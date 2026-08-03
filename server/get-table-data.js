const db = require('./config/db');
const ChaCha20Crypto = require('./crypto/chacha20');
const chacha20 = new ChaCha20Crypto(process.env.CHACHA20_KEY || 'default-chacha20-key-for-testing-32byte!');

const konsumsiDesc = [
    'Konsumsi harian',
    'Konsumsi karyawan',
    'Beli kopi dan teh',
    'Makan siang karyawan',
    'Konsumsi rapat kecil'
];

const operasionalDesc = [
    'Biaya listrik',
    'Pembelian gas LPG',
    'Biaya air bersih',
    'Beli kantong plastik',
    'Beli ATK toko',
    'Biaya kebersihan dan keamanan'
];

async function seedDummyData() {
    try {
        console.log('Clearing existing pemasukan and biaya_history to start fresh...');
        await db.query('DELETE FROM pemasukan');
        await db.query('DELETE FROM biaya_history');

        const now = new Date();
        let totalKonsumsi = 0;
        let totalOperasional = 0;

        console.log('Inserting realistic dummy data with updated range 500k-1.5M...');

        for (let i = 14; i >= 0; i--) {
            // Calculate date for i days ago
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateString = date.toISOString().split('T')[0];

            // 1. Generate Pemasukan (random between 500k and 1.5M, rounded to nearest 1,000)
            const incomeJumlahRaw = Math.floor(Math.random() * (1500000 - 500000 + 1)) + 500000;
            const incomeJumlah = Math.round(incomeJumlahRaw / 1000) * 1000;
            
            const incomeKeterangan = 'Pemasukan tunai';
            const sensitiveIncome = JSON.stringify({
                jumlah: incomeJumlah,
                tanggal: dateString,
                keterangan: incomeKeterangan,
                user: 'DechaJaya',
                created_at: date.toISOString()
            });
            const encryptedIncome = chacha20.encrypt(sensitiveIncome);
            await db.query(
                'INSERT INTO pemasukan (jumlah, tanggal, keterangan, encrypted_data) VALUES (?, ?, ?, ?)',
                [incomeJumlah, dateString, incomeKeterangan, encryptedIncome]
            );

            // 2. Generate Biaya Konsumsi Harian (random between 10k and 35k, rounded to nearest 1,000)
            const konsumsiJumlahRaw = Math.floor(Math.random() * (35000 - 10000 + 1)) + 10000;
            const konsumsiJumlah = Math.round(konsumsiJumlahRaw / 1000) * 1000;
            
            const konsumsiKeterangan = konsumsiDesc[Math.floor(Math.random() * konsumsiDesc.length)];
            await db.query(
                'INSERT INTO biaya_history (jenis, jumlah, changed_by, keterangan, tanggal) VALUES (?, ?, ?, ?, ?)',
                ['konsumsi', konsumsiJumlah, 'DechaJaya', konsumsiKeterangan, dateString]
            );
            totalKonsumsi += konsumsiJumlah;

            // 3. Generate Biaya Operasional (random between 20k and 75k, rounded to nearest 1,000)
            const operasionalJumlahRaw = Math.floor(Math.random() * (75000 - 20000 + 1)) + 20000;
            const operasionalJumlah = Math.round(operasionalJumlahRaw / 1000) * 1000;
            
            const operasionalKeterangan = operasionalDesc[Math.floor(Math.random() * operasionalDesc.length)];
            await db.query(
                'INSERT INTO biaya_history (jenis, jumlah, changed_by, keterangan, tanggal) VALUES (?, ?, ?, ?, ?)',
                ['operasional', operasionalJumlah, 'DechaJaya', operasionalKeterangan, dateString]
            );
            totalOperasional += operasionalJumlah;
        }

        console.log(`Summary - Total Konsumsi: ${totalKonsumsi}, Total Operasional: ${totalOperasional}`);

        // Update biaya table with totals
        await db.query("UPDATE biaya SET jumlah = ? WHERE jenis = 'konsumsi'", [totalKonsumsi]);
        await db.query("UPDATE biaya SET jumlah = ? WHERE jenis = 'operasional'", [totalOperasional]);

        console.log('✅ Dummy data successfully seeded with new range 500k-1.5M!');
    } catch (error) {
        console.error('Error seeding dummy data:', error);
    }
}

seedDummyData();
