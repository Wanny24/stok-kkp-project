const express = require('express');
const {
    getPemasukan,
    addPemasukan,
    resetPemasukan,
    getBiaya,
    updateBiaya,
    resetBiayaHistory,
    getProfitSettings,
    updateProfitSettings,
    getActivityLogs,
    getNotifications,
    markNotificationRead
} = require('../controllers/keuanganController');
const { authenticateToken, checkOwner } = require('../middleware/auth');
const router = express.Router();

// Semua route require login
router.use(authenticateToken);

// Pemasukan
router.get('/pemasukan', getPemasukan);
router.post('/pemasukan', addPemasukan);
router.delete('/pemasukan/reset', checkOwner, resetPemasukan);

// Biaya
router.get('/biaya', getBiaya);
router.put('/biaya', checkOwner, updateBiaya);
router.delete('/biaya/history', checkOwner, resetBiayaHistory);

// Profit Settings
router.get('/profit-settings', checkOwner, getProfitSettings);
router.put('/profit-settings', checkOwner, updateProfitSettings);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Logs
router.get('/logs', checkOwner, getActivityLogs);

// Tambahkan di dalam file keuanganRoutes.js, setelah route biaya lainnya

// History Biaya dengan detail (POST untuk tambah history)
router.post('/biaya/history', checkOwner, async (req, res) => {
    try {
        const { jenis, jumlah, keterangan, tanggal } = req.body;
        const db = require('../config/db');
        
        await db.query(
            'INSERT INTO biaya_history (jenis, jumlah, changed_by, changed_at, keterangan) VALUES (?, ?, ?, ?, ?)',
            [jenis, jumlah, req.user.username, tanggal || new Date(), keterangan || '']
        );
        
        res.json({ success: true, message: 'History biaya ditambahkan' });
    } catch (error) {
        console.error('Error add biaya history:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;