const crypto = require('crypto');

class ChaCha20Crypto {
    constructor(key) {
        // ChaCha20 membutuhkan key 32 byte (256 bit)
        if (typeof key === 'string') {
            // Jika key berupa hex string
            if (key.length === 64) {
                this.key = Buffer.from(key, 'hex');
            } else {
                // Hash key ke 32 byte
                this.key = crypto.createHash('sha256').update(key).digest();
            }
        } else if (Buffer.isBuffer(key)) {
            this.key = key;
        } else {
            // Default key (jangan gunakan di production!)
            this.key = crypto.randomBytes(32);
        }
        
        if (this.key.length !== 32) {
            throw new Error('ChaCha20 key must be 32 bytes');
        }
    }

    encrypt(text) {
        // Generate random 12-byte nonce untuk ChaCha20-Poly1305
        const nonce = crypto.randomBytes(12);
        
        // Node.js menggunakan ChaCha20-Poly1305 (AEAD)
        const cipher = crypto.createCipheriv('chacha20-poly1305', this.key, nonce);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Dapatkan auth tag untuk verifikasi
        const authTag = cipher.getAuthTag();
        
        // Gabungkan: nonce + authTag + encrypted data
        return nonce.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        try {
            const [nonceHex, authTagHex, encrypted] = encryptedText.split(':');
            
            const nonce = Buffer.from(nonceHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            
            const decipher = crypto.createDecipheriv('chacha20-poly1305', this.key, nonce);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('ChaCha20 decryption error:', error.message);
            return '[Decryption Failed]';
        }
    }
}

module.exports = ChaCha20Crypto;