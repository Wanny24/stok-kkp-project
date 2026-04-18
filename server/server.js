const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const keuanganRoutes = require('./routes/keuanganRoutes');
const karyawanRoutes = require('./routes/karyawanRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'configured'
    });
});

// === FUNGSI AUTO MIGRASI SEDERHANA ===
async function autoMigrate() {
    let connection;
    try {
        // Koneksi ke database
        const dbConfig = process.env.MYSQL_URL ? 
            { uri: process.env.MYSQL_URL } :
            {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'stok_kkp_db'
            };
        
        console.log('📦 Checking database connection...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');

        // 1. Tabel users
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE DEFAULT NULL,
                role ENUM('owner', 'karyawan') NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table users ready');

        try {
            await connection.execute('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE DEFAULT NULL');
            console.log('✓ Column email added to users');
        } catch (e) {}

        // 1.5. Tabel otps
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                type ENUM('register', 'reset') NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table otps ready');

        // 2. Tabel pending_registrations
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pending_registrations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table pending_registrations ready');

        // 3. Tabel inventory
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS inventory (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nama VARCHAR(255) NOT NULL,
                stock INT DEFAULT 0,
                min_stock INT DEFAULT 0,
                harga_jual DECIMAL(15,2),
                average_cost DECIMAL(15,2),
                encrypted_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table inventory ready');

        // 4. Tabel pemasukan
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pemasukan (
                id INT PRIMARY KEY AUTO_INCREMENT,
                jumlah DECIMAL(15,2) NOT NULL,
                tanggal DATE NOT NULL,
                keterangan TEXT,
                encrypted_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table pemasukan ready');

        // 5. Tabel biaya
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS biaya (
                id INT PRIMARY KEY AUTO_INCREMENT,
                jenis VARCHAR(100) NOT NULL,
                jumlah DECIMAL(15,2) NOT NULL,
                encrypted_data TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table biaya ready');

        // 6. Tabel biaya_history
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS biaya_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                jenis VARCHAR(100) NOT NULL,
                jumlah DECIMAL(15,2) NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                changed_by VARCHAR(100)
            )
        `);
        console.log('✓ Table biaya_history ready');

        try {
            await connection.execute('ALTER TABLE biaya_history ADD COLUMN keterangan TEXT');
            console.log('✓ Column keterangan added to biaya_history');
        } catch (e) {}

        try {
            await connection.execute('ALTER TABLE biaya_history ADD COLUMN tanggal DATE');
            console.log('✓ Column tanggal added to biaya_history');
        } catch (e) {}

        // 7. Tabel activity_logs
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) NOT NULL,
                action TEXT NOT NULL,
                encrypted_action TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table activity_logs ready');

        // 8. Tabel notifications
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(100) NOT NULL,
                title VARCHAR(255),
                message TEXT,
                type VARCHAR(50),
                barang_id INT,
                encrypted_data TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table notifications ready');

        // 9. Tabel profit_settings
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS profit_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                duration_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
                duration_value INT DEFAULT 1,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                next_update_allowed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table profit_settings ready');

        // 10. Tabel user_sessions
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                token TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_online BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✓ Table user_sessions ready');

        // Cek dan update/buat owner
        const [ownerCheck] = await connection.execute(
            `SELECT * FROM users WHERE role = 'owner' LIMIT 1`
        );
        
        const ownerUsername = 'DechaJaya';
        const ownerPassword = 'Pemancingantangsel99.';
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);

        if (ownerCheck.length === 0) {
            await connection.execute(
                `INSERT INTO users (username, password, role, status) VALUES (?, ?, 'owner', 'active')`,
                [ownerUsername, hashedPassword]
            );
            console.log(`✓ Owner created (username: ${ownerUsername})`);
        } else {
            await connection.execute(
                `UPDATE users SET username = ?, password = ? WHERE role = 'owner'`,
                [ownerUsername, hashedPassword]
            );
            console.log(`✓ Owner updated (username: ${ownerUsername})`);
        }

        // Cek dan buat default profit_settings jika belum ada
        const [settingsCheck] = await connection.execute(
            `SELECT * FROM profit_settings LIMIT 1`
        );
        
        if (settingsCheck.length === 0) {
            await connection.execute(
                `INSERT INTO profit_settings (duration_type, duration_value) VALUES ('monthly', 1)`
            );
            console.log('✓ Default profit settings created');
        }

        console.log('✅ Auto migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Auto migration failed:', error.message);
        // Jangan exit, biarkan server tetap jalan dengan koneksi database
    } finally {
        if (connection) await connection.end();
    }
}

// === ROUTES ===
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/keuangan', keuanganRoutes);
app.use('/api/karyawan', karyawanRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// === START SERVER DENGAN AUTO MIGRATION ===
autoMigrate().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Health check: http://localhost:${PORT}/health`);
    });
});