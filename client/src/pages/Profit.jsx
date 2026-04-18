import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function Profit() {
    const [pemasukanList, setPemasukanList] = useState([]);
    const [biaya, setBiaya] = useState({ konsumsi: 0, operasional: 0, history: [] });
    const [totalUangMasuk, setTotalUangMasuk] = useState(0);
    const [profitSettings, setProfitSettings] = useState({ duration_type: 'weekly', duration_value: 7, next_update_allowed: null });
    const [showSettings, setShowSettings] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState('weekly');
    const [canUpdate, setCanUpdate] = useState(true);
    const [nextUpdateDate, setNextUpdateDate] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [modalData, setModalData] = useState({});
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchData();
        fetchProfitSettings();
    }, []);

    const fetchData = async () => {
        try {
            const [pemasukanRes, biayaRes] = await Promise.all([
                API.get('/keuangan/pemasukan'),
                API.get('/keuangan/biaya')
            ]);
            setPemasukanList(pemasukanRes.data);
            setBiaya({
                konsumsi: biayaRes.data.current?.konsumsi || 0,
                operasional: biayaRes.data.current?.operasional || 0,
                history: biayaRes.data.history || []
            });
            const total = pemasukanRes.data.reduce((sum, item) => sum + item.jumlah, 0);
            setTotalUangMasuk(total);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchProfitSettings = async () => {
        try {
            const response = await API.get('/keuangan/profit-settings');
            setProfitSettings(response.data);
            const now = new Date();
            const nextUpdate = new Date(response.data.next_update_allowed);
            setCanUpdate(now >= nextUpdate);
            setNextUpdateDate(nextUpdate);
        } catch (error) {
            console.error('Error fetching profit settings:', error);
        }
    };

    const handleUpdateProfitSettings = async () => {
        let durationValue = 1;
        let durationType = 'daily';
        
        switch (selectedDuration) {
            case 'daily':
                durationValue = 1;
                durationType = 'daily';
                break;
            case '3days':
                durationValue = 3;
                durationType = 'daily';
                break;
            case 'weekly':
                durationValue = 7;
                durationType = 'weekly';
                break;
            case 'monthly':
                durationValue = 30;
                durationType = 'monthly';
                break;
            default:
                durationValue = 7;
                durationType = 'weekly';
        }
        
        try {
            await API.put('/keuangan/profit-settings', {
                duration_type: durationType,
                duration_value: durationValue
            });
            await fetchProfitSettings();
            setShowSettings(false);
            alert('Pengaturan profit berhasil diupdate!');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update pengaturan profit');
        }
    };

    const handleUpdateBiaya = async () => {
        try {
            await API.put('/keuangan/biaya', {
                konsumsi: biaya.konsumsi,
                konsumsi_keterangan: biaya.konsumsi_keterangan,
                konsumsi_tanggal: biaya.konsumsi_tanggal,
                operasional: biaya.operasional,
                operasional_keterangan: biaya.operasional_keterangan,
                operasional_tanggal: biaya.operasional_tanggal
            });
            await fetchData();
            alert('Biaya berhasil disimpan');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update biaya');
        }
    };

    const handleResetHistory = async () => {
        if (confirm('Reset semua history biaya? Aksi ini tidak dapat dibatalkan.')) {
            try {
                await API.delete('/keuangan/biaya/history');
                await fetchData();
                alert('History biaya direset');
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal reset history');
            }
        }
    };

    const checkIfProfitVisible = () => {
        if (!isOwner) return false;
        
        const now = new Date();
        const lastUpdated = new Date(profitSettings.last_updated);
        const daysDiff = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        
        if (profitSettings.duration_type === 'daily') {
            return daysDiff >= profitSettings.duration_value;
        } else if (profitSettings.duration_type === 'weekly') {
            return daysDiff >= 7;
        } else if (profitSettings.duration_type === 'monthly') {
            return daysDiff >= 30;
        }
        return false;
    };

    const profitKotor = totalUangMasuk - biaya.konsumsi - biaya.operasional;
    const isProfitVisible = checkIfProfitVisible();

    // Modal handlers untuk input form
    const openModal = (type, currentValue = 0, label = '') => {
        setModalType(type);
        setModalData({ 
            value: currentValue, 
            label, 
            keterangan: '', 
            tanggal: new Date().toISOString().split('T')[0] 
        });
        setShowModal(true);
    };

    const handleModalSave = () => {
        const newValue = parseFloat(modalData.value);
        if (isNaN(newValue)) return;
        
        setBiaya(prev => ({
            ...prev,
            [modalType]: newValue,
            [`${modalType}_keterangan`]: modalData.keterangan || '-',
            [`${modalType}_tanggal`]: modalData.tanggal || new Date().toISOString().split('T')[0]
        }));
        
        setShowModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar role={userRole} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 text-sm"
                >
                    <i className="fas fa-arrow-left"></i> Kembali
                </button>

                {/* Profit Settings Icon - Only for Owner */}
                {isOwner && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
                            title="Pengaturan Profit"
                        >
                            <i className="fas fa-sliders-h text-gray-600"></i>
                        </button>
                    </div>
                )}

                {/* Profit Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-chart-line text-purple-600 text-sm"></i>
                            </div>
                            Profit
                        </h3>
                    </div>
                    
                    <div className="p-4 sm:p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">Total Uang Masuk</span>
                                <strong className="text-green-600 text-base">{formatRupiah(totalUangMasuk)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">Biaya Konsumsi</span>
                                <span className="text-red-500 font-medium text-sm">
                                    - {formatRupiah(biaya.konsumsi)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">Biaya Operasional</span>
                                <span className="text-red-500 font-medium text-sm">
                                    - {formatRupiah(biaya.operasional)}
                                </span>
                            </div>
                        </div>

                        {/* Profit Result */}
                        {isOwner ? (
                            isProfitVisible ? (
                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-center">
                                    <p className="text-xs text-green-700 font-medium mb-1">TOTAL PROFIT</p>
                                    <p className="text-2xl font-bold text-green-800">{formatRupiah(profitKotor)}</p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Periode: {profitSettings.duration_type === 'daily' ? 'Harian' : profitSettings.duration_type === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 p-4 bg-amber-50 rounded-xl text-center relative">
                                    <div className="absolute inset-0 bg-amber-50/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                                        <i className="fas fa-lock text-amber-500 text-3xl mb-2"></i>
                                        <p className="text-amber-700 text-sm font-medium">Profit Terkunci</p>
                                        <p className="text-amber-600 text-xs mt-1">
                                            Profit hanya dapat dilihat setiap {profitSettings.duration_value} hari
                                        </p>
                                        {nextUpdateDate && (
                                            <p className="text-amber-500 text-xs mt-2">
                                                Dapat dilihat kembali pada: {nextUpdateDate.toLocaleDateString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="opacity-10 blur-sm">
                                        <p className="text-sm text-gray-600">Profit Sementara</p>
                                        <p className="text-xl font-bold text-gray-800">{formatRupiah(profitKotor)}</p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-center">
                                <i className="fas fa-lock text-gray-400 text-xl mb-2 block"></i>
                                <p className="text-gray-500 text-sm">Profit hanya dapat dilihat oleh Owner</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Biaya Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-sliders-h text-amber-600 text-sm"></i>
                            </div>
                            Biaya Operasional Mingguan
                        </h3>
                        {isOwner && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="text-blue-600 text-sm hover:underline"
                                >
                                    <i className="fas fa-history mr-1"></i> History
                                </button>
                                <button
                                    onClick={handleResetHistory}
                                    className="text-red-500 text-sm hover:underline"
                                >
                                    <i className="fas fa-trash mr-1"></i> Reset History
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Konsumsi (Rp)</label>
                                <button
                                    onClick={() => openModal('konsumsi', biaya.konsumsi, 'Konsumsi')}
                                    className="w-full text-left px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                                    disabled={!isOwner}
                                >
                                    {formatRupiah(biaya.konsumsi)}
                                </button>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Operasional (Rp)</label>
                                <button
                                    onClick={() => openModal('operasional', biaya.operasional, 'Operasional')}
                                    className="w-full text-left px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                                    disabled={!isOwner}
                                >
                                    {formatRupiah(biaya.operasional)}
                                </button>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={handleUpdateBiaya}
                                    className="self-end bg-gray-600 text-white px-5 py-2 rounded-xl hover:bg-gray-700 transition-all"
                                >
                                    Simpan
                                </button>
                            )}
                        </div>

                        {/* History Biaya */}
                        {showHistory && biaya.history.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="font-semibold text-gray-700 text-sm mb-3">Riwayat Perubahan Biaya</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {biaya.history.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {item.jenis === 'konsumsi' ? 'Konsumsi' : 'Operasional'}
                                                    <span className="text-gray-500 ml-2">Rp {item.jumlah.toLocaleString('id-ID')}</span>
                                                </div>
                                                {item.keterangan && <div className="text-gray-500 italic mt-0.5">{item.keterangan}</div>}
                                            </div>
                                            <div className="text-gray-400 text-right ml-4">
                                                <div>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : new Date(item.changed_at).toLocaleDateString('id-ID')}</div>
                                                <div className="mt-0.5">by {item.changed_by}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Input Biaya */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Edit {modalData.label}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jumlah (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={modalData.value}
                                    onChange={(e) => setModalData({ ...modalData, value: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    placeholder="Masukkan nominal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keterangan
                                </label>
                                <textarea
                                    value={modalData.keterangan}
                                    onChange={(e) => setModalData({ ...modalData, keterangan: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    placeholder="Contoh: Bensin, Makan Siang"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={modalData.tanggal}
                                    onChange={(e) => setModalData({ ...modalData, tanggal: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleModalSave}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Settings Profit */}
            {showSettings && isOwner && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Pengaturan Periode Profit</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            {!canUpdate && (
                                <div className="mb-4 p-3 bg-amber-50 rounded-xl text-center">
                                    <i className="fas fa-clock text-amber-500 mr-2"></i>
                                    <span className="text-amber-700 text-sm">
                                        Hanya bisa diganti seminggu sekali. Berikutnya: {nextUpdateDate?.toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            )}
                            
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Periode Profit</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedDuration('daily')}
                                    className={`px-4 py-2 rounded-xl border transition-all ${selectedDuration === 'daily' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                >
                                    Setiap Hari
                                </button>
                                <button
                                    onClick={() => setSelectedDuration('3days')}
                                    className={`px-4 py-2 rounded-xl border transition-all ${selectedDuration === '3days' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                >
                                    3 Hari
                                </button>
                                <button
                                    onClick={() => setSelectedDuration('weekly')}
                                    className={`px-4 py-2 rounded-xl border transition-all ${selectedDuration === 'weekly' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                >
                                    Seminggu
                                </button>
                                <button
                                    onClick={() => setSelectedDuration('monthly')}
                                    className={`px-4 py-2 rounded-xl border transition-all ${selectedDuration === 'monthly' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                                >
                                    Sebulan
                                </button>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpdateProfitSettings}
                                    disabled={!canUpdate}
                                    className={`flex-1 px-4 py-2 rounded-xl text-white transition-all ${canUpdate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profit;