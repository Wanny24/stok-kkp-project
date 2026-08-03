import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';
import { formatNumberWithDots, cleanNumberString } from '../utils/formatNumber';


function Stok() {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMinStockModal, setShowMinStockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newMinStock, setNewMinStock] = useState('5');
    const [actionModal, setActionModal] = useState({
        show: false,
        type: '', // 'tambah', 'kurang', 'modal', 'harga'
        item: null
    });
    const [actionData, setActionData] = useState({
        value1: '',
        value2: ''
    });
    const [formData, setFormData] = useState({
        nama: '',
        harga_jual: '',
        stock: '',
        average_cost: '',
        min_stock: '5'
    });

    // Custom Toast & Confirm states
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
    
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchInventory();
    }, []);

    // Filter effect dengan safety check
    useEffect(() => {
        const inventoryArray = Array.isArray(inventory) ? inventory : [];
        
        if (searchTerm.trim() === '') {
            setFilteredInventory(inventoryArray);
        } else {
            const filtered = inventoryArray.filter(item =>
                item && item.nama && item.nama.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredInventory(filtered);
        }
    }, [searchTerm, inventory]);

    // Toast helper
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await API.get('/inventory');
            
            console.log('API Response:', response.data);
            
            let inventoryData = [];
            if (Array.isArray(response.data)) {
                inventoryData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                inventoryData = response.data.data;
            } else {
                console.error('Unexpected response format:', response.data);
                inventoryData = [];
            }
            
            setInventory(inventoryData);
            setFilteredInventory(inventoryData);
            
            if (isOwner) {
                const logsRes = await API.get('/keuangan/logs');
                const logsData = Array.isArray(logsRes.data) ? logsRes.data : [];
                setLogs(logsData);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setInventory([]);
            setFilteredInventory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'stock' || name === 'harga_jual' || name === 'average_cost' || name === 'min_stock') {
            setFormData({
                ...formData,
                [name]: formatNumberWithDots(value)
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleTambahBarang = async (e) => {
        e.preventDefault();
        if (inventory.length >= 30) {
            showToast('Batas maksimal 30 produk telah tercapai', 'error');
            return;
        }
        const rawStock = parseInt(cleanNumberString(formData.stock));
        if (rawStock > 1000) {
            showToast('Stok Maksimal 1000 Pcs', 'error');
            return;
        }
        try {
            await API.post('/inventory', {
                nama: formData.nama,
                stock: rawStock,
                harga_jual: parseFloat(cleanNumberString(formData.harga_jual)),
                average_cost: parseFloat(cleanNumberString(formData.average_cost)),
                min_stock: parseInt(cleanNumberString(formData.min_stock))
            });
            fetchInventory();
            setShowModal(false);
            setFormData({ nama: '', harga_jual: '', stock: '', average_cost: '', min_stock: '5' });
            showToast('Produk berhasil ditambahkan', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menambah produk', 'error');
        }
    };

    const handleUpdateMinStock = async () => {
        try {
            await API.put('/inventory/min-stock', {
                id: selectedProduct.id,
                min_stock: parseInt(cleanNumberString(newMinStock))
            });
            fetchInventory();
            setShowMinStockModal(false);
            showToast('Batas minimum stok berhasil diupdate', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal update batas stok', 'error');
        }
    };

    const openActionModal = (type, item) => {
        setActionModal({ show: true, type, item });
        if (type === 'tambah' || type === 'kurang') {
            setActionData({ value1: '1', value2: '' });
        } else if (type === 'harga') {
            setActionData({ value1: formatNumberWithDots(Math.round(item.harga_jual)), value2: '' });
        } else if (type === 'modal') {
            setActionData({ value1: '5', value2: formatNumberWithDots(Math.round(item.average_cost)) });
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        const { type, item } = actionModal;
        const id = item.id;
        
        try {
            if (type === 'tambah') {
                const quantity = parseInt(cleanNumberString(actionData.value1));
                if (quantity > 0) {
                    if (item.stock + quantity > 1000) {
                        showToast('Stok Maksimal 1000 Pcs', 'error');
                        return;
                    }
                    await API.put('/inventory/stock', { id, type: 'tambah', quantity });
                    showToast('Stok berhasil ditambahkan', 'success');
                }
            } else if (type === 'kurang') {
                const quantity = parseInt(cleanNumberString(actionData.value1));
                if (quantity > 0) {
                    if (item.stock < quantity) {
                        showToast('Stok tidak cukup', 'error');
                        return;
                    }
                    await API.put('/inventory/stock', { id, type: 'kurang', quantity });
                    showToast('Stok berhasil dikurangi', 'success');
                }
            } else if (type === 'modal') {
                const newQuantity = parseInt(cleanNumberString(actionData.value1));
                const newUnitCost = parseFloat(cleanNumberString(actionData.value2));
                if (newQuantity > 0 && newUnitCost > 0) {
                    if (item.stock + newQuantity > 1000) {
                        showToast('Stok Maksimal 1000 Pcs', 'error');
                        return;
                    }
                    await API.put('/inventory/average-cost', { id, newQuantity, newUnitCost });
                    showToast('Modal berhasil diupdate', 'success');
                }
            } else if (type === 'harga') {
                const newPrice = parseFloat(cleanNumberString(actionData.value1));
                if (newPrice > 0) {
                    await API.put('/inventory/harga-jual', { id, harga_jual: newPrice });
                    showToast('Harga jual berhasil diupdate', 'success');
                }
            }
            
            fetchInventory();
            setActionModal({ show: false, type: '', item: null });
        } catch (error) {
            showToast(error.response?.data?.message || 'Aksi gagal dilakukan', 'error');
        }
    };

    const triggerHapusBarang = (id, nama) => {
        setConfirmModal({
            show: true,
            title: 'Hapus Barang',
            message: `Apakah Anda yakin ingin menghapus barang "${nama}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
            onConfirm: () => handleHapusBarang(id, nama)
        });
    };

    const handleHapusBarang = async (id, nama) => {
        try {
            await API.delete(`/inventory/${id}`);
            fetchInventory();
            showToast(`Barang "${nama}" telah dihapus`, 'success');
            setConfirmModal(prev => ({ ...prev, show: false }));
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menghapus barang', 'error');
            setConfirmModal(prev => ({ ...prev, show: false }));
        }
    };

    const openMinStockModal = (item) => {
        setSelectedProduct(item);
        setNewMinStock(formatNumberWithDots(item.min_stock || 5));
        setShowMinStockModal(true);
    };

    // Calculate Fast Moving Products based on actual stock reduction logs
    const getFastMovingProducts = () => {
        if (!isOwner || !logs || logs.length === 0) return [];
        const counts = {};
        
        logs.forEach(log => {
            if (!log.action) return;
            // Matches: "Kurangi stok [nama] -[qty]" or "Kurangi stok [nama] [qty]"
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

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent lg:flex">
                <Sidebar role={userRole} activeMenu="stok" />
                <div className="flex-1">
                    <div className="flex justify-center items-center h-screen">
                        <div className="text-indigo-400 flex flex-col items-center gap-2">
                            <i className="fas fa-circle-notch animate-spin text-3xl"></i>
                            <span className="text-sm font-medium">Loading inventory...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role={userRole} activeMenu="stok" />
            
            {/* Content area */}
            <div className="flex-1 min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 animate-fade-in">
                    
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:-translate-x-0.5 active:translate-x-0 transition-all text-slate-300 text-xs sm:text-sm font-semibold"
                        >
                            <i className="fas fa-arrow-left"></i> Kembali
                        </button>
                    </div>

                    {/* Chart Section - Fast Moving Products */}
                    {fastMovingProducts.length > 0 && (
                        <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 shadow-2xl">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i className="fas fa-fire text-amber-500 animate-pulse"></i>
                                Analisis Produk Terlaris (Kecepatan Turnover Bulanan)
                            </h4>
                            
                            {/* Horizontal Bar Chart */}
                            <div className="space-y-4 pt-2">
                                {fastMovingProducts.map((prod) => {
                                    const percent = Math.min(100, Math.round((prod.monthlySales / maxSalesVal) * 100));
                                    return (
                                        <div key={prod.nama} className="flex items-center gap-4">
                                            <span className="text-slate-300 font-bold text-xs sm:text-sm w-24 sm:w-36 truncate">{prod.nama}</span>
                                            <div className="flex-1 h-3.5 bg-white/5 border border-white/5 rounded-full overflow-hidden relative">
                                                <div 
                                                    style={{ width: `${percent}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                                ></div>
                                            </div>
                                            <span className="text-cyan-400 font-extrabold text-xs sm:text-sm w-20 text-right flex-shrink-0">
                                                {prod.monthlySales} Unit/bln
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Card Stok */}
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60">
                        {/* Header */}
                        <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/2">
                            <h3 className="font-bold text-white flex items-center gap-2.5 text-sm sm:text-base">
                                <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <i className="fas fa-warehouse text-xs sm:text-sm"></i>
                                </div>
                                Tabel Manajemen Stok <span className="text-xs text-slate-400 font-medium">({inventory.length}/30 Produk)</span>
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search Bar */}
                                <div className="relative">
                                    <i className="fas fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs sm:text-sm"></i>
                                    <input
                                        type="text"
                                        placeholder="Cari produk..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm w-full sm:w-64 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-white transition-all"
                                    />
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => {
                                            if (inventory.length >= 30) {
                                                showToast('Batas maksimal 30 produk telah tercapai', 'error');
                                            } else {
                                                setShowModal(true);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-white/10 ${
                                            inventory.length >= 30
                                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed border-slate-600'
                                                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white shadow-indigo-500/20'
                                        }`}
                                    >
                                        <i className="fas fa-plus text-xs"></i>
                                        Tambah Barang {inventory.length >= 30 && '(Penuh)'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table - Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/1 border-b border-white/10">
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Produk</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Stok</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Min. Stok</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Jual</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Modal</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi Cepat</th>
                                        {isOwner && <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-12"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan={isOwner ? 7 : 6} className="text-center py-16">
                                                <div className="text-slate-500">
                                                    <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <i className="fas fa-box-open text-2xl"></i>
                                                    </div>
                                                    <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInventory.map((item) => {
                                            const minStock = item.min_stock || 5;
                                            const isLowStock = item.stock <= minStock;
                                            return (
                                                <tr 
                                                    key={item.id} 
                                                    className={`transition-colors duration-150 ${
                                                        isLowStock 
                                                            ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500' 
                                                            : 'hover:bg-white/5'
                                                    }`}
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-slate-400">
                                                                <i className="fas fa-tag text-xs"></i>
                                                            </div>
                                                            <span className="font-semibold text-slate-200 text-sm">{item.nama}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {isLowStock ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold">
                                                                <i className="fas fa-exclamation-triangle text-[10px]"></i>
                                                                {formatNumberWithDots(item.stock)} / {formatNumberWithDots(minStock)}
                                                            </span>
                                                        ) : (
                                                            <span className="font-bold text-slate-200 text-sm">{formatNumberWithDots(item.stock)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-slate-400 text-sm font-medium">{formatNumberWithDots(minStock)}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-bold text-slate-200 text-sm">{formatRupiah(item.harga_jual)}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="text-slate-400 text-sm font-semibold">{formatRupiah(item.average_cost)}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openActionModal('tambah', item)}
                                                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-2 rounded-xl text-xs font-medium hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center justify-center w-8 h-8"
                                                                title="Tambah Stok"
                                                            >
                                                                <i className="fas fa-plus"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal('kurang', item)}
                                                                className="bg-amber-500/10 text-amber-400 border border-amber-500/20 p-2 rounded-xl text-xs font-medium hover:bg-amber-600 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center justify-center w-8 h-8"
                                                                title="Kurangi Stok"
                                                            >
                                                                <i className="fas fa-minus"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal('modal', item)}
                                                                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 p-2 rounded-xl text-xs font-medium hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center justify-center w-8 h-8"
                                                                title="Update Modal"
                                                            >
                                                                <i className="fas fa-chart-line"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal('harga', item)}
                                                                className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 p-2 rounded-xl text-xs font-medium hover:bg-cyan-600 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center justify-center w-8 h-8"
                                                                title="Update Harga"
                                                            >
                                                                <i className="fas fa-tag"></i>
                                                            </button>
                                                            {isOwner && (
                                                                <button
                                                                    onClick={() => openMinStockModal(item)}
                                                                    className="bg-slate-700/50 text-slate-300 border border-slate-600/50 p-2 rounded-xl text-xs font-medium hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center w-8 h-8"
                                                                    title="Edit Batas Stok"
                                                                >
                                                                    <i className="fas fa-sliders-h"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {isOwner && (
                                                        <td className="px-5 py-3.5">
                                                            <button
                                                                onClick={() => triggerHapusBarang(item.id, item.nama)}
                                                                className="text-red-400/70 hover:text-red-400 hover:scale-105 active:scale-95 transition-all w-8 h-8 flex items-center justify-center"
                                                                title="Hapus Barang"
                                                            >
                                                                <i className="fas fa-trash text-sm"></i>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View - Mobile */}
                        <div className="block md:hidden divide-y divide-white/5 bg-white/1">
                            {filteredInventory.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fas fa-box-open text-xl"></i>
                                    </div>
                                    <p className="text-sm">Tidak ada produk ditemukan</p>
                                </div>
                            ) : (
                                filteredInventory.map((item) => {
                                    const minStock = item.min_stock || 5;
                                    const isLowStock = item.stock <= minStock;
                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`p-4 space-y-4 ${
                                                isLowStock 
                                                    ? 'bg-amber-500/5 border-l-2 border-amber-500' 
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400">
                                                        <i className="fas fa-tag text-xs"></i>
                                                    </div>
                                                    <span className="font-bold text-slate-200 text-sm">{item.nama}</span>
                                                </div>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => triggerHapusBarang(item.id, item.nama)}
                                                        className="text-red-400/80 p-1"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 text-xs bg-white/2 border border-white/5 rounded-xl p-3">
                                                <div>
                                                    <span className="text-slate-400">Stok</span>
                                                    <p className={`font-bold mt-0.5 ${isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                                                        {formatNumberWithDots(item.stock)} / {formatNumberWithDots(minStock)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Harga Jual</span>
                                                    <p className="font-bold text-slate-200 mt-0.5">{formatRupiah(item.harga_jual)}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-slate-400">Modal Rata-rata</span>
                                                    <p className="text-slate-300 font-semibold mt-0.5">{formatRupiah(item.average_cost)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 pt-1.5">
                                                <button
                                                    onClick={() => openActionModal('tambah', item)}
                                                    className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all"
                                                >
                                                    <i className="fas fa-plus mr-1"></i> Tambah
                                                </button>
                                                <button
                                                    onClick={() => openActionModal('kurang', item)}
                                                    className="flex-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600 hover:text-white transition-all"
                                                >
                                                    <i className="fas fa-minus mr-1"></i> Kurang
                                                </button>
                                                <button
                                                    onClick={() => openActionModal('modal', item)}
                                                    className="flex-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    <i className="fas fa-chart-line mr-1"></i> Modal
                                                </button>
                                                <button
                                                    onClick={() => openActionModal('harga', item)}
                                                    className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-2 rounded-xl text-xs font-semibold hover:bg-cyan-600 hover:text-white transition-all"
                                                >
                                                    <i className="fas fa-tag mr-1"></i> Harga
                                                </button>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => openMinStockModal(item)}
                                                        className="flex-1 bg-slate-700/50 text-slate-300 border border-slate-600/50 py-2 rounded-xl text-xs font-semibold hover:bg-slate-600 hover:text-white transition-all"
                                                    >
                                                        <i className="fas fa-sliders-h mr-1"></i> Batas
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Tambah Barang */}
            {showModal && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900/90 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-white">
                        <div className="sticky top-0 bg-[#0c1022]/95 px-6 py-4 border-b border-white/10 flex justify-between items-center z-10">
                            <h3 className="font-extrabold text-lg">Tambah Barang Baru</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleTambahBarang} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Produk *</label>
                                <input
                                    type="text"
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stok Awal *</label>
                                <input
                                    type="text"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batas Minimum Stok</label>
                                <input
                                    type="text"
                                    name="min_stock"
                                    value={formData.min_stock}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">Jika stok mencapai batas ini, akan muncul notifikasi sistem.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Harga Jual (Rp) *</label>
                                <input
                                    type="text"
                                    name="harga_jual"
                                    value={formData.harga_jual}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modal Awal (Rp) *</label>
                                <input
                                    type="text"
                                    name="average_cost"
                                    value={formData.average_cost}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm border border-white/10"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Batas Minimum Stok */}
            {showMinStockModal && selectedProduct && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c1022]/95">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">Edit Batas Minimum Stok</h3>
                            <button onClick={() => setShowMinStockModal(false)} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl">
                                <span className="text-xs text-slate-400 block mb-0.5">Nama Produk:</span>
                                <span className="font-bold text-slate-200 text-sm">{selectedProduct.nama}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batas Minimum Stok Baru</label>
                                <input
                                    type="text"
                                    value={newMinStock}
                                    onChange={(e) => setNewMinStock(formatNumberWithDots(e.target.value))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                    Notifikasi akan muncul jika stok mencapai atau kurang dari {newMinStock} unit.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowMinStockModal(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpdateMinStock}
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm border border-white/10"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modals (Tambah/Kurang/Modal/Harga) */}
            {actionModal.show && actionModal.item && (
                <div className="fixed inset-0 bg-[#070913]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0c1022]/95">
                            <h3 className="font-extrabold text-sm uppercase tracking-wider">
                                {actionModal.type === 'tambah' && 'Tambah Stok'}
                                {actionModal.type === 'kurang' && 'Kurangi Stok'}
                                {actionModal.type === 'harga' && 'Update Harga Jual'}
                                {actionModal.type === 'modal' && 'Update Modal'}
                            </h3>
                            <button onClick={() => setActionModal({ show: false, type: '', item: null })} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
                            <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl">
                                <span className="text-xs text-slate-400 block mb-0.5">Nama Produk:</span>
                                <span className="font-bold text-slate-200 text-sm">{actionModal.item.nama}</span>
                            </div>
                            
                            {(actionModal.type === 'tambah' || actionModal.type === 'kurang') && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Jumlah Stok {actionModal.type === 'tambah' ? 'Tambahan' : 'Dikurangi'}
                                    </label>
                                    <input
                                        type="text"
                                        value={actionData.value1}
                                        onChange={(e) => setActionData({ ...actionData, value1: formatNumberWithDots(e.target.value) })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                        Stok terdaftar saat ini: <strong className="text-slate-200">{actionModal.item.stock} unit</strong>.
                                    </p>
                                </div>
                            )}

                            {actionModal.type === 'harga' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Harga Jual Baru (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        value={actionData.value1}
                                        onChange={(e) => setActionData({ ...actionData, value1: formatNumberWithDots(e.target.value) })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                        required
                                    />
                                </div>
                            )}

                            {actionModal.type === 'modal' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Jumlah Pembelian Baru (unit)
                                        </label>
                                        <input
                                            type="text"
                                            value={actionData.value1}
                                            onChange={(e) => setActionData({ ...actionData, value1: formatNumberWithDots(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            Harga Beli Per Unit Baru (Rp)
                                        </label>
                                        <input
                                            type="text"
                                            value={actionData.value2}
                                            onChange={(e) => setActionData({ ...actionData, value2: formatNumberWithDots(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setActionModal({ show: false, type: '', item: null })}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-sm border border-white/10"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
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
                                    Hapus
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

export default Stok;