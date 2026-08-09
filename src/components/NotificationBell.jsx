// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
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
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch notifications (closing reports + contact replies)
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const cashierId = localStorage.getItem('cashierId');
      const token = localStorage.getItem('token');
      if (!cashierId || !token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // 1. Closing reports (custom month range)
      const start = new Date(selectedYear, selectedMonth - 2, 26);
      const end = new Date(selectedYear, selectedMonth - 1, 25);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const closingRes = await axios.get(`${API_BASE}/closing`, {
        params: { cashierId, startDate: startStr, endDate: endStr },
      });
      const reports = closingRes.data;

      const closingNotifs = reports
        .filter(r => r.varianceAbs >= NOTIFY_THRESHOLD)
        .map(r => ({
          id: `closing_${r._id}`,
          date: r.date,
          amount: r.varianceAbs,
          type: 'closing',
          icon: r.varianceAbs <= 500 ? '🎉' : r.varianceAbs >= 200 ? '💳' : '🔔',
          message: `${r.varianceAbs <= 500 ? 'Reward' : r.varianceAbs >= 200 ? 'Charge' : 'Notification'}! Variance ₹${r.varianceAbs.toFixed(2)}`,
          read: localStorage.getItem(`notif_closing_${r._id}`) === 'true',
        }));

      // 2. Contact messages (replies)
      const contactRes = await axios.get(`${API_BASE}/contact/my-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contactMessages = contactRes.data.messages || [];

      const contactNotifs = contactMessages
        .filter(msg => msg.status === 'replied' && msg.adminReply)
        .map(msg => ({
          id: `contact_${msg._id}`,
          date: msg.repliedAt || msg.createdAt,
          amount: 0,
          type: 'contact',
          icon: '💬',
          message: `Admin replied to "${msg.subject}": ${msg.adminReply.substring(0, 60)}${msg.adminReply.length > 60 ? '...' : ''}`,
          read: localStorage.getItem(`notif_contact_${msg._id}`) === 'true',
          // store full data for potential detail view
          contactData: msg,
        }));

      // Combine & sort by date (newest first)
      const all = [...closingNotifs, ...contactNotifs]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(all);
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

  const markAsRead = (id, type) => {
    const key = type === 'contact' ? `notif_contact_${id}` : `notif_closing_${id}`;
    localStorage.setItem(key, 'true');
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      const key = n.type === 'contact' ? `notif_contact_${n.id.split('_')[1]}` : `notif_closing_${n.id.split('_')[1]}`;
      localStorage.setItem(key, 'true');
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

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
  const monthLabel = () => {
    const start = new Date(selectedYear, selectedMonth - 2, 26);
    const end = new Date(selectedYear, selectedMonth - 1, 25);
    return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="p-1 rounded hover:bg-gray-200 transition-colors" aria-label="Previous month">
                <ChevronLeft />
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">
                {monthLabel()}
              </span>
              <button onClick={goToNextMonth} className="p-1 rounded hover:bg-gray-200 transition-colors" aria-label="Next month">
                <ChevronRight />
              </button>
            </div>
            <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-dark font-medium transition-colors">
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" /></div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No notifications for {monthLabel()}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id.split('_')[1], notif.type)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">{notif.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 break-words">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(notif.date), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">{unreadCount} unread</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;