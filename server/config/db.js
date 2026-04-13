const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            // Railway akan memberikan MYSQL_URL secara otomatis
            const mysqlUrl = process.env.MYSQL_URL;
            
            if (!mysqlUrl) {
                console.error('❌ MYSQL_URL not found in environment variables');
                throw new Error('Database URL not configured');
            }
            
            console.log('📦 Connecting to database...');
            pool = mysql.createPool({
                uri: mysqlUrl,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true
            });
            
            // Test connection
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw error;
        }
    }
    return pool;
}

async function query(sql, params = []) {
    const poolInstance = await getPool();
    const [rows] = await poolInstance.execute(sql, params);
    return rows;
}

module.exports = { getPool, query };