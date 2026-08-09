// // src/components/ClosingReport.jsx
// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import { format } from 'date-fns';
// import { useRefresh } from '../context/RefreshContext';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';

// const NOTIFY_THRESHOLD = 1;
// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// // ---------- Icons ----------
// const PlusIcon = () => (
//   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
//   </svg>
// );

// const DownloadIcon = () => (
//   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//   </svg>
// );

// const PdfIcon = () => (
//   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V3" />
//     <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6M9 19h2M9 11h6" />
//   </svg>
// );

// // ---------- Main Component ----------
// const ClosingReport = () => {
//   const { refresh } = useRefresh();
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split('T')[0],
//     billAmount: '',
//     cash: '',
//     upi: '',
//     card: '',
//     excess: '',
//     short: '',
//     isWeekOff: false,
//     reason: '',
//   });
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [computedBill, setComputedBill] = useState(0);
//   const [filterType, setFilterType] = useState('range');
//   const [startDate, setStartDate] = useState(
//     new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
//   );
//   const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [lastReport, setLastReport] = useState(null);
//   const todayStr = new Date().toISOString().split('T')[0];

//   // Compute totals – EXCLUDING week‑off days
//   const totals = useMemo(() => {
//     const activeReports = reports.filter(r => !r.isWeekOff);
//     return activeReports.reduce((acc, r) => {
//       acc.totalBill += r.billAmount;
//       acc.totalReceived += r.totalAmount;
//       acc.totalVariance += r.variance;
//       acc.totalExcess += r.variance > 0 ? r.variance : 0;
//       acc.totalShort += r.variance < 0 ? r.variance : 0;
//       acc.count += 1;
//       return acc;
//     }, { totalBill: 0, totalReceived: 0, totalVariance: 0, totalExcess: 0, totalShort: 0, count: 0 });
//   }, [reports]);

//   // Compute total and bill – honour isWeekOff
//   useEffect(() => {
//     if (formData.isWeekOff) {
//       setTotalAmount(0);
//       setComputedBill(0);
//       return;
//     }
//     const cash = parseFloat(formData.cash) || 0;
//     const upi = parseFloat(formData.upi) || 0;
//     const card = parseFloat(formData.card) || 0;
//     const total = cash + upi + card;
//     setTotalAmount(total);
//     const bill = parseFloat(formData.billAmount);
//     if (!isNaN(bill) && bill > 0) {
//       setComputedBill(bill);
//     } else {
//       const excess = parseFloat(formData.excess) || 0;
//       const short = parseFloat(formData.short) || 0;
//       const computed = total + short - excess;
//       setComputedBill(computed > 0 ? computed : 0);
//     }
//   }, [formData]);

//   // Fetch reports
//   const fetchReports = async () => {
//     const cashierId = localStorage.getItem('cashierId');
//     if (!cashierId) {
//       toast.error('Cashier ID not found. Please login again.');
//       return;
//     }
//     setLoading(true);
//     try {
//       let params = { cashierId };
//       if (filterType === 'range') {
//         params.startDate = startDate;
//         params.endDate = endDate;
//       } else if (filterType === 'month') {
//         // Custom period: 26th of previous month to 25th of selected month
//         const start = new Date(selectedYear, selectedMonth - 2, 26);
//         const end = new Date(selectedYear, selectedMonth - 1, 25);
//         params.startDate = format(start, 'yyyy-MM-dd');
//         params.endDate = format(end, 'yyyy-MM-dd');
//       } else if (filterType === 'year') {
//         params.year = selectedYear;
//       }
//       const res = await axios.get(`${API_BASE}/closing`, { params });
//       setReports(res.data);
//       if (res.data.length > 0) setLastReport(res.data[0]);
//     } catch (err) {
//       toast.error('Failed to fetch reports');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReports();
//     // eslint-disable-next-line
//   }, [filterType, startDate, endDate, selectedMonth, selectedYear]);

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     if (name === 'date') return;
//     if (type === 'checkbox') {
//       setFormData(prev => ({ ...prev, [name]: checked }));
//       if (checked) {
//         // Clear all amount fields when week‑off is checked
//         setFormData(prev => ({
//           ...prev,
//           isWeekOff: true,
//           billAmount: '',
//           cash: '',
//           upi: '',
//           card: '',
//           excess: '',
//           short: '',
//         }));
//       }
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   // Duplicate last report
//   const duplicateLastReport = () => {
//     if (!lastReport) {
//       toast.error('No previous report to duplicate');
//       return;
//     }
//     const r = lastReport;
//     setFormData({
//       date: todayStr,
//       billAmount: r.isWeekOff ? '' : r.billAmount,
//       cash: r.isWeekOff ? '' : r.cash,
//       upi: r.isWeekOff ? '' : r.upi,
//       card: r.isWeekOff ? '' : r.card,
//       excess: r.isWeekOff ? '' : (r.variance > 0 ? r.variance : ''),
//       short: r.isWeekOff ? '' : (r.variance < 0 ? Math.abs(r.variance) : ''),
//       isWeekOff: r.isWeekOff || false,
//       reason: r.reason || '',
//     });
//     toast.success('Report duplicated – adjust & save');
//   };

