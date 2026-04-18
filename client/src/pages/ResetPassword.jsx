import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

function ResetPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('Email harus diisi');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/request-otp', { email, type: 'reset' });
            setMessage('Kode OTP untuk reset password telah dikirim ke email Anda.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Password baru tidak cocok');
            setLoading(false);
            return;
        }

        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!re.test(password)) {
            setError('Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial');
            setLoading(false);
            return;
        }

        try {
            const response = await API.post('/auth/reset-password', { 
                email, 
                password, 
                otp 
            });
            
            setMessage(response.data.message || 'Password berhasil direset!');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mereset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ink)' }}>
            <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                        <i className="fas fa-boxes text-white relative z-10"></i>
                        <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight">Stok<span className="text-blue-600">DechaJaya</span></span>
                </div>
                <h1 className="text-3xl font-bold mt-6">Reset Password</h1>
                <p className="text-gray-500 mb-8">Pulihkan akses akun Anda</p>

                {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp}>
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email Terdaftar</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                placeholder="Masukkan email akun Anda"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Memproses...' : 'Kirim Kode OTP'}
                            {!loading && <i className="fas fa-arrow-right"></i>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kode OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 tracking-[0.5em] text-center text-xl font-bold"
                                placeholder="------"
                                maxLength="6"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2 text-center">Dikirim ke: {email}</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password Baru</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Minimal 8 karakter (huruf besar, kecil, angka, simbol)</p>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Ganti Email
                        </button>
                    </form>
                )}

                <div className="text-center mt-6">
                    <Link to="/login" className="text-blue-600 hover:underline">Kembali ke halaman Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
