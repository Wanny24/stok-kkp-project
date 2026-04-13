const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function debugRegister() {
    try {
        // Koneksi ke database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'stok_kkp_db'
        });
        
        const username = 'karyawan1';
        const password = '123456';
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('1. Hash password dibuat:', hashedPassword);
        
        // Cek apakah username sudah ada
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        console.log('2. Cek di users:', existing.length > 0 ? 'ADA' : 'TIDAK ADA');
        
        const [existingPending] = await connection.execute(
            'SELECT id FROM pending_registrations WHERE username = ?',
            [username]
        );
        console.log('3. Cek di pending_registrations:', existingPending.length > 0 ? 'ADA' : 'TIDAK ADA');
        
        // Insert ke pending_registrations
        if (existing.length === 0 && existingPending.length === 0) {
            const [result] = await connection.execute(
                'INSERT INTO pending_registrations (username, password) VALUES (?, ?)',
                [username, hashedPassword]
            );
            console.log('4. INSERT BERHASIL! ID:', result.insertId);
        } else {
            console.log('4. SKIP INSERT - username sudah ada');
        }
        
        // Cek hasil
        const [pendingList] = await connection.execute('SELECT * FROM pending_registrations');
        console.log('\n5. Isi pending_registrations sekarang:');
        console.table(pendingList);
        
        await connection.end();
        
    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

debugRegister();