//   // Submit – for today only
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const { isWeekOff, billAmount, cash, upi, card, excess, short, reason } = formData;
//     const cashierId = localStorage.getItem('cashierId');
//     if (!cashierId) {
//       toast.error('Cashier ID not found. Please login again.');
//       return;
//     }

//     let total = totalAmount;
//     let bill = parseFloat(billAmount) || computedBill;
//     if (isWeekOff) {
//       total = 0;
//       bill = 0;
//     } else {
//       if (total === 0) {
//         toast.error('Total amount (Cash+UPI+Card) must be > 0');
//         return;
//       }
//       if (bill <= 0) {
//         toast.error('Bill amount must be positive. Please enter or adjust excess/short.');
//         return;
//       }
//     }

//     const data = {
//       date: new Date(todayStr),
//       billAmount: bill,
//       cash: parseFloat(cash) || 0,
//       upi: parseFloat(upi) || 0,
//       card: parseFloat(card) || 0,
//       totalAmount: total,
//       cashierId,
//       isWeekOff: isWeekOff || false,
//       reason: reason || '',
//     };

//     try {
//       const existing = reports.find(r => format(new Date(r.date), 'yyyy-MM-dd') === todayStr);
//       let report;
//       if (existing) {
//         const res = await axios.put(`${API_BASE}/closing/${existing._id}`, data);
//         report = res.data;
//         toast.success('Report updated successfully');
//       } else {
//         const res = await axios.post(`${API_BASE}/closing`, data);
//         report = res.data;
//         toast.success('Report saved successfully');
//       }

//       if (!isWeekOff) {
//         if (report.varianceAbs >= NOTIFY_THRESHOLD && !report.notified) {
//           toast.error(`⚠️ Variance ${report.varianceAbs} exceeds ${NOTIFY_THRESHOLD}! Notification sent.`);
//           await axios.put(`${API_BASE}/closing/${report._id}`, { notified: true, cashierId });
//         }
//         if (report.varianceAbs >= 200 && !report.charged) {
//           toast.error(`💳 Charge applied! Variance ${report.varianceAbs} exceeds 200.`);
//           await axios.put(`${API_BASE}/closing/${report._id}`, { charged: true, cashierId });
//         }
//         if (report.varianceAbs >= 500) {
//           toast.success(`🎉 Bonus reward! Variance ${report.varianceAbs} exceeds 500!`);
//         }
//       }

//       setFormData({
//         date: todayStr,
//         billAmount: '',
//         cash: '',
//         upi: '',
//         card: '',
//         excess: '',
//         short: '',
//         isWeekOff: false,
//         reason: '',
//       });
//       await fetchReports();
//       refresh();
//     } catch (err) {
//       toast.error('Failed to save report');
//     }
//   };

//   // Delete
//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure?')) return;
//     const cashierId = localStorage.getItem('cashierId');
//     if (!cashierId) {
//       toast.error('Cashier ID not found. Please login again.');
//       return;
//     }
//     try {
//       await axios.delete(`${API_BASE}/closing/${id}`, { params: { cashierId } });
//       toast.success('Report deleted');
//       await fetchReports();
//       refresh();
//     } catch (err) {
//       toast.error('Delete failed');
//     }
//   };

//   // Download CSV (includes Reason column)
//   const downloadCSV = () => {
//     if (reports.length === 0) {
//       toast.error('No data to download');
//       return;
//     }
//     const headers = ['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged'];
//     const rows = reports.map(r => [
//       format(new Date(r.date), 'yyyy-MM-dd'),
//       r.isWeekOff ? '—' : r.billAmount,
//       r.isWeekOff ? '—' : r.cash,
//       r.isWeekOff ? '—' : r.upi,
//       r.isWeekOff ? '—' : r.card,
//       r.isWeekOff ? '—' : r.totalAmount,
//       r.isWeekOff ? '—' : r.variance,
//       r.isWeekOff ? 'Week Off' : (r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'),
//       r.reason || '—',
//       r.notified ? 'Yes' : 'No',
//       r.charged ? 'Yes' : 'No',
//     ]);
//     // Totals for active reports only (excluding week‑off)
//     const activeTotals = reports.filter(r => !r.isWeekOff).reduce((acc, r) => {
//       acc.bill += r.billAmount;
//       acc.total += r.totalAmount;
//       acc.variance += r.variance;
//       acc.excess += r.variance > 0 ? r.variance : 0;
//       acc.short += r.variance < 0 ? r.variance : 0;
//       return acc;
//     }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
//     rows.push([
//       'TOTALS (active)',
//       activeTotals.bill.toFixed(2),
//       '',
//       '',
//       '',
//       activeTotals.total.toFixed(2),
//       activeTotals.variance.toFixed(2),
//       `Excess: ${activeTotals.excess.toFixed(2)}, Short: ${Math.abs(activeTotals.short).toFixed(2)}`,
//       '',
//       '',
//       '',
//     ]);
//     let csvContent = headers.join(',') + '\n';
//     rows.forEach(row => csvContent += row.join(',') + '\n');
//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `closing_report_${format(new Date(), 'yyyyMMdd')}.csv`;
//     a.click();
//     URL.revokeObjectURL(url);
//     toast.success('CSV downloaded');
//   };

