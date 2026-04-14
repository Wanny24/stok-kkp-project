import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';

function KaryawanManagement() {
    const [pendingList, setPendingList] = useState([]);
    const [karyawanList, setKaryawanList] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showTooltip, setShowTooltip] = useState(null);
    const [loginHistory, setLoginHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        fetchOnlineUsers();
        const interval = setInterval(fetchOnlineUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [pendingRes, karyawanRes] = await Promise.all([
                API.get('/karyawan/pending'),
                API.get('/karyawan/list')
            ]);
            setPendingList(pendingRes.data);
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

    const handleApprove = async (id, username) => {
        if (confirm(`Setujui pendaftaran ${username}?`)) {
            try {
                await API.post(`/karyawan/approve/${id}`);
                fetchData();
                alert(`Akun ${username} berhasil disetujui`);
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menyetujui');
            }
        }
    };

    const handleReject = async (id, username) => {
        if (confirm(`Tolak pendaftaran ${username}?`)) {
            try {
                await API.delete(`/karyawan/reject/${id}`);
                fetchData();
                alert(`Pendaftaran ${username} ditolak`);
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menolak');
            }
        }
    };

    const handleResign = async (id, username) => {
        if (confirm(`Resign karyawan ${username}?`)) {
            try {
                await API.delete(`/karyawan/resign/${id}`);
                fetchData();
                fetchOnlineUsers();
                alert(`Karyawan ${username} telah di-resign`);
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal resign karyawan');
            }
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
        <div className="min-h-screen bg-gray-50">
            <Navbar role="owner" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 text-sm"
                >
                    <i className="fas fa-arrow-left"></i> Kembali
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-users text-blue-600 text-sm"></i>
                            </div>
                            Manajemen Karyawan
                        </h3>
                        {pendingList.length > 0 && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-user-check"></i>
                                Persetujuan ({pendingList.length})
                            </button>
                        )}
                    </div>

                    <div className="p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i className="fas fa-circle text-green-500 text-xs"></i>
                            Daftar Karyawan
                        </h4>
                        
                        <div className="space-y-3">
                            {karyawanList.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-users text-3xl mb-2 block"></i>
                                    <p className="text-sm">Belum ada karyawan</p>
                                </div>
                            ) : (
                                karyawanList.map((k) => {
                                    const isOnline = getOnlineStatus(k.id);
                                    return (
                                        <div
                                            key={k.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                            onMouseEnter={() => setShowTooltip(k.id)}
                                            onMouseLeave={() => setShowTooltip(null)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                        {k.username[0].toUpperCase()}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{k.username}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {isOnline ? 'Online' : 'Offline'}
                                                        {!isOnline && getUserLastActivity(k.id) && (
                                                            <span className="ml-1">
                                                                - Terakhir {new Date(getUserLastActivity(k.id)).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleResign(k.id, k.username)}
                                                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                            >
                                                <i className="fas fa-user-minus"></i>
                                                <span className="hidden sm:inline">Resign</span>
                                            </button>
                                            
                                            {/* Tooltip History */}
                                            {showTooltip === k.id && (
                                                <div className="absolute left-0 mt-12 ml-12 w-64 bg-gray-900 text-white rounded-lg shadow-xl z-50">
                                                    <div className="px-3 py-2 border-b border-gray-700 text-xs font-semibold">
                                                        Riwayat Login {k.username}
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto p-2">
                                                        {loginHistory.filter(h => h.username === k.username).length === 0 ? (
                                                            <p className="text-gray-400 text-xs p-2">Belum ada riwayat login</p>
                                                        ) : (
                                                            loginHistory.filter(h => h.username === k.username).map((h, idx) => (
                                                                <div key={idx} className="text-xs py-1 border-b border-gray-700 last:border-0">
                                                                    <div className="text-gray-300">{h.action}</div>
                                                                    <div className="text-gray-500 text-xs mt-0.5">{new Date(h.timestamp).toLocaleString('id-ID')}</div>
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

            {/* Modal Persetujuan */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Persetujuan Karyawan Baru</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {pendingList.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">Tidak ada pendaftaran baru</p>
                            ) : (
                                pendingList.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                                                {p.username[0].toUpperCase()}
                                            </div>
                                            <span className="font-medium">{p.username}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(p.id, p.username)}
                                                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-all"
                                            >
                                                <i className="fas fa-check mr-1"></i> Setujui
                                            </button>
                                            <button
                                                onClick={() => handleReject(p.id, p.username)}
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition-all"
                                            >
                                                <i className="fas fa-times mr-1"></i> Tolak
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// Tambahkan useEffect untuk polling online status
useEffect(() => {
    fetchKaryawan();
    const interval = setInterval(fetchKaryawan, 10000); // setiap 10 detik
    return () => clearInterval(interval);
}, []);

// Status badge dengan icon
<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
    karyawan.is_online 
        ? 'bg-green-100 text-green-700' 
        : 'bg-gray-100 text-gray-500'
}`}>
    <span className={`w-2 h-2 rounded-full ${karyawan.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
    {karyawan.is_online ? 'Online' : 'Offline'}
</span>

export default KaryawanManagement;