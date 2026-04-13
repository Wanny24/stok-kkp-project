import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import KaryawanDashboard from './pages/KaryawanDashboard';
import Stok from './pages/Stok';
import UangMasuk from './pages/UangMasuk';
import Profit from './pages/Profit';
import ModalView from './pages/ModalView';
import ActivityLog from './pages/ActivityLog';
import KaryawanManagement from './pages/KaryawanManagement';
import FloatingNotification from './components/FloatingNotification';

// Protected Route component
const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRole && userRole !== allowedRole) {
        return <Navigate to={userRole === 'owner' ? '/owner' : '/karyawan'} />;
    }
    
    return children;
};

function App() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Owner Routes */}
                <Route path="/owner" element={
                    <ProtectedRoute allowedRole="owner">
                        <OwnerDashboard />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/stok" element={
                    <ProtectedRoute allowedRole="owner">
                        <Stok />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/uang-masuk" element={
                    <ProtectedRoute allowedRole="owner">
                        <UangMasuk />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/profit" element={
                    <ProtectedRoute allowedRole="owner">
                        <Profit />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/modal" element={
                    <ProtectedRoute allowedRole="owner">
                        <ModalView />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/logs" element={
                    <ProtectedRoute allowedRole="owner">
                        <ActivityLog />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/owner/karyawan" element={
                    <ProtectedRoute allowedRole="owner">
                        <KaryawanManagement />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                
                {/* Karyawan Routes */}
                <Route path="/karyawan" element={
                    <ProtectedRoute allowedRole="karyawan">
                        <KaryawanDashboard />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                <Route path="/karyawan/stok" element={
                    <ProtectedRoute allowedRole="karyawan">
                        <Stok />
                        <FloatingNotification />
                    </ProtectedRoute>
                } />
                
                <Route path="/" element={<Navigate to={token ? (userRole === 'owner' ? '/owner' : '/karyawan') : '/login'} />} />
            </Routes>
        </Router>
    );
}

export default App;