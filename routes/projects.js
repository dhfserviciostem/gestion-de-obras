const express = require('express');
const mysql = require('mysql2/promise');
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

// GET all projects
router.get('/', requireAuth, async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ projects: [] });
        }

        const [projects] = await pool.execute(`
            SELECT p.*, c.name as client_name, u.first_name, u.last_name,
                   CONCAT(u.first_name, ' ', u.last_name) as manager_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN users u ON p.project_manager_id = u.id
            WHERE p.is_active = TRUE
            ORDER BY p.created_at DESC
        `);
        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty projects');
            return res.json({ projects: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET project by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [projects] = await pool.execute(`
            SELECT p.*, c.name as client_name, c.email as client_email,
                   u.first_name, u.last_name,
                   CONCAT(u.first_name, ' ', u.last_name) as manager_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN users u ON p.project_manager_id = u.id
            WHERE p.id = ? AND p.is_active = TRUE
        `, [id]);

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project team members
        const [team] = await pool.execute(`
            SELECT pt.*, u.first_name, u.last_name, u.email, u.role as user_role,
                   CONCAT(u.first_name, ' ', u.last_name) as full_name
            FROM project_team pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.project_id = ?
        `, [id]);

        // Get project activities count
        const [activityCount] = await pool.execute(
            'SELECT COUNT(*) as total_activities FROM activities WHERE project_id = ?',
            [id]
        );

        res.json({ 
            project: projects[0],
            team: team,
            totalActivities: activityCount[0].total_activities
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE new project
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            name, description, clientId, projectManagerId, startDate, endDate,
            estimatedBudget, address, city, state, postalCode, coordinates,
            priority, notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const [result] = await pool.execute(`
            INSERT INTO projects (name, description, client_id, project_manager_id, 
                                start_date, end_date, estimated_budget, address, city, 
                                state, postal_code, coordinates, priority, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, description, clientId, projectManagerId, startDate, endDate,
            estimatedBudget, address, city, state, postalCode, coordinates,
            priority || 'medium', notes]);

        // Add project manager to team if specified
        if (projectManagerId) {
            await pool.execute(`
                INSERT INTO project_team (project_id, user_id, role, permissions)
                VALUES (?, ?, 'manager', '{"read": true, "write": true, "admin": true}')
            `, [result.insertId, projectManagerId]);
        }

        // Log the creation
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'CREATE', 'projects', result.insertId, JSON.stringify(req.body)]
        );

        res.status(201).json({ 
            success: true, 
            projectId: result.insertId,
            message: 'Project created successfully' 
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE project
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, clientId, projectManagerId, startDate, endDate,
            estimatedBudget, actualCost, status, progressPercentage, address,
            city, state, postalCode, coordinates, priority, notes
        } = req.body;

        const [result] = await pool.execute(`
            UPDATE projects SET 
                name = ?, description = ?, client_id = ?, project_manager_id = ?, 
                start_date = ?, end_date = ?, estimated_budget = ?, actual_cost = ?,
                status = ?, progress_percentage = ?, address = ?, city = ?, 
                state = ?, postal_code = ?, coordinates = ?, priority = ?, 
                notes = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND is_active = TRUE
        `, [name, description, clientId, projectManagerId, startDate, endDate,
            estimatedBudget, actualCost, status, progressPercentage, address,
            city, state, postalCode, coordinates, priority, notes, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Log the update
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'projects', id, JSON.stringify(req.body)]
        );

        res.json({ success: true, message: 'Project updated successfully' });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ADD team member to project
router.post('/:id/team', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role, permissions } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if user is already in the team
        const [existing] = await pool.execute(
            'SELECT id FROM project_team WHERE project_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'User is already a team member' });
        }

        await pool.execute(`
            INSERT INTO project_team (project_id, user_id, role, permissions)
            VALUES (?, ?, ?, ?)
        `, [id, userId, role || 'worker', JSON.stringify(permissions || {read: true, write: false, admin: false})]);

        res.status(201).json({ success: true, message: 'Team member added successfully' });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// REMOVE team member from project
router.delete('/:id/team/:userId', requireAuth, async (req, res) => {
    try {
        const { id, userId } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM project_team WHERE project_id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        res.json({ success: true, message: 'Team member removed successfully' });
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE project (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE projects SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'projects', id]
        );

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
