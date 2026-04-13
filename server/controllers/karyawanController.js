const db = require('../config/db');

const getPendingRegistrations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pending_registrations');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const approveKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const [pending] = await db.query('SELECT * FROM pending_registrations WHERE id = ?', [id]);
        
        if (pending.length === 0) {
            return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
        }
        
        const user = pending[0];
        await db.query(
            'INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)',
            [user.username, user.password, 'karyawan', 'approved']
        );
        
        await db.query('DELETE FROM pending_registrations WHERE id = ?', [id]);
        
        const { addActivityLog, addNotification } = require('./keuanganController');
        await addActivityLog(req.user.username, `Menyetujui karyawan: ${user.username}`);
        await addNotification(user.username, 'Akun Disetujui', 'Akun Anda telah disetujui oleh Owner, silakan login', 'success');
        
        res.json({ message: 'Karyawan berhasil disetujui' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const [pending] = await db.query('SELECT * FROM pending_registrations WHERE id = ?', [id]);
        
        if (pending.length === 0) {
            return res.status(404).json({ message: 'Pendaftaran tidak ditemukan' });
        }
        
        const username = pending[0].username;
        await db.query('DELETE FROM pending_registrations WHERE id = ?', [id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Menolak pendaftaran: ${username}`);
        
        res.json({ message: 'Pendaftaran ditolak' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getKaryawanList = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT u.id, u.username, u.role, u.status, 
                   us.is_online, us.last_activity
            FROM users u
            LEFT JOIN user_sessions us ON u.id = us.user_id
            WHERE u.role = 'karyawan'
            ORDER BY u.id DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resignKaryawan = async (req, res) => {
    try {
        const { id } = req.params;
        const [user] = await db.query('SELECT username FROM users WHERE id = ? AND role = "karyawan"', [id]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
        }
        
        await db.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ? AND role = "karyawan"', [id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Resign karyawan ${user[0].username}`);
        
        res.json({ message: 'Karyawan berhasil di-resign' });
    } catch (error) {
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