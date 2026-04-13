const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const keuanganRoutes = require('./routes/keuanganRoutes');
const karyawanRoutes = require('./routes/karyawanRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/keuangan', keuanganRoutes);
app.use('/api/karyawan', karyawanRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});