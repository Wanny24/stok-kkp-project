import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';

function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await API.get('/keuangan/logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    return (
        <div>
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

                    <div className="p-6 max-h-[600px] overflow-y-auto space-y-3">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Belum ada aktivitas
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <i className="fas fa-user-circle"></i>
                                        <strong>{log.username}</strong>
                                        <span className="text-xs">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
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