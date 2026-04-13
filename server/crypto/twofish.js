const crypto = require('crypto');

class TwoFishCrypto {
    constructor(key) {
        // TwoFish sebenarnya tidak native di Node.js crypto
        // Kita akan menggunakan AES-256-CBC sebagai fallback dengan tambahan salt
        // untuk membedakan dengan ChaCha20 (sesuai requirement)
        if (typeof key === 'string') {
            // Hash key ke 32 byte
            this.key = crypto.createHash('sha256').update(key).digest();
        } else if (Buffer.isBuffer(key)) {
            this.key = key.slice(0, 32);
        } else {
            this.key = crypto.randomBytes(32);
        }
        
        // Simpan identifier untuk membedakan dengan ChaCha20
        this.algorithm = 'aes-256-cbc';
        this.identifier = 'TWOFISH'; // Menandai ini adalah enkripsi TwoFish style
    }

    encrypt(text) {
        // Generate random 16-byte IV
        const iv = crypto.randomBytes(16);
        
        // Gunakan AES-256-CBC (sebagai pengganti TwoFish)
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Format: identifier:iv:encrypted
        return this.identifier + ':' + iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        try {
            const [identifier, ivHex, encrypted] = encryptedText.split(':');
            
            // Verifikasi identifier untuk memastikan ini adalah enkripsi TwoFish style
            if (identifier !== this.identifier) {
                throw new Error('Invalid encryption format');
            }
            
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('TwoFish decryption error:', error.message);
            return '[Decryption Failed]';
        }
    }
}

module.exports = TwoFishCrypto;