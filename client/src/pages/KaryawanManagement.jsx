import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';

function KaryawanManagement() {
    const [karyawanList, setKaryawanList] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showTooltip, setShowTooltip] = useState(null);
    const [loginHistory, setLoginHistory] = useState([]);
    const navigate = useNavigate();

    // Toast & Confirm states
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchData();
        fetchOnlineUsers();
        const interval = setInterval(fetchOnlineUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const fetchData = async () => {
        try {
            const karyawanRes = await API.get('/karyawan/list');
            setKaryawanList(karyawanRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchOnlineUsers = async () => {
        try {
            const response = await API.get('/auth/online-users');
            setOnlineUsers(response.data.users);
            setLoginHistory(response.data.history);
        } catch (error) {
            console.error('Error fetching online users:', error);
        }
    };

    const triggerResign = (id, username) => {
        setConfirmModal({
            show: true,
            title: 'Resign Karyawan',
            message: `Apakah Anda yakin ingin me-resign karyawan "${username}"? Tindakan ini akan menonaktifkan akses akun mereka ke sistem.`,
            onConfirm: () => handleResign(id, username)
        });
    };

    const handleResign = async (id, username) => {
        try {
            await API.delete(`/karyawan/resign/${id}`);
            fetchData();
            fetchOnlineUsers();
            showToast(`Karyawan ${username} telah di-resign`, 'success');
            setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal meresign karyawan', 'error');
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    const getOnlineStatus = (userId) => {
        const user = onlineUsers.find(u => u.id === userId);
        return user ? user.is_online : false;
    };

    const getUserLastActivity = (userId) => {
        const user = onlineUsers.find(u => u.id === userId);
        return user?.last_activity;
    };

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role="owner" activeMenu="karyawan" />
            
            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 animate-fade-in">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:-translate-x-0.5 active:translate-x-0 transition-all text-slate-300 text-xs sm:text-sm font-semibold"
                    >
                        <i className="fas fa-arrow-left"></i> Kembali
                    </button>

                    {/* Card Management */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                        <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-white/2">
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <i className="fas fa-users text-sm"></i>
                                </div>
                                Manajemen Anggota Karyawan
                            </h3>
                        </div>

                        <div className="p-6">
                            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i className="fas fa-circle text-emerald-500 text-[10px] animate-pulse"></i>
                                Daftar Karyawan Terdaftar
                            </h4>
                            
                            <div className="space-y-4">
                                {karyawanList.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500">
                                        <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-users-slash text-2xl"></i>
                                        </div>
                                        <p className="text-sm font-medium">Belum ada karyawan terdaftar</p>
                                    </div>
                                ) : (
                                    karyawanList.map((k) => {
                                        const isOnline = getOnlineStatus(k.id);
                                        return (
                                            <div
                                                key={k.id}
                                                className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 transition-all duration-200 relative animate-fade-in"
                                                onMouseEnter={() => setShowTooltip(k.id)}
                                                onMouseLeave={() => setShowTooltip(null)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center font-extrabold text-white shadow-md">
                                                            {k.username[0].toUpperCase()}
                                                        </div>
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-200 text-sm sm:text-base">{k.username}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                                                                {isOnline ? 'Online' : 'Offline'}
                                                            </span>
                                                            {!isOnline && getUserLastActivity(k.id) && (
                                                                <span className="ml-1 text-slate-500">
                                                                    • Terakhir aktif: {new Date(getUserLastActivity(k.id)).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    onClick={() => triggerResign(k.id, k.username)}
                                                    className="text-red-400 hover:text-red-300 font-bold active:scale-95 transition-all text-xs border border-red-500/20 bg-red-500/10 rounded-xl px-3.5 py-2 hover:bg-red-500/20 flex items-center gap-1.5"
                                                >
                                                    <i className="fas fa-user-minus text-[10px]"></i>
                                                    <span className="hidden sm:inline">Resign</span>
                                                </button>
                                                
                                                {/* Tooltip History (Hover popup) */}
                                                {showTooltip === k.id && (
                                                    <div className="absolute left-12 top-14 w-72 bg-slate-950/95 border border-white/10 text-white rounded-2xl shadow-2xl z-50 backdrop-blur-xl animate-fade-in">
                                                        <div className="px-4 py-2.5 border-b border-white/10 text-xs font-bold text-indigo-300 bg-white/2 rounded-t-2xl flex items-center gap-1.5">
                                                            <i className="fas fa-history text-[10px]"></i>
                                                            Riwayat Aktivitas Login {k.username}
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                                                            {loginHistory.filter(h => h.username === k.username).length === 0 ? (
                                                                <p className="text-slate-500 text-xs p-2 text-center">Belum ada riwayat masuk</p>
                                                            ) : (
                                                                loginHistory.filter(h => h.username === k.username).map((h, idx) => (
                                                                    <div key={idx} className="text-xs py-1 border-b border-white/5 last:border-0 last:pb-0">
                                                                        <div className="text-slate-300 font-medium">{h.action}</div>
                                                                        <div className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">
                                                                            <i className="far fa-clock"></i>
                                                                            {new Date(h.timestamp).toLocaleString('id-ID')}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-5 py-4 border-b border-white/10 bg-red-500/5 flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-red-400"></i>
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">{confirmModal.title}</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-300 text-sm leading-relaxed">{confirmModal.message}</p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all text-xs border border-white/10"
                                >
                                    Keluarkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast Alert */}
            {toast.show && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className={`px-5 py-3 rounded-2xl border shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white ${
                        toast.type === 'success' 
                            ? 'bg-emerald-600/90 border-emerald-500/30' 
                            : 'bg-red-600/90 border-red-500/30'
                    }`}>
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KaryawanManagement;