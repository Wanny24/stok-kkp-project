import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Login attempt:', username);
            const response = await API.post('/auth/login', {
                username,
                password
            });

            console.log('Response:', response.data);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userRole', response.data.user.role);
                localStorage.setItem('username', response.data.user.username);

                if (response.data.user.role === 'owner') {
                    navigate('/owner');
                } else {
                    navigate('/karyawan');
                }
            } else {
                setError('Response tidak valid dari server');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.response) {
                setError(err.response.data?.message || 'Login gagal');
            } else if (err.request) {
                setError('Server tidak merespon. Pastikan backend berjalan di port 5000');
            } else {
                setError('Terjadi kesalahan: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#070913]">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl shadow-black/80 relative z-10 animate-fade-in">
                
                {/* Brand */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-indigo-500/25">
                        <i className="fas fa-boxes text-white relative z-10 text-sm"></i>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-400 rounded-full opacity-60"></div>
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-white">
                        Stok<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">DechaJaya</span>
                    </span>
                </div>
                
                <h1 className="text-3xl font-extrabold mt-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Selamat Datang</h1>
                <p className="text-slate-400 mb-8 text-sm font-medium">Login untuk mengelola stok & keuangan toko</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl mb-6 text-sm flex items-center gap-2">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                            placeholder="Masukkan username"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex justify-between flex-wrap gap-2 mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                            <Link to="/reset-password text-xs" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors font-medium">Lupa Password?</Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Memproses...' : 'Masuk'}
                        {!loading && <i className="fas fa-arrow-right text-xs"></i>}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link to="/register" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors font-semibold">
                        Daftar sebagai karyawan →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;