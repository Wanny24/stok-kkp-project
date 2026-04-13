const mysql = require('mysql2/promise');
require('dotenv').config();

// Helper function untuk mendapatkan konfigurasi database
const getDbConfig = () => {
    // Prioritaskan MYSQL_URL dari Railway
    if (process.env.MYSQL_URL) {
        console.log('📦 Using Railway MySQL URL');
        return { uri: process.env.MYSQL_URL };
    }
    
    // Fallback ke konfigurasi manual (development)
    console.log('📦 Using manual MySQL configuration');
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'stok_kkp_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };
};

// Create connection pool
let pool;

const initDb = async () => {
    try {
        const config = getDbConfig();
        
        if (config.uri) {
            pool = mysql.createPool(config.uri);
        } else {
            pool = mysql.createPool(config);
        }
        
        // Test connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        console.log('✅ MySQL database connected successfully');
        return pool;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        throw error;
    }
};

// Get pool instance (initialize if not exists)
const getPool = async () => {
    if (!pool) {
        await initDb();
    }
    return pool;
};

// Execute query helper
const query = async (sql, params = []) => {
    const db = await getPool();
    try {
        const [rows] = await db.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const db = await getPool();
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        const result = await callback(connection);
        await connection.commit();
        connection.release();
        return result;
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

module.exports = {
    initDb,
    getPool,
    query,
    transaction
};