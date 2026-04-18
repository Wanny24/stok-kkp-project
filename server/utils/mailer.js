const nodemailer = require('nodemailer');

// Konfigurasi transporter
// Disarankan untuk menggunakan App Password jika memakai Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525, // Port khusus yang dijamin tidak diblokir oleh Railway!
    auth: {
        user: 'a88158001@smtp-brevo.com',
        pass: '1ymIYh5ftCDXBpNx'
    },
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 5000
});

/**
 * Mengirim email OTP
 * @param {string} to - Alamat email tujuan
 * @param {string} otp - Kode OTP 6 digit
 * @param {string} type - 'register' atau 'reset'
 */
const sendOTPEmail = async (to, otp, type) => {
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
        from: `"Stok Decha Jaya" <wannsart@gmail.com>`,
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error mengirim email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTPEmail
};
