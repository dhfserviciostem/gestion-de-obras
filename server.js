const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123456',
    database: process.env.DB_NAME || 'construction_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

const pool = mysql.createPool(dbConfig);

// Test database connection and ensure basic data exists
async function testConnection() {
    try {
        if (pool) {
            await pool.execute('SELECT 1');
            console.log('✅ Database connected successfully');
            
            // Check if users table exists, if not, create it
            try {
                const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
                if (users[0].count === 0) {
                    console.log('📝 No users found, inserting admin user...');
                    await pool.execute(`
                        INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
                        ('admin', 'admin@admin.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Sistema', 'admin')
                    `);
                }
            } catch (error) {
                console.log('📝 Users table not found, creating basic structure...');
                // Create users table if it doesn't exist
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        first_name VARCHAR(50) NOT NULL,
                        last_name VARCHAR(50) NOT NULL,
                        role ENUM('admin', 'manager', 'supervisor', 'worker') DEFAULT 'worker',
                        phone VARCHAR(20),
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                
                // Insert admin user
                await pool.execute(`
                    INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
                    ('admin', 'admin@admin.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Sistema', 'admin')
                `);
            }
        }
    } catch (error) {
        console.warn('⚠️  Database connection failed:', error.message);
        console.warn('⚠️  Server will continue without database connection');
        // Don't exit - let server run without DB
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for development
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload middleware
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Railway doesn't require HTTPS for sessions
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cross-site requests
    }
}));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

// Authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (req.session && req.session.userRole && roles.includes(req.session.userRole)) {
            return next();
        } else {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
    };
};

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userRole = user.role;
        req.session.firstName = user.first_name;
        req.session.lastName = user.last_name;

        // Log the login
        await pool.execute(
            'INSERT INTO activity_logs (user_id, action, table_name, record_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, 'LOGIN', 'users', user.id, req.ip, req.get('User-Agent')]
        );

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, first_name, last_name, role, phone, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        res.json({ 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                phone: user.phone,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        
        let updateFields = [];
        let updateValues = [];

        if (firstName) {
            updateFields.push('first_name = ?');
            updateValues.push(firstName);
        }
        if (lastName) {
            updateFields.push('last_name = ?');
            updateValues.push(lastName);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        // Handle password update if provided
        if (password) {
            const bcrypt = require('bcryptjs');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            updateFields.push('password_hash = ?');
            updateValues.push(passwordHash);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.session.userId);

        const [result] = await pool.execute(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update session data if name changed
        if (firstName) req.session.firstName = firstName;
        if (lastName) req.session.lastName = lastName;

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Import route modules
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const supplierRoutes = require('./routes/suppliers');
const projectRoutes = require('./routes/projects');
const activityRoutes = require('./routes/activities');
const fileRoutes = require('./routes/files');
const dashboardRoutes = require('./routes/dashboard');
const collaborationRoutes = require('./routes/collaboration');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/collaboration', collaborationRoutes);

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`);
        console.log(`📁 File uploads directory: ${uploadsDir}`);
    });
}

startServer().catch(console.error);

module.exports = { app, pool };
