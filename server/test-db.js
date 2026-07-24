const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDB() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stok_kkp_db',
            port: parseInt(process.env.DB_PORT) || 3306,
            connectTimeout: 10000
        };

        console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}...`);
        const connection = await mysql.createConnection(dbConfig);
        
        console.log('✅ Koneksi database BERHASIL!');
        
        // Cek tabel users
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\nTabel dalam database:');
        console.log(tables);
        
        // Cek isi users
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('\nIsi tabel users:');
        console.log(users);
        
        await connection.end();
    } catch (error) {
        console.error('❌ Koneksi database GAGAL!');
        console.error('Error:', error.message);
        console.log('\nPeriksa:');
        console.log('1. Apakah MySQL sedang berjalan?');
        console.log('2. Apakah database "stok_kkp_db" sudah dibuat?');
        console.log('3. Apakah username/password MySQL di .env sudah benar?');
    }
}

testDB();