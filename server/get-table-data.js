const mysql = require('mysql2/promise');
require('dotenv').config();

async function getData() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stok_kkp_db',
            port: parseInt(process.env.DB_PORT) || 3306,
            connectTimeout: 10000
        };

        const connection = await mysql.createConnection(dbConfig);
        console.log('--- pemasukan ---');
        const [rows] = await connection.execute('SELECT * FROM pemasukan LIMIT 5');
        console.log(rows);
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

getData();
