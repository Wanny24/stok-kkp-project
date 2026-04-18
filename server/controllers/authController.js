const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('========================================');
        console.log('LOGIN ATTEMPT:');
        console.log('Username:', username);
        console.log('========================================');
        
        // Cek user di database - PERBAIKAN: 'approved' diganti 'active'
        const users = await db.query(
            'SELECT * FROM users WHERE username = ? AND status = "active"',
            [username]
        );
        
        console.log('User found in database:', users.length > 0 ? 'YES' : 'NO');
        
        if (users.length === 0) {
            console.log('User not found or not active');
            return res.status(401).json({ 
                success: false,
                message: 'Username atau password salah' 
            });
        }
        
        const user = users[0];
        console.log('User role:', user.role);
        
        // Verifikasi password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword ? 'YES' : 'NO');
        
        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ 
                success: false,
                message: 'Username atau password salah' 
            });
        }
        
        // Buat JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'stok_kkp_super_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        // Update session - matikan session lama
        await db.query('UPDATE user_sessions SET is_online = 0 WHERE user_id = ?', [user.id]);
        
        // Insert session baru
        await db.query(
            'INSERT INTO user_sessions (user_id, token, last_activity, is_online) VALUES (?, ?, NOW(), 1)',
            [user.id, token]
        );
        
        console.log('Session created for user:', username);
        console.log('Token generated successfully');
        
        // Kirim response sukses
        res.status(200).json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
        
        console.log('Login SUCCESS for user:', username);
        console.log('========================================\n');
        
    } catch (error) {
        console.error('========================================');
        console.error('LOGIN ERROR:', error);
        console.error('========================================\n');
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan pada server: ' + error.message 
        });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            await db.query('UPDATE user_sessions SET is_online = 0 WHERE token = ?', [token]);
        }
        
        res.json({ 
            success: true,
            message: 'Logout berhasil' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const getOnlineUsers = async (req, res) => {
    try {
        // Get all karyawan with their online status
        const users = await db.query(`
            SELECT 
                u.id, 
                u.username, 
                u.role, 
                us.is_online, 
                us.last_activity,
                TIMESTAMPDIFF(MINUTE, us.last_activity, NOW()) as minutes_ago
            FROM users u
            LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_online = 1
            WHERE u.role = 'karyawan'
            GROUP BY u.id
            ORDER BY u.id DESC
        `);
        
        // Update offline status (5 menit tidak aktif = offline)
        for (const user of users) {
            if (user.minutes_ago > 5 && user.is_online === 1) {
                await db.query('UPDATE user_sessions SET is_online = 0 WHERE user_id = ?', [user.id]);
                user.is_online = 0;
            }
            // Convert to boolean for frontend
            user.is_online = user.is_online === 1;
        }
        
        // Get login history for tooltip
        const history = await db.query(`
            SELECT username, action, timestamp 
            FROM activity_logs 
            WHERE action LIKE '%Login%' 
            ORDER BY timestamp DESC 
            LIMIT 50
        `);
        
        res.json({ 
            success: true,
            users, 
            history 
        });
    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('========================================');
        console.log('REGISTER ATTEMPT:');
        console.log('Username:', username);
        console.log('========================================');
        
        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            });
        }
        
        if (password.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 4 karakter'
            });
        }
        
        // Cek apakah username sudah ada di users
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = ?', 
            [username]
        );
        
        if (existingUser.length > 0) {
            console.log('Username already exists in users');
            return res.status(400).json({ 
                success: false,
                message: 'Username sudah terdaftar' 
            });
        }
        
        // Cek apakah sudah pernah registrasi dan pending
        const existingPending = await db.query(
            'SELECT id FROM pending_registrations WHERE username = ?', 
            [username]
        );
        
        if (existingPending.length > 0) {
            console.log('Username already pending');
            return res.status(400).json({ 
                success: false,
                message: 'Username sudah pernah mendaftar, menunggu persetujuan owner' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');
        
        // Insert ke pending_registrations
        const result = await db.query(
            'INSERT INTO pending_registrations (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        
        console.log('Insert success, ID:', result.insertId);

        // Tambah notifikasi untuk owner
        await db.query(
            'INSERT INTO notifications (username, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
            ['owner', 'Karyawan Baru mendaftar', `Karyawan baru mendaftar dengan username ${username}, menunggu persetujuan.`, 'info']
        );
        
        // Kirim response sukses
        res.status(200).json({ 
            success: true,
            message: 'Pendaftaran berhasil, menunggu persetujuan owner',
            data: {
                username: username,
                id: result.insertId
            }
        });
        
        console.log('REGISTER SUCCESS for user:', username);
        console.log('========================================\n');
        
    } catch (error) {
        console.error('========================================');
        console.error('REGISTER ERROR:', error);
        console.error('========================================\n');
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan pada server: ' + error.message 
        });
    }
};

module.exports = { login, logout, getOnlineUsers, register };