//   // Download PDF (includes Reason column)
//   const downloadPDF = () => {
//     if (reports.length === 0) {
//       toast.error('No data to download');
//       return;
//     }
//     const doc = new jsPDF('landscape', 'mm', 'a4');
//     doc.setFontSize(16);
//     doc.text('D-Mart Cashier - Closing Report', 14, 15);
//     doc.setFontSize(10);
//     doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 22);

//     const tableData = reports.map(r => [
//       format(new Date(r.date), 'yyyy-MM-dd'),
//       r.isWeekOff ? '—' : r.billAmount.toFixed(2),
//       r.isWeekOff ? '—' : r.cash.toFixed(2),
//       r.isWeekOff ? '—' : r.upi.toFixed(2),
//       r.isWeekOff ? '—' : r.card.toFixed(2),
//       r.isWeekOff ? '—' : r.totalAmount.toFixed(2),
//       r.isWeekOff ? '—' : r.variance.toFixed(2),
//       r.isWeekOff ? 'Week Off' : (r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'),
//       r.reason || '—',
//       r.notified ? 'Yes' : 'No',
//       r.charged ? 'Yes' : 'No',
//     ]);
//     const activeTotals = reports.filter(r => !r.isWeekOff).reduce((acc, r) => {
//       acc.bill += r.billAmount;
//       acc.total += r.totalAmount;
//       acc.variance += r.variance;
//       acc.excess += r.variance > 0 ? r.variance : 0;
//       acc.short += r.variance < 0 ? r.variance : 0;
//       return acc;
//     }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
//     tableData.push([
//       'TOTALS (active)',
//       activeTotals.bill.toFixed(2),
//       '',
//       '',
//       '',
//       activeTotals.total.toFixed(2),
//       activeTotals.variance.toFixed(2),
//       `Excess: ${activeTotals.excess.toFixed(2)}, Short: ${Math.abs(activeTotals.short).toFixed(2)}`,
//       '',
//       '',
//       '',
//     ]);

//     autoTable(doc, {
//       head: [['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged']],
//       body: tableData,
//       startY: 30,
//       styles: { fontSize: 7 },
//       headStyles: { fillColor: [46, 125, 50] },
//       alternateRowStyles: { fillColor: [245, 245, 245] },
//       columnStyles: {
//         0: { cellWidth: 25 },
//         1: { cellWidth: 16 },
//         2: { cellWidth: 16 },
//         3: { cellWidth: 16 },
//         4: { cellWidth: 16 },
//         5: { cellWidth: 16 },
//         6: { cellWidth: 18 },
//         7: { cellWidth: 20 },
//         8: { cellWidth: 22 },
//         9: { cellWidth: 16 },
//         10: { cellWidth: 16 },
//       },
//     });

//     doc.save(`closing_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
//     toast.success('PDF downloaded');
//   };

//   // ---------- Render ----------
//   return (
//     <div className="p-4 sm:p-6">
//       <h2 className="text-2xl font-bold text-gray-800 mb-6">Closing Report</h2>

//       {/* Filter Bar */}
//       <div className="card mb-6">
//         <div className="card-body">
//           <div className="flex flex-wrap items-end gap-3">
//             <div className="w-full sm:w-auto flex-1 min-w-[130px]">
//               <label className="block text-sm font-medium text-gray-600 mb-1">Filter by</label>
//               <select
//                 value={filterType}
//                 onChange={(e) => setFilterType(e.target.value)}
//                 className="dmart-input"
//               >
//                 <option value="range">Date Range</option>
//                 <option value="month">Month (26th–25th)</option>
//                 <option value="year">Year</option>
//               </select>
//             </div>

