#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('🏗️  Configuración del Sistema de Gestión de Obras');
    console.log('================================================\n');

    try {
        // Check if .env exists
        if (!fs.existsSync('.env')) {
            console.log('❌ Archivo .env no encontrado. Creando uno nuevo...\n');
            await createEnvFile();
        }

        // Create uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Directorio de uploads creado');
        }

        // Database setup
        console.log('\n📊 Configuración de Base de Datos');
        console.log('==================================');
        
        const dbConfig = await getDatabaseConfig();
        await setupDatabase(dbConfig);

        console.log('\n🎉 ¡Configuración completada exitosamente!');
        console.log('\nPara iniciar el servidor:');
        console.log('  npm start     (producción)');
        console.log('  npm run dev   (desarrollo)');
        console.log('\nUsuario por defecto:');
        console.log('  Usuario: admin');
        console.log('  Contraseña: admin123456');
        console.log('\nServidor disponible en: http://localhost:3000');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

async function createEnvFile() {
    const dbHost = await question('Host de MySQL (localhost): ') || 'localhost';
    const dbUser = await question('Usuario de MySQL (root): ') || 'root';
    const dbPassword = await question('Contraseña de MySQL: ')|| 'admin123456';
    const dbName = await question('Nombre de la base de datos (construction_management): ') || 'construction_management';
    const port = await question('Puerto del servidor (3000): ') || '3000';
    
    const sessionSecret = generateRandomString(64);
    const jwtSecret = generateRandomString(32);

    const envContent = `# Database Configuration
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Server Configuration
PORT=${port}
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Security
JWT_SECRET=${jwtSecret}
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Archivo .env creado');
}

async function getDatabaseConfig() {
    // Load .env file
    require('dotenv').config();
    
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'admin123456',
        database: process.env.DB_NAME || 'construction_management'
    };
}

async function setupDatabase(config) {
    try {
        // Connect without database first
        const connectionConfig = { ...config };
        delete connectionConfig.database;
        
        const connection = await mysql.createConnection(connectionConfig);
        
        // Create database if it doesn't exist
        console.log('📊 Creando base de datos...');
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
        await connection.end();
        
        // Connect to the database
        const dbConnection = await mysql.createConnection(config);
        
        // Read and execute schema
        console.log('📋 Ejecutando esquema de base de datos...');
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await dbConnection.execute(statement);
            }
        }
        
        console.log('✅ Base de datos configurada correctamente');
        
        // Check if admin user exists
        const [users] = await dbConnection.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
        
        if (users[0].count === 0) {
            console.log('👤 Creando usuario administrador...');
            const passwordHash = await bcrypt.hash('admin123456', 10);
            await dbConnection.execute(
                'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin', 'admin@construccion.com', passwordHash, 'Administrador', 'Sistema', 'admin']
            );
            console.log('✅ Usuario administrador creado');
        }
        
        await dbConnection.end();
        
    } catch (error) {
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            throw new Error('Acceso denegado a MySQL. Verifica usuario y contraseña.');
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('No se puede conectar a MySQL. ¿Está ejecutándose el servidor?');
        } else {
            throw error;
        }
    }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Run setup if called directly
if (require.main === module) {
    setup();
}

module.exports = { setup };
