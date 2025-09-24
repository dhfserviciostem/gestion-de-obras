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

// GET all clients
router.get('/', requireAuth, async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ clients: [] });
        }

        const [clients] = await pool.execute(
            'SELECT * FROM clients WHERE is_active = TRUE ORDER BY name ASC'
        );
        res.json({ clients });
    } catch (error) {
        console.error('Get clients error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty clients');
            return res.json({ clients: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET client by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [clients] = await pool.execute(
            'SELECT * FROM clients WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({ client: clients[0] });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE new client
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            name, company, email, phone, address, city, state,
            postalCode, country, contactPerson, notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO clients (name, company, email, phone, address, city, state, 
             postal_code, country, contact_person, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, company, email, phone, address, city, state, postalCode, country || 'España', contactPerson, notes]
        );

        // Log the creation
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'CREATE', 'clients', result.insertId, JSON.stringify(req.body)]
        );

        res.status(201).json({ 
            success: true, 
            clientId: result.insertId,
            message: 'Client created successfully' 
        });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE client
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, company, email, phone, address, city, state,
            postalCode, country, contactPerson, notes
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE clients SET 
             name = ?, company = ?, email = ?, phone = ?, address = ?, 
             city = ?, state = ?, postal_code = ?, country = ?, 
             contact_person = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND is_active = TRUE`,
            [name, company, email, phone, address, city, state, postalCode, country, contactPerson, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Log the update
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'clients', id, JSON.stringify(req.body)]
        );

        res.json({ success: true, message: 'Client updated successfully' });
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE client (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if client has active projects
        const [projects] = await pool.execute(
            'SELECT COUNT(*) as count FROM projects WHERE client_id = ? AND is_active = TRUE',
            [id]
        );

        if (projects[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete client with active projects. Please complete or reassign projects first.' 
            });
        }

        const [result] = await pool.execute(
            'UPDATE clients SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'clients', id]
        );

        res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
