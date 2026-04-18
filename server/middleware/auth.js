const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Token tidak ditemukan' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'stok_kkp_super_secret_key_2024', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Token tidak valid' 
            });
        }
        req.user = user;
        // Keep session alive
        db.query('UPDATE user_sessions SET last_activity = NOW(), is_online = 1 WHERE token = ?', [token]).catch(console.error);
        next();
    });
};

const checkOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ 
            success: false,
            message: 'Akses hanya untuk owner' 
        });
    }
    next();
};

module.exports = { authenticateToken, checkOwner };