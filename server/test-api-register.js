const axios = require('axios');

async function testAPI() {
    try {
        console.log('Mencoba registrasi ke API...');
        console.log('URL: http://localhost:5000/api/auth/register');
        console.log('Data: { username: "testuser2", password: "123456" }');
        
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'testuser2',
            password: '123456'
        });
        
        console.log('\n✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('\n❌ FAILED!');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('Error: Koneksi ditolak! Pastikan backend sedang berjalan di port 5000');
            console.log('Jalankan: npm run dev di folder server');
        } else if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.message);
            console.log('Full response:', error.response.data);
        } else if (error.request) {
            console.log('No response received from server');
            console.log('Pastikan backend sudah running!');
        } else {
            console.log('Error:', error.message);
        }
        
        console.log('\n💡 Tips:');
        console.log('1. Pastikan backend running: cd server && npm run dev');
        console.log('2. Cek dengan browser: http://localhost:5000');
        console.log('3. Jika tidak bisa, cek apakah port 5000 terbuka');
    }
}

testAPI();