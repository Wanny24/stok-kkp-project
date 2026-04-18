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
                    n.title === 'Stok Menipis' || n.title === 'Stok Habis'
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
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-105"
            >
                <i className="fas fa-bell text-xl"></i>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-800 text-sm flex justify-between items-center">
                        <span>Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                <i className="fas fa-bell-slash text-3xl mb-2 block"></i>
                                Tidak ada notifikasi
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        {notif.type === 'warning' && <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>}
                                        {notif.type === 'danger' && <i className="fas fa-times-circle text-red-500 text-xs"></i>}
                                        {notif.type === 'success' && <i className="fas fa-check-circle text-green-500 text-xs"></i>}
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