import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function ModalView() {
    const [inventory, setInventory] = useState([]);
    const [totalModal, setTotalModal] = useState(0);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await API.get('/inventory');
            setInventory(response.data);
            const total = response.data.reduce((sum, item) => sum + (item.stock * item.average_cost), 0);
            setTotalModal(total);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    return (
        <div className="min-h-screen bg-transparent lg:flex">
            {/* Sidebar Navigation */}
            <Sidebar role={userRole} activeMenu="modal" />
            
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

                    {/* Card Modal */}
                    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                        <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-white/2">
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <i className="fas fa-hand-holding-usd text-sm"></i>
                                </div>
                                Total Modal Investasi (Average Cost)
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/1 border-b border-white/10">
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Barang</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Modal Rata-rata</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Terdaftar</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Akumulasi Modal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {inventory.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-16">
                                                <div className="text-slate-500">
                                                    <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <i className="fas fa-box-open text-xl"></i>
                                                    </div>
                                                    <p className="text-sm font-medium">Tidak ada data inventaris</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        inventory.map((item) => {
                                            const total = item.stock * item.average_cost;
                                            return (
                                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-5 py-3.5 font-semibold text-slate-200">
                                                        <div className="flex items-center gap-2">
                                                            <i className="fas fa-cube text-indigo-400 text-xs"></i> 
                                                            <span>{item.nama}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-300 font-medium">{formatRupiah(item.average_cost)}</td>
                                                    <td className="px-5 py-3.5 text-slate-400 font-bold">{item.stock}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                                                            {formatRupiah(total)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 text-right border-t border-white/10 bg-white/2">
                            <div className="text-base sm:text-lg font-bold text-slate-300">
                                Total Modal Keseluruhan: <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent text-2xl font-extrabold ml-2">{formatRupiah(totalModal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalView;