// ================================================================
// config/db.js — MySQL Connection Pool
// ================================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flight_booking_db',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const testConnection = async () => {
    try {
        const conn = await pool.getConnection();
        console.log('------------------------------------------------');
        console.log('✅ Database connected successfully');
        console.log(`🔌 Host: ${pool.pool.config.connectionConfig.host}`);
        console.log(`🗄️  Database: ${pool.pool.config.connectionConfig.database}`);
        console.log('------------------------------------------------');
        conn.release();
    } catch (err) {
        console.error('\n❌ Database connection failed!');
        console.error('Error:', err.message);
        console.error('Check if MySQL service is running and credentials in .env are correct.\n');
        throw err;
    }
};

module.exports = { pool, testConnection };
