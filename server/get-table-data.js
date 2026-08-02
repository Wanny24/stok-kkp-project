const mysql = require('mysql2/promise');
require('dotenv').config();

async function syncBiaya() {
    try {
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stok_kkp_db',
            port: parseInt(process.env.DB_PORT) || 3306,
            connectTimeout: 10000
        };

        const connection = await mysql.createConnection(dbConfig);
        console.log('Syncing biaya table from latest biaya_history entries...');

        // Get latest konsumsi from history
        const [konsumsiRows] = await connection.execute(
            "SELECT jumlah FROM biaya_history WHERE jenis = 'konsumsi' ORDER BY id DESC LIMIT 1"
        );
        const konsumsiJumlah = konsumsiRows[0]?.jumlah || 0.00;

        // Get latest operasional from history
        const [operasionalRows] = await connection.execute(
            "SELECT jumlah FROM biaya_history WHERE jenis = 'operasional' ORDER BY id DESC LIMIT 1"
        );
        const operasionalJumlah = operasionalRows[0]?.jumlah || 0.00;

        console.log(`Latest from history - Konsumsi: ${konsumsiJumlah}, Operasional: ${operasionalJumlah}`);

        // Update biaya table
        await connection.execute(
            "UPDATE biaya SET jumlah = ? WHERE jenis = 'konsumsi'",
            [konsumsiJumlah]
        );
        await connection.execute(
            "UPDATE biaya SET jumlah = ? WHERE jenis = 'operasional'",
            [operasionalJumlah]
        );

        const [finalRows] = await connection.execute('SELECT * FROM biaya');
        console.log('Sync complete. Current status of biaya table:', finalRows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

syncBiaya();
