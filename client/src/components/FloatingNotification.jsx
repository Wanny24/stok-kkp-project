import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

function FloatingNotification() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // setiap 10 detik
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await API.get('/keuangan/notifications');
            const data = Array.isArray(response.data) ? response.data : [];
            
            // Filter notifikasi: karyawan hanya lihat notif stok
            let filteredNotif = data;
            if (!isOwner) {
                filteredNotif = data.filter(n => 
                    n.title === 'Stok Menipis' || n.title === 'Stok Habis' || n.title === 'Selamat Datang'
                );
            }
            setNotifications(filteredNotif);
            setUnreadCount(filteredNotif.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await API.put(`/keuangan/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        await markAsRead(notif.id);
        if (notif.title === 'Karyawan Baru mendaftar') {
            navigate('/owner/karyawan');
        } else if (notif.barang_id) {
            navigate(isOwner ? '/owner/stok' : '/karyawan/stok');
        }
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-cyan-500/30 flex items-center justify-center hover:scale-105 active:scale-95 border border-white/10 transition-all duration-300"
            >
                <i className="fas fa-bell text-xl"></i>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-[#0c1022]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform origin-bottom-right transition-all duration-300">
                    <div className="px-4 py-3.5 bg-white/5 border-b border-white/10 font-semibold text-white text-sm flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <i className="fas fa-bell text-xs text-indigo-400"></i>
                            Notifikasi
                        </span>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i className="fas fa-bell-slash text-slate-500"></i>
                                </div>
                                Tidak ada notifikasi
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`px-4 py-3.5 border-b border-white/5 cursor-pointer transition-colors ${
                                        !notif.is_read 
                                            ? 'bg-indigo-500/5 hover:bg-indigo-500/10' 
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Status Dot */}
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                            !notif.is_read 
                                                ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50' 
                                                : 'bg-slate-700'
                                        }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 truncate">{notif.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 break-words line-clamp-2 leading-relaxed">{notif.message}</p>
                                            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                                <i className="far fa-clock"></i>
                                                {new Date(notif.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        {/* Status Icon */}
                                        {notif.type === 'warning' && <i className="fas fa-exclamation-triangle text-amber-400 text-xs mt-1"></i>}
                                        {notif.type === 'danger' && <i className="fas fa-times-circle text-red-400 text-xs mt-1"></i>}
                                        {notif.type === 'success' && <i className="fas fa-check-circle text-emerald-400 text-xs mt-1"></i>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FloatingNotification;