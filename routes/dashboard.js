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

// GET dashboard overview
router.get('/overview', requireAuth, async (req, res) => {
    try {
        // Get project statistics
        const [projectStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_projects,
                SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning_projects,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_projects,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold_projects,
                AVG(progress_percentage) as avg_progress,
                SUM(estimated_budget) as total_budget,
                SUM(actual_cost) as total_spent
            FROM projects WHERE is_active = TRUE
        `);

        // Get activity statistics
        const [activityStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_activities,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_activities,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_activities,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_activities,
                AVG(progress_percentage) as avg_activity_progress
            FROM activities
        `);

        // Get recent activities
        const [recentActivities] = await pool.execute(`
            SELECT a.*, p.name as project_name,
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u ON a.assigned_to = u.id
            ORDER BY a.updated_at DESC
            LIMIT 10
        `);

        // Get overdue activities
        const [overdueActivities] = await pool.execute(`
            SELECT a.*, p.name as project_name,
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u ON a.assigned_to = u.id
            WHERE a.end_date < CURDATE() AND a.status != 'completed'
            ORDER BY a.end_date ASC
            LIMIT 10
        `);

        // Get file statistics
        const [fileStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_files,
                SUM(file_size) as total_size,
                SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) as image_files,
                SUM(CASE WHEN file_type = 'excel' THEN 1 ELSE 0 END) as excel_files,
                SUM(CASE WHEN file_type = 'word' THEN 1 ELSE 0 END) as word_files,
                SUM(CASE WHEN file_type = 'cad' THEN 1 ELSE 0 END) as cad_files,
                SUM(CASE WHEN file_type = 'pdf' THEN 1 ELSE 0 END) as pdf_files
            FROM files
        `);

        // Get user statistics
        const [userStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_users,
                SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as supervisor_users,
                SUM(CASE WHEN role = 'worker' THEN 1 ELSE 0 END) as worker_users,
                SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
            FROM users
        `);

        res.json({
            projectStats: projectStats[0],
            activityStats: activityStats[0],
            fileStats: fileStats[0],
            userStats: userStats[0],
            recentActivities,
            overdueActivities
        });
    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET project progress data for charts
router.get('/project-progress', requireAuth, async (req, res) => {
    try {
        const [projects] = await pool.execute(`
            SELECT id, name, progress_percentage, status, estimated_budget, actual_cost,
                   start_date, end_date
            FROM projects 
            WHERE is_active = TRUE
            ORDER BY progress_percentage DESC
        `);

        res.json({ projects });
    } catch (error) {
        console.error('Project progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET activity timeline data
router.get('/activity-timeline', requireAuth, async (req, res) => {
    try {
        const { projectId } = req.query;
        
        let query = `
            SELECT a.id, a.name, a.start_date, a.end_date, a.status, a.progress_percentage,
                   p.name as project_name, p.id as project_id,
                   CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u ON a.assigned_to = u.id
        `;
        
        let params = [];
        if (projectId) {
            query += ' WHERE a.project_id = ?';
            params.push(projectId);
        }
        
        query += ' ORDER BY a.start_date ASC';

        const [activities] = await pool.execute(query, params);
        res.json({ activities });
    } catch (error) {
        console.error('Activity timeline error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET budget analysis
router.get('/budget-analysis', requireAuth, async (req, res) => {
    try {
        const [budgetData] = await pool.execute(`
            SELECT 
                p.id, p.name, p.estimated_budget, p.actual_cost,
                (p.actual_cost / p.estimated_budget * 100) as budget_usage_percentage,
                c.name as client_name
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE p.is_active = TRUE AND p.estimated_budget > 0
            ORDER BY budget_usage_percentage DESC
        `);

        // Get monthly spending
        const [monthlySpending] = await pool.execute(`
            SELECT 
                DATE_FORMAT(updated_at, '%Y-%m') as month,
                SUM(actual_cost) as total_spent
            FROM projects 
            WHERE is_active = TRUE AND actual_cost > 0
            GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({ 
            budgetData,
            monthlySpending: monthlySpending.reverse()
        });
    } catch (error) {
        console.error('Budget analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET team performance
router.get('/team-performance', requireAuth, async (req, res) => {
    try {
        const [teamPerformance] = await pool.execute(`
            SELECT 
                u.id, u.first_name, u.last_name, u.role,
                CONCAT(u.first_name, ' ', u.last_name) as full_name,
                COUNT(a.id) as total_activities,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_activities,
                SUM(CASE WHEN a.status = 'in_progress' THEN 1 ELSE 0 END) as active_activities,
                SUM(CASE WHEN a.end_date < CURDATE() AND a.status != 'completed' THEN 1 ELSE 0 END) as overdue_activities,
                AVG(a.progress_percentage) as avg_progress
            FROM users u
            LEFT JOIN activities a ON u.id = a.assigned_to
            WHERE u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.role
            ORDER BY completed_activities DESC
        `);

        res.json({ teamPerformance });
    } catch (error) {
        console.error('Team performance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET file usage statistics
router.get('/file-usage', requireAuth, async (req, res) => {
    try {
        const [fileUsage] = await pool.execute(`
            SELECT 
                file_type,
                COUNT(*) as file_count,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_size
            FROM files
            GROUP BY file_type
            ORDER BY file_count DESC
        `);

        // Get recent uploads
        const [recentUploads] = await pool.execute(`
            SELECT f.*, p.name as project_name,
                   CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
            FROM files f
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN users u ON f.uploaded_by = u.id
            ORDER BY f.created_at DESC
            LIMIT 10
        `);

        res.json({ 
            fileUsage,
            recentUploads
        });
    } catch (error) {
        console.error('File usage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
