// src/components/AllReports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useRefresh } from '../context/RefreshContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AllReports = () => {
  const { refreshKey } = useRefresh();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('range');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch reports
  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId || !token) return;
    setLoading(true);
    try {
      let params = { cashierId };
      if (filterType === 'range') {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (filterType === 'month') {
        // Custom period: 26th of previous month to 25th of selected month
        const start = new Date(selectedYear, selectedMonth - 2, 26);
        const end = new Date(selectedYear, selectedMonth - 1, 25);
        params.startDate = format(start, 'yyyy-MM-dd');
        params.endDate = format(end, 'yyyy-MM-dd');
      } else if (filterType === 'year') {
        params.year = selectedYear;
      }
      const res = await axios.get(`${API_BASE}/closing`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
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
    // eslint-disable-next-line
  }, [refreshKey, filterType, startDate, endDate, selectedMonth, selectedYear]);

  // Client-side filtering (search + status) – also filter out week‑off? No, we show them but exclude from totals.
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        r.cashierId.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' ? true :
        (filterStatus === 'short' ? r.isShort :
         filterStatus === 'excess' ? r.isExcess : !r.isShort && !r.isExcess);
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  // Totals – EXCLUDING week‑off days
  const totals = useMemo(() => {
    const activeReports = filteredReports.filter(r => !r.isWeekOff);
    return activeReports.reduce((acc, r) => {
      acc.totalBill += r.billAmount;
      acc.totalReceived += r.totalAmount;
      acc.totalVariance += r.variance;
      acc.totalExcess += r.variance > 0 ? r.variance : 0;
      acc.totalShort += r.variance < 0 ? r.variance : 0;
      acc.count += 1;
      return acc;
    }, { totalBill: 0, totalReceived: 0, totalVariance: 0, totalExcess: 0, totalShort: 0, count: 0 });
  }, [filteredReports]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterType('range');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
  };

  // Download CSV (includes Reason column)
  const downloadCSV = () => {
    if (filteredReports.length === 0) {
      toast.error('No data to download');
      return;
    }
    const headers = ['Date', 'Cashier ID',  'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged'];
    const rows = filteredReports.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.cashierId,
      r.isWeekOff ? '—' : r.billAmount,
      r.isWeekOff ? '—' : r.cash,
      r.isWeekOff ? '—' : r.upi,
      r.isWeekOff ? '—' : r.card,
      r.isWeekOff ? '—' : r.totalAmount,
      r.isWeekOff ? '—' : r.variance,
      r.isWeekOff ? 'Week Off' : (r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'),
      r.reason || '—',
      r.notified ? 'Yes' : 'No',
      r.charged ? 'Yes' : 'No',
    ]);
    // Totals for active reports only (excluding week‑off)
    const activeTotals = filteredReports.filter(r => !r.isWeekOff).reduce((acc, r) => {
      acc.bill += r.billAmount;
      acc.total += r.totalAmount;
      acc.variance += r.variance;
      acc.excess += r.variance > 0 ? r.variance : 0;
      acc.short += r.variance < 0 ? r.variance : 0;
      return acc;
    }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
    rows.push([
      'TOTALS (active)',
      '',
      '',
      activeTotals.bill.toFixed(2),
      '',
      '',
      '',
      activeTotals.total.toFixed(2),
      activeTotals.variance.toFixed(2),
      `Excess: ${activeTotals.excess.toFixed(2)}, Short: ${Math.abs(activeTotals.short).toFixed(2)}`,
      '',
      '',
      '',
    ]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => csvContent += row.join(',') + '\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_reports_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  // Download PDF (includes Reason column)
  const downloadPDF = () => {
    if (filteredReports.length === 0) {
      toast.error('No data to download');
      return;
    }
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('D-Mart Cashier - All Reports', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 22);

    const tableData = filteredReports.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.cashierId,
      r.isWeekOff ? '—' : r.billAmount.toFixed(2),
      r.isWeekOff ? '—' : r.cash.toFixed(2),
      r.isWeekOff ? '—' : r.upi.toFixed(2),
      r.isWeekOff ? '—' : r.card.toFixed(2),
      r.isWeekOff ? '—' : r.totalAmount.toFixed(2),
      r.isWeekOff ? '—' : r.variance.toFixed(2),
      r.isWeekOff ? 'Week Off' : (r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'),
      r.reason || '—',
      r.notified ? 'Yes' : 'No',
      r.charged ? 'Yes' : 'No',
    ]);
    const activeTotals = filteredReports.filter(r => !r.isWeekOff).reduce((acc, r) => {
      acc.bill += r.billAmount;
      acc.total += r.totalAmount;
      acc.variance += r.variance;
      acc.excess += r.variance > 0 ? r.variance : 0;
      acc.short += r.variance < 0 ? r.variance : 0;
      return acc;
    }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
    tableData.push([
      'TOTALS (active)',
      '',
      '',
      activeTotals.bill.toFixed(2),
      '',
      '',
      '',
      activeTotals.total.toFixed(2),
      activeTotals.variance.toFixed(2),
      `Excess: ${activeTotals.excess.toFixed(2)}, Short: ${Math.abs(activeTotals.short).toFixed(2)}`,
      '',
      '',
      '',
    ]);

    autoTable(doc, {
      head: [['Date', 'ID', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [46, 125, 50] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 16 },
        7: { cellWidth: 16 },
        8: { cellWidth: 18 },
        9: { cellWidth: 20 },
        10: { cellWidth: 22 },
        11: { cellWidth: 16 },
        12: { cellWidth: 16 },
      },
    });
    doc.save(`all_reports_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">All Closing Reports</h2>
          <p className="text-sm text-gray-500">View and filter all your closing entries.</p>
        </div>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {filteredReports.length} entries
        </span>
      </div>

      {/* Professional Filter Bar */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-auto flex-1 min-w-[130px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">Filter by</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="dmart-input"
              >
                <option value="range">Date Range</option>
                <option value="month">Month (26th–25th)</option>
                <option value="year">Year</option>
              </select>
            </div>

            {filterType === 'range' && (
              <>
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="dmart-input"
                  />
                </div>
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="dmart-input"
                  />
                </div>
              </>
            )}

            {filterType === 'month' && (
              <>
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="dmart-input"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-auto flex-1 min-w-[100px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="dmart-input"
                  />
                </div>
              </>
            )}

            {filterType === 'year' && (
              <div className="w-full sm:w-auto flex-1 min-w-[100px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="dmart-input"
                />
              </div>
            )}

            <div className="w-full sm:w-auto flex-1 min-w-[130px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="dmart-input"
              >
                <option value="all">All Status</option>
                <option value="short">Short</option>
                <option value="excess">Excess</option>
                <option value="match">Match</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap mt-2 sm:mt-0">
              <button onClick={fetchReports} className="dmart-btn dmart-btn-primary">Apply</button>
              <button onClick={downloadCSV} className="dmart-btn dmart-btn-success">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={downloadPDF} className="dmart-btn dmart-btn-primary">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9V3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15h6M9 19h2M9 11h6" />
                </svg>
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={clearFilters} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">
                Clear
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {(searchTerm || filterStatus !== 'all' || filterType !== 'range') && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Active filters:</span>
              {searchTerm && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {filterType !== 'range' && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                  Filter: {filterType}
                  <button onClick={() => setFilterType('range')} className="hover:text-blue-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards – only active days */}
      {filteredReports.filter(r => !r.isWeekOff).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Bill</p>
              <p className="text-lg font-bold text-gray-800">₹{totals.totalBill.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Received</p>
              <p className="text-lg font-bold text-gray-800">₹{totals.totalReceived.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Net Variance</p>
              <p className={`text-lg font-bold ${totals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="card shadow-card-hover border-green-200">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Excess</p>
              <p className="text-lg font-bold text-green-600">+₹{totals.totalExcess.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover border-red-200">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Short</p>
              <p className="text-lg font-bold text-red-600">-₹{Math.abs(totals.totalShort).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table with Reason column */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner" />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cashier ID</th>
                  <th>Bill</th>
                  <th>Cash</th>
                  <th>UPI</th>
                  <th>Card</th>
                  <th>Total</th>
                  <th>Variance</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Notified</th>
                  <th>Charged</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
                  <tr key={r._id} className={!r.isWeekOff && r.variance !== 0 ? 'bg-red-50' : ''}>
                    <td className="whitespace-nowrap">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                    <td className="whitespace-nowrap font-medium text-primary">{r.cashierId}</td>
                    <td className="whitespace-nowrap">{r.isWeekOff ? '—' : `₹${r.billAmount.toFixed(2)}`}</td>
                    <td className="whitespace-nowrap">{r.isWeekOff ? '—' : `₹${r.cash.toFixed(2)}`}</td>
                    <td className="whitespace-nowrap">{r.isWeekOff ? '—' : `₹${r.upi.toFixed(2)}`}</td>
                    <td className="whitespace-nowrap">{r.isWeekOff ? '—' : `₹${r.card.toFixed(2)}`}</td>
                    <td className="whitespace-nowrap font-semibold">{r.isWeekOff ? '—' : `₹${r.totalAmount.toFixed(2)}`}</td>
                    <td className={`whitespace-nowrap font-medium ${!r.isWeekOff && r.variance !== 0 ? 'text-red-600' : ''}`}>
                      {r.isWeekOff ? '—' : (r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2))}
                    </td>
                    <td className="whitespace-nowrap">
                      {r.isWeekOff ? (
                        <span className="badge badge-neutral">Week Off</span>
                      ) : (
                        <span className={`badge ${r.isShort ? 'badge-danger' : r.isExcess ? 'badge-warning' : 'badge-success'}`}>
                          {r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-sm text-gray-600">{r.reason || '—'}</td>
                    <td className="whitespace-nowrap text-center">{r.notified ? '✅' : '❌'}</td>
                    <td className="whitespace-nowrap text-center">{r.charged ? '✅' : '❌'}</td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr><td colSpan="13" className="py-8 text-center text-gray-500">No reports found.</td></tr>
                )}
              </tbody>
              {filteredReports.filter(r => !r.isWeekOff).length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="text-left">TOTALS (active)</td>
                    <td></td>
                    <td></td>
                    <td>₹{totals.totalBill.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>₹{totals.totalReceived.toFixed(2)}</td>
                    <td className={`${totals.totalVariance !== 0 ? 'text-red-600' : ''}`}>
                      {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="text-green-600">+₹{totals.totalExcess.toFixed(2)}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-600">-₹{Math.abs(totals.totalShort).toFixed(2)}</span>
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllReports;