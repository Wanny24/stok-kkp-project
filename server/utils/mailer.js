const nodemailer = require('nodemailer');

// Konfigurasi transporter
// Disarankan untuk menggunakan App Password jika memakai Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail', // Anda bisa mengubahnya ke layanan lain seperti hostinger, dsb
    auth: {
        user: process.env.EMAIL_USER || '', // Masukkan di file .env
        pass: process.env.EMAIL_PASS || ''  // Masukkan di file .env
    }
});

/**
 * Mengirim email OTP
 * @param {string} to - Alamat email tujuan
 * @param {string} otp - Kode OTP 6 digit
 * @param {string} type - 'register' atau 'reset'
 */
const sendOTPEmail = async (to, otp, type) => {
    // Abaikan jika env email belum disetel (untuk testing tanpa error crash)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('EMAIL_USER atau EMAIL_PASS belum diatur di .env. Email OTP tidak benar-benar terkirim. OTP:', otp);
        return true; 
    }

    let subject = '';
    let text = '';
    let html = '';

    if (type === 'register') {
        subject = 'Verifikasi Pendaftaran Stok Decha Jaya';
        text = `Kode OTP pendaftaran Anda adalah: ${otp}. Kode ini kadaluarsa dalam 10 menit.`;
        html = `
            <h2>Verifikasi Pendaftaran</h2>
            <p>Terima kasih telah mendaftar di sistem Manajemen Stok Decha Jaya.</p>
            <p>Kode OTP Anda adalah: <strong style="font-size:24px;">${otp}</strong></p>
            <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        `;
    } else if (type === 'reset') {
        subject = 'Reset Password Stok Decha Jaya';
        text = `Kode OTP untuk reset password Anda adalah: ${otp}. Kode ini kadaluarsa dalam 10 menit.`;
        html = `
            <h2>Reset Password</h2>
            <p>Kami menerima permintaan reset password untuk akun Anda.</p>
            <p>Kode OTP Anda adalah: <strong style="font-size:24px;">${otp}</strong></p>
            <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        `;
    }

    const mailOptions = {
        from: `"Stok Decha Jaya" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error mengirim email:', error);
        throw new Error('Gagal mengirim email verifikasi');
    }
};

module.exports = {
    sendOTPEmail
};
