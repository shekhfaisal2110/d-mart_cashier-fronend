// src/components/WhatsNewModal.jsx
import React, { useState, useEffect } from 'react';

const VERSION = '1.2.0';
const CHANGELOG = [
  '🔁 Duplicate Last Report – save time!',
  '📊 Entries Today counter on dashboard.',
  '📅 One report per day – edit existing entry.',
  '📤 Export Selected rows from All Reports.',
  '🕒 Last login shown in profile.',
  '✨ Performance improvements and bug fixes.',
];

const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('whatsNewVersion');
    if (lastSeen !== VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('whatsNewVersion', VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 What's New</h3>
        <p className="text-sm text-gray-500 mb-4">Version {VERSION}</p>
        <ul className="space-y-2 mb-6">
          {CHANGELOG.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={handleClose}
          className="dmart-btn dmart-btn-primary w-full"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default WhatsNewModal;