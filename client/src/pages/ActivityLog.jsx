import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchLogs();
    }, []);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await API.get('/keuangan/logs');
            const data = Array.isArray(response.data) ? response.data : [];
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!startDate && !endDate) return true;
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar role={userRole} />
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar role={userRole} />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2 rounded-full hover:bg-white transition-all"
                >
                    <i className="fas fa-arrow-left"></i> Kembali
                </button>

                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <i className="fas fa-history text-blue-600"></i> Log Aktivitas
                        </h3>
                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Dari Tanggal</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            <i className="fas fa-lock mr-1"></i> Data dienkripsi dengan TwoFish
                        </p>
                    </div>

                    <div className="p-6 max-h-[600px] overflow-y-auto space-y-3">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Belum ada aktivitas
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <i className="fas fa-user-circle"></i>
                                        <strong>{log.username}</strong>
                                        <span className="text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                                        {!log.decrypted && (
                                            <span className="text-xs text-amber-500 ml-2">
                                                <i className="fas fa-lock"></i> Terenkripsi
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-800">{log.action}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityLog;