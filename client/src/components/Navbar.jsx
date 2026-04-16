import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';

function Navbar({ role }) {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const isOwner = role === 'owner';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.clear();
        navigate('/login');
    };

    // Menu items berdasarkan role
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
        <nav className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(isOwner ? '/owner/dashboard' : '/karyawan/dashboard')}>
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                        <i className="fas fa-boxes text-white relative z-10 text-sm"></i>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight">Stok<span className="text-blue-600">KKP</span></span>
                </div>
                
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-1">
                    {menus.map((menu) => (
                        <Link
                            key={menu.path}
                            to={menu.path}
                            className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all text-sm font-medium flex items-center gap-2"
                        >
                            <i className={menu.icon}></i>
                            {menu.label}
                        </Link>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Role Badge */}
                    <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isOwner ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        <i className={`fas fa-${isOwner ? 'crown' : 'id-badge'} text-xs`}></i>
                        <span>{isOwner ? 'Owner' : 'Karyawan'}</span>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                    >
                        <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                    </button>
                    
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all text-xs sm:text-sm"
                    >
                        <i className="fas fa-sign-out-alt"></i>
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden py-3 border-t border-gray-100 bg-white">
                    {menus.map((menu) => (
                        <Link
                            key={menu.path}
                            to={menu.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100 transition-all text-sm"
                        >
                            <i className={`${menu.icon} w-5 mr-2`}></i>
                            {menu.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
