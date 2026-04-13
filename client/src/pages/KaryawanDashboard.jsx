import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

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
        <div className="min-h-screen bg-gray-50">
            <Navbar role="karyawan" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {greeting}, {username} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Akses menu yang tersedia untuk Anda</p>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {menus.map((menu, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(menu.path)}
                            className="group bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-blue-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                    <i className={`${menu.icon} text-gray-500 text-lg group-hover:text-blue-600 transition-colors`}></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{menu.label}</p>
                                    <p className="text-gray-400 text-xs mt-0.5">{menu.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex gap-3">
                        <i className="fas fa-lock text-amber-600 mt-0.5"></i>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Akses Terbatas</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Menu keuangan, manajemen karyawan, dan pengaturan hanya untuk Owner.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KaryawanDashboard;