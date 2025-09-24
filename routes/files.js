const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
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

// File type mapping
const getFileType = (mimetype, filename) => {
    const ext = path.extname(filename).toLowerCase();
    
    if (mimetype.includes('image/')) return 'image';
    if (mimetype.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') || 
        mimetype.includes('application/vnd.ms-excel') || ext === '.xlsx' || ext === '.xls') return 'excel';
    if (mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') || 
        mimetype.includes('application/msword') || ext === '.docx' || ext === '.doc') return 'word';
    if (mimetype.includes('application/pdf')) return 'pdf';
    if (ext === '.dwg' || ext === '.dxf' || ext === '.step' || ext === '.iges') return 'cad';
    
    return 'other';
};

// GET all files (with optional filters)
router.get('/', requireAuth, async (req, res) => {
    try {
        // Check if pool is available
        if (!pool) {
            console.warn('Database pool not available');
            return res.json({ files: [] });
        }

        const { projectId, activityId, fileType } = req.query;
        
        let query = `
            SELECT f.*, p.name as project_name, a.name as activity_name,
                   u.first_name, u.last_name,
                   CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
            FROM files f
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN activities a ON f.activity_id = a.id
            LEFT JOIN users u ON f.uploaded_by = u.id
            WHERE 1=1
        `;
        
        let params = [];
        
        if (projectId) {
            query += ' AND f.project_id = ?';
            params.push(projectId);
        }
        
        if (activityId) {
            query += ' AND f.activity_id = ?';
            params.push(activityId);
        }
        
        if (fileType) {
            query += ' AND f.file_type = ?';
            params.push(fileType);
        }
        
        query += ' ORDER BY f.created_at DESC';

        const [files] = await pool.execute(query, params);
        res.json({ files });
    } catch (error) {
        console.error('Get files error:', error);
        // Return empty array instead of 500 error when database is not available
        if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
            console.warn('Database connection failed, returning empty files');
            return res.json({ files: [] });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET file by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [files] = await pool.execute(`
            SELECT f.*, p.name as project_name, a.name as activity_name,
                   u.first_name, u.last_name,
                   CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
            FROM files f
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN activities a ON f.activity_id = a.id
            LEFT JOIN users u ON f.uploaded_by = u.id
            WHERE f.id = ?
        `, [id]);

        if (files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({ file: files[0] });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPLOAD file
router.post('/upload', requireAuth, async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: 'No files were uploaded' });
        }

        const { projectId, activityId, description, isShared } = req.body;
        const uploadedFiles = [];

        // Handle multiple files
        const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

        for (const file of files) {
            // Generate unique filename
            const fileExtension = path.extname(file.name);
            const uniqueFilename = `${uuidv4()}${fileExtension}`;
            const uploadPath = path.join(__dirname, '..', 'uploads', uniqueFilename);

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.dirname(uploadPath);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Move file to uploads directory
            await file.mv(uploadPath);

            // Determine file type
            const fileType = getFileType(file.mimetype, file.name);

            // Save file info to database
            const [result] = await pool.execute(`
                INSERT INTO files (filename, original_name, file_path, file_type, file_size, 
                                 mime_type, project_id, activity_id, uploaded_by, description, is_shared) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [uniqueFilename, file.name, uploadPath, fileType, file.size, file.mimetype,
                projectId || null, activityId || null, req.session.userId, description || null, 
                isShared === 'true']);

            uploadedFiles.push({
                id: result.insertId,
                filename: uniqueFilename,
                originalName: file.name,
                fileType: fileType,
                size: file.size
            });

            // Log the upload
            await pool.execute(
                'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
                [req.session.userId, 'UPLOAD', 'files', result.insertId, JSON.stringify({
                    filename: file.name,
                    projectId,
                    activityId,
                    fileType
                })]
            );
        }

        res.status(201).json({ 
            success: true, 
            files: uploadedFiles,
            message: `${uploadedFiles.length} file(s) uploaded successfully` 
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DOWNLOAD file
router.get('/:id/download', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [files] = await pool.execute(
            'SELECT * FROM files WHERE id = ?',
            [id]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];
        
        // Check if file exists on disk
        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Type', file.mime_type);

        // Stream the file
        const fileStream = fs.createReadStream(file.file_path);
        fileStream.pipe(res);

        // Log the download
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.session.userId, 'DOWNLOAD', 'files', id]
        );
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE file metadata
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, isShared, projectId, activityId } = req.body;

        const [result] = await pool.execute(`
            UPDATE files SET 
                description = ?, is_shared = ?, project_id = ?, activity_id = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [description, isShared, projectId || null, activityId || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Log the update
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'UPDATE', 'files', id, JSON.stringify(req.body)]
        );

        res.json({ success: true, message: 'File updated successfully' });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE file
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get file info first
        const [files] = await pool.execute(
            'SELECT * FROM files WHERE id = ?',
            [id]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        // Delete from database
        const [result] = await pool.execute(
            'DELETE FROM files WHERE id = ?',
            [id]
        );

        // Delete physical file
        if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }

        // Log the deletion
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, old_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'DELETE', 'files', id, JSON.stringify({
                filename: file.original_name,
                fileType: file.file_type
            })]
        );

        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SHARE file with user
router.post('/:id/share', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, permissionType } = req.body;

        if (!userId || !permissionType) {
            return res.status(400).json({ error: 'User ID and permission type are required' });
        }

        // Check if permission already exists
        const [existing] = await pool.execute(
            'SELECT id FROM file_permissions WHERE file_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            // Update existing permission
            await pool.execute(
                'UPDATE file_permissions SET permission_type = ?, granted_by = ?, granted_at = CURRENT_TIMESTAMP WHERE file_id = ? AND user_id = ?',
                [permissionType, req.session.userId, id, userId]
            );
        } else {
            // Create new permission
            await pool.execute(
                'INSERT INTO file_permissions (file_id, user_id, permission_type, granted_by) VALUES (?, ?, ?, ?)',
                [id, userId, permissionType, req.session.userId]
            );
        }

        res.json({ success: true, message: 'File shared successfully' });
    } catch (error) {
        console.error('Share file error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
