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

        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
        if (!re.test(password)) {
            setError('Password harus 8-16 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial');
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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#070913]">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

            {/* Register Card */}
            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-black/80 relative z-10 animate-fade-in">
                <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Daftar Karyawan</h1>
                <p className="text-slate-400 mb-6 text-sm font-medium">Buat akun karyawan untuk masuk ke sistem</p>
                
                {message && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl mb-4 text-xs flex items-center gap-2">
                        <i className="fas fa-check-circle text-xs"></i>
                        <span>{message}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2">
                        <i className="fas fa-exclamation-circle text-xs mt-0.5"></i>
                        <span>{error}</span>
                    </div>
                )}
                
                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                                placeholder="Pilih username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                                placeholder="Alamat email aktif"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                                placeholder="••••••••"
                                maxLength="16"
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">8-16 karakter (mengandung huruf besar, kecil, angka, & simbol)</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                                placeholder="••••••••"
                                maxLength="16"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? 'Memproses...' : 'Kirim OTP Verification'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kode OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-center text-2xl tracking-widest font-bold transition-all focus:ring-4 focus:ring-indigo-500/10"
                                placeholder="------"
                                maxLength="6"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-3 text-center leading-relaxed">
                                Masukkan 6 digit kode yang dikirim ke <strong className="text-slate-200">{email}</strong>
                            </p>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Memverifikasi...' : 'Selesaikan Pendaftaran'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full bg-white/5 border border-white/10 text-slate-300 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-all"
                            >
                                Kembali Edit Data
                            </button>
                        </div>
                    </form>
                )}
                
                <div className="text-center mt-6">
                    <Link to="/login" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors font-semibold">
                        ← Kembali Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;