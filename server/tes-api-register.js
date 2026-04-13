const axios = require('axios');

async function testAPI() {
    try {
        console.log('Mencoba registrasi ke API...');
        
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'testuser2',
            password: '123456'
        });
        
        console.log('✅ SUCCESS!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('❌ FAILED!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.message);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testAPI();