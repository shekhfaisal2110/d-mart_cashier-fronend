import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SystemDashboard = () => {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [apiResponseTime, setApiResponseTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = performance.now();
        const res = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
        const end = performance.now();
        setApiResponseTime(Math.round(end - start));
        setApiStatus(res.data.status === 'ok' ? '✅ Online' : '⚠️ Degraded');
        setDbStatus(res.data.database === 'connected' ? '✅ Connected' : '❌ Disconnected');
      } catch {
        setApiStatus('❌ Offline');
        setDbStatus('❌ Unknown');
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'Recharts', 'jsPDF'] },
    { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'Mongoose'] },
    { category: 'Authentication', items: ['JWT', 'bcryptjs'] },
    { category: 'PWA', items: ['Service Worker', 'Web App Manifest', 'Workbox'] },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🖥️ System Dashboard</h2>
          <p className="text-sm text-gray-500">System health & tech stack</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">v1.2.0</span>
      </div>

      {/* System Health */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-800">🖥️ System Health</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="spinner-sm" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">API Status</p>
                <p className="text-lg font-semibold text-gray-800">{apiStatus}</p>
                <p className="text-xs text-gray-400 mt-1">{apiResponseTime}ms response time</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Database</p>
                <p className="text-lg font-semibold text-gray-800">{dbStatus}</p>
                <p className="text-xs text-gray-400 mt-1">MongoDB</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Environment</p>
                <p className="text-lg font-semibold text-gray-800">
                  {import.meta.env.PROD ? '🚀 Production' : '🧪 Development'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Built with Vite</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-800">📚 Tech Stack</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((stack, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-primary">{stack.category}</p>
                <ul className="mt-2 space-y-1">
                  {stack.items.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-800">🌐 Environment</h3>
        </div>
        <div className="card-body space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">App Name</span>
            <span className="font-medium text-gray-800">D-Mart Cashier</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Version</span>
            <span className="font-medium text-gray-800">1.2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">API Base</span>
            <span className="font-medium text-gray-800">{API_BASE}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Build Date</span>
            <span className="font-medium text-gray-800">{format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;