//             {filterType === 'range' && (
//               <>
//                 <div className="w-full sm:w-auto flex-1 min-w-[130px]">
//                   <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
//                   <input
//                     type="date"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                     className="dmart-input"
//                   />
//                 </div>
//                 <div className="w-full sm:w-auto flex-1 min-w-[130px]">
//                   <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
//                   <input
//                     type="date"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                     className="dmart-input"
//                   />
//                 </div>
//               </>
//             )}

//             {filterType === 'month' && (
//               <>
//                 <div className="w-full sm:w-auto flex-1 min-w-[130px]">
//                   <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
//                   <select
//                     value={selectedMonth}
//                     onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
//                     className="dmart-input"
//                   >
//                     {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
//                       <option key={m} value={m}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="w-full sm:w-auto flex-1 min-w-[100px]">
//                   <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
//                   <input
//                     type="number"
//                     value={selectedYear}
//                     onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                     className="dmart-input"
//                   />
//                 </div>
//               </>
//             )}

//             {filterType === 'year' && (
//               <div className="w-full sm:w-auto flex-1 min-w-[100px]">
//                 <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
//                 <input
//                   type="number"
//                   value={selectedYear}
//                   onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//                   className="dmart-input"
//                 />
//               </div>
//             )}

//             <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap mt-2 sm:mt-0">
//               <button onClick={fetchReports} className="dmart-btn dmart-btn-primary">Apply</button>
//               <button onClick={downloadCSV} className="dmart-btn dmart-btn-success">
//                 <DownloadIcon />
//                 <span className="hidden sm:inline">CSV</span>
//               </button>
//               <button onClick={downloadPDF} className="dmart-btn dmart-btn-primary">
//                 <PdfIcon />
//                 <span className="hidden sm:inline">PDF</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Summary Cards – only active days (exclude week‑off) */}
//       {reports.filter(r => !r.isWeekOff).length > 0 && (
//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
//           <div className="card shadow-card-hover">
//             <div className="card-body">
//               <p className="text-xs text-gray-500">Total Bill</p>
//               <p className="text-lg font-bold text-gray-800">₹{totals.totalBill.toFixed(2)}</p>
//             </div>
//           </div>
//           <div className="card shadow-card-hover">
//             <div className="card-body">
//               <p className="text-xs text-gray-500">Total Received</p>
//               <p className="text-lg font-bold text-gray-800">₹{totals.totalReceived.toFixed(2)}</p>
//             </div>
//           </div>
//           <div className="card shadow-card-hover">
//             <div className="card-body">
//               <p className="text-xs text-gray-500">Net Variance</p>
//               <p className={`text-lg font-bold ${totals.totalVariance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>
//                 {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
//               </p>
//             </div>
//           </div>
//           <div className="card shadow-card-hover border-green-200">
//             <div className="card-body">
//               <p className="text-xs text-gray-500">Total Excess</p>
//               <p className="text-lg font-bold text-green-600">+₹{totals.totalExcess.toFixed(2)}</p>
//             </div>
//           </div>
//           <div className="card shadow-card-hover border-red-200">
//             <div className="card-body">
//               <p className="text-xs text-gray-500">Total Short</p>
//               <p className="text-lg font-bold text-red-600">-₹{Math.abs(totals.totalShort).toFixed(2)}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Entry Form with Duplicate Button & Week Off toggle */}
//       <div className="card mb-6">
//         <div className="card-body">
//           <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
//             <h3 className="text-lg font-semibold text-gray-800">Add Daily Closing</h3>
//             <div className="flex items-center gap-2">
//               <span className="text-xs text-gray-400">Date: <strong>{todayStr}</strong></span>
//               {lastReport && (
//                 <button
//                   onClick={duplicateLastReport}
//                   className="dmart-btn bg-purple-600 text-white hover:bg-purple-700"
//                 >
//                   <span className="text-lg">🔁</span> Duplicate Last
//                 </button>
//               )}
//             </div>
//           </div>
//           <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
//             <div className="col-span-full flex flex-wrap items-center gap-3 mb-1">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="isWeekOff"
//                   checked={formData.isWeekOff}
//                   onChange={handleInputChange}
//                   className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
//                 />
//                 <span className="text-sm font-medium text-gray-700">Week Off</span>
//               </label>
//               <span className="text-xs text-gray-400">(Check this if you were off today)</span>
//             </div>

//             {/* Reason field */}
//             <div className="col-span-full sm:col-span-2 lg:col-span-3 xl:col-span-4">
//               <label className="block text-sm font-medium text-gray-600 mb-1">Reason (optional)</label>
//               <input
//                 type="text"
//                 name="reason"
//                 value={formData.reason}
//                 onChange={handleInputChange}
//                 placeholder="e.g., Holiday, Leave, Training, etc."
//                 className="dmart-input"
//               />
//             </div>

