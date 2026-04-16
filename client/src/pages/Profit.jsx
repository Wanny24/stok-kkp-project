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
    const [showBiayaModal, setShowBiayaModal] = useState(false);
    const [biayaForm, setBiayaForm] = useState({ jenis: '', jumlah: '', keterangan: '', tanggal: '' });
    const [editingId, setEditingId] = useState(null);
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

    // INLINE EDIT BIAYA - LANGSUNG DI TABEL
    const handleInlineBiayaChange = (jenis, value) => {
        setBiaya({ ...biaya, [jenis]: parseFloat(value) || 0 });
    };

    const handleSaveBiaya = async () => {
        try {
            await API.put('/keuangan/biaya', {
                konsumsi: biaya.konsumsi,
                operasional: biaya.operasional
            });
            await fetchData();
            alert('Biaya berhasil disimpan');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update biaya');
        }
    };

    // MODAL UNTUK TAMBAH BIAYA DENGAN KETERANGAN & TANGGAL
    const openTambahBiayaModal = (jenis) => {
        setBiayaForm({
            jenis: jenis,
            jumlah: '',
            keterangan: '',
            tanggal: new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
        setShowBiayaModal(true);
    };

    const handleSaveBiayaWithDetails = async () => {
        if (!biayaForm.jumlah || biayaForm.jumlah <= 0) {
            alert('Masukkan jumlah biaya');
            return;
        }
        
        try {
            // Simpan ke database biaya utama
            const newKonsumsi = biayaForm.jenis === 'konsumsi' 
                ? biaya.konsumsi + parseFloat(biayaForm.jumlah) 
                : biaya.konsumsi;
            const newOperasional = biayaForm.jenis === 'operasional' 
                ? biaya.operasional + parseFloat(biayaForm.jumlah) 
                : biaya.operasional;
            
            await API.put('/keuangan/biaya', {
                konsumsi: newKonsumsi,
                operasional: newOperasional
            });
            
            // Simpan ke history dengan detail
            await API.post('/keuangan/biaya/history', {
                jenis: biayaForm.jenis,
                jumlah: parseFloat(biayaForm.jumlah),
                keterangan: biayaForm.keterangan,
                tanggal: biayaForm.tanggal
            });
            
            await fetchData();
            setShowBiayaModal(false);
            alert('Biaya berhasil ditambahkan');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menambah biaya');
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

                {/* Profit Settings Icon */}
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
                            
                            {/* INLINE EDIT BIAYA KONSUMSI */}
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">Biaya Konsumsi</span>
                                <div className="flex items-center gap-2">
                                    {isOwner ? (
                                        <input
                                            type="number"
                                            value={biaya.konsumsi}
                                            onChange={(e) => handleInlineBiayaChange('konsumsi', e.target.value)}
                                            className="w-32 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm"
                                        />
                                    ) : (
                                        <span className="text-red-500 text-sm">{formatRupiah(biaya.konsumsi)}</span>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => openTambahBiayaModal('konsumsi')}
                                            className="text-green-500 hover:text-green-600 text-xs"
                                            title="Tambah Biaya Konsumsi"
                                        >
                                            <i className="fas fa-plus-circle"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* INLINE EDIT BIAYA OPERASIONAL */}
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">Biaya Operasional</span>
                                <div className="flex items-center gap-2">
                                    {isOwner ? (
                                        <input
                                            type="number"
                                            value={biaya.operasional}
                                            onChange={(e) => handleInlineBiayaChange('operasional', e.target.value)}
                                            className="w-32 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm"
                                        />
                                    ) : (
                                        <span className="text-red-500 text-sm">{formatRupiah(biaya.operasional)}</span>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => openTambahBiayaModal('operasional')}
                                            className="text-green-500 hover:text-green-600 text-xs"
                                            title="Tambah Biaya Operasional"
                                        >
                                            <i className="fas fa-plus-circle"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tombol Simpan Biaya */}
                        {isOwner && (
                            <div className="mt-4">
                                <button
                                    onClick={handleSaveBiaya}
                                    className="w-full bg-gray-600 text-white py-2 rounded-xl hover:bg-gray-700 transition-all text-sm"
                                >
                                    Simpan Perubahan Biaya
                                </button>
                            </div>
                        )}

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

                {/* History Biaya Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-history text-amber-600 text-sm"></i>
                            </div>
                            Riwayat Biaya Operasional
                        </h3>
                        {isOwner && (
                            <button
                                onClick={handleResetHistory}
                                className="text-red-500 text-sm hover:underline"
                            >
                                <i className="fas fa-trash mr-1"></i> Reset History
                            </button>
                        )}
                    </div>
                    
                    <div className="p-4 sm:p-6">
                        {biaya.history.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <i className="fas fa-inbox text-3xl mb-2 block"></i>
                                <p className="text-sm">Belum ada riwayat biaya</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {biaya.history.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.jenis === 'konsumsi' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.jenis === 'konsumsi' ? 'Konsumsi' : 'Operasional'}
                                                </span>
                                                <p className="font-semibold text-gray-800 mt-1">{formatRupiah(item.jumlah)}</p>
                                                {item.keterangan && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        <i className="fas fa-info-circle mr-1"></i> {item.keterangan}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right text-xs text-gray-400">
                                                <p>{new Date(item.changed_at || item.tanggal).toLocaleDateString('id-ID')}</p>
                                                <p className="text-xs">by {item.changed_by || 'Owner'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL TAMBAH BIAYA DENGAN KETERANGAN & TANGGAL */}
            {showBiayaModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">
                                Tambah {biayaForm.jenis === 'konsumsi' ? 'Biaya Konsumsi' : 'Biaya Operasional'}
                            </h3>
                            <button onClick={() => setShowBiayaModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                                <input
                                    type="number"
                                    value={biayaForm.jumlah}
                                    onChange={(e) => setBiayaForm({ ...biayaForm, jumlah: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    placeholder="Masukkan nominal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    value={biayaForm.keterangan}
                                    onChange={(e) => setBiayaForm({ ...biayaForm, keterangan: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    rows="2"
                                    placeholder="Contoh: Beli bahan baku, Listrik, dll"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={biayaForm.tanggal}
                                    onChange={(e) => setBiayaForm({ ...biayaForm, tanggal: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowBiayaModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveBiayaWithDetails}
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