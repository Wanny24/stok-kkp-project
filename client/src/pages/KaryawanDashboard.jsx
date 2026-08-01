import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function KaryawanDashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hours = new Date().getHours();
        if (hours < 12) setGreeting('Selamat Pagi');
        else if (hours < 15) setGreeting('Selamat Siang');
        else if (hours < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');
    }, []);

    const menus = [
        { icon: 'fas fa-cubes', label: 'Stok Barang', path: '/karyawan/stok', desc: 'Lihat dan update stok' },
    ];

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role="karyawan" activeMenu="dashboard" />
            
            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 animate-fade-in">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            {greeting}, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{username}</span> 👋
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Akses menu yang tersedia untuk Anda.</p>
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {menus.map((menu, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(menu.path)}
                                className="group bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 border border-white/5 hover:shadow-xl hover:shadow-emerald-500/5 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300 flex-shrink-0">
                                    <i className={`${menu.icon} text-slate-400 text-lg group-hover:text-emerald-400 transition-colors`}></i>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-200 text-sm sm:text-base group-hover:text-emerald-300 transition-colors">{menu.label}</p>
                                    <p className="text-slate-400 text-xs mt-0.5 truncate">{menu.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info Card */}
                    <div className="bg-amber-500/5 rounded-2xl p-4 sm:p-5 border border-amber-500/20 backdrop-blur-md shadow-lg shadow-black/20 flex gap-3.5">
                        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                            <i className="fas fa-lock text-sm"></i>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-200">Akses Terbatas</p>
                            <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                                Beberapa menu seperti Laporan Keuangan, Manajemen Karyawan, Modal, dan Pengaturan Sistem lainnya hanya dapat diakses oleh Owner akun.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KaryawanDashboard;