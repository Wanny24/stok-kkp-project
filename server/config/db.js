const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function getPool() {
    if (!pool) {
        try {
            const dbConfig = {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: parseInt(process.env.DB_PORT) || 3306,
                waitForConnections: true,
                connectionLimit: 1,   // Vercel Serverless = pakai 1 agar tidak bentrok dengan instance lain
                maxIdle: 1,           // Tutup koneksi idle secepatnya
                idleTimeout: 10000,   // 10 detik idle langsung putus
                queueLimit: 10,
                enableKeepAlive: false, // JANGAN keepAlive di Serverless Vercel
                connectTimeout: 10000
            };

            const mysqlUrl = process.env.MYSQL_URL;

            console.log('📦 Connecting to database...');
            if (dbConfig.host && dbConfig.user && dbConfig.database) {
                pool = mysql.createPool(dbConfig);
            } else if (mysqlUrl) {
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
            pool = null; // Reset pool agar bisa reconnect pada request berikutnya
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