//             {/* Date – disabled */}
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Date (Today)</label>
//               <input
//                 type="date"
//                 value={todayStr}
//                 disabled
//                 className="dmart-input bg-gray-100 cursor-not-allowed"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Bill (optional)</label>
//               <input
//                 type="number"
//                 name="billAmount"
//                 value={formData.billAmount}
//                 onChange={handleInputChange}
//                 placeholder="Auto"
//                 className="dmart-input"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Cash</label>
//               <input
//                 type="number"
//                 name="cash"
//                 value={formData.cash}
//                 onChange={handleInputChange}
//                 placeholder="0.00"
//                 className="dmart-input"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">UPI</label>
//               <input
//                 type="number"
//                 name="upi"
//                 value={formData.upi}
//                 onChange={handleInputChange}
//                 placeholder="0.00"
//                 className="dmart-input"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Card</label>
//               <input
//                 type="number"
//                 name="card"
//                 value={formData.card}
//                 onChange={handleInputChange}
//                 placeholder="0.00"
//                 className="dmart-input"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Excess</label>
//               <input
//                 type="number"
//                 name="excess"
//                 value={formData.excess}
//                 onChange={handleInputChange}
//                 placeholder="+ excess"
//                 className="dmart-input border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//               <p className="text-xs text-green-600 mt-0.5">Decreases bill</p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Short</label>
//               <input
//                 type="number"
//                 name="short"
//                 value={formData.short}
//                 onChange={handleInputChange}
//                 placeholder="- short"
//                 className="dmart-input border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
//                 disabled={formData.isWeekOff}
//                 step="0.01"
//                 min="0"
//               />
//               <p className="text-xs text-red-600 mt-0.5">Increases bill</p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Total (auto)</label>
//               <input
//                 type="text"
//                 value={formData.isWeekOff ? '— (Week Off)' : totalAmount.toFixed(2)}
//                 readOnly
//                 className="dmart-input bg-gray-50 font-semibold"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-600 mb-1">Computed Bill</label>
//               <input
//                 type="text"
//                 value={formData.isWeekOff ? '—' : computedBill.toFixed(2)}
//                 readOnly
//                 className="dmart-input bg-gray-50 font-semibold"
//               />
//             </div>
//             <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end mt-2">
//               <button
//                 type="submit"
//                 className="dmart-btn dmart-btn-primary w-full sm:w-auto"
//               >
//                 <PlusIcon /> Save Report
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>

