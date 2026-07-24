import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CashierDashboard from './components/CashierDashboard';
import AdminDashboard from './components/AdminDashboard';
import ClosingReport from './components/ClosingReport';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { RefreshProvider } from './context/RefreshContext';
import { Toaster } from 'react-hot-toast';
import AllReports from './components/AllReports';
import ChangePassword from './components/ChangePassword';
import HowToUse from './components/HowToUse';

const App = () => {
  // Root redirection based on role
  const RootRedirect = () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  };

  return (
    <RefreshProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1A1A2E', color: '#fff', borderRadius: '12px', padding: '16px 20px', fontSize: '14px', fontWeight: '500' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
            <Route index element={<RootRedirect />} />
            <Route path="dashboard" element={<CashierDashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="closing" element={<ClosingReport />} />
            <Route path="all-reports" element={<AllReports />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="how-to-use" element={<HowToUse />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </RefreshProvider>
  );
};

export default App;