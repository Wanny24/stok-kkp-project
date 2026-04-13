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

// Pemasukan
router.get('/pemasukan', authenticateToken, getPemasukan);
router.post('/pemasukan', authenticateToken, addPemasukan);
router.delete('/pemasukan/reset', authenticateToken, checkOwner, resetPemasukan);

// Biaya
router.get('/biaya', authenticateToken, getBiaya);
router.put('/biaya', authenticateToken, checkOwner, updateBiaya);
router.delete('/biaya/history', authenticateToken, checkOwner, resetBiayaHistory);

// Profit Settings
router.get('/profit-settings', authenticateToken, checkOwner, getProfitSettings);
router.put('/profit-settings', authenticateToken, checkOwner, updateProfitSettings);

// Notifications
router.get('/notifications', authenticateToken, getNotifications);
router.put('/notifications/:id/read', authenticateToken, markNotificationRead);

// Logs
router.get('/logs', authenticateToken, checkOwner, getActivityLogs);

module.exports = router;