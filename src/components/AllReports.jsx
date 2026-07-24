// src/components/AllReports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useRefresh } from '../context/RefreshContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AllReports = () => {
  const { refreshKey } = useRefresh();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/closing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { cashierId },
      });
      setReports(res.data);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshKey]);

  // Filtering
  const filtered = reports.filter(r => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      r.cashierId.toLowerCase().includes(searchLower) ||
      (r.name && r.name.toLowerCase().includes(searchLower));
    const matchesDate = filterDate ? format(new Date(r.date), 'yyyy-MM-dd') === filterDate : true;
    const matchesStatus = filterStatus === 'all' ? true :
      (filterStatus === 'short' ? r.isShort :
       filterStatus === 'excess' ? r.isExcess : !r.isShort && !r.isExcess);
    return matchesSearch && matchesDate && matchesStatus;
  });

  // Summary totals
  const totalBill = filtered.reduce((sum, r) => sum + r.billAmount, 0);
  const totalReceived = filtered.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalVariance = filtered.reduce((sum, r) => sum + r.variance, 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterStatus('all');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Closing Reports</h2>
          <p className="text-sm text-gray-500">View and filter all your closing entries.</p>
        </div>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {filtered.length} entries
        </span>
      </div>

      {/* Professional Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/40 focus:border-red-500 text-sm transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/40 focus:border-red-500 text-sm transition-all appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="short">Short</option>
              <option value="excess">Excess</option>
              <option value="match">Match</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchReports}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || filterDate || filterStatus !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Active filters:</span>
            {searchTerm && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filterDate && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                Date: {filterDate}
                <button onClick={() => setFilterDate('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('all')} className="hover:text-blue-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Bill</p>
          <p className="text-xl font-bold text-gray-800">₹{totalBill.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Received</p>
          <p className="text-xl font-bold text-gray-800">₹{totalReceived.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Net Variance</p>
          <p className={`text-xl font-bold ${totalVariance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {totalVariance > 0 ? `+${totalVariance.toFixed(2)}` : totalVariance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Entries</p>
          <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r._id} className={r.variance !== 0 ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{r.cashierId}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.name || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{r.billAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{r.cash.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{r.upi.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">₹{r.card.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">₹{r.totalAmount.toFixed(2)}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${r.variance !== 0 ? 'text-red-600' : ''}`}>
                    {r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.isShort ? 'bg-red-100 text-red-700' :
                      r.isExcess ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">No reports found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllReports;