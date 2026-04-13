const db = require('../config/db');
const ChaCha20Crypto = require('../crypto/chacha20');

const chacha20 = new ChaCha20Crypto(process.env.CHACHA20_KEY || 'default-chacha20-key-for-testing-32byte!');

const getInventory = async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM inventory ORDER BY id');
        
        // Pastikan selalu mengembalikan array
        const inventory = Array.isArray(rows) ? rows : [];
        
        res.json(inventory);
    } catch (error) {
        console.error('Error getInventory:', error);
        // Kirim array kosong agar frontend tidak error
        res.status(200).json([]);
    }
};

const addInventory = async (req, res) => {
    try {
        const { nama, stock, harga_jual, average_cost, min_stock = 5 } = req.body;
        
        const sensitiveData = JSON.stringify({
            nama,
            created: new Date().toISOString(),
            user: req.user.username
        });
        const encryptedData = chacha20.encrypt(sensitiveData);
        
        const result = await db.query(
            'INSERT INTO inventory (nama, stock, harga_jual, average_cost, min_stock, encrypted_data) VALUES (?, ?, ?, ?, ?, ?)',
            [nama, stock, harga_jual, average_cost, min_stock, encryptedData]
        );
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Tambah produk: ${nama} (Stok: ${stock}, Min Stock: ${min_stock})`);
        
        res.json({ id: result.insertId, message: 'Barang berhasil ditambahkan' });
    } catch (error) {
        console.error('Error addInventory:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateMinStock = async (req, res) => {
    try {
        const { id, min_stock } = req.body;
        const item = await db.query('SELECT nama FROM inventory WHERE id = ?', [id]);
        
        if (item.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        
        await db.query('UPDATE inventory SET min_stock = ? WHERE id = ?', [min_stock, id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Update batas minimum stok ${item[0].nama} menjadi ${min_stock}`);
        
        res.json({ message: 'Batas minimum stok berhasil diupdate' });
    } catch (error) {
        console.error('Error updateMinStock:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateStock = async (req, res) => {
    try {
        const { id, type, quantity } = req.body;
        const item = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        
        if (item.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        
        let newStock = item[0].stock;
        if (type === 'tambah') {
            newStock += quantity;
        } else if (type === 'kurang') {
            if (newStock < quantity) {
                return res.status(400).json({ message: 'Stok tidak cukup' });
            }
            newStock -= quantity;
        }
        
        await db.query('UPDATE inventory SET stock = ? WHERE id = ?', [newStock, id]);
        
        // Cek stok menipis
        const minStock = item[0].min_stock || 5;
        if (newStock <= minStock) {
            const { addNotification } = require('./keuanganController');
            await addNotification(
                req.user.username,
                `Stok Menipis`,
                `${item[0].nama} tersisa ${newStock} pcs (minimal ${minStock})`,
                'warning',
                id
            );
        }
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(
            req.user.username,
            `${type === 'tambah' ? 'Tambah' : 'Kurangi'} stok ${item[0].nama} ${type === 'tambah' ? '+' : '-'}${quantity}`
        );
        
        res.json({ message: 'Stok berhasil diupdate', newStock });
    } catch (error) {
        console.error('Error updateStock:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateAverageCost = async (req, res) => {
    try {
        const { id, newQuantity, newUnitCost } = req.body;
        const item = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        
        if (item.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        
        const oldStock = item[0].stock;
        const oldAvg = parseFloat(item[0].average_cost);
        const totalCostBefore = oldStock * oldAvg;
        const newTotalCost = newQuantity * newUnitCost;
        const newStock = oldStock + newQuantity;
        const newAvg = Math.round((totalCostBefore + newTotalCost) / newStock);
        
        await db.query(
            'UPDATE inventory SET stock = ?, average_cost = ? WHERE id = ?',
            [newStock, newAvg, id]
        );
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(
            req.user.username,
            `Update modal ${item[0].nama}: beli ${newQuantity} pcs @Rp ${newUnitCost.toLocaleString()} -> rata-rata baru Rp ${newAvg.toLocaleString()}`
        );
        
        res.json({ message: 'Modal berhasil diupdate', newAverage: newAvg });
    } catch (error) {
        console.error('Error updateAverageCost:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateHargaJual = async (req, res) => {
    try {
        const { id, harga_jual } = req.body;
        const item = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        
        if (item.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        
        await db.query('UPDATE inventory SET harga_jual = ? WHERE id = ?', [harga_jual, id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(
            req.user.username,
            `Ubah harga jual ${item[0].nama} -> Rp ${harga_jual.toLocaleString()}`
        );
        
        res.json({ message: 'Harga jual berhasil diupdate' });
    } catch (error) {
        console.error('Error updateHargaJual:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
        
        if (item.length === 0) {
            return res.status(404).json({ message: 'Barang tidak ditemukan' });
        }
        
        await db.query('DELETE FROM inventory WHERE id = ?', [id]);
        
        const { addActivityLog } = require('./keuanganController');
        await addActivityLog(req.user.username, `Menghapus barang: ${item[0].nama}`);
        
        res.json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
        console.error('Error deleteInventory:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInventory,
    addInventory,
    updateMinStock,
    updateStock,
    updateAverageCost,
    updateHargaJual,
    deleteInventory
};