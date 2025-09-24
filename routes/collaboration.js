const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const { pool } = require('../server');
const router = express.Router();

// Middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

// Active collaboration sessions
const collaborationSessions = new Map();

// GET collaborative editing session for a file
router.get('/session/:fileId', requireAuth, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Check if user has permission to edit this file
        const hasPermission = await checkFilePermission(fileId, req.session.userId, 'write');
        if (!hasPermission) {
            return res.status(403).json({ error: 'No tienes permisos para editar este archivo' });
        }

        // Get file information
        const [files] = await pool.execute(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const file = files[0];
        
        // Check if file type supports collaboration
        if (!['excel', 'word'].includes(file.file_type)) {
            return res.status(400).json({ error: 'Tipo de archivo no soportado para colaboración' });
        }

        // Create or get existing session
        let session = collaborationSessions.get(fileId);
        if (!session) {
            session = await createCollaborationSession(file);
            collaborationSessions.set(fileId, session);
        }

        // Add user to session
        session.users.set(req.session.userId, {
            id: req.session.userId,
            name: `${req.session.firstName} ${req.session.lastName}`,
            joinedAt: new Date(),
            cursor: null
        });

        res.json({
            sessionId: session.id,
            fileType: file.file_type,
            fileName: file.original_name,
            content: session.content,
            users: Array.from(session.users.values()),
            lastModified: session.lastModified
        });

    } catch (error) {
        console.error('Get collaboration session error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST update content in collaboration session
router.post('/session/:fileId/update', requireAuth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { content, operation, position } = req.body;

        const session = collaborationSessions.get(fileId);
        if (!session) {
            return res.status(404).json({ error: 'Sesión de colaboración no encontrada' });
        }

        // Check if user is in session
        if (!session.users.has(req.session.userId)) {
            return res.status(403).json({ error: 'No estás en esta sesión de colaboración' });
        }

        // Apply operation to content
        const updatedContent = applyOperation(session.content, operation, content, position);
        session.content = updatedContent;
        session.lastModified = new Date();
        session.version++;

        // Broadcast update to all users in session
        broadcastUpdate(session, {
            type: 'content_update',
            userId: req.session.userId,
            userName: `${req.session.firstName} ${req.session.lastName}`,
            operation,
            content: updatedContent,
            version: session.version,
            timestamp: session.lastModified
        });

        res.json({
            success: true,
            version: session.version,
            lastModified: session.lastModified
        });

    } catch (error) {
        console.error('Update collaboration session error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST save collaborative changes to file
router.post('/session/:fileId/save', requireAuth, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const session = collaborationSessions.get(fileId);
        if (!session) {
            return res.status(404).json({ error: 'Sesión de colaboración no encontrada' });
        }

        // Get original file info
        const [files] = await pool.execute(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        const file = files[0];

        // Create new version of the file
        const newFileName = `${uuidv4()}_${file.original_name}`;
        const newFilePath = path.join(__dirname, '..', 'uploads', newFileName);

        // Save content based on file type
        if (file.file_type === 'excel') {
            await saveExcelFile(session.content, newFilePath);
        } else if (file.file_type === 'word') {
            await saveWordFile(session.content, newFilePath);
        }

        // Get file stats
        const stats = fs.statSync(newFilePath);

        // Create new file record with version
        const [result] = await pool.execute(`
            INSERT INTO files (filename, original_name, file_path, file_type, file_size, 
                             mime_type, project_id, activity_id, uploaded_by, description, 
                             is_shared, version, parent_file_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            newFileName, file.original_name, newFilePath, file.file_type, stats.size,
            file.mime_type, file.project_id, file.activity_id, req.session.userId,
            `Versión colaborativa ${session.version}`, file.is_shared, session.version, fileId
        ]);

        // Log the save
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, 'COLLABORATIVE_SAVE', 'files', result.insertId, JSON.stringify({
                originalFileId: fileId,
                version: session.version,
                collaborators: Array.from(session.users.keys())
            })]
        );

        // Broadcast save notification
        broadcastUpdate(session, {
            type: 'file_saved',
            userId: req.session.userId,
            userName: `${req.session.firstName} ${req.session.lastName}`,
            newFileId: result.insertId,
            version: session.version,
            timestamp: new Date()
        });

        res.json({
            success: true,
            newFileId: result.insertId,
            version: session.version,
            message: 'Archivo guardado correctamente'
        });

    } catch (error) {
        console.error('Save collaboration session error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST leave collaboration session
router.post('/session/:fileId/leave', requireAuth, async (req, res) => {
    try {
        const { fileId } = req.params;
        
        const session = collaborationSessions.get(fileId);
        if (session && session.users.has(req.session.userId)) {
            // Remove user from session
            session.users.delete(req.session.userId);

            // Broadcast user left
            broadcastUpdate(session, {
                type: 'user_left',
                userId: req.session.userId,
                userName: `${req.session.firstName} ${req.session.lastName}`,
                timestamp: new Date()
            });

            // Clean up empty sessions
            if (session.users.size === 0) {
                collaborationSessions.delete(fileId);
            }
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Leave collaboration session error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET active collaboration sessions
router.get('/sessions', requireAuth, async (req, res) => {
    try {
        const activeSessions = [];
        
        for (const [fileId, session] of collaborationSessions.entries()) {
            if (session.users.has(req.session.userId)) {
                activeSessions.push({
                    fileId,
                    sessionId: session.id,
                    fileName: session.fileName,
                    fileType: session.fileType,
                    userCount: session.users.size,
                    lastModified: session.lastModified
                });
            }
        }

        res.json({ sessions: activeSessions });

    } catch (error) {
        console.error('Get active sessions error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Helper functions

async function checkFilePermission(fileId, userId, permissionType) {
    try {
        // Check if user uploaded the file
        const [files] = await pool.execute(
            'SELECT uploaded_by FROM files WHERE id = ?',
            [fileId]
        );

        if (files.length > 0 && files[0].uploaded_by === userId) {
            return true;
        }

        // Check file permissions
        const [permissions] = await pool.execute(
            'SELECT permission_type FROM file_permissions WHERE file_id = ? AND user_id = ?',
            [fileId, userId]
        );

        if (permissions.length > 0) {
            const userPermission = permissions[0].permission_type;
            if (permissionType === 'read') {
                return ['read', 'write', 'admin'].includes(userPermission);
            } else if (permissionType === 'write') {
                return ['write', 'admin'].includes(userPermission);
            }
        }

        return false;
    } catch (error) {
        console.error('Check file permission error:', error);
        return false;
    }
}

async function createCollaborationSession(file) {
    const session = {
        id: uuidv4(),
        fileId: file.id,
        fileName: file.original_name,
        fileType: file.file_type,
        content: null,
        users: new Map(),
        version: 1,
        lastModified: new Date(),
        createdAt: new Date()
    };

    // Load file content
    if (file.file_type === 'excel') {
        session.content = await loadExcelFile(file.file_path);
    } else if (file.file_type === 'word') {
        session.content = await loadWordFile(file.file_path);
    }

    return session;
}

async function loadExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheets = {};
        
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        });

        return {
            type: 'excel',
            sheets: sheets,
            activeSheet: workbook.SheetNames[0] || null
        };
    } catch (error) {
        console.error('Load Excel file error:', error);
        throw new Error('Error cargando archivo Excel');
    }
}

async function loadWordFile(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return {
            type: 'word',
            text: result.value,
            messages: result.messages
        };
    } catch (error) {
        console.error('Load Word file error:', error);
        throw new Error('Error cargando archivo Word');
    }
}

async function saveExcelFile(content, filePath) {
    try {
        const workbook = XLSX.utils.book_new();
        
        Object.keys(content.sheets).forEach(sheetName => {
            const worksheet = XLSX.utils.aoa_to_sheet(content.sheets[sheetName]);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        XLSX.writeFile(workbook, filePath);
    } catch (error) {
        console.error('Save Excel file error:', error);
        throw new Error('Error guardando archivo Excel');
    }
}

async function saveWordFile(content, filePath) {
    try {
        // For now, save as plain text
        // In a real implementation, you'd use a library like docx to maintain formatting
        fs.writeFileSync(filePath, content.text, 'utf8');
    } catch (error) {
        console.error('Save Word file error:', error);
        throw new Error('Error guardando archivo Word');
    }
}

function applyOperation(currentContent, operation, newContent, position) {
    // Simple implementation - in production, use operational transformation
    switch (operation) {
        case 'replace':
            return newContent;
        case 'insert':
            if (currentContent.type === 'word') {
                const text = currentContent.text;
                return {
                    ...currentContent,
                    text: text.slice(0, position) + newContent + text.slice(position)
                };
            }
            break;
        case 'delete':
            if (currentContent.type === 'word') {
                const text = currentContent.text;
                return {
                    ...currentContent,
                    text: text.slice(0, position) + text.slice(position + newContent.length)
                };
            }
            break;
        case 'cell_update':
            if (currentContent.type === 'excel' && position) {
                const { sheet, row, col } = position;
                if (currentContent.sheets[sheet]) {
                    if (!currentContent.sheets[sheet][row]) {
                        currentContent.sheets[sheet][row] = [];
                    }
                    currentContent.sheets[sheet][row][col] = newContent;
                }
            }
            break;
        default:
            return currentContent;
    }
    
    return currentContent;
}

function broadcastUpdate(session, update) {
    // In a real implementation, use WebSockets (Socket.IO) to broadcast
    // For now, we'll store updates in session for polling
    if (!session.updates) {
        session.updates = [];
    }
    
    session.updates.push(update);
    
    // Keep only last 100 updates
    if (session.updates.length > 100) {
        session.updates = session.updates.slice(-100);
    }
}

// GET updates for polling (WebSocket alternative)
router.get('/session/:fileId/updates', requireAuth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { since } = req.query;
        
        const session = collaborationSessions.get(fileId);
        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        if (!session.users.has(req.session.userId)) {
            return res.status(403).json({ error: 'No estás en esta sesión' });
        }

        let updates = session.updates || [];
        
        if (since) {
            const sinceDate = new Date(since);
            updates = updates.filter(update => new Date(update.timestamp) > sinceDate);
        }

        res.json({
            updates,
            users: Array.from(session.users.values()),
            version: session.version
        });

    } catch (error) {
        console.error('Get updates error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
