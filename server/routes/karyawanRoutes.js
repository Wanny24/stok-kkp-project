const express = require('express');
const {
    getPendingRegistrations,
    approveKaryawan,
    rejectKaryawan,
    getKaryawanList,
    resignKaryawan
} = require('../controllers/karyawanController');
const { authenticateToken, checkOwner } = require('../middleware/auth');
const router = express.Router();

router.get('/pending', authenticateToken, checkOwner, getPendingRegistrations);
router.post('/approve/:id', authenticateToken, checkOwner, approveKaryawan);
router.delete('/reject/:id', authenticateToken, checkOwner, rejectKaryawan);
router.get('/list', authenticateToken, checkOwner, getKaryawanList);
router.delete('/resign/:id', authenticateToken, checkOwner, resignKaryawan);

module.exports = router;