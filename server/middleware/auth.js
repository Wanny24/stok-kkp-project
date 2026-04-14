const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stok_kkp_super_secret_key_2024');
        req.user = decoded;
        
        
        // UPDATE SESSION LAST ACTIVITY - TANDA ONLINE
        const [existing] = await db.query(
            'SELECT id FROM user_sessions WHERE user_id = ? AND token = ?',
            [decoded.id, token]
        );
        
        if (existing.length > 0) {
            await db.query(
                'UPDATE user_sessions SET last_activity = NOW(), is_online = 1 WHERE user_id = ? AND token = ?',
                [decoded.id, token]
            );
        } else {
            await db.query(
                'INSERT INTO user_sessions (user_id, token, last_activity, is_online) VALUES (?, ?, NOW(), 1)',
                [decoded.id, token]
            );
        }
        
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token tidak valid' });
    }
};

const checkOwner = (req, res, next) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Akses hanya untuk owner' });
    }
    next();
};

module.exports = { authenticateToken, checkOwner };