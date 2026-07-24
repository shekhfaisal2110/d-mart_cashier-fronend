// src/components/DashboardContent.jsx
import React, { useState, useEffect } from 'react';
import { useRefresh } from '../context/RefreshContext';
import axios from 'axios';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ---------- Icons ----------
const BillIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ReceivedIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VarianceIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DiscrepancyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6v-6m-6 6v-6m6 6v-6M3 3h18M3 3v18h18V3M3 3l18 18" />
  </svg>
);

const ClosingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// ---------- Stat Card ----------
const StatCard = ({ title, value, icon, trend, trendLabel, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-2 sm:p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
    <div className="mt-3 sm:mt-4 flex items-center gap-2">
      <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-400'}`}>{trend}</span>
      <span className="text-xs text-gray-400">{trendLabel}</span>
    </div>
  </div>
);

// ---------- Dashboard Content ----------
const DashboardContent = () => {
  const { refreshKey } = useRefresh();
  const [todayClosing, setTodayClosing] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [chartData, setChartData] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cashierId = localStorage.getItem('cashierId');
        if (!cashierId) return;

        const today = new Date().toISOString().split('T')[0];
        const todayRes = await axios.get(`${API_BASE}/closing?cashierId=${cashierId}&startDate=${today}&endDate=${today}`);
        setTodayClosing(todayRes.data.length > 0 ? todayRes.data[0] : null);

        const allRes = await axios.get(`${API_BASE}/closing?cashierId=${cashierId}`);
        setRecentReports(allRes.data.slice(0, 5));

        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const prevMonthStart = startOfMonth(subMonths(now, 1));
        const prevMonthEnd = endOfMonth(subMonths(now, 1));

        const [currentMonthData, prevMonthData] = await Promise.all([
          axios.get(`${API_BASE}/closing?cashierId=${cashierId}&startDate=${format(currentMonthStart, 'yyyy-MM-dd')}&endDate=${format(currentMonthEnd, 'yyyy-MM-dd')}`),
          axios.get(`${API_BASE}/closing?cashierId=${cashierId}&startDate=${format(prevMonthStart, 'yyyy-MM-dd')}&endDate=${format(prevMonthEnd, 'yyyy-MM-dd')}`)
        ]);

        const calcStats = (reports) => {
          const totalBill = reports.reduce((sum, r) => sum + r.billAmount, 0);
          const totalReceived = reports.reduce((sum, r) => sum + r.totalAmount, 0);
          const netVariance = reports.reduce((sum, r) => sum + r.variance, 0);
          const totalAbsVariance = reports.reduce((sum, r) => sum + Math.abs(r.variance), 0);
          const count = reports.length;
          return { totalBill, totalReceived, netVariance, totalAbsVariance, count };
        };

        const curr = calcStats(currentMonthData.data);
        const prev = calcStats(prevMonthData.data);

        const trend = (currVal, prevVal) => {
          if (prevVal === 0) return prevVal === currVal ? '0%' : 'N/A';
          const diff = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
          return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
        };

        setStats([
          { title: 'Total Bill', value: `₹${curr.totalBill.toFixed(2)}`, icon: <BillIcon />, color: 'bg-blue-50 text-blue-600', trend: trend(curr.totalBill, prev.totalBill), trendLabel: 'vs last month' },
          { title: 'Total Received', value: `₹${curr.totalReceived.toFixed(2)}`, icon: <ReceivedIcon />, color: 'bg-green-50 text-green-600', trend: trend(curr.totalReceived, prev.totalReceived), trendLabel: 'vs last month' },
          { title: 'Net Variance', value: `${curr.netVariance >= 0 ? '+' : ''}${curr.netVariance.toFixed(2)}`, icon: <VarianceIcon />, color: 'bg-orange-50 text-orange-600', trend: trend(curr.netVariance, prev.netVariance), trendLabel: 'vs last month' },
          { title: 'Total Discrepancy', value: `₹${curr.totalAbsVariance.toFixed(2)}`, icon: <DiscrepancyIcon />, color: 'bg-indigo-50 text-indigo-600', trend: trend(curr.totalAbsVariance, prev.totalAbsVariance), trendLabel: 'vs last month' },
          { title: 'Total Closings', value: curr.count, icon: <ClosingsIcon />, color: 'bg-purple-50 text-purple-600', trend: trend(curr.count, prev.count), trendLabel: 'vs last month' },
        ]);

        const endDate = new Date();
        const startDate = subDays(endDate, 6);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));
        const weeklyRes = await axios.get(`${API_BASE}/closing?cashierId=${cashierId}&startDate=${dayStrings[0]}&endDate=${dayStrings[6]}`);
        const weeklyReports = weeklyRes.data;
        const grouped = {};
        dayStrings.forEach(d => { grouped[d] = 0; });
        weeklyReports.forEach(r => {
          const d = format(new Date(r.date), 'yyyy-MM-dd');
          if (grouped.hasOwnProperty(d)) grouped[d] += r.totalAmount;
        });
        setChartData(dayStrings.map(d => ({ name: format(new Date(d), 'EEE'), sales: grouped[d] || 0 })));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey, API_BASE]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Your closing summary for this month.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Today's Closing */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">📊 Today's Closing</h3>
          {loading ? <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div></div>
          : todayClosing ? (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div><p className="text-xs sm:text-sm text-gray-500">Bill</p><p className="text-lg sm:text-xl font-bold text-gray-800">₹{todayClosing.billAmount.toFixed(2)}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Received</p><p className="text-lg sm:text-xl font-bold text-gray-800">₹{todayClosing.totalAmount.toFixed(2)}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Variance</p><p className={`text-lg sm:text-xl font-bold ${todayClosing.variance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>{todayClosing.variance > 0 ? `+${todayClosing.variance.toFixed(2)}` : todayClosing.variance.toFixed(2)}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${todayClosing.isShort ? 'bg-red-100 text-red-700' : todayClosing.isExcess ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{todayClosing.isShort ? 'Short' : todayClosing.isExcess ? 'Excess' : 'Match'}</span></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {todayClosing.notified && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🔔 Notified</span>}
                {todayClosing.charged && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">💳 Charged</span>}
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm">No closing for today. <a href="/closing" className="text-red-600 hover:underline">Add now →</a></p>}
        </div>
        {/* Recent Closings */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">📋 Recent</h3>
            <a href="/all-reports" className="text-sm text-red-600 hover:text-red-700 font-medium">View all</a>
          </div>
          {loading ? <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div></div>
          : recentReports.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentReports.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0"><p className="text-sm font-medium text-gray-800">{format(new Date(r.date), 'dd MMM yyyy')}</p><p className="text-xs text-gray-500 truncate">Bill: ₹{r.billAmount.toFixed(2)}</p></div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-sm font-semibold ${r.variance !== 0 ? 'text-red-600' : 'text-gray-800'}`}>{r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.isShort ? 'bg-red-100 text-red-700' : r.isExcess ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{r.isShort ? 'Short' : r.isExcess ? 'Excess' : 'Match'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">No reports found.</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">📈 Weekly Revenue</h3>
        <div className="h-60 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value) => `₹${value.toFixed(2)}`} />
              <Bar dataKey="sales" fill="#E31837" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;