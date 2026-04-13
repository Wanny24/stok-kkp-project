import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';

function OwnerDashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0 });

    useEffect(() => {
        fetchStats();
        
        const hours = new Date().getHours();
        if (hours < 12) setGreeting('Selamat Pagi');
        else if (hours < 15) setGreeting('Selamat Siang');
        else if (hours < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await API.get('/inventory');
            const inventory = response.data;
            setStats({
                totalProducts: inventory.length,
                lowStock: inventory.filter(i => i.stock <= (i.min_stock || 5)).length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const menus = [
        { icon: 'fas fa-cubes', label: 'Stok Barang', path: '/owner/stok', desc: 'Kelola inventaris produk' },
        { icon: 'fas fa-coins', label: 'Uang Masuk', path: '/owner/uang-masuk', desc: 'Catat pemasukan harian' },
        { icon: 'fas fa-chart-line', label: 'Profit', path: '/owner/profit', desc: 'Lihat laporan keuntungan' },
        { icon: 'fas fa-hand-holding-usd', label: 'Modal', path: '/owner/modal', desc: 'Total modal investasi' },
        { icon: 'fas fa-history', label: 'Log Aktivitas', path: '/owner/logs', desc: 'Riwayat aktivitas sistem' },
        { icon: 'fas fa-users', label: 'Karyawan', path: '/owner/karyawan', desc: 'Kelola tim karyawan' },
    ];

    const handleAddProduct = () => {
        navigate('/owner/stok');
        setTimeout(() => {
            const addBtn = document.querySelector('#addBarangBtn');
            if (addBtn) addBtn.click();
        }, 300);
    };

    const handleAddIncome = () => {
        navigate('/owner/uang-masuk');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar role="owner" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                {greeting}, {username} 👋
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Kelola stok dan keuangan toko</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm text-xs sm:text-sm">
                                <i className="far fa-clock text-gray-400 mr-1 sm:mr-2"></i>
                                <span className="text-gray-700">{currentTime}</span>
                            </div>
                            <div className="bg-white rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm text-xs sm:text-sm">
                                <i className="fas fa-calendar-alt text-gray-400 mr-1 sm:mr-2"></i>
                                <span className="text-gray-700">
                                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm">Total Produk</p>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-cube text-blue-600 text-sm sm:text-base"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs sm:text-sm">Stok Menipis</p>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{stats.lowStock}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-exclamation-triangle text-amber-600 text-sm sm:text-base"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Aksi Cepat</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleAddProduct}
                            className="bg-blue-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm sm:text-base"
                        >
                            <i className="fas fa-plus-circle"></i>
                            <span className="font-medium">Tambah Produk</span>
                        </button>
                        <button
                            onClick={handleAddIncome}
                            className="bg-green-600 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 flex items-center justify-center gap-2 hover:bg-green-700 transition-all text-sm sm:text-base"
                        >
                            <i className="fas fa-money-bill-wave"></i>
                            <span className="font-medium">Input Pemasukan</span>
                        </button>
                    </div>
                </div>

                {/* Menu Grid */}
                <div>
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Menu Utama</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {menus.map((menu, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(menu.path)}
                                className="group bg-white rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-100 hover:border-blue-200"
                            >
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        <i className={`${menu.icon} text-gray-500 text-sm sm:text-base group-hover:text-blue-600 transition-colors`}></i>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">{menu.label}</p>
                                        <p className="text-gray-400 text-xs hidden sm:block">{menu.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OwnerDashboard;