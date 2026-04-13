const mysql = require('mysql2/promise');

async function testDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Ganti dengan password MySQL Anda
            database: 'stok_kkp_db'
        });
        
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