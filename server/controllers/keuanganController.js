const db = require('../config/db');
const ChaCha20Crypto = require('../crypto/chacha20');
const TwoFishCrypto = require('../crypto/twofish');

const chacha20 = new ChaCha20Crypto(process.env.CHACHA20_KEY || 'default-chacha20-key-for-testing-32byte!');
const twofish = new TwoFishCrypto(process.env.TWOFISH_KEY || 'default-twofish-key-32bytes-long!!!');

// ==================== PEMASUKAN (ChaCha20) ====================
const getPemasukan = async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM pemasukan ORDER BY tanggal DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error getPemasukan:', error);
        res.status(500).json([]);
    }
};

const addPemasukan = async (req, res) => {
    try {
        const { jumlah, tanggal, keterangan } = req.body;
        
        const sensitiveData = JSON.stringify({
            jumlah,
            tanggal,
            keterangan,
            user: req.user.username,
            created_at: new Date().toISOString()
        });
        const encryptedData = chacha20.encrypt(sensitiveData);
        
        const result = await db.query(
            'INSERT INTO pemasukan (jumlah, tanggal, keterangan, encrypted_data) VALUES (?, ?, ?, ?)',
            [jumlah, tanggal, keterangan || 'Pemasukan tunai', encryptedData]
        );
        
        await addActivityLog(req.user.username, `Menambah pemasukan Rp ${jumlah.toLocaleString()}`);
        
        res.json({ id: result.insertId, message: 'Pemasukan berhasil ditambahkan' });
    } catch (error) {
        console.error('Error addPemasukan:', error);
        res.status(500).json({ message: error.message });
    }
};

const resetPemasukan = async (req, res) => {
    try {
        await db.query('DELETE FROM pemasukan');
        await addActivityLog(req.user.username, 'Meriset seluruh data uang masuk');
        res.json({ message: 'Semua data pemasukan direset' });
    } catch (error) {
        console.error('Error resetPemasukan:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== BIAYA (ChaCha20) ====================
const getBiaya = async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM biaya');
        const biayaMap = {};
        rows.forEach(row => {
            biayaMap[row.jenis] = row.jumlah;
        });
        
        const history = await db.query('SELECT * FROM biaya_history ORDER BY changed_at DESC LIMIT 50');
        
        res.json({ current: biayaMap, history });
    } catch (error) {
        console.error('Error getBiaya:', error);
        res.status(500).json({ current: {}, history: [] });
    }
};

const updateBiaya = async (req, res) => {
    try {
        const { konsumsi, operasional } = req.body;
        
        await db.query('UPDATE biaya SET jumlah = ? WHERE jenis = ?', [konsumsi, 'konsumsi']);
        await db.query('UPDATE biaya SET jumlah = ? WHERE jenis = ?', [operasional, 'operasional']);
        
        await db.query(
            'INSERT INTO biaya_history (jenis, jumlah, changed_by) VALUES (?, ?, ?)',
            ['konsumsi', konsumsi, req.user.username]
        );
        await db.query(
            'INSERT INTO biaya_history (jenis, jumlah, changed_by) VALUES (?, ?, ?)',
            ['operasional', operasional, req.user.username]
        );
        
        await addActivityLog(
            req.user.username,
            `Update biaya: Konsumsi Rp ${konsumsi.toLocaleString()}, Operasional Rp ${operasional.toLocaleString()}`
        );
        
        res.json({ message: 'Biaya berhasil diupdate' });
    } catch (error) {
        console.error('Error updateBiaya:', error);
        res.status(500).json({ message: error.message });
    }
};

const resetBiayaHistory = async (req, res) => {
    try {
        await db.query('DELETE FROM biaya_history');
        await addActivityLog(req.user.username, 'Meriset history biaya');
        res.json({ message: 'History biaya direset' });
    } catch (error) {
        console.error('Error resetBiayaHistory:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== PROFIT SETTINGS ====================
const getProfitSettings = async (req, res) => {
    try {
        const settings = await db.query('SELECT * FROM profit_settings ORDER BY id DESC LIMIT 1');
        res.json(settings[0] || { duration_type: 'monthly', duration_value: 1 });
    } catch (error) {
        console.error('Error getProfitSettings:', error);
        res.status(500).json({ duration_type: 'monthly', duration_value: 1 });
    }
};

const updateProfitSettings = async (req, res) => {
    try {
        const { duration_type, duration_value } = req.body;
        
        const settings = await db.query('SELECT * FROM profit_settings ORDER BY id DESC LIMIT 1');
        const now = new Date();
        
        if (settings[0] && new Date(settings[0].next_update_allowed) > now) {
            return res.status(403).json({ 
                message: `Hanya bisa diganti ${settings[0].duration_value} hari sekali. Coba lagi setelah ${new Date(settings[0].next_update_allowed).toLocaleDateString()}` 
            });
        }
        
        let nextUpdate = new Date();
        if (duration_type === 'daily') nextUpdate.setDate(now.getDate() + 1);
        else if (duration_type === 'weekly') nextUpdate.setDate(now.getDate() + 7);
        else if (duration_type === 'monthly') nextUpdate.setMonth(now.getMonth() + 1);
        
        await db.query(
            'INSERT INTO profit_settings (duration_type, duration_value, last_updated, next_update_allowed) VALUES (?, ?, NOW(), ?)',
            [duration_type, duration_value, nextUpdate]
        );
        
        await addActivityLog(req.user.username, `Update profit setting: ${duration_type} (${duration_value} hari)`);
        
        res.json({ message: 'Pengaturan profit berhasil diupdate' });
    } catch (error) {
        console.error('Error updateProfitSettings:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== NOTIFIKASI ====================
const addNotification = async (username, title, message, type, barangId = null) => {
    try {
        await db.query(
            'INSERT INTO notifications (username, title, message, type, barang_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())',
            [username, title, message, type, barangId]
        );
    } catch (error) {
        console.error('Error adding notification:', error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const notifications = await db.query(
            'SELECT * FROM notifications WHERE username = ? OR username = "system" ORDER BY created_at DESC LIMIT 50',
            [req.user.username]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Error getNotifications:', error);
        res.status(500).json([]);
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error markNotificationRead:', error);
        res.status(500).json({ message: error.message });
    }
};

// ==================== ACTIVITY LOGS (TwoFish) ====================
const addActivityLog = async (username, action) => {
    try {
        const encryptedAction = twofish.encrypt(action);
        
        await db.query(
            'INSERT INTO activity_logs (username, action, encrypted_action, timestamp) VALUES (?, ?, ?, NOW())',
            [username, action, encryptedAction]
        );
    } catch (error) {
        console.error('Error adding activity log:', error);
    }
};

const getActivityLogs = async (req, res) => {
    try {
        const logs = await db.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 200');
        
        const decryptedLogs = logs.map(log => {
            try {
                const decryptedAction = twofish.decrypt(log.encrypted_action);
                return { ...log, action: decryptedAction, decrypted: true };
            } catch (error) {
                return { ...log, action: log.action, decrypted: false };
            }
        });
        
        res.json(decryptedLogs);
    } catch (error) {
        console.error('Error getActivityLogs:', error);
        res.status(500).json([]);
    }
};

module.exports = {
    getPemasukan,
    addPemasukan,
    resetPemasukan,
    getBiaya,
    updateBiaya,
    resetBiayaHistory,
    getProfitSettings,
    updateProfitSettings,
    addActivityLog,
    getActivityLogs,
    addNotification,
    getNotifications,
    markNotificationRead
};

