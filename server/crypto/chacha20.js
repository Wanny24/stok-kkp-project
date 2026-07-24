const crypto = require('crypto');

// Constants: "expand 32-byte k"
const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

function quarterRound(state, a, b, c, d) {
    state[a] = (state[a] + state[b]) | 0;
    state[d] ^= state[a];
    state[d] = (state[d] << 16) | (state[d] >>> 16);

    state[c] = (state[c] + state[d]) | 0;
    state[b] ^= state[c];
    state[b] = (state[b] << 12) | (state[b] >>> 20);

    state[a] = (state[a] + state[b]) | 0;
    state[d] ^= state[a];
    state[d] = (state[d] << 8) | (state[d] >>> 24);

    state[c] = (state[c] + state[d]) | 0;
    state[b] ^= state[c];
    state[b] = (state[b] << 7) | (state[b] >>> 25);
}

function chacha20Block(out, inState) {
    let x = new Int32Array(16);
    for (let i = 0; i < 16; i++) {
        x[i] = inState[i];
    }

    // 20 rounds (10 loops of 2 rounds)
    for (let i = 0; i < 10; i++) {
        // Column rounds
        quarterRound(x, 0, 4, 8, 12);
        quarterRound(x, 1, 5, 9, 13);
        quarterRound(x, 2, 6, 10, 14);
        quarterRound(x, 3, 7, 11, 15);
        // Diagonal rounds
        quarterRound(x, 0, 5, 10, 15);
        quarterRound(x, 1, 6, 11, 12);
        quarterRound(x, 2, 7, 8, 13);
        quarterRound(x, 3, 4, 9, 14);
    }

    for (let i = 0; i < 16; i++) {
        out[i] = (x[i] + inState[i]) | 0;
    }
}

function chacha20InitState(key, nonce, counter) {
    let state = new Int32Array(16);
    state[0] = SIGMA[0];
    state[1] = SIGMA[1];
    state[2] = SIGMA[2];
    state[3] = SIGMA[3];

    // Key (32 bytes = 8 words)
    for (let i = 0; i < 8; i++) {
        state[4 + i] = key.readInt32LE(i * 4);
    }

    // Counter (1 word)
    state[12] = counter;

    // Nonce (12 bytes = 3 words)
    state[13] = nonce.readInt32LE(0);
    state[14] = nonce.readInt32LE(4);
    state[15] = nonce.readInt32LE(8);

    return state;
}

function chacha20EncryptDecrypt(key, nonce, counter, plaintext) {
    let state = chacha20InitState(key, nonce, counter);
    let ciphertext = Buffer.alloc(plaintext.length);
    let block = new Int32Array(16);
    let blockBytes = Buffer.alloc(64);

    for (let i = 0; i < plaintext.length; i += 64) {
        state[12] = counter + Math.floor(i / 64);
        
        chacha20Block(block, state);

        for (let j = 0; j < 16; j++) {
            blockBytes.writeInt32LE(block[j], j * 4);
        }

        let len = Math.min(64, plaintext.length - i);
        for (let j = 0; j < len; j++) {
            ciphertext[i + j] = plaintext[i + j] ^ blockBytes[j];
        }
    }

    return ciphertext;
}

class ChaCha20Crypto {
    constructor(key) {
        if (typeof key === 'string') {
            this.key = crypto.createHash('sha256').update(key).digest();
        } else if (Buffer.isBuffer(key)) {
            this.key = key.length === 32 ? key : crypto.createHash('sha256').update(key).digest();
        } else {
            this.key = crypto.randomBytes(32);
        }

        if (this.key.length !== 32) {
            throw new Error('ChaCha20 key must be 32 bytes');
        }
    }

    encrypt(text) {
        const nonce = crypto.randomBytes(12);
        const plaintext = Buffer.from(text, 'utf8');
        
        // Start block counter at 1 for compatibility with native chacha20-poly1305 payload encryption
        const encrypted = chacha20EncryptDecrypt(this.key, nonce, 1, plaintext);
        
        // Return format: nonceHex:dummyAuthTag:encryptedHex
        const dummyAuthTag = '00000000000000000000000000000000';
        return nonce.toString('hex') + ':' + dummyAuthTag + ':' + encrypted.toString('hex');
    }

    decrypt(encryptedText) {
        try {
            const parts = encryptedText.split(':');
            let nonceHex, encryptedHex;
            
            if (parts.length === 3) {
                // Format: nonce:authTag:encrypted
                nonceHex = parts[0];
                encryptedHex = parts[2];
            } else if (parts.length === 2) {
                // Simple format: nonce:encrypted
                nonceHex = parts[0];
                encryptedHex = parts[1];
            } else {
                throw new Error('Invalid format');
            }
            
            const nonce = Buffer.from(nonceHex, 'hex');
            const encrypted = Buffer.from(encryptedHex, 'hex');
            
            // Decrypt starting at counter 1
            const decrypted = chacha20EncryptDecrypt(this.key, nonce, 1, encrypted);
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('ChaCha20 decryption error:', error.message);
            return '[Decryption Failed]';
        }
    }
}

module.exports = ChaCha20Crypto;