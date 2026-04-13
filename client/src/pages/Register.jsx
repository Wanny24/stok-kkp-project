import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Password tidak cocok');
            return;
        }
        
        try {
            await API.post('/auth/register', { username, password });
            setMessage('Pendaftaran berhasil! Menunggu persetujuan owner.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Pendaftaran gagal');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--ink)' }}>
            <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl">
                <h1 className="text-2xl font-bold mb-2">Daftar Karyawan</h1>
                <p className="text-amber-600 mb-6"><i className="fas fa-clock"></i> Menunggu persetujuan Owner</p>
                
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
                
                <form onSubmit={handleSubmit}>
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
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                            placeholder="••••••••"
                            required
                        />
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
                        className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                        Kirim Pendaftaran <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
                
                <div className="text-center mt-6">
                    <Link to="/login" className="text-blue-600 hover:underline">← Kembali Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;