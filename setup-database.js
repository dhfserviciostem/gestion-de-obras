const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        // First connect without database to create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin123456'
        });

        console.log('✅ Connected to MySQL server');

        // Create database
        await connection.query('CREATE DATABASE IF NOT EXISTS construction_management');
        console.log('✅ Database created/verified');

        // Switch to the database
        await connection.query('USE construction_management');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    // Ignore table already exists errors
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }
        }
        console.log('✅ Schema created successfully');

        // Read and execute sample data
        const dataPath = path.join(__dirname, 'database', 'sample_data.sql');
        const dataSQL = fs.readFileSync(dataPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const dataStatements = dataSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of dataStatements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (error) {
                    // Ignore duplicate entry errors and constraint violations
                    if (error.message.includes('Duplicate entry') || 
                        error.message.includes('already exists') ||
                        error.code === 'ER_DUP_ENTRY') {
                        console.log(`⚠️  Skipping duplicate: ${error.message.split(':')[0]}`);
                    } else {
                        throw error;
                    }
                }
            }
        }
        console.log('✅ Sample data loaded successfully');

        // Verify data
        const [activities] = await connection.query('SELECT COUNT(*) as count FROM activities');
        const [projects] = await connection.query('SELECT COUNT(*) as count FROM projects');
        const [clients] = await connection.query('SELECT COUNT(*) as count FROM clients');
        
        console.log(`📊 Database populated with:`);
        console.log(`   - ${activities[0].count} activities`);
        console.log(`   - ${projects[0].count} projects`);
        console.log(`   - ${clients[0].count} clients`);
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now start the server with: node server.js');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Troubleshooting tips:');
            console.log('1. Make sure MySQL is installed and running');
            console.log('2. Check your credentials in the .env file');
            console.log('3. Try: mysql -u root -p');
            console.log('4. If needed, reset MySQL root password');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
