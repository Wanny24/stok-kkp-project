// Kita tinggalkan nodemailer karena diblokir oleh provider
// Kita menggunakan REST API bawaan dari Node (fetch) untuk Brevo HTTPS Port 443 yang DIJAMIN lolos dari pemblokiran

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = 'wannsart@gmail.com';

/**
 * Mengirim email OTP melalui Brevo REST API HTTPS
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
            <p>Kode OTP Anda adalah: <strong style="font-size:24px; color:#2563EB;">${otp}</strong></p>
            <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        `;
    } else if (type === 'reset') {
        subject = 'Reset Password Stok Decha Jaya';
        text = `Kode OTP untuk reset password Anda adalah: ${otp}. Kode ini kadaluarsa dalam 10 menit.`;
        html = `
            <h2>Reset Password</h2>
            <p>Kami menerima permintaan reset password untuk akun Anda.</p>
            <p>Kode OTP Anda adalah: <strong style="font-size:24px; color:#2563EB;">${otp}</strong></p>
            <p>Kode ini akan kadaluarsa dalam 10 menit.</p>
        `;
    }

    const payload = {
        sender: { 
            name: 'Stok Decha Jaya', 
            email: SENDER_EMAIL 
        },
        to: [
            { email: to }
        ],
        subject: subject,
        htmlContent: html,
        textContent: text
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Kalau ada messageId, berarti 100% SUKSES dikirim Brevo
        if (data.messageId) {
            console.log('Email sukses dikirim! MessageId:', data.messageId);
            return { success: true };
        } else {
            console.error('Brevo API menolak:', data);
            return { success: false, error: data.message || 'Error API Brevo' };
        }
    } catch (error) {
        console.error('Fetch HTTP Error mengirim email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTPEmail
};
