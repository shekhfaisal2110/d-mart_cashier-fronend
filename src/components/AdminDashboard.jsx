// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, addMonths, subMonths } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [detailedReports, setDetailedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [downloading, setDownloading] = useState(false);

  // Extract unique branches from summary data
  const branchOptions = useMemo(() => {
    const branches = summaryData
      .map(item => item.branch)
      .filter(branch => branch && branch !== 'N/A' && branch !== 'Unknown');
    return ['all', ...new Set(branches)];
  }, [summaryData]);

  // Fetch aggregated summary
  const fetchSummaryData = async () => {
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/closing/admin/custom-summary`, {
        params: {
          cashierId,
          month: selectedMonth,
          year: selectedYear,
          branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        }
      });
      setSummaryData(res.data);
    } catch (err) {
      toast.error('Failed to fetch summary data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed reports
  const fetchDetailedReports = async () => {
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) return;
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${API_BASE}/closing/admin/custom-details`, {
        params: {
          cashierId,
          month: selectedMonth,
          year: selectedYear,
          branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        }
      });
      setDetailedReports(res.data);
    } catch (err) {
      toast.error('Failed to fetch detailed reports');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
    fetchDetailedReports();
    // eslint-disable-next-line
  }, [selectedMonth, selectedYear, selectedBranch]);

  useEffect(() => {
    setSelectedCashier(null);
  }, [selectedMonth, selectedYear, selectedBranch]);

  const getMonthLabel = () => {
    const start = new Date(selectedYear, selectedMonth - 2, 26);
    const end = new Date(selectedYear, selectedMonth - 1, 25);
    return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`;
  };

  // Overall totals (for summary cards)
  const totalBill = summaryData.reduce((sum, r) => sum + r.totalBill, 0);
  const totalReceived = summaryData.reduce((sum, r) => sum + r.totalReceived, 0);
  const totalExcess = summaryData.reduce((sum, r) => sum + r.totalExcess, 0);
  const totalShort = summaryData.reduce((sum, r) => sum + r.totalShort, 0);

  // Filtered reports based on selected cashier
  const filteredReports = selectedCashier
    ? detailedReports.filter(r => r.cashierId === selectedCashier)
    : detailedReports;

  // Totals for filtered reports
  const filteredTotals = filteredReports.reduce((acc, r) => {
    acc.totalBill += r.billAmount;
    acc.totalReceived += r.totalAmount;
    acc.totalVariance += r.variance;
    acc.totalExcess += r.variance > 0 ? r.variance : 0;
    acc.totalShort += r.variance < 0 ? r.variance : 0;
    acc.count += 1;
    return acc;
  }, { totalBill: 0, totalReceived: 0, totalVariance: 0, totalExcess: 0, totalShort: 0, count: 0 });

  const handleCashierClick = (cashierId) => setSelectedCashier(cashierId);
  const handleBack = () => setSelectedCashier(null);

  // Month navigation
  const goToPrevMonth = () => {
    const newDate = subMonths(new Date(selectedYear, selectedMonth - 1, 1), 1);
    setSelectedMonth(newDate.getMonth() + 1);
    setSelectedYear(newDate.getFullYear());
  };

  const goToNextMonth = () => {
    const newDate = addMonths(new Date(selectedYear, selectedMonth - 1, 1), 1);
    setSelectedMonth(newDate.getMonth() + 1);
    setSelectedYear(newDate.getFullYear());
  };

  const selectedCashierName = summaryData.find(s => s.cashierId === selectedCashier)?.name || selectedCashier;

  // ---- Download CSV ----
  const downloadCSV = () => {
    if (filteredReports.length === 0) {
      toast.error('No data to download');
      return;
    }
    setDownloading(true);
    try {
      const headers = ['Date', 'Cashier ID', 'Name', 'Branch', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Notified', 'Charged'];
      const rows = filteredReports.map(r => [
        format(new Date(r.date), 'yyyy-MM-dd'),
        r.cashierId,
        r.name || 'Unknown',
        r.branch || 'N/A',
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
      // Totals row
      rows.push([
        'TOTALS',
        '',
        '',
        '',
        filteredTotals.totalBill.toFixed(2),
        '',
        '',
        '',
        filteredTotals.totalReceived.toFixed(2),
        filteredTotals.totalVariance.toFixed(2),
        `Excess: ${filteredTotals.totalExcess.toFixed(2)}, Short: ${filteredTotals.totalShort.toFixed(2)}`,
        '',
        '',
      ]);

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => csvContent += row.join(',') + '\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_report_${format(new Date(), 'yyyyMMdd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error('CSV download failed');
    } finally {
      setDownloading(false);
    }
  };

  // ---- Download PDF ----
  const downloadPDF = () => {
    if (filteredReports.length === 0) {
      toast.error('No data to download');
      return;
    }
    setDownloading(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text('D-Mart Admin Report', 14, 15);
      doc.setFontSize(10);
      const branchLabel = selectedBranch !== 'all' ? selectedBranch : 'All Branches';
      const cashierLabel = selectedCashier ? `Cashier: ${selectedCashierName}` : '';
      doc.text(`Period: ${getMonthLabel()} | Branch: ${branchLabel} ${cashierLabel}`, 14, 22);

      const tableData = filteredReports.map(r => [
        format(new Date(r.date), 'yyyy-MM-dd'),
        r.cashierId,
        r.name || 'Unknown',
        r.branch || 'N/A',
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
      // Totals row
      tableData.push([
        'TOTALS',
        '',
        '',
        '',
        filteredTotals.totalBill.toFixed(2),
        '',
        '',
        '',
        filteredTotals.totalReceived.toFixed(2),
        filteredTotals.totalVariance.toFixed(2),
        `Excess: ${filteredTotals.totalExcess.toFixed(2)}, Short: ${filteredTotals.totalShort.toFixed(2)}`,
        '',
        '',
      ]);

      autoTable(doc, {
        head: [['Date', 'ID', 'Name', 'Branch', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Notified', 'Charged']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [46, 125, 50] }, // green theme
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
          8: { cellWidth: 18 },
          9: { cellWidth: 20 },
          10: { cellWidth: 22 },
          11: { cellWidth: 18 },
          12: { cellWidth: 18 },
        },
      });

      doc.save(`admin_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">
            {selectedCashier
              ? `Viewing: ${selectedCashierName} (${selectedCashier})`
              : 'Overview of all cashiers'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadCSV}
            disabled={downloading || filteredReports.length === 0}
            className="dmart-btn dmart-btn-success disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading || filteredReports.length === 0}
            className="dmart-btn dmart-btn-primary disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9V3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15h6M9 19h2M9 11h6" />
            </svg>
            PDF
          </button>
          {selectedCashier && (
            <button
              onClick={handleBack}
              className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Branch Filter */}
      <div className="card mb-6">
        <div className="card-body flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="dmart-input"
            >
              <option value="all">All Branches</option>
              {branchOptions.filter(b => b !== 'all').map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-400">
            {summaryData.length} cashiers
          </div>
        </div>
      </div>

      {/* Summary Cards (only when viewing all) */}
      {!selectedCashier && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Bill</p>
              <p className="text-2xl font-bold">₹{totalBill.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="text-2xl font-bold">₹{totalReceived.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover border-green-200">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Excess</p>
              <p className="text-2xl font-bold text-green-600">+₹{totalExcess.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover border-red-200">
            <div className="card-body">
              <p className="text-sm text-gray-500">Total Short</p>
              <p className="text-2xl font-bold text-red-600">-₹{Math.abs(totalShort).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Summary Table */}
      {!selectedCashier && (
        <div className="card mb-6">
          <div className="card-header flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800">📊 Cashier Summary</h3>
            <span className="text-xs text-gray-400">Click an ID for details</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Total Bill</th>
                    <th>Received</th>
                    <th>Net Var.</th>
                    <th>Excess</th>
                    <th>Short</th>
                    <th>Reports</th>
                    <th>Last Report</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((row) => (
                    <tr key={row.cashierId} onClick={() => handleCashierClick(row.cashierId)} className="cursor-pointer hover:bg-gray-50 transition">
                      <td className="font-medium text-primary hover:underline">{row.cashierId}</td>
                      <td>{row.name}</td>
                      <td>{row.branch || 'N/A'}</td>
                      <td>₹{row.totalBill.toFixed(2)}</td>
                      <td>₹{row.totalReceived.toFixed(2)}</td>
                      <td className={`font-medium ${row.totalVariance !== 0 ? 'text-red-600' : ''}`}>
                        {row.totalVariance > 0 ? `+${row.totalVariance.toFixed(2)}` : row.totalVariance.toFixed(2)}
                      </td>
                      <td className="text-green-600">+₹{row.totalExcess.toFixed(2)}</td>
                      <td className="text-red-600">-₹{Math.abs(row.totalShort).toFixed(2)}</td>
                      <td className="text-center">{row.count}</td>
                      <td>
                        {row.lastReportDate ? format(new Date(row.lastReportDate), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                  {summaryData.length === 0 && (
                    <tr><td colSpan="10" className="py-8 text-center text-gray-500">No reports found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detailed Reports */}
      <div className="card">
        <div className="card-header flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedCashier
              ? `📋 Reports for ${selectedCashierName}`
              : `📋 All Cashiers${selectedBranch !== 'all' ? ` (${selectedBranch})` : ''}`}
            <span className="text-sm font-normal text-gray-500 ml-2">({getMonthLabel()})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition text-sm">◀</button>
            <span className="text-sm font-medium min-w-[120px] text-center">{getMonthLabel()}</span>
            <button onClick={goToNextMonth} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition text-sm">▶</button>
          </div>
        </div>
        {loadingDetails ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    {!selectedCashier && (
                      <>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Branch</th>
                      </>
                    )}
                    <th>Bill</th>
                    <th>Cash</th>
                    <th>UPI</th>
                    <th>Card</th>
                    <th>Total</th>
                    <th>Variance</th>
                    <th>Status</th>
                    <th>Notif.</th>
                    <th>Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report._id} className={report.variance !== 0 ? 'bg-red-50' : ''}>
                      <td>{format(new Date(report.date), 'dd MMM yyyy')}</td>
                      {!selectedCashier && (
                        <>
                          <td className="font-medium">{report.cashierId}</td>
                          <td>{report.name}</td>
                          <td>{report.branch || 'N/A'}</td>
                        </>
                      )}
                      <td>₹{report.billAmount.toFixed(2)}</td>
                      <td>₹{report.cash.toFixed(2)}</td>
                      <td>₹{report.upi.toFixed(2)}</td>
                      <td>₹{report.card.toFixed(2)}</td>
                      <td className="font-semibold">₹{report.totalAmount.toFixed(2)}</td>
                      <td className={`font-medium ${report.variance !== 0 ? 'text-red-600' : ''}`}>
                        {report.variance > 0 ? `+${report.variance.toFixed(2)}` : report.variance.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${
                          report.isShort ? 'badge-danger' :
                          report.isExcess ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {report.isShort ? 'Short' : report.isExcess ? 'Excess' : 'Match'}
                        </span>
                      </td>
                      <td className="text-center">{report.notified ? '✅' : '❌'}</td>
                      <td className="text-center">{report.charged ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr><td colSpan={selectedCashier ? 11 : 14} className="py-8 text-center text-gray-500">No reports found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredReports.length > 0 && (
              <div className="card-footer">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-gray-700">📊 Totals {selectedCashier ? `for ${selectedCashierName}` : 'for all cashiers'}:</span>
                  <div className="flex flex-wrap gap-4">
                    <span className="font-medium">Bill: <span className="text-gray-800">₹{filteredTotals.totalBill.toFixed(2)}</span></span>
                    <span className="font-medium">Received: <span className="text-gray-800">₹{filteredTotals.totalReceived.toFixed(2)}</span></span>
                    <span className={`font-medium ${filteredTotals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      Net: {filteredTotals.totalVariance > 0 ? '+' : ''}{filteredTotals.totalVariance.toFixed(2)}
                    </span>
                    <span className="font-medium text-green-600">Excess: +₹{filteredTotals.totalExcess.toFixed(2)}</span>
                    <span className="font-medium text-red-600">Short: -₹{Math.abs(filteredTotals.totalShort).toFixed(2)}</span>
                    <span className="font-medium text-gray-700">Reports: {filteredTotals.count}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;