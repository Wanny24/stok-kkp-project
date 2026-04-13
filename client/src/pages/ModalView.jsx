import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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
                            <i className="fas fa-hand-holding-usd text-blue-600"></i> Total Modal (Average Cost)
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-4 text-gray-600 text-sm font-semibold">Nama Barang</th>
                                    <th className="text-left p-4 text-gray-600 text-sm font-semibold">Modal Rata-rata</th>
                                    <th className="text-left p-4 text-gray-600 text-sm font-semibold">Stok</th>
                                    <th className="text-left p-4 text-gray-600 text-sm font-semibold">Total Modal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => {
                                    const total = item.stock * item.average_cost;
                                    return (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="p-4 font-bold">
                                                <i className="fas fa-cube text-blue-500 mr-2"></i> {item.nama}
                                            </td>
                                            <td className="p-4">{formatRupiah(item.average_cost)}</td>
                                            <td className="p-4">{item.stock}</td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                                    {formatRupiah(total)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 text-right border-t border-gray-100">
                        <div className="text-lg font-bold text-gray-800">
                            Total Keseluruhan Modal: <span className="text-blue-600 text-2xl">{formatRupiah(totalModal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalView;