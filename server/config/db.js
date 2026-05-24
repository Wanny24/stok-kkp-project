const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            // Coba ambil dari konfigurasi individual (seperti FreeDB.tech) atau fallback ke MYSQL_URL
            const dbConfig = {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true
            };

            const mysqlUrl = process.env.MYSQL_URL;

            console.log('📦 Connecting to database...');
            if (dbConfig.host && dbConfig.user && dbConfig.database) {
                // Koneksi manual pakai kredensial terpisah
                pool = mysql.createPool(dbConfig);
            } else if (mysqlUrl) {
                // Fallback untuk URL string
                pool = mysql.createPool(mysqlUrl);
            } else {
                console.error('❌ Database credentials not found in environment variables');
                throw new Error('Database credentials not configured');
            }
            
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