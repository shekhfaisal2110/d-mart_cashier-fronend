// src/components/ClosingReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useRefresh } from '../context/RefreshContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NOTIFY_THRESHOLD = 1;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ---------- Icons ----------
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const PdfIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 19h2M9 11h6" />
  </svg>
);

// ---------- Main Component ----------
const ClosingReport = () => {
  const { refresh } = useRefresh();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    billAmount: '',
    cash: '',
    upi: '',
    card: '',
    excess: '',
    short: '',
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [computedBill, setComputedBill] = useState(0);
  const [filterType, setFilterType] = useState('range');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Compute totals from reports
  const totals = useMemo(() => {
    return reports.reduce(
      (acc, r) => {
        acc.totalBill += r.billAmount;
        acc.totalReceived += r.totalAmount;
        acc.totalVariance += r.variance;
        acc.totalExcess += r.variance > 0 ? r.variance : 0;
        acc.totalShort += r.variance < 0 ? Math.abs(r.variance) : 0;
        acc.count += 1;
        return acc;
      },
      { totalBill: 0, totalReceived: 0, totalVariance: 0, totalExcess: 0, totalShort: 0, count: 0 }
    );
  }, [reports]);

  // Compute total and bill
  useEffect(() => {
    const cash = parseFloat(formData.cash) || 0;
    const upi = parseFloat(formData.upi) || 0;
    const card = parseFloat(formData.card) || 0;
    const total = cash + upi + card;
    setTotalAmount(total);

    const bill = parseFloat(formData.billAmount);
    if (!isNaN(bill) && bill > 0) {
      setComputedBill(bill);
    } else {
      const excess = parseFloat(formData.excess) || 0;
      const short = parseFloat(formData.short) || 0;
      const computed = total + short - excess;
      setComputedBill(computed > 0 ? computed : 0);
    }
  }, [formData]);

  // Fetch reports
  const fetchReports = async () => {
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) {
      toast.error('Cashier ID not found. Please login again.');
      return;
    }
    setLoading(true);
    try {
      let params = { cashierId };
      if (filterType === 'range') {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (filterType === 'month') {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else if (filterType === 'year') {
        params.year = selectedYear;
      }
      const res = await axios.get(`${API_BASE}/closing`, { params });
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
  }, [filterType, startDate, endDate, selectedMonth, selectedYear]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = totalAmount;
    if (total === 0) {
      toast.error('Total amount (Cash+UPI+Card) must be > 0');
      return;
    }
    const bill = parseFloat(formData.billAmount) || computedBill;
    if (bill <= 0) {
      toast.error('Bill amount must be positive. Please enter or adjust excess/short.');
      return;
    }
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) {
      toast.error('Cashier ID not found. Please login again.');
      return;
    }

    const data = {
      date: new Date(formData.date),
      billAmount: bill,
      cash: parseFloat(formData.cash) || 0,
      upi: parseFloat(formData.upi) || 0,
      card: parseFloat(formData.card) || 0,
      totalAmount: total,
      cashierId,
    };

    try {
      const res = await axios.post(`${API_BASE}/closing`, data);
      const report = res.data;
      toast.success('Report saved successfully');

      if (report.varianceAbs >= NOTIFY_THRESHOLD && !report.notified) {
        toast.error(`⚠️ Variance ${report.varianceAbs} exceeds ${NOTIFY_THRESHOLD}! Notification sent.`);
        await axios.put(`${API_BASE}/closing/${report._id}`, { notified: true, cashierId });
      }
      if (report.varianceAbs >= 200 && !report.charged) {
        toast.error(`💳 Charge applied! Variance ${report.varianceAbs} exceeds 200.`);
        await axios.put(`${API_BASE}/closing/${report._id}`, { charged: true, cashierId });
      }
      if (report.varianceAbs >= 500) {
        toast.success(`🎉 Bonus reward! Variance ${report.varianceAbs} exceeds 500!`);
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        billAmount: '',
        cash: '',
        upi: '',
        card: '',
        excess: '',
        short: '',
      });
      await fetchReports();
      refresh();
    } catch (err) {
      toast.error('Failed to save report');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) {
      toast.error('Cashier ID not found. Please login again.');
      return;
    }
    try {
      await axios.delete(`${API_BASE}/closing/${id}`, { params: { cashierId } });
      toast.success('Report deleted');
      await fetchReports();
      refresh();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Download CSV (includes totals)
  const downloadCSV = () => {
    if (reports.length === 0) {
      toast.error('No data to download');
      return;
    }
    const headers = ['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Notified', 'Charged'];
    const rows = reports.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.billAmount,
      r.cash,
      r.upi,
      r.card,
      r.totalAmount,
      r.variance,
      r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match',
      r.notified ? 'Yes' : 'No',
      r.charged ? 'Yes' : 'No',
    ]);
    // Add totals row
    rows.push([
      'TOTALS',
      totals.totalBill.toFixed(2),
      '',
      '',
      '',
      totals.totalReceived.toFixed(2),
      totals.totalVariance.toFixed(2),
      `Excess: ${totals.totalExcess.toFixed(2)}, Short: ${totals.totalShort.toFixed(2)}`,
      '',
      '',
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => csvContent += row.join(',') + '\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `closing_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  // Download PDF (includes totals)
  const downloadPDF = () => {
    if (reports.length === 0) {
      toast.error('No data to download');
      return;
    }
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('D-Mart Cashier - Closing Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 22);

    const tableData = reports.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.billAmount.toFixed(2),
      r.cash.toFixed(2),
      r.upi.toFixed(2),
      r.card.toFixed(2),
      r.totalAmount.toFixed(2),
      r.variance.toFixed(2),
      r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match',
      r.notified ? 'Yes' : 'No',
      r.charged ? 'Yes' : 'No',
    ]);

    // Add totals row
    tableData.push([
      'TOTALS',
      totals.totalBill.toFixed(2),
      '',
      '',
      '',
      totals.totalReceived.toFixed(2),
      totals.totalVariance.toFixed(2),
      `Excess: ${totals.totalExcess.toFixed(2)}, Short: ${totals.totalShort.toFixed(2)}`,
      '',
      '',
    ]);

    autoTable(doc, {
      head: [['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Notified', 'Charged']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: function(data) {
        // Add summary at the end
      },
    });

    doc.save(`closing_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF downloaded');
  };

  // ---------- Render ----------
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Closing Report</h2>

      {/* Summary Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Bill</p>
            <p className="text-lg font-bold text-gray-800">₹{totals.totalBill.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Received</p>
            <p className="text-lg font-bold text-gray-800">₹{totals.totalReceived.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Net Variance</p>
            <p className={`text-lg font-bold ${totals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
            <p className="text-xs text-gray-500">Total Excess</p>
            <p className="text-lg font-bold text-green-600">+₹{totals.totalExcess.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-red-200">
            <p className="text-xs text-gray-500">Total Short</p>
            <p className="text-lg font-bold text-red-600">-₹{totals.totalShort.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-auto flex-1 min-w-[130px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">Filter by</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
            >
              <option value="range">Date Range</option>
              <option value="month">Month (25th–25th)</option>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap mt-2 sm:mt-0">
            <button
              onClick={fetchReports}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Apply
            </button>
            <button
              onClick={downloadCSV}
              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-1"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={downloadPDF}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-1"
            >
              <PdfIcon />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Daily Closing</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Bill (optional)</label>
            <input
              type="number"
              name="billAmount"
              value={formData.billAmount}
              onChange={handleInputChange}
              placeholder="Auto"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Cash</label>
            <input
              type="number"
              name="cash"
              value={formData.cash}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">UPI</label>
            <input
              type="number"
              name="upi"
              value={formData.upi}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Card</label>
            <input
              type="number"
              name="card"
              value={formData.card}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Excess</label>
            <input
              type="number"
              name="excess"
              value={formData.excess}
              onChange={handleInputChange}
              placeholder="+ excess"
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/40 bg-green-50"
              step="0.01"
              min="0"
            />
            <p className="text-xs text-green-600 mt-0.5">Decreases bill</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Short</label>
            <input
              type="number"
              name="short"
              value={formData.short}
              onChange={handleInputChange}
              placeholder="- short"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500/40 bg-red-50"
              step="0.01"
              min="0"
            />
            <p className="text-xs text-red-600 mt-0.5">Increases bill</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Total (auto)</label>
            <input
              type="text"
              value={totalAmount.toFixed(2)}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Computed Bill</label>
            <input
              type="text"
              value={computedBill.toFixed(2)}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 font-semibold"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <PlusIcon /> Save Report
            </button>
          </div>
        </form>
      </div>

      {/* Reports Table with Totals Row */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="min-w-[700px] sm:min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notif.</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charge</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => {
                  const isRed = report.variance !== 0;
                  return (
                    <tr key={report._id} className={isRed ? 'bg-red-50' : ''}>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {format(new Date(report.date), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {report.billAmount.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {report.cash.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {report.upi.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {report.card.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                        {report.totalAmount.toFixed(2)}
                      </td>
                      <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap font-medium ${isRed ? 'text-red-600' : 'text-gray-700'}`}>
                        {report.variance > 0 ? `+${report.variance.toFixed(2)}` : report.variance.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                          report.isShort ? 'bg-red-100 text-red-700' :
                          report.isExcess ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.isShort ? 'Short' : report.isExcess ? 'Excess' : 'Match'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                        {report.notified ? '✅' : '❌'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center">
                        {report.charged ? '✅' : '❌'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(report._id)}
                          className="text-red-600 hover:text-red-800 transition text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals Row */}
                {reports.length > 0 && (
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">TOTALS</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                      ₹{totals.totalBill.toFixed(2)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                      ₹{totals.totalReceived.toFixed(2)}
                    </td>
                    <td className={`px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap ${totals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700">
                      Excess: +₹{totals.totalExcess.toFixed(2)}, Short: -₹{totals.totalShort.toFixed(2)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-700"></td>
                  </tr>
                )}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center text-gray-500 text-sm">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosingReport;