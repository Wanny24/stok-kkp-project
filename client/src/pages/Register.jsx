import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

function Register() {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        
        if (password !== confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!re.test(password)) {
            setError('Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial');
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/request-otp', { email, type: 'register' });
            setMessage(response.data.message || 'Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await API.post('/auth/register', { 
                username, 
                email, 
                password, 
                otp 
            });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('username', response.data.user.username);
                
                setMessage('Pendaftaran berhasil! Mengalihkan ke dashboard...');
                setTimeout(() => navigate('/karyawan'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Pendaftaran gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ink)' }}>
            <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl">
                <h1 className="text-2xl font-bold mb-2">Daftar Karyawan</h1>
                <p className="text-gray-500 mb-6">Buat akun untuk masuk ke sistem</p>
                
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
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                placeholder="Pilih username"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                                placeholder="Alamat email aktif"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password</label>
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
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Konfirmasi Password</label>
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
                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Memproses...' : 'Kirim OTP Verification'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kode OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-center text-xl tracking-widest font-bold"
                                placeholder="------"
                                maxLength="6"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Masukkan 6 digit kode yang dikirim ke <strong>{email}</strong>
                            </p>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            {loading ? 'Memverifikasi...' : 'Selesaikan Pendaftaran'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Kembali Edit Data
                        </button>
                    </form>
                )}
                
                <div className="text-center mt-6">
                    <Link to="/login" className="text-blue-600 hover:underline">← Kembali Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;