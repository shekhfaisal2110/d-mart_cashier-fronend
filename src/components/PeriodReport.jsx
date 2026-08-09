// src/components/PeriodReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth, getWeek, getMonth, getYear, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import toast from 'react-hot-toast';
import { useRefresh } from '../context/RefreshContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const PeriodReport = () => {
  const { refreshKey } = useRefresh();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch reports based on current view
  const fetchReports = async () => {
    const token = localStorage.getItem('token');
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId || !token) return;
    setLoading(true);
    try {
      let startDate, endDate;
      const now = selectedDate;
      if (viewType === 'week') {
        startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else if (viewType === 'month') {
        startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd');
        endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1, 1)), 'yyyy-MM-dd');
      } else if (viewType === 'year') {
        startDate = format(new Date(selectedYear, 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(selectedYear, 11, 31), 'yyyy-MM-dd');
      }
      const res = await axios.get(`${API_BASE}/closing`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { cashierId, startDate, endDate },
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
  }, [refreshKey, viewType, selectedDate, selectedMonth, selectedYear]);

  // Aggregate data based on viewType
  const aggregatedData = useMemo(() => {
    const activeReports = reports.filter(r => !r.isWeekOff);
    if (activeReports.length === 0) return [];

    if (viewType === 'week') {
      // Group by day (Monday–Sunday)
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayReports = activeReports.filter(r => format(new Date(r.date), 'yyyy-MM-dd') === dayStr);
        const totalBill = dayReports.reduce((sum, r) => sum + r.billAmount, 0);
        const totalReceived = dayReports.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalVariance = dayReports.reduce((sum, r) => sum + r.variance, 0);
        const totalExcess = dayReports.reduce((sum, r) => sum + (r.variance > 0 ? r.variance : 0), 0);
        const totalShort = dayReports.reduce((sum, r) => sum + (r.variance < 0 ? r.variance : 0), 0);
        return {
          label: format(day, 'EEE dd'),
          date: day,
          count: dayReports.length,
          totalBill,
          totalReceived,
          totalVariance,
          totalExcess,
          totalShort,
        };
      });
    } else if (viewType === 'month') {
      // Group by week (1st week, 2nd week, etc.)
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekReports = activeReports.filter(r => {
          const d = new Date(r.date);
          return d >= weekStart && d <= weekEnd;
        });
        const totalBill = weekReports.reduce((sum, r) => sum + r.billAmount, 0);
        const totalReceived = weekReports.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalVariance = weekReports.reduce((sum, r) => sum + r.variance, 0);
        const totalExcess = weekReports.reduce((sum, r) => sum + (r.variance > 0 ? r.variance : 0), 0);
        const totalShort = weekReports.reduce((sum, r) => sum + (r.variance < 0 ? r.variance : 0), 0);
        return {
          label: `Week ${index + 1}`,
          date: weekStart,
          count: weekReports.length,
          totalBill,
          totalReceived,
          totalVariance,
          totalExcess,
          totalShort,
        };
      });
    } else if (viewType === 'year') {
      // Group by month
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      return months.map(month => {
        const monthReports = activeReports.filter(r => isSameMonth(new Date(r.date), month));
        const totalBill = monthReports.reduce((sum, r) => sum + r.billAmount, 0);
        const totalReceived = monthReports.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalVariance = monthReports.reduce((sum, r) => sum + r.variance, 0);
        const totalExcess = monthReports.reduce((sum, r) => sum + (r.variance > 0 ? r.variance : 0), 0);
        const totalShort = monthReports.reduce((sum, r) => sum + (r.variance < 0 ? r.variance : 0), 0);
        return {
          label: format(month, 'MMM'),
          date: month,
          count: monthReports.length,
          totalBill,
          totalReceived,
          totalVariance,
          totalExcess,
          totalShort,
        };
      });
    }
    return [];
  }, [reports, viewType, selectedDate, selectedMonth, selectedYear]);

  // Overall totals for summary cards (across the entire period)
  const overallTotals = useMemo(() => {
    const activeReports = reports.filter(r => !r.isWeekOff);
    return activeReports.reduce((acc, r) => {
      acc.totalBill += r.billAmount;
      acc.totalReceived += r.totalAmount;
      acc.totalVariance += r.variance;
      acc.totalExcess += r.variance > 0 ? r.variance : 0;
      acc.totalShort += r.variance < 0 ? r.variance : 0;
      acc.count += 1;
      return acc;
    }, { totalBill: 0, totalReceived: 0, totalVariance: 0, totalExcess: 0, totalShort: 0, count: 0 });
  }, [reports]);

  // Get period label
  const getPeriodLabel = () => {
    if (viewType === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(start, 'dd MMM yyyy')} – ${format(end, 'dd MMM yyyy')}`;
    } else if (viewType === 'month') {
      return format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy');
    } else {
      return selectedYear;
    }
  };

  // Navigation controls
  const goToPrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };
  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };
  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  const goToPrevYear = () => setSelectedYear(selectedYear - 1);
  const goToNextYear = () => setSelectedYear(selectedYear + 1);

  const renderNavigation = () => {
    if (viewType === 'week') {
      return (
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">◀</button>
          <span className="text-sm font-medium min-w-[180px] text-center">{getPeriodLabel()}</span>
          <button onClick={goToNextWeek} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">▶</button>
        </div>
      );
    } else if (viewType === 'month') {
      return (
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">◀</button>
          <span className="text-sm font-medium min-w-[140px] text-center">{getPeriodLabel()}</span>
          <button onClick={goToNextMonth} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">▶</button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <button onClick={goToPrevYear} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">◀</button>
          <span className="text-sm font-medium min-w-[100px] text-center">{getPeriodLabel()}</span>
          <button onClick={goToNextYear} className="dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300">▶</button>
        </div>
      );
    }
  };

  // Download CSV (aggregated)
  const downloadCSV = () => {
    if (aggregatedData.length === 0) {
      toast.error('No data to download');
      return;
    }
    const headers = ['Period', 'Reports', 'Bill', 'Received', 'Variance', 'Excess', 'Short'];
    const rows = aggregatedData.map(row => [
      row.label,
      row.count,
      row.totalBill.toFixed(2),
      row.totalReceived.toFixed(2),
      row.totalVariance.toFixed(2),
      row.totalExcess.toFixed(2),
      Math.abs(row.totalShort).toFixed(2),
    ]);
    // Add overall totals row
    rows.push([
      'TOTALS',
      overallTotals.count,
      overallTotals.totalBill.toFixed(2),
      overallTotals.totalReceived.toFixed(2),
      overallTotals.totalVariance.toFixed(2),
      overallTotals.totalExcess.toFixed(2),
      Math.abs(overallTotals.totalShort).toFixed(2),
    ]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => csvContent += row.join(',') + '\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `period_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  // Download PDF (aggregated)
  const downloadPDF = () => {
    if (aggregatedData.length === 0) {
      toast.error('No data to download');
      return;
    }
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text(`Period Report – ${getPeriodLabel()}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 22);

    const tableData = aggregatedData.map(row => [
      row.label,
      row.count,
      row.totalBill.toFixed(2),
      row.totalReceived.toFixed(2),
      row.totalVariance.toFixed(2),
      row.totalExcess.toFixed(2),
      Math.abs(row.totalShort).toFixed(2),
    ]);
    tableData.push([
      'TOTALS',
      overallTotals.count,
      overallTotals.totalBill.toFixed(2),
      overallTotals.totalReceived.toFixed(2),
      overallTotals.totalVariance.toFixed(2),
      overallTotals.totalExcess.toFixed(2),
      Math.abs(overallTotals.totalShort).toFixed(2),
    ]);

    autoTable(doc, {
      head: [['Period', 'Reports', 'Bill', 'Received', 'Variance', 'Excess', 'Short']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [46, 125, 50] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
      },
    });
    doc.save(`period_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Period Report</h2>

      {/* Controls */}
      <div className="card mb-6">
        <div className="card-body flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">View:</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="dmart-input w-auto min-w-[120px]"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          {renderNavigation()}
          <div className="flex gap-2 ml-auto">
            <button onClick={downloadCSV} className="dmart-btn dmart-btn-success">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button onClick={downloadPDF} className="dmart-btn dmart-btn-primary">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9V3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15h6M9 19h2M9 11h6" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards – overall period */}
      {reports.filter(r => !r.isWeekOff).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Bill</p>
              <p className="text-lg font-bold text-gray-800">₹{overallTotals.totalBill.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Received</p>
              <p className="text-lg font-bold text-gray-800">₹{overallTotals.totalReceived.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover">
            <div className="card-body">
              <p className="text-xs text-gray-500">Net Variance</p>
              <p className={`text-lg font-bold ${overallTotals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {overallTotals.totalVariance > 0 ? '+' : ''}{overallTotals.totalVariance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="card shadow-card-hover border-green-200">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Excess</p>
              <p className="text-lg font-bold text-green-600">+₹{overallTotals.totalExcess.toFixed(2)}</p>
            </div>
          </div>
          <div className="card shadow-card-hover border-red-200">
            <div className="card-body">
              <p className="text-xs text-gray-500">Total Short</p>
              <p className="text-lg font-bold text-red-600">-₹{Math.abs(overallTotals.totalShort).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table – aggregated */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Reports</th>
                  <th>Bill</th>
                  <th>Received</th>
                  <th>Variance</th>
                  <th>Excess</th>
                  <th>Short</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="whitespace-nowrap font-medium">{row.label}</td>
                    <td className="whitespace-nowrap text-center">{row.count}</td>
                    <td className="whitespace-nowrap">₹{row.totalBill.toFixed(2)}</td>
                    <td className="whitespace-nowrap">₹{row.totalReceived.toFixed(2)}</td>
                    <td className={`whitespace-nowrap ${row.totalVariance !== 0 ? 'text-red-600' : ''}`}>
                      {row.totalVariance > 0 ? '+' : ''}{row.totalVariance.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap text-green-600">+₹{row.totalExcess.toFixed(2)}</td>
                    <td className="whitespace-nowrap text-red-600">-₹{Math.abs(row.totalShort).toFixed(2)}</td>
                  </tr>
                ))}
                {aggregatedData.length === 0 && (
                  <tr><td colSpan="7" className="py-8 text-center text-gray-500">No data for this period.</td></tr>
                )}
              </tbody>
              {aggregatedData.length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="text-left">TOTALS</td>
                    <td className="text-center">{overallTotals.count}</td>
                    <td>₹{overallTotals.totalBill.toFixed(2)}</td>
                    <td>₹{overallTotals.totalReceived.toFixed(2)}</td>
                    <td className={`${overallTotals.totalVariance !== 0 ? 'text-red-600' : ''}`}>
                      {overallTotals.totalVariance > 0 ? '+' : ''}{overallTotals.totalVariance.toFixed(2)}
                    </td>
                    <td className="text-green-600">+₹{overallTotals.totalExcess.toFixed(2)}</td>
                    <td className="text-red-600">-₹{Math.abs(overallTotals.totalShort).toFixed(2)}</td>
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

export default PeriodReport;