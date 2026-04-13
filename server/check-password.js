const bcrypt = require('bcryptjs');

// Ganti dengan hash lengkap yang ada di database Anda
// Copy dari MySQL: SELECT password FROM users WHERE username = 'owner';
const hashFromDB = '$2b$10$EkHVnuLYEYsuWLYU50Gjo.Z7ch7m9TDkLBfNmDWqH6R...'; // Ganti dengan hash lengkap!

const inputPassword = 'owner';

async function check() {
    try {
        const match = await bcrypt.compare(inputPassword, hashFromDB);
        console.log('========================================');
        console.log('Password "owner" cocok?', match ? '✅ YES' : '❌ NO');
        console.log('========================================');
        
        if (!match) {
            // Buat hash baru
            const newHash = await bcrypt.hash('owner', 10);
            console.log('\nHash baru untuk password "owner":');
            console.log(newHash);
            console.log('\nJalankan di MySQL:');
            console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'owner';`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

check();