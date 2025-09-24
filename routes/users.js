const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123456',
    database: process.env.DB_NAME || 'construction_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (req.session && req.session.userRole && roles.includes(req.session.userRole)) {
            return next();
        } else {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
    };
};

// GET all users
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ users: [] });
        }

        const [users] = await pool.execute(
            'SELECT id, username, email, first_name, last_name, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty users');
            return res.json({ users: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET user by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Users can only view their own profile unless they're admin/manager
        if (req.session.userId !== parseInt(id) && !['admin', 'manager'].includes(req.session.userRole)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [users] = await pool.execute(
            'SELECT id, username, email, first_name, last_name, role, phone, is_active, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE new user
router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role, phone } = req.body;

        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        // Check if username or email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, firstName, lastName, role || 'worker', phone]
        );

        // Log the creation
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'CREATE', 'users', result.insertId, JSON.stringify({ username, email, firstName, lastName, role })]
        );

        res.status(201).json({ 
            success: true, 
            userId: result.insertId,
            message: 'User created successfully' 
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE user
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, firstName, lastName, role, phone, isActive } = req.body;

        // Users can only update their own profile unless they're admin
        if (req.session.userId !== parseInt(id) && req.session.userRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Non-admin users cannot change role or isActive status
        let updateFields = [];
        let updateValues = [];

        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (firstName) {
            updateFields.push('first_name = ?');
            updateValues.push(firstName);
        }
        if (lastName) {
            updateFields.push('last_name = ?');
            updateValues.push(lastName);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        // Handle password update if provided
        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            
            // Hash the new password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            updateFields.push('password_hash = ?');
            updateValues.push(passwordHash);
        }

        // Only admin can update role and active status
        if (req.session.userRole === 'admin') {
            if (role) {
                updateFields.push('role = ?');
                updateValues.push(role);
            }
            if (isActive !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(isActive);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(id);

        const [result] = await pool.execute(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the update
        const logData = { ...req.body };
        if (password) {
            logData.password = '[HIDDEN]'; // Don't log the actual password
        }
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'users', id, JSON.stringify(logData)]
        );

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE user password
router.put('/:id/password', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Users can only change their own password unless they're admin
        if (req.session.userId !== parseInt(id) && req.session.userRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // If not admin, verify current password
        if (req.session.userRole !== 'admin') {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password required' });
            }

            const [users] = await pool.execute(
                'SELECT password_hash FROM users WHERE id = ?',
                [id]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the password change
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'PASSWORD_CHANGE', 'users', id]
        );

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE user (soft delete)
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Cannot delete yourself
        if (req.session.userId === parseInt(id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const [result] = await pool.execute(
            'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'users', id]
        );

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
