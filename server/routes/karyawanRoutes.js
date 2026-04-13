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

// Semua route hanya untuk owner yang sudah login
router.use(authenticateToken);
router.use(checkOwner);

router.get('/pending', getPendingRegistrations);
router.post('/approve/:id', approveKaryawan);
router.delete('/reject/:id', rejectKaryawan);
router.get('/list', getKaryawanList);
router.delete('/resign/:id', resignKaryawan);

module.exports = router;