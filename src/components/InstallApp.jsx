// src/components/InstallApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [activeDevice, setActiveDevice] = useState('desktop');
  const menuRef = useRef(null);
  const instructionsRef = useRef(null);

  // Detect device type
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setDeviceType('android');
      setActiveDevice('android');
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
      setActiveDevice('ios');
    } else {
      setDeviceType('desktop');
      setActiveDevice('desktop');
    }
  }, []);

  // Check if already installed
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const handler = (e) => {
      if (e.matches) setIsInstalled(true);
    };
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (instructionsRef.current && !instructionsRef.current.contains(event.target)) {
        setShowInstructions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary install handler
  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Installation not available. Try using the browser menu.');
      return;
    }
    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        toast.success('🎉 App installed successfully!');
        setIsInstallable(false);
        setDeferredPrompt(null);
        setIsInstalled(true);
      } else {
        toast('Installation declined');
      }
    } catch (err) {
      toast.error('Installation failed. Please try again.');
    }
  };

  // Open instructions modal
  const openInstructions = () => {
    setShowInstructions(true);
    setActiveDevice(deviceType);
  };

  // Device instructions data
  const getDeviceInstructions = (device) => {
    const instructions = {
      desktop: {
        title: 'Desktop Installation',
        icon: '🖥️',
        steps: [
          'Click the "Install App" button or the install icon in the address bar',
          'Click "Install" in the popup window',
          'The app will be added to your desktop or start menu',
        ],
      },
      android: {
        title: 'Android Installation',
        icon: '📱',
        steps: [
          'Tap the "Install App" button or the menu icon (⋮) in Chrome',
          'Select "Add to Home Screen" from the menu',
          'Tap "Add" to install the app on your home screen',
        ],
      },
      ios: {
        title: 'iOS Installation',
        icon: '🍎',
        steps: [
          'Tap the Share icon (📤) at the bottom of Safari',
          'Scroll down and select "Add to Home Screen"',
          'Tap "Add" in the top-right corner',
        ],
      },
    };
    return instructions[device] || instructions.desktop;
  };

  // If already installed, show a small indicator instead
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
        <span className="text-green-600">✅</span>
        <span className="text-xs text-green-700 font-medium">Installed</span>
      </div>
    );
  }

  const deviceInfo = getDeviceInstructions(activeDevice);

  return (
    <>
      {/* 3-dot menu button in header */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          aria-label="Install menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
          {isInstallable && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger rounded-full animate-pulse" />
          )}
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Install Options</p>
            </div>
            {isInstallable && (
              <button
                onClick={() => {
                  handleInstall();
                  setShowMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition hover:text-primary"
              >
                <span className="text-lg">📲</span>
                <span className="font-medium">Install App</span>
                <span className="text-xs text-gray-400 ml-auto">(1-click)</span>
              </button>
            )}
            <button
              onClick={() => {
                openInstructions();
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <span className="text-lg">📖</span>
              <span className="font-medium">Installation Guide</span>
            </button>
            <button
              onClick={() => {
                window.location.reload();
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
            >
              <span className="text-lg">🔄</span>
              <span className="font-medium">Refresh App</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Install Button – only shows when installable */}
      {isInstallable && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-slow">
          <button
            onClick={handleInstall}
            className="dmart-btn dmart-btn-primary shadow-lg shadow-primary/30 hover:shadow-primary/50"
          >
            <span className="text-2xl">📲</span>
            <div className="text-left">
              <p className="text-sm font-semibold">Install D-Mart App</p>
              <p className="text-xs opacity-80">One-click install</p>
            </div>
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">FREE</span>
          </button>
        </div>
      )}

      {/* Installation Guide Modal (always accessible via the 3‑dot menu) */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            ref={instructionsRef}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>{deviceInfo.icon}</span>
                  {deviceInfo.title}
                </h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Device Selector Icons */}
              <div className="flex justify-center gap-4 mb-4">
                {['desktop', 'android', 'ios'].map((dev) => {
                  const icons = { desktop: '🖥️', android: '📱', ios: '🍎' };
                  return (
                    <button
                      key={dev}
                      onClick={() => setActiveDevice(dev)}
                      className={`flex flex-col items-center p-2 rounded-xl transition ${
                        activeDevice === dev
                          ? 'bg-primary-50 border-2 border-primary shadow-md'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl">{icons[dev]}</span>
                      <span className="text-xs font-medium capitalize mt-1">{dev}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <span>💡</span>
                  {isInstallable
                    ? 'You can install this app on your device for a native experience!'
                    : 'Install the app to get offline access and a native app feel.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Follow these steps:</p>
                  <ol className="space-y-2">
                    {deviceInfo.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2 text-center">Scan QR to install</p>
                  <QRCode
                    value={window.location.href}
                    size={120}
                    level="H"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 break-all text-center">
                    {window.location.href}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {isInstallable && (
                  <button
                    onClick={() => {
                      handleInstall();
                      setShowInstructions(false);
                    }}
                    className="dmart-btn dmart-btn-primary flex-1"
                  >
                    <span>📲</span> Install Now
                  </button>
                )}
                <button
                  onClick={() => setShowInstructions(false)}
                  className={isInstallable ? 'dmart-btn bg-gray-200 text-gray-700 hover:bg-gray-300' : 'dmart-btn w-full bg-gray-200 text-gray-700 hover:bg-gray-300'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind animation for floating button */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default InstallApp;