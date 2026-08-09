// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const [cashierId, setCashierId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentCashierIds');
    if (stored) {
      try { setRecentIds(JSON.parse(stored)); } catch { setRecentIds([]); }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!cashierId.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { cashierId, password });
      const { token, cashierId: id, isAdmin, name, branch } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('cashierId', id);
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
      localStorage.setItem('userName', name || id);
      localStorage.setItem('branch', branch || 'N/A');
      localStorage.setItem('lastLogin', new Date().toISOString());

      let recent = recentIds.filter(rid => rid !== id);
      recent = [id, ...recent].slice(0, 3);
      localStorage.setItem('recentCashierIds', JSON.stringify(recent));
      setRecentIds(recent);

      toast.success(`Welcome back, ${name || id}!`);
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentClick = (id) => setCashierId(id);
  const clearRecent = () => {
    localStorage.removeItem('recentCashierIds');
    setRecentIds([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/50 transition-all duration-300 hover:shadow-3xl">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-3 shadow-lg shadow-primary-100/50">
            <img src="/dmart.png" alt="D-Mart" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">D-Mart Cashier</h2>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Recent Cashiers */}
        {recentIds.length > 0 && (
          <div className="mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent cashiers</span>
              <button onClick={clearRecent} className="text-xs text-primary hover:text-primary-dark transition font-medium">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentIds.map(id => (
                <button
                  key={id}
                  onClick={() => handleRecentClick(id)}
                  className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm rounded-full hover:bg-primary-200 transition font-medium"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cashier ID</label>
            <div className="relative">
              <input
                type="text"
                value={cashierId}
                onChange={(e) => setCashierId(e.target.value)}
                className="dmart-input pl-10"
                placeholder="Enter your Cashier ID"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dmart-input pl-10 pr-10"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0" />
              <span className="text-sm text-gray-500 group-hover:text-gray-700 transition select-none">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark transition hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="dmart-btn dmart-btn-primary w-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-medium hover:underline transition">
            Register
          </Link>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[10px] text-gray-300">© {new Date().getFullYear()} D-Mart</span>
          <div className="flex gap-3">
            <span className="text-[10px] text-gray-300">🔒 SSL Secure</span>
            <span className="text-[10px] text-gray-300">🛡️ 2FA Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;