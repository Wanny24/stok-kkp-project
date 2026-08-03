import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';

function Sidebar({ role, activeMenu }) {
    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username');
    const isOwner = role === 'owner';
    
    // Read collapsed state from localStorage
    const [isCollapsed, setIsCollapsed] = useState(
        localStorage.getItem('sidebar-collapsed') === 'true'
    );
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.clear();
        navigate('/login');
    };

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebar-collapsed', nextState.toString());
        // Dispatch custom event to notify listeners
        window.dispatchEvent(new Event('sidebar-toggle'));
    };

    const ownerMenus = [
        { id: 'dashboard', label: 'Dashboard', path: '/owner', icon: 'fas fa-th-large' },
        { id: 'stok', label: 'Stok Barang', path: '/owner/stok', icon: 'fas fa-cubes' },
        { id: 'profit', label: 'Profit & Keuangan', path: '/owner/profit', icon: 'fas fa-wallet' },
        { id: 'modal', label: 'Modal Investasi', path: '/owner/modal', icon: 'fas fa-hand-holding-usd' },
        { id: 'logs', label: 'Log Aktivitas', path: '/owner/logs', icon: 'fas fa-history' },
        { id: 'karyawan', label: 'Tim Karyawan', path: '/owner/karyawan', icon: 'fas fa-users' },
    ];

    const karyawanMenus = [
        { id: 'dashboard', label: 'Dashboard', path: '/karyawan', icon: 'fas fa-th-large' },
        { id: 'stok', label: 'Stok Barang', path: '/karyawan/stok', icon: 'fas fa-cubes' },
    ];

    const activeMenus = isOwner ? ownerMenus : karyawanMenus;

    const renderMenuLinks = () => (
        <ul className="space-y-1.5 px-3.5 flex-1 py-4">
            {activeMenus.map((menu) => {
                const isActive = activeMenu === menu.id || location.pathname === menu.path;
                return (
                    <li key={menu.id}>
                        <button
                            onClick={() => {
                                navigate(menu.path);
                                setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all group border border-transparent ${
                                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'
                            } ${
                                isActive 
                                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={isCollapsed ? menu.label : ''}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                isActive 
                                    ? 'bg-indigo-500 text-white' 
                                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-indigo-400'
                            }`}>
                                <i className={menu.icon}></i>
                            </div>
                            {!isCollapsed && <span className="flex-1 text-left truncate">{menu.label}</span>}
                            {!isCollapsed && isActive && (
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-md shadow-cyan-400/50"></div>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );

    const renderSidebarContent = (isMobileView = false) => {
        const collapsedState = isMobileView ? false : isCollapsed;
        
        return (
            <div className="flex flex-col h-full bg-[#0c1022]/95 backdrop-blur-2xl border-r border-white/10 text-white">
                {/* Sidebar Logo */}
                <div className={`h-16 flex items-center border-b border-white/10 ${
                    collapsedState ? 'justify-center px-2' : 'gap-3 px-5'
                }`}>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                        <i className="fas fa-boxes text-white text-xs"></i>
                    </div>
                    {!collapsedState && (
                        <span className="font-extrabold text-base tracking-tight truncate">
                            Stok<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">DechaJaya</span>
                        </span>
                    )}
                </div>

                {/* Profile Section */}
                <div className={`p-4 border-b border-white/5 flex items-center bg-white/2 ${
                    collapsedState ? 'justify-center' : 'gap-3'
                }`}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center font-extrabold text-white shadow-md border border-white/10 flex-shrink-0">
                        {username ? username[0].toUpperCase() : 'U'}
                    </div>
                    {!collapsedState && (
                        <div className="min-w-0">
                            <p className="font-bold text-slate-200 text-sm truncate">Hi, {username || 'User'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    isOwner ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                    {isOwner ? 'Owner' : 'Karyawan'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Menus */}
                {renderMenuLinks()}

                {/* Footer buttons */}
                <div className="p-3.5 border-t border-white/10 space-y-1.5">
                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all ${
                            collapsedState ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'
                        }`}
                        title={collapsedState ? 'Keluar' : ''}
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-all flex-shrink-0">
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                        {!collapsedState && <span>Keluar</span>}
                    </button>

                    {/* Desktop Collapse Toggle */}
                    {!isMobileView && (
                        <button
                            onClick={toggleCollapse}
                            className={`w-full flex items-center rounded-xl text-xs font-bold text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent transition-all ${
                                collapsedState ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/2 text-slate-500 flex items-center justify-center hover:text-white transition-all flex-shrink-0">
                                <i className={`fas fa-chevron-${collapsedState ? 'right' : 'left'}`}></i>
                            </div>
                            {!collapsedState && <span>Sembunyikan Sidebar</span>}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Sidebar - Sticky layouts */}
            <aside className={`hidden lg:flex flex-col sticky top-0 h-screen z-40 transition-all duration-300 flex-shrink-0 ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}>
                {renderSidebarContent(false)}
            </aside>

            {/* Mobile Top Navbar */}
            <div className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-[#070913]/80 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between z-40">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                >
                    <i className="fas fa-bars"></i>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-boxes text-white text-xs"></i>
                    </div>
                    <span className="font-extrabold text-sm text-white">Stok<span className="text-indigo-400">DechaJaya</span></span>
                </div>
                <div className={`px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                    isOwner ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                    {isOwner ? 'Owner' : 'Karyawan'}
                </div>
            </div>

            {/* Mobile Sidebar Overlay Drawer */}
            {isMobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    ></div>
                    {/* Drawer panel */}
                    <div className="relative w-64 max-w-xs h-full z-10 animate-fade-in">
                        {renderSidebarContent(true)}
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="absolute top-3.5 right-[-48px] w-9 h-9 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-white shadow-xl"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
