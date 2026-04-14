const db = require('../config/db');

const getPendingRegistrations = async (req, res) => {
    try {
        const pending = await db.query('SELECT * FROM pending_registrations ORDER BY created_at DESC');
        res.json(pending);
    } catch (error) {
        console.error('Error getPendingRegistrations:', error);
        res.status(500).json([]);
    }
};

const approveKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const pending = await db.query('SELECT * FROM pending_registrations WHERE id = ?', [id]);
        
        if (pending.length === 0) {
            return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
        }
        
        const user = pending[0];
        await db.query(
            'INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)',
            [user.username, user.password, 'karyawan', 'active']
        );
        
        await db.query('DELETE FROM pending_registrations WHERE id = ?', [id]);
        
        const { addActivityLog, addNotification } = require('./keuanganController');
        await addActivityLog(req.user.username, `Menyetujui karyawan: ${user.username}`);
        await addNotification(user.username, '✅ Akun Disetujui', `Akun Anda telah disetujui oleh Owner. Silakan login`, 'success');
        await addNotification(req.user.username, '✅ Karyawan Disetujui', `Karyawan "${user.username}" telah disetujui`, 'success');
        
        res.json({ success: true, message: 'Karyawan berhasil disetujui' });
    } catch (error) {
        console.error('Error approveKaryawan:', error);
        res.status(500).json({ message: error.message });
    }
};

const rejectKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const pending = await db.query('SELECT * FROM pending_registrations WHERE id = ?', [id]);
        
        if (pending.length === 0) {
            return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
        }
        
        const username = pending[0].username;
        await db.query('DELETE FROM pending_registrations WHERE id = ?', [id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Menolak pendaftaran: ${username}`);
        
        res.json({ success: true, message: 'Pendaftaran ditolak' });
    } catch (error) {
        console.error('Error rejectKaryawan:', error);
        res.status(500).json({ message: error.message });
    }
};

const getKaryawanList = async (req, res) => {
    try {
        // Update offline status untuk session yang sudah tidak aktif > 5 menit
        await db.query(`
            UPDATE user_sessions 
            SET is_online = 0 
            WHERE is_online = 1 AND last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        `);
        
        const karyawan = await db.query(`
            SELECT 
                u.id, 
                u.username, 
                u.role, 
                u.status, 
                COALESCE(us.is_online, 0) as is_online,
                us.last_activity
            FROM users u
            LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_online = 1
            WHERE u.role = 'karyawan'
            ORDER BY u.id DESC
        `);
        
        // Convert ke boolean untuk frontend
        const formatted = karyawan.map(k => ({
            ...k,
            is_online: k.is_online === 1,
            last_activity: k.last_activity || null
        }));
        
        res.json(formatted);
    } catch (error) {
        console.error('Error getKaryawanList:', error);
        res.status(500).json([]);
    }
};

const resignKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.query('SELECT username FROM users WHERE id = ? AND role = "karyawan"', [id]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
        }
        
        await db.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ? AND role = "karyawan"', [id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Resign karyawan ${user[0].username}`);
        
        res.json({ success: true, message: 'Karyawan berhasil di-resign' });
    } catch (error) {
        console.error('Error resignKaryawan:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingRegistrations,
    approveKaryawan,
    rejectKaryawan,
    getKaryawanList,
    resignKaryawan
};