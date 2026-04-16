import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterUsername, setFilterUsername] = useState('');
    const [usernames, setUsernames] = useState([]);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [logs, startDate, endDate, filterUsername]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await API.get('/keuangan/logs');
            const data = Array.isArray(response.data) ? response.data : [];
            setLogs(data);
            
            // Extract unique usernames for filter
            const uniqueUsernames = [...new Set(data.map(log => log.username))];
            setUsernames(uniqueUsernames);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        let filtered = [...logs];
        
        // Filter by date range
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(log => new Date(log.timestamp) >= start);
        }
        
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(log => new Date(log.timestamp) <= end);
        }
        
        // Filter by username
        if (filterUsername) {
            filtered = filtered.filter(log => log.username === filterUsername);
        }
        
        setFilteredLogs(filtered);
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setFilterUsername('');
    };

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
                        <p className="text-sm text-gray-500 mt-1">
                            <i className="fas fa-lock mr-1"></i> Data dienkripsi dengan TwoFish
                        </p>
                    </div>

                    {/* FILTER SECTION */}
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                                <select
                                    value={filterUsername}
                                    onChange={(e) => setFilterUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="">Semua User</option>
                                    {usernames.map(username => (
                                        <option key={username} value={username}>{username}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all"
                                >
                                    <i className="fas fa-undo-alt mr-1"></i> Reset
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            <i className="fas fa-chart-line mr-1"></i>
                            Menampilkan {filteredLogs.length} dari {logs.length} log
                        </div>
                    </div>

                    {/* LOGS LIST */}
                    <div className="p-6 max-h-[600px] overflow-y-auto space-y-3">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-inbox text-3xl mb-2 block"></i>
                                Tidak ada log yang sesuai filter
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <i className="fas fa-user-circle"></i>
                                        <strong>{log.username}</strong>
                                        <span className="text-xs">
                                            {new Date(log.timestamp).toLocaleString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
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