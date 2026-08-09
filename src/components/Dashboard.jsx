// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import NotificationBell from './NotificationBell';
import InstallApp from './InstallApp';
import WhatsNewModal from './WhatsNewModal';
import { FiMail } from 'react-icons/fi';

// ---------- Icons ----------
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10-10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zm0 10a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6v-6m-6 6v-6m6 6v-6M3 3h18M3 3v18h18V3M3 3l18 18" />
  </svg>
);

const AllReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ---------- Logo Component ----------
const Logo = () => (
  <div className="flex items-center gap-2 select-none">
    <img
      src="/dmart.png"
      alt="D-Mart"
      className="h-20 w-20 md:h-14 lg:h-14 object-contain"
      onError={(e) => {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        const fallback = document.createElement('span');
        fallback.className =
          'flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-sm md:h-12 md:w-12 lg:h-14 lg:w-14';
        fallback.textContent = 'DM';
        parent.appendChild(fallback);
      }}
    />
  </div>
);

// ---------- Sidebar Item ----------
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-primary-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

// ---------- Main Dashboard ----------
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('Cashier');
  const [isAdmin, setIsAdmin] = useState(false);
  const [cashierId, setCashierId] = useState('');
  const [branch, setBranch] = useState('');
  const [lastLogin, setLastLogin] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Cashier';
    const admin = localStorage.getItem('isAdmin') === 'true';
    const id = localStorage.getItem('cashierId') || '';
    const br = localStorage.getItem('branch') || 'N/A';
    const stored = localStorage.getItem('lastLogin');
    if (stored) {
      try {
        setLastLogin(format(new Date(stored), 'dd MMM yyyy, hh:mm a'));
      } catch (e) {
        setLastLogin('—');
      }
    } else {
      setLastLogin('—');
    }
    setUserName(name);
    setIsAdmin(admin);
    setCashierId(id);
    setBranch(br);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cashierId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userName');
    localStorage.removeItem('branch');
    localStorage.removeItem('lastLogin');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path === '/admin') return 'admin';
    if (path === '/closing') return 'closing';
    if (path === '/all-reports') return 'all-reports';
    if (path === '/period-report') return 'period';
    if (path === '/how-to-use') return 'help';
    if (path === '/all-users') return 'users';
    if (path === '/admin/messages') return 'messages';
    if (path === '/developer') return 'developer';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  useEffect(() => {
    setSidebarOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <Logo />
          <button className="lg:hidden p-1 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {isAdmin ? (
            <>
              <SidebarItem icon={<DashboardIcon />} label="Cashier Dashboard" active={activeTab === 'dashboard'} onClick={() => navigate('/dashboard')} />
              <SidebarItem icon={<DashboardIcon />} label="Admin Dashboard" active={activeTab === 'admin'} onClick={() => navigate('/admin')} />
            </>
          ) : (
            <SidebarItem icon={<DashboardIcon />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => navigate('/dashboard')} />
          )}
          <SidebarItem icon={<ReportsIcon />} label="Closing Report" active={activeTab === 'closing'} onClick={() => navigate('/closing')} />
          <SidebarItem icon={<AllReportsIcon />} label="All Reports" active={activeTab === 'all-reports'} onClick={() => navigate('/all-reports')} />
          <SidebarItem icon={<CalendarIcon />} label="Period Report" active={activeTab === 'period'} onClick={() => navigate('/period-report')} />
          {isAdmin && (
            <>
              <SidebarItem icon={<UsersIcon />} label="All Users" active={activeTab === 'users'} onClick={() => navigate('/all-users')} />
              <SidebarItem icon={<FiMail className="w-5 h-5" />} label="Messages" active={activeTab === 'messages'} onClick={() => navigate('/admin/messages')} />
            </>
          )}
          <SidebarItem icon={<HelpIcon />} label="Developer" active={activeTab === 'developer'} onClick={() => navigate('/developer')} />
          <SidebarItem icon={<HelpIcon />} label="System" active={activeTab === 'system'} onClick={() => navigate('/system')}/>
          <SidebarItem icon={<HelpIcon />} label="How to Use" active={activeTab === 'help'} onClick={() => navigate('/how-to-use')} />
        </nav>
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <SidebarItem icon={<LogoutIcon />} label="Logout" active={false} onClick={handleLogout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </button>
              <Logo />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <InstallApp />
              <NotificationBell />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 md:gap-3 focus:outline-none group"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs sm:text-sm group-hover:bg-primary-200 transition">
                    {initials || 'CA'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-primary transition truncate max-w-[80px] md:max-w-[120px]">
                      {userName}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-400">Cashier</p>
                  </div>
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                          {initials || 'CA'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{userName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span> Cashier
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400 font-medium">Cashier ID</p>
                          <p className="text-gray-800 font-semibold truncate">{cashierId || '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium">Branch</p>
                          <p className="text-gray-800 font-semibold truncate">{branch || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Last login: <span className="font-medium text-gray-700">{lastLogin}</span>
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/change-password"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Change Password
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="p-3 sm:p-4 md:p-6">
          <WhatsNewModal />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;