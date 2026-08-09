// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/auth/verify-token`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(res.data.valid);
      } catch (err) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('cashierId');
        localStorage.removeItem('isAdmin');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="spinner" />
        <p className="text-sm text-gray-500 mt-4 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;