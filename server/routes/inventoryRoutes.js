const express = require('express');
const {
    getInventory,
    addInventory,
    updateMinStock,
    updateStock,
    updateAverageCost,
    updateHargaJual,
    deleteInventory
} = require('../controllers/inventoryController');
const { authenticateToken, checkOwner } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, getInventory);
router.post('/', authenticateToken, checkOwner, addInventory);
router.put('/min-stock', authenticateToken, checkOwner, updateMinStock);
router.put('/stock', authenticateToken, updateStock);
router.put('/average-cost', authenticateToken, checkOwner, updateAverageCost);
router.put('/harga-jual', authenticateToken, updateHargaJual);
router.delete('/:id', authenticateToken, checkOwner, deleteInventory);

module.exports = router;