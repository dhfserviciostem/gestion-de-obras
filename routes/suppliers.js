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

// GET all suppliers
router.get('/', requireAuth, async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ suppliers: [] });
        }

        const [suppliers] = await pool.execute(
            'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC'
        );
        res.json({ suppliers });
    } catch (error) {
        console.error('Get suppliers error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty suppliers');
            return res.json({ suppliers: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET supplier by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [suppliers] = await pool.execute(
            'SELECT * FROM suppliers WHERE id = ? AND is_active = TRUE',
            [id]
        );

        if (suppliers.length === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ supplier: suppliers[0] });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE new supplier
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            name, company, email, phone, address, city, state,
            postalCode, country, contactPerson, supplierType,
            taxId, paymentTerms, notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO suppliers (name, company, email, phone, address, city, state, 
             postal_code, country, contact_person, supplier_type, tax_id, payment_terms, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, company, email, phone, address, city, state, postalCode, 
             country || 'España', contactPerson, supplierType || 'materials', taxId, paymentTerms, notes]
        );

        // Log the creation
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'CREATE', 'suppliers', result.insertId, JSON.stringify(req.body)]
        );

        res.status(201).json({ 
            success: true, 
            supplierId: result.insertId,
            message: 'Supplier created successfully' 
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE supplier
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, company, email, phone, address, city, state,
            postalCode, country, contactPerson, supplierType,
            taxId, paymentTerms, notes
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE suppliers SET 
             name = ?, company = ?, email = ?, phone = ?, address = ?, 
             city = ?, state = ?, postal_code = ?, country = ?, 
             contact_person = ?, supplier_type = ?, tax_id = ?, 
             payment_terms = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ? AND is_active = TRUE`,
            [name, company, email, phone, address, city, state, postalCode, 
             country, contactPerson, supplierType, taxId, paymentTerms, notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Log the update
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'suppliers', id, JSON.stringify(req.body)]
        );

        res.json({ success: true, message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE supplier (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE suppliers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'suppliers', id]
        );

        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
