const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/mailer');

const validatePassword = (password) => {
    // 8 karakter, huruf besar & kecil, angka, spesial karakter
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

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
        
        // Update session - hapus sesi lama agar tidak ada duplikat (hanya 1 sesi per user)
        await db.query('DELETE FROM user_sessions WHERE user_id = ?', [user.id]);
        
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
            await db.query('DELETE FROM user_sessions WHERE token = ?', [token]);
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
            LEFT JOIN user_sessions us ON u.id = us.user_id
            WHERE u.role = 'karyawan'
            ORDER BY u.id DESC
        `);
        
        // Update offline status (5 menit tidak aktif = offline)
        for (const user of users) {
            if (user.minutes_ago > 5 && user.is_online == 1) {
                await db.query('UPDATE user_sessions SET is_online = 0 WHERE user_id = ?', [user.id]);
                user.is_online = 0;
            }
            // Convert to boolean for frontend
            user.is_online = user.is_online == 1;
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

const requestOtp = async (req, res) => {
    try {
        const { email, type } = req.body;
        
        if (!email || !type) {
            return res.status(400).json({ success: false, message: 'Email dan tipe operasi harus diisi' });
        }

        // Cek email jika mode register
        if (type === 'register') {
            const existingEmail = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
            }
        }

        // Cek email jika mode reset password
        if (type === 'reset') {
            const user = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(404).json({ success: false, message: 'Email tidak ditemukan' });
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hapus OTP lama yang belum expired untuk email tersebut
        await db.query('DELETE FROM otps WHERE email = ? AND type = ?', [email, type]);
        
        // Expiration = 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60000);
        
        // Insert DB
        await db.query('INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)', [
            email, otp, type, expiresAt
        ]);

        // Send Email
        await sendOTPEmail(email, otp, type);

        res.json({ success: true, message: 'OTP berhasil dikirim ke email' });
    } catch (error) {
        console.error('requestOtp error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses OTP: ' + error.message });
    }
};

const register = async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;
        
        // Validasi input dasar
        if (!username || !email || !password || !otp) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
        }
        
        // Validasi keunikan
        const existingUsername = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
        }
        
        const existingEmail = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        // Validasi password kuat
        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial' 
            });
        }
        
        // Verifikasi OTP
        const otpRecord = await db.query('SELECT * FROM otps WHERE email = ? AND type = "register" AND otp = ?', [email, otp]);
        
        if (otpRecord.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP tidak valid' });
        }
        
        if (new Date() > new Date(otpRecord[0].expires_at)) {
            return res.status(400).json({ success: false, message: 'OTP sudah kadaluarsa' });
        }

        // OTP Valid. Hapus dari database otps
        await db.query('DELETE FROM otps WHERE id = ?', [otpRecord[0].id]);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert langsung ke tabel users dengan status 'active' (bypass approval)
        const result = await db.query(
            'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, 'karyawan', 'active']
        );
        
        // Tambah notifikasi untuk owner
        await db.query(
            'INSERT INTO notifications (username, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
            ['owner', 'Karyawan Baru Telah Mendaftar', `Karyawan baru bergabung dengan username ${username}.`, 'info']
        );

        // Langsung generate token untuk auto-login
        const token = jwt.sign(
            { id: result.insertId, username: username, role: 'karyawan' },
            process.env.JWT_SECRET || 'stok_kkp_super_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        await db.query('DELETE FROM user_sessions WHERE user_id = ?', [result.insertId]);
        await db.query(
            'INSERT INTO user_sessions (user_id, token, last_activity, is_online) VALUES (?, ?, NOW(), 1)',
            [result.insertId, token]
        );
        
        // Kirim response sukses & token
        res.status(200).json({ 
            success: true,
            message: 'Pendaftaran berhasil, Anda otomatis masuk.',
            token: token,
            user: {
                id: result.insertId,
                username: username,
                role: 'karyawan'
            }
        });
        
    } catch (error) {
        console.error('REGISTER ERROR:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        if (!email || !password || !otp) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
        }

        // Validasi password kuat
        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial' 
            });
        }

        // Verifikasi OTP
        const otpRecord = await db.query('SELECT * FROM otps WHERE email = ? AND type = "reset" AND otp = ?', [email, otp]);
        
        if (otpRecord.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP tidak valid' });
        }
        
        if (new Date() > new Date(otpRecord[0].expires_at)) {
            return res.status(400).json({ success: false, message: 'OTP sudah kadaluarsa' });
        }

        // OTP Valid. Hapus dari database otps
        await db.query('DELETE FROM otps WHERE id = ?', [otpRecord[0].id]);

        // Hash password baru
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        // Putuskan koneksi dari session lama jika dia login
        const user = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (user.length > 0) {
            await db.query('DELETE FROM user_sessions WHERE user_id = ?', [user[0].id]);
        }

        res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses reset password' });
    }
};

module.exports = { login, logout, getOnlineUsers, register, requestOtp, resetPassword };