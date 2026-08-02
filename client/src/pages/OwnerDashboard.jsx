import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function OwnerDashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0 });
    
    // States for dashboard charts
    const [logs, setLogs] = useState([]);
    const [pemasukanList, setPemasukanList] = useState([]);
    const [biaya, setBiaya] = useState({ konsumsi: 0, operasional: 0 });
    const [profitSettings, setProfitSettings] = useState({ duration_type: 'weekly', duration_value: 7 });
    const [loadingCharts, setLoadingCharts] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        
        const hours = new Date().getHours();
        if (hours < 12) setGreeting('Selamat Pagi');
        else if (hours < 15) setGreeting('Selamat Siang');
        else if (hours < 18) setGreeting('Selamat Sore');
        else setGreeting('Selamat Malam');

        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoadingCharts(true);
            const invRes = await API.get('/inventory');
            const logsRes = await API.get('/keuangan/logs');
            const pemasukanRes = await API.get('/keuangan/pemasukan');
            const biayaRes = await API.get('/keuangan/biaya');
            const settingsRes = await API.get('/keuangan/profit-settings');

            const inventory = invRes.data;
            setStats({
                totalProducts: inventory.length,
                lowStock: inventory.filter(i => i.stock <= (i.min_stock || 5)).length
            });

            setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
            setPemasukanList(Array.isArray(pemasukanRes.data) ? pemasukanRes.data : []);
            setBiaya({
                konsumsi: biayaRes.data.current?.konsumsi || 0,
                operasional: biayaRes.data.current?.operasional || 0
            });
            setProfitSettings(settingsRes.data || { duration_type: 'weekly', duration_value: 7 });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoadingCharts(false);
        }
    };

    const menus = [
        { icon: 'fas fa-cubes', label: 'Stok Barang', path: '/owner/stok', desc: 'Kelola inventaris produk' },
        { icon: 'fas fa-wallet', label: 'Profit & Keuangan', path: '/owner/profit', desc: 'Laba rugi & catat transaksi' },
        { icon: 'fas fa-hand-holding-usd', label: 'Modal', path: '/owner/modal', desc: 'Total modal investasi' },
        { icon: 'fas fa-history', label: 'Log Aktivitas', path: '/owner/logs', desc: 'Riwayat aktivitas sistem' },
        { icon: 'fas fa-users', label: 'Karyawan', path: '/owner/karyawan', desc: 'Kelola tim karyawan' },
    ];

    const handleAddProduct = () => {
        navigate('/owner/stok');
    };

    const handleAddIncome = () => {
        navigate('/owner/profit');
    };

    // Calculate Fast Moving Products from logs
    const getFastMovingProducts = () => {
        if (!logs || logs.length === 0) return [];
        const counts = {};
        
        logs.forEach(log => {
            if (!log.action) return;
            const match = log.action.match(/Kurangi stok (.+?) -?(\d+)/i);
            if (match) {
                const nama = match[1].trim();
                const qty = parseInt(match[2]);
                counts[nama] = (counts[nama] || 0) + qty;
            }
        });
        
        return Object.keys(counts)
            .map(nama => ({ nama, monthlySales: counts[nama] }))
            .filter(item => item.monthlySales > 0)
            .sort((a, b) => b.monthlySales - a.monthlySales)
            .slice(0, 5);
    };

    const fastMovingProducts = getFastMovingProducts();
    const maxSalesVal = fastMovingProducts.length > 0 ? Math.max(...fastMovingProducts.map(p => p.monthlySales)) : 100;

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

    // SVG Settings
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
    
    let pathD = '';
    if (coordinates.length > 0) {
        pathD = `M ${coordinates[0].x} ${coordinates[0].y} ` + 
            coordinates.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
    }

    const bottomY = svgHeight - paddingBottom;
    const areaD = coordinates.length > 0 
        ? `${pathD} L ${coordinates[coordinates.length - 1].x} ${bottomY} L ${coordinates[0].x} ${bottomY} Z`
        : '';

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role="owner" activeMenu="dashboard" />
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 animate-fade-in">
                    
                    {/* Header Greeting */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    {greeting}, <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{username}</span> 👋
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">Kelola stok dan keuangan toko Anda hari ini.</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 shadow-lg backdrop-blur-md text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                                    <i className="far fa-clock text-indigo-400"></i>
                                    <span>{currentTime}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 shadow-lg backdrop-blur-md text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-cyan-400"></i>
                                    <span>
                                        {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/40 hover:border-indigo-500/30 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">Total Produk</p>
                                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{stats.totalProducts}</p>
                                </div>
                                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/25 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/5 group-hover:bg-indigo-500/20 transition-all">
                                    <i className="fas fa-cube text-indigo-400 text-sm sm:text-base"></i>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl shadow-black/40 hover:border-amber-500/30 transition-all duration-300 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">Stok Menipis</p>
                                    <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{stats.lowStock}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/5 group-hover:bg-amber-500/20 transition-all">
                                    <i className="fas fa-exclamation-triangle text-amber-400 text-sm sm:text-base"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Aksi Cepat</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleAddProduct}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm sm:text-base font-bold border border-white/10"
                            >
                                <i className="fas fa-plus-circle"></i>
                                <span>Tambah Produk</span>
                            </button>
                            <button
                                onClick={handleAddIncome}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] transition-all text-sm sm:text-base font-bold border border-white/10"
                            >
                                <i className="fas fa-money-bill-wave"></i>
                                <span>Input Keuangan</span>
                            </button>
                        </div>
                    </div>

                    {/* Executive Dashboard Analytics (SVG Charts) */}
                    {!loadingCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                            
                            {/* Chart 1: Profit Trend */}
                            {coordinates.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-2xl">
                                    <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                        <i className="fas fa-chart-line text-indigo-400"></i>
                                        Tren Perkembangan Profit
                                    </h4>
                                    <div className="w-full overflow-hidden">
                                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                                            <defs>
                                                <linearGradient id="dbProfitGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                                                </linearGradient>
                                                <filter id="dbLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="3" />
                                            <line x1={paddingLeft} y1={(svgHeight - paddingBottom - paddingTop) / 2 + paddingTop} x2={svgWidth - paddingRight} y2={(svgHeight - paddingBottom - paddingTop) / 2 + paddingTop} stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="3" />
                                            <line x1={paddingLeft} y1={bottomY} x2={svgWidth - paddingRight} y2={bottomY} stroke="rgba(255, 255, 255, 0.1)" />
                                            
                                            {areaD && <path d={areaD} fill="url(#dbProfitGrad)" />}
                                            {pathD && <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#dbLineGlow)" />}
                                            
                                            {coordinates.map((pt, idx) => (
                                                <g key={idx} className="cursor-pointer group">
                                                    <circle cx={pt.x} cy={pt.y} r="4" fill="#06b6d4" stroke="#070913" strokeWidth="1.5" />
                                                    <rect x={pt.x - 30} y={pt.y - 22} width="60" height="14" rx="3" fill="#0c1022" stroke="rgba(255, 255, 255, 0.1)" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <text x={pt.x} y={pt.y - 12} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {pt.val >= 1000 ? `${Math.round(pt.val/1000)}k` : pt.val}
                                                    </text>
                                                    <text x={pt.x} y={svgHeight - 8} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">{pt.label}</text>
                                                </g>
                                            ))}
                                            <text x={paddingLeft - 8} y={paddingTop + 3} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">{formatRupiah(maxVal)}</text>
                                            <text x={paddingLeft - 8} y={bottomY + 3} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">Rp 0</text>
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Chart 2: Fast Selling Products */}
                            {fastMovingProducts.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider mb-3.5 flex items-center gap-2">
                                            <i className="fas fa-fire text-amber-500 animate-pulse"></i>
                                            Produk Terlaris (Subtraksi Stok)
                                        </h4>
                                        <div className="space-y-3">
                                            {fastMovingProducts.map((prod) => {
                                                const percent = Math.min(100, Math.round((prod.monthlySales / maxSalesVal) * 100));
                                                return (
                                                    <div key={prod.nama} className="flex items-center gap-3">
                                                        <span className="text-slate-300 font-bold text-xs w-20 sm:w-28 truncate">{prod.nama}</span>
                                                        <div className="flex-1 h-2.5 bg-white/5 border border-white/5 rounded-full overflow-hidden relative">
                                                            <div style={{ width: `${percent}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                                                        </div>
                                                        <span className="text-cyan-400 font-extrabold text-xs flex-shrink-0">{prod.monthlySales} Unit</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Menu Grid */}
                    <div>
                        <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menus.map((menu, index) => (
                                <div
                                    key={index}
                                    onClick={() => navigate(menu.path)}
                                    className="group bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 border border-white/5 hover:shadow-xl hover:shadow-indigo-500/5 flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-300 flex-shrink-0">
                                        <i className={`${menu.icon} text-slate-400 text-lg group-hover:text-indigo-400 transition-colors`}></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-200 text-sm sm:text-base group-hover:text-indigo-300 transition-colors">{menu.label}</p>
                                        <p className="text-slate-400 text-xs mt-0.5 truncate">{menu.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OwnerDashboard;