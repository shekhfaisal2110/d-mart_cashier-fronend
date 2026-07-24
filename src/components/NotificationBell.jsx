// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useRefresh } from '../context/RefreshContext';

const NOTIFY_THRESHOLD = 1;

// ---------- Icons ----------
const BellIcon = () => (
  <svg className="w-6 h-6 sm:w-6 md:w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ---------- Main Component ----------
const NotificationBell = () => {
  const { refreshKey } = useRefresh();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch notifications for the selected month
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const cashierId = localStorage.getItem('cashierId');
      if (!cashierId) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
      const monthEnd = endOfMonth(monthStart);
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      const res = await axios.get(`${API_BASE}/closing`, {
        params: { cashierId, startDate: startStr, endDate: endStr },
      });
      const reports = res.data;

      const notifs = reports
        .filter(r => r.varianceAbs >= NOTIFY_THRESHOLD)
        .map(r => {
          let type, icon, message;
          if (r.varianceAbs >= 500) {
            type = 'reward';
            icon = '🎉';
            message = `🎉 Reward incentive! Variance ₹${r.varianceAbs.toFixed(2)}`;
          } else if (r.varianceAbs >= 200) {
            type = 'charge';
            icon = '💳';
            message = `💳 Charge applied! Variance ₹${r.varianceAbs.toFixed(2)}`;
          } else {
            type = 'notification';
            icon = '🔔';
            message = `🔔 Notification triggered! Variance ₹${r.varianceAbs.toFixed(2)}`;
          }
          return {
            id: r._id,
            date: r.date,
            amount: r.varianceAbs,
            type,
            icon,
            message,
            read: localStorage.getItem(`notif_${r._id}`) === 'true',
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [refreshKey, selectedMonth, selectedYear]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    localStorage.setItem(`notif_${id}`, 'true');
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      localStorage.setItem(`notif_${n.id}`, 'true');
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Month navigation
  const goToPrevMonth = () => {
    const newDate = subMonths(new Date(selectedYear, selectedMonth, 1), 1);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const goToNextMonth = () => {
    const newDate = addMonths(new Date(selectedYear, selectedMonth, 1), 1);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  };

  const monthLabel = format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header with month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[100px] text-center">
                {monthLabel}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>
            <button
              onClick={markAllAsRead}
              className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Mark all read
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No notifications for {monthLabel}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-red-50/30' : ''
                  }`}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">{notif.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 break-words">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(notif.date), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">
                {unreadCount} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;