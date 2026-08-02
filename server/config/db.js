const mysql = require('mysql2/promise');
require('dotenv').config();

let poolPromise = null;

function getPool() {
    if (!poolPromise) {
        poolPromise = (async () => {
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
                let tempPool;

                console.log('📦 Connecting to database...');
                if (dbConfig.host && dbConfig.user && dbConfig.database) {
                    tempPool = mysql.createPool(dbConfig);
                } else if (mysqlUrl) {
                    tempPool = mysql.createPool(mysqlUrl);
                } else {
                    console.error('❌ Database credentials not found in environment variables');
                    throw new Error('Database credentials not configured');
                }
                
                try {
                    // Test connection
                    const connection = await tempPool.getConnection();
                    await connection.ping();
                    connection.release();
                    
                    console.log('✅ Database connected successfully');
                    return tempPool;
                } catch (error) {
                    if (tempPool) {
                        try {
                            await tempPool.end();
                        } catch (closeError) {
                            console.error('Error closing pool after connection failure:', closeError.message);
                        }
                    }
                    throw error;
                }
            } catch (error) {
                console.error('❌ Database connection failed:', error.message);
                throw error;
            }
        })().catch(err => {
            poolPromise = null; // Reset agar bisa dicoba kembali pada request berikutnya
            throw err;
        });
    }
    return poolPromise;
}

async function query(sql, params = []) {
    const poolInstance = await getPool();
    const [rows] = await poolInstance.execute(sql, params);
    return rows;
}

module.exports = { getPool, query };