import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function Stok() {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMinStockModal, setShowMinStockModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newMinStock, setNewMinStock] = useState(5);
    const [formData, setFormData] = useState({
        nama: '',
        harga_jual: '',
        stock: '',
        average_cost: '',
        min_stock: 5
    });
    
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        const filtered = inventory.filter(item =>
            item.nama.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInventory(filtered);
    }, [searchTerm, inventory]);

    const fetchInventory = async () => {
        try {
            const response = await API.get('/inventory');
            setInventory(response.data);
            setFilteredInventory(response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleTambahBarang = async (e) => {
        e.preventDefault();
        try {
            await API.post('/inventory', {
                nama: formData.nama,
                stock: parseInt(formData.stock),
                harga_jual: parseFloat(formData.harga_jual),
                average_cost: parseFloat(formData.average_cost),
                min_stock: parseInt(formData.min_stock)
            });
            fetchInventory();
            setShowModal(false);
            setFormData({ nama: '', harga_jual: '', stock: '', average_cost: '', min_stock: 5 });
            alert('Produk berhasil ditambahkan');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menambah produk');
        }
    };

    const handleUpdateMinStock = async () => {
        try {
            await API.put('/inventory/min-stock', {
                id: selectedProduct.id,
                min_stock: newMinStock
            });
            fetchInventory();
            setShowMinStockModal(false);
            alert('Batas minimum stok berhasil diupdate');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal update batas stok');
        }
    };

    const handleTambahStok = async (id, currentStock) => {
        const quantity = parseInt(prompt('Jumlah stok yang ditambahkan:', '1'));
        if (quantity && quantity > 0) {
            try {
                await API.put('/inventory/stock', { id, type: 'tambah', quantity });
                fetchInventory();
                alert('Stok berhasil ditambahkan');
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menambah stok');
            }
        }
    };

    const handleKurangiStok = async (id, currentStock) => {
        const quantity = parseInt(prompt('Jumlah stok yang dikurangi:', '1'));
        if (quantity && quantity > 0) {
            if (currentStock < quantity) {
                alert('Stok tidak cukup');
                return;
            }
            try {
                await API.put('/inventory/stock', { id, type: 'kurang', quantity });
                fetchInventory();
                alert('Stok berhasil dikurangi');
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal mengurangi stok');
            }
        }
    };

    const handleUpdateModal = async (id, currentAvgCost) => {
        const newQuantity = parseInt(prompt('Jumlah pembelian baru:', '5'));
        if (newQuantity && newQuantity > 0) {
            const newUnitCost = parseFloat(prompt('Harga beli per unit (Rp):', currentAvgCost));
            if (newUnitCost && newUnitCost > 0) {
                try {
                    await API.put('/inventory/average-cost', { id, newQuantity, newUnitCost });
                    fetchInventory();
                    alert('Modal berhasil diupdate');
                } catch (error) {
                    alert(error.response?.data?.message || 'Gagal update modal');
                }
            }
        }
    };

    const handleUpdateHargaJual = async (id, currentPrice) => {
        const newPrice = parseFloat(prompt('Harga jual baru (Rp):', currentPrice));
        if (newPrice && newPrice > 0) {
            try {
                await API.put('/inventory/harga-jual', { id, harga_jual: newPrice });
                fetchInventory();
                alert('Harga jual berhasil diupdate');
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal update harga jual');
            }
        }
    };

    const handleHapusBarang = async (id, nama) => {
        if (confirm(`Hapus barang "${nama}" secara permanen?`)) {
            try {
                await API.delete(`/inventory/${id}`);
                fetchInventory();
                alert(`Barang "${nama}" telah dihapus`);
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menghapus barang');
            }
        }
    };

    const openMinStockModal = (item) => {
        setSelectedProduct(item);
        setNewMinStock(item.min_stock || 5);
        setShowMinStockModal(true);
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
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 text-xs sm:text-sm"
                >
                    <i className="fas fa-arrow-left"></i> Kembali
                </button>

                {/* Card Stok */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                <i className="fas fa-warehouse text-blue-600 text-xs sm:text-sm"></i>
                            </div>
                            Manajemen Stok
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm"></i>
                                <input
                                    type="text"
                                    placeholder="Cari produk..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm w-full sm:w-64 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-plus text-xs"></i>
                                    Tambah Barang
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table - Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stok</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min. Stok</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga Jual</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modal</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                    {isOwner && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length === 0 ? (
                                    <tr>
                                        <td colSpan={isOwner ? 7 : 6} className="text-center py-12">
                                            <div className="text-gray-400">
                                                <i className="fas fa-box-open text-3xl sm:text-4xl mb-2 block"></i>
                                                <p className="text-xs sm:text-sm">Tidak ada produk ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInventory.map((item) => {
                                        const minStock = item.min_stock || 5;
                                        const isLowStock = item.stock <= minStock;
                                        return (
                                            <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-amber-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <i className="fas fa-tag text-gray-500 text-xs"></i>
                                                        </div>
                                                        <span className="font-medium text-gray-800 text-sm">{item.nama}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
                                                            <i className="fas fa-exclamation-triangle text-xs"></i>
                                                            {item.stock} / {minStock}
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-gray-800 text-sm">{item.stock}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-600 text-sm">{minStock}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-gray-800 text-sm">{formatRupiah(item.harga_jual)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-600 text-sm">{formatRupiah(item.average_cost)}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => handleTambahStok(item.id, item.stock)}
                                                            className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-green-600 hover:text-white transition-all"
                                                            title="Tambah Stok"
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleKurangiStok(item.id, item.stock)}
                                                            className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-amber-600 hover:text-white transition-all"
                                                            title="Kurangi Stok"
                                                        >
                                                            <i className="fas fa-minus"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateModal(item.id, item.average_cost)}
                                                            className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-600 hover:text-white transition-all"
                                                            title="Update Modal"
                                                        >
                                                            <i className="fas fa-chart-line"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateHargaJual(item.id, item.harga_jual)}
                                                            className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-purple-600 hover:text-white transition-all"
                                                            title="Update Harga"
                                                        >
                                                            <i className="fas fa-tag"></i>
                                                        </button>
                                                        {isOwner && (
                                                            <button
                                                                onClick={() => openMinStockModal(item)}
                                                                className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium hover:bg-gray-600 hover:text-white transition-all"
                                                                title="Edit Batas Stok"
                                                            >
                                                                <i className="fas fa-sliders-h"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                {isOwner && (
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleHapusBarang(item.id, item.nama)}
                                                            className="text-red-400 hover:text-red-600 transition-all"
                                                            title="Hapus Barang"
                                                        >
                                                            <i className="fas fa-trash"></i>
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
                    <div className="block md:hidden divide-y divide-gray-100">
                        {filteredInventory.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fas fa-box-open text-3xl mb-2 block"></i>
                                <p className="text-sm">Tidak ada produk ditemukan</p>
                            </div>
                        ) : (
                            filteredInventory.map((item) => {
                                const minStock = item.min_stock || 5;
                                const isLowStock = item.stock <= minStock;
                                return (
                                    <div key={item.id} className={`p-4 space-y-3 ${isLowStock ? 'bg-amber-50' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                                                    <i className="fas fa-tag text-gray-500 text-sm"></i>
                                                </div>
                                                <span className="font-semibold text-gray-800">{item.nama}</span>
                                            </div>
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleHapusBarang(item.id, item.nama)}
                                                    className="text-red-400"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Stok</span>
                                                <p className={`font-semibold ${isLowStock ? 'text-amber-600' : 'text-gray-800'}`}>
                                                    {item.stock} / {minStock}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Harga Jual</span>
                                                <p className="font-semibold text-gray-800">{formatRupiah(item.harga_jual)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Modal</span>
                                                <p className="text-gray-600">{formatRupiah(item.average_cost)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <button
                                                onClick={() => handleTambahStok(item.id, item.stock)}
                                                className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-sm font-medium hover:bg-green-600 hover:text-white transition-all"
                                            >
                                                <i className="fas fa-plus mr-1"></i> Tambah
                                            </button>
                                            <button
                                                onClick={() => handleKurangiStok(item.id, item.stock)}
                                                className="flex-1 bg-amber-50 text-amber-600 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 hover:text-white transition-all"
                                            >
                                                <i className="fas fa-minus mr-1"></i> Kurang
                                            </button>
                                            <button
                                                onClick={() => handleUpdateModal(item.id, item.average_cost)}
                                                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <i className="fas fa-chart-line mr-1"></i> Modal
                                            </button>
                                            <button
                                                onClick={() => handleUpdateHargaJual(item.id, item.harga_jual)}
                                                className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-xl text-sm font-medium hover:bg-purple-600 hover:text-white transition-all"
                                            >
                                                <i className="fas fa-tag mr-1"></i> Harga
                                            </button>
                                            {isOwner && (
                                                <button
                                                    onClick={() => openMinStockModal(item)}
                                                    className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-600 hover:text-white transition-all"
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

            {/* Modal Tambah Barang */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Tambah Barang Baru</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleTambahBarang} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                                <input
                                    type="text"
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal *</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batas Minimum Stok</label>
                                <input
                                    type="number"
                                    name="min_stock"
                                    value={formData.min_stock}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                />
                                <p className="text-xs text-gray-400 mt-1">Jika stok mencapai batas ini, akan muncul notifikasi</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp) *</label>
                                <input
                                    type="number"
                                    name="harga_jual"
                                    value={formData.harga_jual}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modal Awal (Rp) *</label>
                                <input
                                    type="number"
                                    name="average_cost"
                                    value={formData.average_cost}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold">Edit Batas Minimum Stok</h3>
                            <button onClick={() => setShowMinStockModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Produk: <span className="font-semibold">{selectedProduct.nama}</span>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batas Minimum Stok</label>
                                <input
                                    type="number"
                                    value={newMinStock}
                                    onChange={(e) => setNewMinStock(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
                                    min="1"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Notifikasi akan muncul jika stok ≤ {newMinStock}
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowMinStockModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpdateMinStock}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
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

export default Stok;