import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
            <div className="min-h-screen bg-transparent lg:flex">
                <Sidebar role={userRole} activeMenu="logs" />
                <div className="flex-1 lg:pl-64">
                    <div className="flex justify-center items-center h-screen">
                        <div className="text-indigo-400 flex flex-col items-center gap-2">
                            <i className="fas fa-circle-notch animate-spin text-3xl"></i>
                            <span className="text-sm font-medium">Loading logs...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role={userRole} activeMenu="logs" />
            
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

                    {/* Card Log */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                        <div className="p-5 sm:p-6 border-b border-white/10 bg-white/2">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                        <i className="fas fa-history text-sm"></i>
                                    </div>
                                    Log Aktivitas Sistem
                                </h3>
                                <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <i className="fas fa-lock text-[9px]"></i>
                                    Enkripsi TwoFish
                                </span>
                            </div>
                            
                            {/* Filters */}
                            <div className="mt-5 flex flex-col sm:flex-row gap-4 bg-white/2 border border-white/5 p-4 rounded-2xl">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dari Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={e => setStartDate(e.target.value)} 
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sampai Tanggal</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)} 
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Timeline List */}
                        <div className="p-6 max-h-[600px] overflow-y-auto space-y-3.5">
                            {filteredLogs.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fas fa-history text-slate-600"></i>
                                    </div>
                                    <p className="text-sm font-medium">Belum ada catatan aktivitas</p>
                                </div>
                            ) : (
                                filteredLogs.map((log) => (
                                    <div 
                                        key={log.id} 
                                        className="bg-white/3 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                                                    <i className="fas fa-user text-[10px]"></i>
                                                </div>
                                                <strong className="text-slate-200 text-sm">{log.username}</strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-semibold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                                                    {new Date(log.timestamp).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {!log.decrypted && (
                                                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <i className="fas fa-lock text-[8px]"></i> Terenkripsi
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-slate-300 text-sm pl-8 leading-relaxed">{log.action}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityLog;