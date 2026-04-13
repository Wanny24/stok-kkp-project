import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../utils/api';
import { formatRupiah } from '../utils/formatRupiah';

function UangMasuk() {
    const [pemasukan, setPemasukan] = useState([]);
    const [jumlah, setJumlah] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isOwner = userRole === 'owner';

    useEffect(() => {
        fetchPemasukan();
    }, []);

    const fetchPemasukan = async () => {
        try {
            const response = await API.get('/keuangan/pemasukan');
            setPemasukan(response.data);
        } catch (error) {
            console.error('Error fetching pemasukan:', error);
        }
    };

    const handleTambahPemasukan = async () => {
        if (!jumlah || parseFloat(jumlah) <= 0) {
            alert('Nominal tidak valid');
            return;
        }
        try {
            await API.post('/keuangan/pemasukan', {
                jumlah: parseFloat(jumlah),
                tanggal,
                keterangan: 'Pemasukan tunai'
            });
            setJumlah('');
            fetchPemasukan();
            alert('Pemasukan berhasil dicatat');
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menambah pemasukan');
        }
    };

    const handleReset = async () => {
        if (confirm('Reset semua data pemasukan? Aksi ini tidak dapat dibatalkan.')) {
            try {
                await API.delete('/keuangan/pemasukan/reset');
                fetchPemasukan();
                alert('Semua data pemasukan direset');
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal reset pemasukan');
            }
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
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <i className="fas fa-coins text-green-600"></i> Pemasukan
                        </h3>
                        {isOwner && (
                            <button
                                onClick={handleReset}
                                className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-all"
                            >
                                <i className="fas fa-trash-alt mr-2"></i> Reset Semua
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        <div className="flex flex-wrap gap-4 mb-8">
                            <input
                                type="number"
                                placeholder="Nominal (Rp)"
                                value={jumlah}
                                onChange={(e) => setJumlah(e.target.value)}
                                className="flex-1 px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
                            />
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleTambahPemasukan}
                                className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all"
                            >
                                Input
                            </button>
                        </div>

                        <h4 className="font-bold mb-4">Riwayat Transaksi</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {pemasukan.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Belum ada pemasukan
                                </div>
                            ) : (
                                pemasukan.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-4 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-money-bill-wave text-green-500 text-xl"></i>
                                            <strong className="text-lg">{formatRupiah(item.jumlah)}</strong>
                                        </div>
                                        <div className="flex items-center gap-4 text-gray-600 text-sm">
                                            <i className="far fa-calendar-alt"></i> {item.tanggal}
                                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                                                {item.keterangan}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UangMasuk;