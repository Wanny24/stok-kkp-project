import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FloatingNotification from '../components/FloatingNotification';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function Profit() {
    const [profitData, setProfitData] = useState([]);
    const [biaya, setBiaya] = useState({ konsumsi: 0, operasional: 0 });
    const [biayaHistory, setBiayaHistory] = useState([]);
    const [settings, setSettings] = useState({ duration_type: 'monthly', duration_value: 1 });
    const [loading, setLoading] = useState(true);
    const [editingBiaya, setEditingBiaya] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [formBiaya, setFormBiaya] = useState({ konsumsi: '', operasional: '' });
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchProfitData();
        fetchBiaya();
        if (isOwner) {
            fetchProfitSettings();
        }
    }, []);

    const fetchProfitData = async () => {
        try {
            const response = await API.get('/keuangan/profit');
            setProfitData(response.data);
        } catch (error) {
            console.error('Error fetching profit:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBiaya = async () => {
        try {
            const response = await API.get('/keuangan/biaya');
            setBiaya(response.data.current || { konsumsi: 0, operasional: 0 });
            setBiayaHistory(response.data.history || []);
        } catch (error) {
            console.error('Error fetching biaya:', error);
        }
    };

    const fetchProfitSettings = async () => {
        try {
            const response = await API.get('/keuangan/profit-settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    // UPDATE BIAYA LANGSUNG DARI TABEL (INLINE EDIT)
    const handleInlineUpdateBiaya = async (jenis, newValue) => {
        try {
            const konsumsi = jenis === 'konsumsi' ? newValue : biaya.konsumsi;
            const operasional = jenis === 'operasional' ? newValue : biaya.operasional;
            
            await API.put('/keuangan/biaya', { konsumsi, operasional });
            fetchBiaya();
            setEditingBiaya(null);
            alert(`Biaya ${jenis} berhasil diupdate`);
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update biaya');
        }
    };

    const handleUpdateBiaya = async (e) => {
        e.preventDefault();
        try {
            await API.put('/keuangan/biaya', {
                konsumsi: parseInt(formBiaya.konsumsi) || biaya.konsumsi,
                operasional: parseInt(formBiaya.operasional) || biaya.operasional
            });
            fetchBiaya();
            setFormBiaya({ konsumsi: '', operasional: '' });
            alert('Biaya berhasil diupdate');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update biaya');
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await API.put('/keuangan/profit-settings', settings);
            alert('Pengaturan profit berhasil diupdate');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update pengaturan');
        }
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
            <FloatingNotification />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50">
                    <i className="fas fa-arrow-left"></i> Kembali
                </button>

                {/* Tabel Biaya dengan Edit Inline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-chart-pie text-blue-600"></i> Biaya Operasional
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Jenis Biaya</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Nilai (Rp)</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-800">🍽️ Biaya Konsumsi</td>
                                    <td className="px-4 py-3 text-right">
                                        {editingBiaya === 'konsumsi' ? (
                                            <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-32 text-right px-2 py-1 border rounded-lg" autoFocus />
                                        ) : (
                                            formatRupiah(biaya.konsumsi)
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {editingBiaya === 'konsumsi' ? (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleInlineUpdateBiaya('konsumsi', parseInt(editValue))} className="text-green-600 hover:text-green-700"><i className="fas fa-check"></i></button>
                                                <button onClick={() => setEditingBiaya(null)} className="text-red-600 hover:text-red-700"><i className="fas fa-times"></i></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setEditingBiaya('konsumsi'); setEditValue(biaya.konsumsi); }} className="text-blue-600 hover:text-blue-700 text-sm"><i className="fas fa-edit"></i> Edit</button>
                                        )}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                    <td className="px-4 py-3 font-medium text-gray-800">⚙️ Biaya Operasional</td>
                                    <td className="px-4 py-3 text-right">
                                        {editingBiaya === 'operasional' ? (
                                            <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-32 text-right px-2 py-1 border rounded-lg" autoFocus />
                                        ) : (
                                            formatRupiah(biaya.operasional)
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {editingBiaya === 'operasional' ? (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleInlineUpdateBiaya('operasional', parseInt(editValue))} className="text-green-600 hover:text-green-700"><i className="fas fa-check"></i></button>
                                                <button onClick={() => setEditingBiaya(null)} className="text-red-600 hover:text-red-700"><i className="fas fa-times"></i></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setEditingBiaya('operasional'); setEditValue(biaya.operasional); }} className="text-blue-600 hover:text-blue-700 text-sm"><i className="fas fa-edit"></i> Edit</button>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Biaya Mingguan (tetap dipertahankan) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-edit text-green-600"></i> Input Biaya Mingguan
                        </h3>
                    </div>
                    <form onSubmit={handleUpdateBiaya} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Konsumsi (Rp)</label>
                            <input type="number" value={formBiaya.konsumsi} onChange={(e) => setFormBiaya({...formBiaya, konsumsi: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder={formatRupiah(biaya.konsumsi)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Operasional (Rp)</label>
                            <input type="number" value={formBiaya.operasional} onChange={(e) => setFormBiaya({...formBiaya, operasional: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder={formatRupiah(biaya.operasional)} />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-all">Update Biaya</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profit;
