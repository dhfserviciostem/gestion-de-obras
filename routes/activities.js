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

// GET all activities (with optional project filter)
router.get('/', requireAuth, async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ activities: [] });
        }

        const { projectId } = req.query;
        let query = `
            SELECT a.*, p.name as project_name, 
                   u1.first_name as assigned_first_name, u1.last_name as assigned_last_name,
                   CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
                   u2.first_name as created_first_name, u2.last_name as created_last_name,
                   CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u1 ON a.assigned_to = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
        `;
        
        let params = [];
        if (projectId) {
            query += ' WHERE a.project_id = ?';
            params.push(projectId);
        }
        
        query += ' ORDER BY a.created_at DESC';

        const [activities] = await pool.execute(query, params);
        res.json({ activities });
    } catch (error) {
        console.error('Get activities error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty activities');
            return res.json({ activities: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET activity by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [activities] = await pool.execute(`
            SELECT a.*, p.name as project_name,
                   u1.first_name as assigned_first_name, u1.last_name as assigned_last_name,
                   CONCAT(u1.first_name, ' ', u1.last_name) as assigned_to_name,
                   u2.first_name as created_first_name, u2.last_name as created_last_name,
                   CONCAT(u2.first_name, ' ', u2.last_name) as created_by_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u1 ON a.assigned_to = u1.id
            LEFT JOIN users u2 ON a.created_by = u2.id
            WHERE a.id = ?
        `, [id]);

        if (activities.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json({ activity: activities[0] });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CREATE new activity
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            projectId, name, description, assignedTo, startDate, endDate,
            estimatedHours, priority, dependencies, materialsNeeded,
            equipmentNeeded, notes
        } = req.body;

        if (!projectId || !name) {
            return res.status(400).json({ error: 'Project ID and activity name are required' });
        }

        // Verify project exists and user has access
        const [projects] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND is_active = TRUE',
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const [result] = await pool.execute(`
            INSERT INTO activities (project_id, name, description, assigned_to, start_date, 
                                  end_date, estimated_hours, priority, dependencies, 
                                  materials_needed, equipment_needed, notes, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [projectId, name, description, assignedTo, startDate, endDate,
            estimatedHours, priority || 'medium', JSON.stringify(dependencies || []),
            materialsNeeded, equipmentNeeded, notes, req.session.userId]);

        // Log the creation
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'CREATE', 'activities', result.insertId, JSON.stringify(req.body)]
        );

        res.status(201).json({ 
            success: true, 
            activityId: result.insertId,
            message: 'Activity created successfully' 
        });
    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE activity
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, description, assignedTo, startDate, endDate,
            estimatedHours, actualHours, status, progressPercentage,
            priority, dependencies, materialsNeeded, equipmentNeeded, notes
        } = req.body;

        const [result] = await pool.execute(`
            UPDATE activities SET 
                name = ?, description = ?, assigned_to = ?, start_date = ?, 
                end_date = ?, estimated_hours = ?, actual_hours = ?, status = ?,
                progress_percentage = ?, priority = ?, dependencies = ?, 
                materials_needed = ?, equipment_needed = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [name, description, assignedTo, startDate, endDate, estimatedHours,
            actualHours, status, progressPercentage, priority,
            JSON.stringify(dependencies || []), materialsNeeded, equipmentNeeded, notes, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Update project progress if activity is completed
        if (status === 'completed') {
            await updateProjectProgress(req.body.projectId || await getProjectIdFromActivity(id));
        }

        // Log the update
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'activities', id, JSON.stringify(req.body)]
        );

        res.json({ success: true, message: 'Activity updated successfully' });
    } catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE activity
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM activities WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'activities', id]
        );

        res.json({ success: true, message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to get project ID from activity
async function getProjectIdFromActivity(activityId) {
    const [activities] = await pool.execute(
        'SELECT project_id FROM activities WHERE id = ?',
        [activityId]
    );
    return activities.length > 0 ? activities[0].project_id : null;
}

// Helper function to update project progress
async function updateProjectProgress(projectId) {
    if (!projectId) return;

    const [activities] = await pool.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed FROM activities WHERE project_id = ?',
        [projectId]
    );

    if (activities[0].total > 0) {
        const progressPercentage = (activities[0].completed / activities[0].total) * 100;
        await pool.execute(
            'UPDATE projects SET progress_percentage = ? WHERE id = ?',
            [progressPercentage, projectId]
        );
    }
}

module.exports = router;
