const express = require('express');
const { login, logout, getOnlineUsers, register, requestOtp, resetPassword } = require('../controllers/authController');
const { authenticateToken, checkOwner } = require('../middleware/auth');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/request-otp', requestOtp);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticateToken, logout);
router.get('/online-users', authenticateToken, checkOwner, getOnlineUsers);

module.exports = router;