//       {/* Reports Table with Week Off support and Reason column */}
//       {loading ? (
//         <div className="flex justify-center py-8">
//           <div className="spinner" />
//         </div>
//       ) : (
//         <div className="card">
//           <div className="table-wrapper">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Date</th>
//                   <th>Bill</th>
//                   <th>Cash</th>
//                   <th>UPI</th>
//                   <th>Card</th>
//                   <th>Total</th>
//                   <th>Variance</th>
//                   <th>Status</th>
//                   <th>Reason</th>
//                   <th>Notif.</th>
//                   <th>Charge</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {reports.map((report) => {
//                   const isRed = !report.isWeekOff && report.variance !== 0;
//                   return (
//                     <tr key={report._id} className={isRed ? 'bg-red-50' : ''}>
//                       <td className="whitespace-nowrap">{format(new Date(report.date), 'yyyy-MM-dd')}</td>
//                       <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.billAmount.toFixed(2)}`}</td>
//                       <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.cash.toFixed(2)}`}</td>
//                       <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.upi.toFixed(2)}`}</td>
//                       <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.card.toFixed(2)}`}</td>
//                       <td className="whitespace-nowrap font-semibold">{report.isWeekOff ? '—' : `₹${report.totalAmount.toFixed(2)}`}</td>
//                       <td className="whitespace-nowrap font-medium">{report.isWeekOff ? '—' : (report.variance > 0 ? `+${report.variance.toFixed(2)}` : report.variance.toFixed(2))}</td>
//                       <td className="whitespace-nowrap">
//                         {report.isWeekOff ? (
//                           <span className="badge badge-neutral">Week Off</span>
//                         ) : (
//                           <span className={`badge ${report.isShort ? 'badge-danger' : report.isExcess ? 'badge-warning' : 'badge-success'}`}>
//                             {report.isShort ? 'Short' : report.isExcess ? 'Excess' : 'Match'}
//                           </span>
//                         )}
//                       </td>
//                       <td className="whitespace-nowrap text-sm text-gray-600">{report.reason || '—'}</td>
//                       <td className="whitespace-nowrap text-center">{report.notified ? '✅' : '❌'}</td>
//                       <td className="whitespace-nowrap text-center">{report.charged ? '✅' : '❌'}</td>
//                       <td className="whitespace-nowrap">
//                         <button
//                           onClick={() => handleDelete(report._id)}
//                           className="text-red-600 hover:text-red-800 transition text-sm"
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {reports.length === 0 && (
//                   <tr>
//                     <td colSpan="12" className="py-8 text-center text-gray-500">
//                       No reports found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//               {reports.filter(r => !r.isWeekOff).length > 0 && (
//                 <tfoot className="bg-gray-50 font-bold">
//                   <tr>
//                     <td className="text-left">TOTALS (active)</td>
//                     <td>₹{totals.totalBill.toFixed(2)}</td>
//                     <td></td>
//                     <td></td>
//                     <td></td>
//                     <td>₹{totals.totalReceived.toFixed(2)}</td>
//                     <td className={`${totals.totalVariance !== 0 ? 'text-red-600' : ''}`}>
//                       {totals.totalVariance > 0 ? '+' : ''}{totals.totalVariance.toFixed(2)}
//                     </td>
//                     <td className="whitespace-nowrap">
//                       <span className="text-green-600">+₹{totals.totalExcess.toFixed(2)}</span>
//                       <span className="mx-1">/</span>
//                       <span className="text-red-600">-₹{Math.abs(totals.totalShort).toFixed(2)}</span>
//                     </td>
//                     <td></td>
//                     <td></td>
//                     <td></td>
//                     <td></td>
//                   </tr>
//                 </tfoot>
//               )}
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ClosingReport;




// src/components/ClosingReport.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    isWeekOff: false,
    reason: '',
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
  const [lastReport, setLastReport] = useState(null);
  const [isBillAutoSet, setIsBillAutoSet] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const billInputRef = useRef(null);

  // Compute totals – EXCLUDING week‑off days
  const totals = useMemo(() => {
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

  // Compute total and bill – honour isWeekOff and auto‑set billAmount when excess/short used
  useEffect(() => {
    if (formData.isWeekOff) {
      setTotalAmount(0);
      setComputedBill(0);
      return;
    }
    const cash = parseFloat(formData.cash) || 0;
    const upi = parseFloat(formData.upi) || 0;
    const card = parseFloat(formData.card) || 0;
    const total = cash + upi + card;
    setTotalAmount(total);

    const excess = parseFloat(formData.excess) || 0;
    const short = parseFloat(formData.short) || 0;
    const computed = total + short - excess;
    const computedVal = computed > 0 ? computed : 0;
    setComputedBill(computedVal);

    // Auto‑set billAmount if excess or short is non‑zero and billAmount is empty or equals old computed
    // Also if the user hasn't manually changed it (we track via a flag)
    if ((excess !== 0 || short !== 0) && !formData.isWeekOff) {
      // Only auto‑set if the current billAmount is empty, or if it equals the previous computed value
      // We'll use a ref to detect if the user has focused and typed in the bill field.
      // For simplicity, if billAmount is empty or "0" or equals the previous computed, we set it.
      const currentBill = parseFloat(formData.billAmount);
      if (isNaN(currentBill) || currentBill === 0 || currentBill === computedVal || !formData.billAmount) {
        if (!isBillAutoSet) {
          setFormData(prev => ({ ...prev, billAmount: computedVal > 0 ? computedVal.toString() : '' }));
          setIsBillAutoSet(true);
        }
      }
    } else {
      // If excess and short are zero, allow manual entry
      setIsBillAutoSet(false);
    }
  }, [formData.cash, formData.upi, formData.card, formData.excess, formData.short, formData.isWeekOff, formData.billAmount]);

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
        const start = new Date(selectedYear, selectedMonth - 2, 26);
        const end = new Date(selectedYear, selectedMonth - 1, 25);
        params.startDate = format(start, 'yyyy-MM-dd');
        params.endDate = format(end, 'yyyy-MM-dd');
      } else if (filterType === 'year') {
        params.year = selectedYear;
      }
      const res = await axios.get(`${API_BASE}/closing`, { params });
      setReports(res.data);
      if (res.data.length > 0) setLastReport(res.data[0]);
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
    const { name, value, type, checked } = e.target;
    if (name === 'date') return;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      if (checked) {
        setFormData(prev => ({
          ...prev,
          isWeekOff: true,
          billAmount: '',
          cash: '',
          upi: '',
          card: '',
          excess: '',
          short: '',
        }));
        setIsBillAutoSet(false);
      }
    } else {
      setFormData({ ...formData, [name]: value });
      // If user manually types in billAmount, we should allow it
      if (name === 'billAmount') {
        setIsBillAutoSet(false);
      }
    }
  };

  // Duplicate last report
  const duplicateLastReport = () => {
    if (!lastReport) {
      toast.error('No previous report to duplicate');
      return;
    }
    const r = lastReport;
    setFormData({
      date: todayStr,
      billAmount: r.isWeekOff ? '' : r.billAmount.toString(),
      cash: r.isWeekOff ? '' : r.cash.toString(),
      upi: r.isWeekOff ? '' : r.upi.toString(),
      card: r.isWeekOff ? '' : r.card.toString(),
      excess: r.isWeekOff ? '' : (r.variance > 0 ? r.variance.toString() : ''),
      short: r.isWeekOff ? '' : (r.variance < 0 ? Math.abs(r.variance).toString() : ''),
      isWeekOff: r.isWeekOff || false,
      reason: r.reason || '',
    });
    setIsBillAutoSet(false);
    toast.success('Report duplicated – adjust & save');
  };

  // Submit – for today only
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isWeekOff, billAmount, cash, upi, card, excess, short, reason } = formData;
    const cashierId = localStorage.getItem('cashierId');
    if (!cashierId) {
      toast.error('Cashier ID not found. Please login again.');
      return;
    }

    let total = totalAmount;
    let bill = parseFloat(billAmount) || computedBill;
    if (isWeekOff) {
      total = 0;
      bill = 0;
    } else {
      if (total === 0) {
        toast.error('Total amount (Cash+UPI+Card) must be > 0');
        return;
      }
      if (bill <= 0) {
        toast.error('Bill amount must be positive. Please enter or adjust excess/short.');
        return;
      }
    }

    const data = {
      date: new Date(todayStr),
      billAmount: bill,
      cash: parseFloat(cash) || 0,
      upi: parseFloat(upi) || 0,
      card: parseFloat(card) || 0,
      totalAmount: total,
      cashierId,
      isWeekOff: isWeekOff || false,
      reason: reason || '',
    };

    try {
      const existing = reports.find(r => format(new Date(r.date), 'yyyy-MM-dd') === todayStr);
      let report;
      if (existing) {
        const res = await axios.put(`${API_BASE}/closing/${existing._id}`, data);
        report = res.data;
        toast.success('Report updated successfully');
      } else {
        const res = await axios.post(`${API_BASE}/closing`, data);
        report = res.data;
        toast.success('Report saved successfully');
      }

      if (!isWeekOff) {
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
      }

      setFormData({
        date: todayStr,
        billAmount: '',
        cash: '',
        upi: '',
        card: '',
        excess: '',
        short: '',
        isWeekOff: false,
        reason: '',
      });
      setIsBillAutoSet(false);
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

  // Download CSV
  const downloadCSV = () => {
    if (reports.length === 0) {
      toast.error('No data to download');
      return;
    }
    const headers = ['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged'];
    const rows = reports.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
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
    const activeTotals = reports.filter(r => !r.isWeekOff).reduce((acc, r) => {
      acc.bill += r.billAmount;
      acc.total += r.totalAmount;
      acc.variance += r.variance;
      acc.excess += r.variance > 0 ? r.variance : 0;
      acc.short += r.variance < 0 ? r.variance : 0;
      return acc;
    }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
    rows.push([
      'TOTALS (active)',
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
    a.download = `closing_report_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  // Download PDF
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
    const activeTotals = reports.filter(r => !r.isWeekOff).reduce((acc, r) => {
      acc.bill += r.billAmount;
      acc.total += r.totalAmount;
      acc.variance += r.variance;
      acc.excess += r.variance > 0 ? r.variance : 0;
      acc.short += r.variance < 0 ? r.variance : 0;
      return acc;
    }, { bill: 0, total: 0, variance: 0, excess: 0, short: 0 });
    tableData.push([
      'TOTALS (active)',
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
      head: [['Date', 'Bill', 'Cash', 'UPI', 'Card', 'Total', 'Variance', 'Status', 'Reason', 'Notified', 'Charged']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [46, 125, 50] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 16 },
        2: { cellWidth: 16 },
        3: { cellWidth: 16 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 20 },
        8: { cellWidth: 22 },
        9: { cellWidth: 16 },
        10: { cellWidth: 16 },
      },
    });

    doc.save(`closing_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('PDF downloaded');
  };

  // ---------- Render ----------
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Closing Report</h2>

      {/* Filter Bar */}
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

            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap mt-2 sm:mt-0">
              <button onClick={fetchReports} className="dmart-btn dmart-btn-primary">Apply</button>
              <button onClick={downloadCSV} className="dmart-btn dmart-btn-success">
                <DownloadIcon />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={downloadPDF} className="dmart-btn dmart-btn-primary">
                <PdfIcon />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards – only active days (exclude week‑off) */}
      {reports.filter(r => !r.isWeekOff).length > 0 && (
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

      {/* Entry Form with Duplicate Button & Week Off toggle */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Add Daily Closing</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Date: <strong>{todayStr}</strong></span>
              {lastReport && (
                <button
                  onClick={duplicateLastReport}
                  className="dmart-btn bg-purple-600 text-white hover:bg-purple-700"
                >
                  <span className="text-lg">🔁</span> Duplicate Last
                </button>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-full flex flex-wrap items-center gap-3 mb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isWeekOff"
                  checked={formData.isWeekOff}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-gray-700">Week Off</span>
              </label>
              <span className="text-xs text-gray-400">(Check this if you were off today)</span>
            </div>

            {/* Reason field */}
            <div className="col-span-full sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Reason (optional)</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="e.g., Holiday, Leave, Training, etc."
                className="dmart-input"
              />
            </div>

            {/* Date – disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date (Today)</label>
              <input
                type="date"
                value={todayStr}
                disabled
                className="dmart-input bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Bill Amount – auto‑filled when excess/short used */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bill Amount</label>
              <input
                type="number"
                name="billAmount"
                value={formData.billAmount}
                onChange={handleInputChange}
                placeholder="Auto"
                className={`dmart-input ${(parseFloat(formData.excess) !== 0 || parseFloat(formData.short) !== 0) && !formData.isWeekOff ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={(parseFloat(formData.excess) !== 0 || parseFloat(formData.short) !== 0) && !formData.isWeekOff}
                step="0.01"
                min="0"
              />
              {(parseFloat(formData.excess) !== 0 || parseFloat(formData.short) !== 0) && !formData.isWeekOff && (
                <p className="text-xs text-blue-600 mt-0.5">Auto‑calculated from Excess/Short</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cash</label>
              <input
                type="number"
                name="cash"
                value={formData.cash}
                onChange={handleInputChange}
                placeholder="0.00"
                className="dmart-input"
                disabled={formData.isWeekOff}
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
                className="dmart-input"
                disabled={formData.isWeekOff}
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
                className="dmart-input"
                disabled={formData.isWeekOff}
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
                className="dmart-input border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500"
                disabled={formData.isWeekOff}
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
                className="dmart-input border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                disabled={formData.isWeekOff}
                step="0.01"
                min="0"
              />
              <p className="text-xs text-red-600 mt-0.5">Increases bill</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Total (auto)</label>
              <input
                type="text"
                value={formData.isWeekOff ? '— (Week Off)' : totalAmount.toFixed(2)}
                readOnly
                className="dmart-input bg-gray-50 font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Computed Bill</label>
              <input
                type="text"
                value={formData.isWeekOff ? '—' : computedBill.toFixed(2)}
                readOnly
                className="dmart-input bg-gray-50 font-semibold"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                className="dmart-btn dmart-btn-primary w-full sm:w-auto"
              >
                <PlusIcon /> Save Report
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reports Table with Week Off support and Reason column */}
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
                  <th>Bill</th>
                  <th>Cash</th>
                  <th>UPI</th>
                  <th>Card</th>
                  <th>Total</th>
                  <th>Variance</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Notif.</th>
                  <th>Charge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const isRed = !report.isWeekOff && report.variance !== 0;
                  return (
                    <tr key={report._id} className={isRed ? 'bg-red-50' : ''}>
                      <td className="whitespace-nowrap">{format(new Date(report.date), 'yyyy-MM-dd')}</td>
                      <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.billAmount.toFixed(2)}`}</td>
                      <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.cash.toFixed(2)}`}</td>
                      <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.upi.toFixed(2)}`}</td>
                      <td className="whitespace-nowrap">{report.isWeekOff ? '—' : `₹${report.card.toFixed(2)}`}</td>
                      <td className="whitespace-nowrap font-semibold">{report.isWeekOff ? '—' : `₹${report.totalAmount.toFixed(2)}`}</td>
                      <td className="whitespace-nowrap font-medium">{report.isWeekOff ? '—' : (report.variance > 0 ? `+${report.variance.toFixed(2)}` : report.variance.toFixed(2))}</td>
                      <td className="whitespace-nowrap">
                        {report.isWeekOff ? (
                          <span className="badge badge-neutral">Week Off</span>
                        ) : (
                          <span className={`badge ${report.isShort ? 'badge-danger' : report.isExcess ? 'badge-warning' : 'badge-success'}`}>
                            {report.isShort ? 'Short' : report.isExcess ? 'Excess' : 'Match'}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-sm text-gray-600">{report.reason || '—'}</td>
                      <td className="whitespace-nowrap text-center">{report.notified ? '✅' : '❌'}</td>
                      <td className="whitespace-nowrap text-center">{report.charged ? '✅' : '❌'}</td>
                      <td className="whitespace-nowrap">
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
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="12" className="py-8 text-center text-gray-500">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
              {reports.filter(r => !r.isWeekOff).length > 0 && (
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="text-left">TOTALS (active)</td>
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

export default ClosingReport;