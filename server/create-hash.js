const bcrypt = require('bcryptjs');

async function createHash() {
    const password = 'owner';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash untuk password "owner":', hash);
    console.log('\nCopy hash ini dan update di database:');
    console.log(`UPDATE users SET password = '${hash}' WHERE username = 'owner';`);
}

createHash();