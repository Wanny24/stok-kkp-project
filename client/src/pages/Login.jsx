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
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ink)' }}>
            <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                        <i className="fas fa-boxes text-white relative z-10"></i>
                        <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight">Stok<span className="text-blue-600">DechaJaya</span></span>
                </div>
                <h1 className="text-3xl font-bold mt-6">Selamat Datang</h1>
                <p className="text-gray-500 mb-8">Login untuk mengelola stok & keuangan toko</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="Masukkan username"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <div className="flex justify-between flex-wrap gap-2 mb-1">
                            <label className="block text-xs font-semibold text-gray-600 uppercase">Password</label>
                            <Link to="/reset-password" className="text-xs text-blue-600 hover:underline">Lupa Password?</Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Memproses...' : 'Masuk'}
                        {!loading && <i className="fas fa-arrow-right"></i>}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <Link to="/register" className="text-blue-600 hover:underline">Daftar sebagai karyawan →</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;