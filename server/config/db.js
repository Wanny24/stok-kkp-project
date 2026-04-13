const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function getPool() {
    if (!pool) {
        const config = process.env.MYSQL_URL ? 
            { uri: process.env.MYSQL_URL, waitForConnections: true, connectionLimit: 10 } :
            {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'stok_kkp_db',
                waitForConnections: true,
                connectionLimit: 10
            };
        
        pool = mysql.createPool(config);
        console.log('✅ Database pool created');
    }
    return pool;
}

async function query(sql, params = []) {
    const pool = await getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = { getPool, query };