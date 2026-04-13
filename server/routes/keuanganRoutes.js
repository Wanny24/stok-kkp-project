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

module.exports = router;