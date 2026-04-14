import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';

function Navbar({ role }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const isOwner = role === 'owner';

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername || 'User');
    }, [role]);

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
            localStorage.clear();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            navigate('/login');
        }
    };

    const ownerMenus = [
        { path: '/owner/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { path: '/owner/stok', icon: 'fas fa-warehouse', label: 'Stok Barang' },
        { path: '/owner/uang-masuk', icon: 'fas fa-money-bill-wave', label: 'Uang Masuk' },
        { path: '/owner/profit', icon: 'fas fa-chart-line', label: 'Profit' },
        { path: '/owner/modal', icon: 'fas fa-coins', label: 'Total Modal' },
        { path: '/owner/karyawan', icon: 'fas fa-users', label: 'Karyawan' },
        { path: '/owner/activity-log', icon: 'fas fa-history', label: 'Log Aktivitas' },
    ];

    const karyawanMenus = [
        { path: '/karyawan/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { path: '/karyawan/stok', icon: 'fas fa-warehouse', label: 'Stok Barang' },
    ];

    const menus = isOwner ? ownerMenus : karyawanMenus;

    return (
        <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to={isOwner ? '/owner/dashboard' : '/karyawan/dashboard'} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <i className="fas fa-boxes text-white text-sm"></i>
                        </div>
                        <span className="font-bold text-gray-800 hidden sm:inline">StokKKP</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-1">
                        {menus.map((menu) => (
                            <Link key={menu.path} to={menu.path} className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all text-sm font-medium flex items-center gap-2">
                                <i className={menu.icon}></i>
                                {menu.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Info - TAMPIL DI SEMUA DEVICE */}
                    <div className="flex items-center gap-3">
                        {/* Avatar dengan nama user - DESKTOP & MOBILE */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-white text-xs"></i>
                            </div>
                            {/* Desktop: tampilkan nama lengkap + role */}
                            <div className="hidden sm:block">
                                <p className="text-xs font-medium text-gray-800">{username}</p>
                                <p className="text-xs text-gray-500">{isOwner ? '👑 Owner' : '👤 Karyawan'}</p>
                            </div>
                            {/* Mobile: tampilkan icon role saja */}
                            <div className="sm:hidden">
                                <p className="text-xs font-medium text-gray-800">
                                    {isOwner ? '👑' : '👤'}
                                </p>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                        </button>

                        {/* Logout button */}
                        <button onClick={handleLogout} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Logout">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-3 border-t border-gray-100">
                        {/* Nama User di Mobile Menu */}
                        <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-800">{username}</p>
                            <p className="text-xs text-gray-500">{isOwner ? '👑 Owner' : '👤 Karyawan'}</p>
                        </div>
                        {menus.map((menu) => (
                            <Link key={menu.path} to={menu.path} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-sm">
                                <i className={`${menu.icon} w-5 mr-2`}></i>
                                {menu.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;