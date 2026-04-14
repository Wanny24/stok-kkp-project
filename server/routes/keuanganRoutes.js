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

// ========== TAMBAHKAN ENDPOINT PROFIT INI ==========
router.get('/profit', async (req, res) => {
    try {
        const db = require('../config/db');
        
        // Ambil total pemasukan
        const pemasukan = await db.query('SELECT SUM(jumlah) as total FROM pemasukan');
        const totalPemasukan = pemasukan[0]?.total || 0;
        
        // Ambil total biaya
        const biayaData = await db.query('SELECT SUM(jumlah) as total FROM biaya');
        const totalBiaya = biayaData[0]?.total || 0;
        
        const profit = totalPemasukan - totalBiaya;
        
        res.json([{
            periode: 'Saat Ini',
            pemasukan: totalPemasukan,
            biaya: totalBiaya,
            profit: profit
        }]);
    } catch (error) {
        console.error('Error getProfit:', error);
        res.status(500).json([]);
    }
});
// ========== END TAMBAHAN ==========

module.exports = router;