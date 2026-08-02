import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
    
    // Integrated Uang Masuk states
    const [incomeNominal, setIncomeNominal] = useState('');
    const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Tab Navigation state
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'income', 'expenses'

    // Custom Toast & Confirm states
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchData();
        fetchProfitSettings();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const fetchData = async () => {
        try {
            const pemasukanRes = await API.get('/keuangan/pemasukan');
            const biayaRes = await API.get('/keuangan/biaya');
            
            setPemasukanList(pemasukanRes.data);
            setBiaya({
                konsumsi: biayaRes.data.current?.konsumsi || 0,
                operasional: biayaRes.data.current?.operasional || 0,
                history: biayaRes.data.history || []
            });
            const total = pemasukanRes.data.reduce((sum, item) => sum + parseFloat(item.jumlah || 0), 0);
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
            showToast('Pengaturan profit berhasil diupdate!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal update pengaturan profit', 'error');
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
            showToast('Biaya berhasil disimpan', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal update biaya', 'error');
        }
    };

    const triggerResetHistory = () => {
        setConfirmModal({
            show: true,
            title: 'Reset Riwayat Biaya',
            message: 'Apakah Anda yakin ingin mereset semua data riwayat biaya? Aksi ini akan menghapus catatan pengeluaran secara permanen dan tidak dapat dibatalkan.',
            onConfirm: handleResetHistory
        });
    };

    const handleResetHistory = async () => {
        try {
            await API.delete('/keuangan/biaya/history');
            await fetchData();
            showToast('Riwayat biaya berhasil direset', 'success');
            setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal reset riwayat biaya', 'error');
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    // Integrated Uang Masuk Handlers
    const handleTambahPemasukan = async () => {
        if (!incomeNominal || parseFloat(incomeNominal) <= 0) {
            showToast('Nominal tidak valid', 'error');
            return;
        }
        try {
            await API.post('/keuangan/pemasukan', {
                jumlah: parseFloat(incomeNominal),
                tanggal: incomeDate,
                keterangan: 'Pemasukan tunai'
            });
            setIncomeNominal('');
            fetchData();
            showToast('Pemasukan berhasil dicatat', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menambah pemasukan', 'error');
        }
    };

    const triggerResetPemasukan = () => {
        setConfirmModal({
            show: true,
            title: 'Reset Pemasukan',
            message: 'Apakah Anda yakin ingin mereset semua data pemasukan? Aksi ini akan menghapus riwayat masuk secara permanen dan tidak dapat dibatalkan.',
            onConfirm: handleResetPemasukan
        });
    };

    const handleResetPemasukan = async () => {
        try {
            await API.delete('/keuangan/pemasukan/reset');
            fetchData();
            showToast('Semua data pemasukan berhasil direset', 'success');
            setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal mereset data', 'error');
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    const checkIfProfitVisible = () => {
        if (!isOwner) return false;
        if (!profitSettings.next_update_allowed) return true;
        
        const now = new Date();
        const nextUpdate = new Date(profitSettings.next_update_allowed);
        return now >= nextUpdate;
    };

    const profitKotor = totalUangMasuk - biaya.konsumsi - biaya.operasional;
    const isProfitVisible = checkIfProfitVisible();

    const openModal = (type, currentValue = 0, label = '') => {
        setModalType(type);
        setModalData({ 
            value: currentValue, 
            label, 
            keterangan: biaya[`${type}_keterangan`] || '', 
            tanggal: biaya[`${type}_tanggal`] || new Date().toISOString().split('T')[0] 
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

    // Calculate dynamic profit line chart coordinates (SVG-based)
    const getTrendPoints = () => {
        let daysPerPt = 1;
        let prefix = 'D';
        let step = 1;
        
        const type = profitSettings.duration_type;
        const val = profitSettings.duration_value;

        if (type === 'daily' && val === 3) {
            daysPerPt = 3;
            prefix = 'D';
            step = 3;
        } else if (type === 'daily') {
            daysPerPt = 1;
            prefix = 'D';
            step = 1;
        } else if (type === 'weekly') {
            daysPerPt = 7;
            prefix = 'W';
            step = 1;
        } else if (type === 'monthly') {
            daysPerPt = 30;
            prefix = 'M';
            step = 1;
        }

        const totalPts = 5;
        const pts = [];
        const now = new Date();

        // Group data into 5 segments back in time
        for (let i = totalPts - 1; i >= 0; i--) {
            const endDaysAgo = i * daysPerPt;
            const startDaysAgo = (i + 1) * daysPerPt;

            const endDate = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
            const startDate = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);

            const filteredIncomes = pemasukanList.filter(item => {
                const itemDate = new Date(item.tanggal);
                return itemDate >= startDate && itemDate <= endDate;
            });

            const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.jumlah, 0);
            const totalCosts = (biaya.konsumsi + biaya.operasional);
            const proportionalCost = totalCosts / totalPts;
            const profit = Math.max(0, totalIncome - proportionalCost);

            const labelNum = step * (totalPts - i);
            pts.push({
                label: `${prefix}${labelNum}`,
                val: profit
            });
        }
        return pts;
    };

    const trendPoints = getTrendPoints();
    const maxVal = Math.max(...trendPoints.map(p => p.val), 50000);

    // Build SVG Path Coordinates (width: 500, height: 130, padding: dynamic)
    const svgWidth = 500;
    const svgHeight = 130;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 15;
    const paddingBottom = 25;

    const getSvgCoordinates = () => {
        const usableWidth = svgWidth - paddingLeft - paddingRight;
        const usableHeight = svgHeight - paddingTop - paddingBottom;
        const bottomY = svgHeight - paddingBottom;

        return trendPoints.map((pt, idx) => {
            const x = paddingLeft + (idx * (usableWidth / (trendPoints.length - 1)));
            const ratio = pt.val / maxVal;
            const y = bottomY - (ratio * usableHeight);
            return { x, y, val: pt.val, label: pt.label };
        });
    };

    const coordinates = getSvgCoordinates();
    
    // Construct Path string (D)
    let pathD = '';
    if (coordinates.length > 0) {
        pathD = `M ${coordinates[0].x} ${coordinates[0].y} ` + 
            coordinates.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
    }

    // Construct Gradient Area string
    const bottomY = svgHeight - paddingBottom;
    const areaD = coordinates.length > 0 
        ? `${pathD} L ${coordinates[coordinates.length - 1].x} ${bottomY} L ${coordinates[0].x} ${bottomY} Z`
        : '';

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role={userRole} activeMenu="profit" />
            
            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 animate-fade-in">
                    
                    {/* Header Controls */}
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:-translate-x-0.5 active:translate-x-0 transition-all text-slate-300 text-xs sm:text-sm font-semibold"
                        >
                            <i className="fas fa-arrow-left"></i> Kembali
                        </button>

                        {/* Setting Cog */}
                        {isOwner && activeTab === 'summary' && (
                            <button
                                onClick={() => {
                                    setSelectedDuration(profitSettings.duration_type === 'daily' && profitSettings.duration_value === 3 ? '3days' : profitSettings.duration_type);
                                    setShowSettings(true);
                                }}
                                className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-lg"
                                title="Pengaturan Profit"
                            >
                                <i className="fas fa-sliders-h"></i>
                            </button>
                        )}
                    </div>

                    {/* consolidated financial navigation tabs */}
                    <div className="flex border-b border-white/10 mb-6 gap-2 flex-wrap">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                                activeTab === 'summary'
                                    ? 'border-indigo-500 text-white bg-indigo-500/5'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2'
                            }`}
                        >
                            <i className="fas fa-chart-line mr-1.5"></i> Ringkasan Profit
                        </button>
                        <button
                            onClick={() => setActiveTab('income')}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                                activeTab === 'income'
                                    ? 'border-emerald-500 text-white bg-emerald-500/5'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2'
                            }`}
                        >
                            <i className="fas fa-coins mr-1.5"></i> Catat Pemasukan
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                                activeTab === 'expenses'
                                    ? 'border-amber-500 text-white bg-amber-500/5'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2'
                            }`}
                        >
                            <i className="fas fa-receipt mr-1.5"></i> Biaya Operasional
                        </button>
                    </div>

                    {/* ================= TAB 1: SUMMARY ================= */}
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            {/* SVG Trend Line Chart */}
                            {isOwner && isProfitVisible && coordinates.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl">
                                    <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <i className="fas fa-chart-area text-indigo-400"></i>
                                        Visualisasi Grafik Tren Profit Bersih
                                    </h4>
                                    
                                    <div className="w-full overflow-hidden">
                                        <svg 
                                            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                                            className="w-full h-auto overflow-visible select-none"
                                        >
                                            <defs>
                                                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35"/>
                                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                                                </linearGradient>
                                                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* Grid Lines */}
                                            <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3" />
                                            <line x1={paddingLeft} y1={(svgHeight - paddingBottom - paddingTop) / 2 + paddingTop} x2={svgWidth - paddingRight} y2={(svgHeight - paddingBottom - paddingTop) / 2 + paddingTop} stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3" />
                                            <line x1={paddingLeft} y1={bottomY} x2={svgWidth - paddingRight} y2={bottomY} stroke="rgba(255, 255, 255, 0.1)" />

                                            {/* Area Gradient Fill */}
                                            {areaD && <path d={areaD} fill="url(#profitGrad)" />}

                                            {/* Glowing Line Path */}
                                            {pathD && (
                                                <path 
                                                    d={pathD} 
                                                    fill="none" 
                                                    stroke="#6366f1" 
                                                    strokeWidth="3.5" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    filter="url(#lineGlow)" 
                                                />
                                            )}

                                            {/* Data Points Dots */}
                                            {coordinates.map((pt, idx) => (
                                                <g key={idx} className="cursor-pointer group">
                                                    <circle 
                                                        cx={pt.x} 
                                                        cy={pt.y} 
                                                        r="5" 
                                                        fill="#06b6d4" 
                                                        stroke="#070913" 
                                                        strokeWidth="2"
                                                        className="hover:r-7 transition-all duration-150"
                                                    />
                                                    {/* Hover tooltips directly inside SVG */}
                                                    <rect 
                                                        x={pt.x - 35} 
                                                        y={pt.y - 25} 
                                                        width="70" 
                                                        height="16" 
                                                        rx="4" 
                                                        fill="#0c1022" 
                                                        stroke="rgba(255, 255, 255, 0.1)" 
                                                        strokeWidth="1"
                                                        className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                                                    />
                                                    <text 
                                                        x={pt.x} 
                                                        y={pt.y - 14} 
                                                        fill="#ffffff" 
                                                        fontSize="8" 
                                                        fontWeight="bold" 
                                                        textAnchor="middle"
                                                        className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                                                    >
                                                        {pt.val >= 1000 ? `${Math.round(pt.val/1000)}k` : pt.val}
                                                    </text>
                                                    
                                                    {/* Axis Labels */}
                                                    <text 
                                                        x={pt.x} 
                                                        y={svgHeight - 12} 
                                                        fill="#94a3b8" 
                                                        fontSize="9" 
                                                        fontWeight="bold" 
                                                        textAnchor="middle"
                                                    >
                                                        {pt.label}
                                                    </text>
                                                </g>
                                            ))}

                                            {/* Left Y Axis Label */}
                                            <text x={paddingLeft - 10} y={paddingTop + 5} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">{formatRupiah(maxVal)}</text>
                                            <text x={paddingLeft - 10} y={(svgHeight - paddingBottom - paddingTop) / 2 + paddingTop + 3} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">{formatRupiah(maxVal / 2)}</text>
                                            <text x={paddingLeft - 10} y={bottomY + 3} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">Rp 0</text>
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Summary Totals */}
                            <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                                        <span className="text-slate-400 text-sm font-medium">Total Uang Masuk</span>
                                        <strong className="text-emerald-400 text-base font-extrabold">{formatRupiah(totalUangMasuk)}</strong>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                                        <span className="text-slate-400 text-sm font-medium">Biaya Konsumsi</span>
                                        <span className="text-red-400 font-semibold text-sm">
                                            - {formatRupiah(biaya.konsumsi)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                                        <span className="text-slate-400 text-sm font-medium">Biaya Operasional</span>
                                        <span className="text-red-400 font-semibold text-sm">
                                            - {formatRupiah(biaya.operasional)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 pt-0">
                                    {isOwner ? (
                                        isProfitVisible ? (
                                            <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl text-center">
                                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">TOTAL PROFIT BERSIH</p>
                                                <p className="text-3xl font-extrabold text-white tracking-tight">{formatRupiah(profitKotor)}</p>
                                                <p className="text-[10px] text-emerald-300/80 mt-2 font-bold uppercase tracking-wider">
                                                    Periode Laporan: {profitSettings.duration_type === 'daily' ? `${profitSettings.duration_value} Hari` : profitSettings.duration_type === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-slate-950/60 border border-white/5 rounded-2xl text-center relative overflow-hidden h-40 flex items-center justify-center">
                                                {/* Locked Screen */}
                                                <div className="absolute inset-0 bg-[#070913]/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                                                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 mb-2">
                                                        <i className="fas fa-lock text-sm"></i>
                                                    </div>
                                                    <p className="text-amber-200 text-sm font-bold">Laporan Profit Terkunci</p>
                                                    <p className="text-slate-400 text-xs mt-0.5">
                                                        Berdasarkan keamanan, profit sementara hanya dapat dilihat setiap {profitSettings.duration_value} hari.
                                                    </p>
                                                    {nextUpdateDate && (
                                                        <p className="text-indigo-300 text-[10px] font-semibold mt-2 uppercase tracking-wider">
                                                            Buka Kunci Pada: {nextUpdateDate.toLocaleDateString('id-ID')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="opacity-10 blur-sm w-full">
                                                    <p className="text-xs text-slate-400">Profit Sementara</p>
                                                    <p className="text-2xl font-bold text-slate-200">{formatRupiah(profitKotor)}</p>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl text-center">
                                            <i className="fas fa-lock text-slate-500 text-2xl mb-2 block"></i>
                                            <p className="text-slate-400 text-sm font-semibold">Laporan profit hanya dapat diakses oleh Owner toko.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= TAB 2: INCOMES (Gabungan Uang Masuk) ================= */}
                    {activeTab === 'income' && (
                        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/60 p-6">
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b border-white/10 pb-4">
                                <h4 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                    <i className="fas fa-plus-circle text-emerald-400"></i>
                                    Pencatatan Pemasukan Harian
                                </h4>
                                {isOwner && (
                                    <button
                                        onClick={triggerResetPemasukan}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 border border-white/10 transition-all"
                                    >
                                        <i className="fas fa-trash-alt mr-1.5"></i> Reset Pemasukan
                                    </button>
                                )}
                            </div>

                            {/* Form Input */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/2 border border-white/5 rounded-2xl p-4 sm:p-5">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nominal Pemasukan (Rp)</label>
                                    <input
                                        type="number"
                                        placeholder="Masukkan nominal pemasukan"
                                        value={incomeNominal}
                                        onChange={(e) => setIncomeNominal(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        value={incomeDate}
                                        onChange={(e) => setIncomeDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleTambahPemasukan}
                                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] border border-white/10 transition-all text-sm h-[46px] flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-check"></i>
                                        Catat
                                    </button>
                                </div>
                            </div>

                            {/* Riwayat Table */}
                            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i className="fas fa-history text-indigo-400"></i>
                                Riwayat Transaksi Pemasukan
                            </h4>
                            
                            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                                {pemasukanList.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-receipt text-slate-600"></i>
                                        </div>
                                        <p className="text-sm font-medium">Belum ada pemasukan terdaftar</p>
                                    </div>
                                ) : (
                                    pemasukanList.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white/3 border border-white/5 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-4 hover:bg-white/5 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                                    <i className="fas fa-money-bill-wave"></i>
                                                </div>
                                                <strong className="text-lg text-white font-extrabold tracking-tight">{formatRupiah(item.jumlah)}</strong>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-400 text-xs font-semibold">
                                                <span className="flex items-center gap-1.5">
                                                    <i className="far fa-calendar-alt text-cyan-400"></i> 
                                                    {item.tanggal}
                                                </span>
                                                <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {item.keterangan}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================= TAB 3: EXPENSES ================= */}
                    {activeTab === 'expenses' && (
                        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden p-6 shadow-2xl shadow-black/60">
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-3 border-b border-white/10 pb-4">
                                <h3 className="font-extrabold text-white flex items-center gap-2.5 text-sm">
                                    <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                                        <i className="fas fa-receipt text-xs"></i>
                                    </div>
                                    Biaya Operasional Toko
                                </h3>
                                {isOwner && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all flex items-center gap-1.5"
                                        >
                                            <i className="fas fa-history text-indigo-400"></i> Riwayat
                                        </button>
                                        <button
                                            onClick={triggerResetHistory}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center gap-1.5"
                                        >
                                            <i className="fas fa-trash text-red-500"></i> Reset Riwayat
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 mb-2 bg-white/2 border border-white/5 rounded-2xl p-4 sm:p-5">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biaya Konsumsi (Klik untuk Ubah)</label>
                                        <button
                                            onClick={() => openModal('konsumsi', biaya.konsumsi, 'Konsumsi')}
                                            className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-between"
                                            disabled={!isOwner}
                                        >
                                            <span>{formatRupiah(biaya.konsumsi)}</span>
                                            {isOwner && <i className="fas fa-pen text-[10px] text-indigo-400"></i>}
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biaya Operasional (Klik untuk Ubah)</label>
                                        <button
                                            onClick={() => openModal('operasional', biaya.operasional, 'Operasional')}
                                            className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold text-sm flex items-center justify-between"
                                            disabled={!isOwner}
                                        >
                                            <span>{formatRupiah(biaya.operasional)}</span>
                                            {isOwner && <i className="fas fa-pen text-[10px] text-indigo-400"></i>}
                                        </button>
                                    </div>
                                    {isOwner && (
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleUpdateBiaya}
                                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] border border-white/10 transition-all text-sm h-[46px]"
                                            >
                                                Simpan Biaya
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* History Biaya */}
                                {showHistory && biaya.history.length > 0 && (
                                    <div className="mt-6 pt-5 border-t border-white/10 animate-fade-in">
                                        <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <i className="fas fa-list text-indigo-400 text-xs"></i>
                                            Riwayat Perubahan Biaya
                                        </h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {biaya.history.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-3 bg-white/2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-slate-200">
                                                            {item.jenis === 'konsumsi' ? 'Konsumsi' : 'Operasional'}
                                                            <span className="text-emerald-400 ml-2 font-bold">{formatRupiah(item.jumlah)}</span>
                                                        </div>
                                                        {item.keterangan && <div className="text-slate-400 italic mt-1 bg-white/2 px-2.5 py-1 rounded-md inline-block">{item.keterangan}</div>}
                                                    </div>
                                                    <div className="text-slate-400 text-right ml-4 font-medium">
                                                        <div className="text-slate-300 font-semibold">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(item.changed_at).toLocaleDateString('id-ID')}</div>
                                                        <div className="mt-1 text-[10px] text-slate-500">Oleh: {item.changed_by}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Input Biaya */}
            {showModal && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c1022]/95">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Ubah Biaya {modalData.label}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jumlah Biaya (Rp)</label>
                                <input
                                    type="number"
                                    value={modalData.value}
                                    onChange={(e) => setModalData({ ...modalData, value: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                    placeholder="Masukkan nominal biaya"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Keterangan Pengeluaran</label>
                                <textarea
                                    value={modalData.keterangan}
                                    onChange={(e) => setModalData({ ...modalData, keterangan: e.target.value })}
                                    rows="2.5"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all resize-none"
                                    placeholder="Contoh: Pembelian gas LPG, bensin karyawan, makan siang, dll"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Pengeluaran</label>
                                <input
                                    type="date"
                                    value={modalData.tanggal}
                                    onChange={(e) => setModalData({ ...modalData, tanggal: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleModalSave}
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm border border-white/10"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Settings Profit Period */}
            {showSettings && isOwner && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c1022]/95">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Periode Penguncian Profit</h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {!canUpdate && (
                                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-xs flex items-center justify-center gap-2 text-amber-300">
                                    <i className="fas fa-info-circle"></i>
                                    <span>
                                        Dapat diupdate berkala. Berikutnya: {nextUpdateDate?.toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pilih Interval Periode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'daily', label: 'Setiap Hari' },
                                        { id: '3days', label: 'Setiap 3 Hari' },
                                        { id: 'weekly', label: 'Setiap Minggu' },
                                        { id: 'monthly', label: 'Setiap Bulan' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedDuration(opt.id)}
                                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                selectedDuration === opt.id
                                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/10'
                                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpdateProfitSettings}
                                    disabled={!canUpdate}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${
                                        canUpdate 
                                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white border-white/10 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99]' 
                                            : 'bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-5 py-4 border-b border-white/10 bg-red-500/5 flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-red-400"></i>
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">{confirmModal.title}</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-slate-300 text-sm leading-relaxed">{confirmModal.message}</p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all text-xs border border-white/10"
                                >
                                    Reset/Ok
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast Alert */}
            {toast.show && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className={`px-5 py-3 rounded-2xl border shadow-xl flex items-center gap-2.5 text-sm font-semibold text-white ${
                        toast.type === 'success' 
                            ? 'bg-emerald-600/90 border-emerald-500/30' 
                            : 'bg-red-600/90 border-red-500/30'
                    }`}>
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profit;