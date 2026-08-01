import React from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

function Navbar({ role }) {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const isOwner = role === 'owner';

    const handleLogout = async () => {
        try {
            await API.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-[#070913]/70 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Brand Logo */}
                <div 
                    className="flex items-center gap-3 cursor-pointer group" 
                    onClick={() => navigate(isOwner ? '/owner' : '/karyawan')}
                >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:shadow-cyan-500/30 transition-all duration-300">
                        <i className="fas fa-boxes text-white relative z-10 text-sm"></i>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-400 rounded-full opacity-60"></div>
                    </div>
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                        Stok<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">DechaJaya</span>
                    </span>
                </div>
                
                {/* Actions & User Badge */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Username */}
                    <span className="hidden md:inline text-xs font-medium text-slate-400 bg-white/5 border border-white/5 rounded-full px-3 py-1">
                         Hi, {username || 'User'}
                    </span>

                    {/* Role Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${
                        isOwner 
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}>
                        <i className={`fas fa-${isOwner ? 'crown' : 'id-badge'} text-[10px]`}></i>
                        <span>{isOwner ? 'Owner' : 'Karyawan'}</span>
                    </div>
                    
                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 hover:-translate-y-[1px] active:translate-y-0 transition-all text-xs sm:text-sm font-medium"
                    >
                        <i className="fas fa-sign-out-alt text-xs"></i>
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;