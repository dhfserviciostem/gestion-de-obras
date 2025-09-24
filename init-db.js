const mysql = require('mysql2/promise');

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        // Verificar si la tabla users existe
        const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
        
        if (tables.length === 0) {
            console.log('📝 Creating database tables...');
            
            // Crear tabla de usuarios
            await connection.execute(`
                CREATE TABLE users (
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

            // Insertar usuario administrador
            await connection.execute(`
                INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
                ('admin', 'admin@admin.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Sistema', 'admin')
            `);

            console.log('✅ Database initialized successfully');
        } else {
            console.log('✅ Database already initialized');
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    } finally {
        await connection.end();
    }
}

module.exports = initializeDatabase;
