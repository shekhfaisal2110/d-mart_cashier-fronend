// src/components/PageNotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="card max-w-md w-full text-center">
        <div className="card-body">
          <div className="text-7xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
          <p className="text-gray-500 mb-6">
            Oops! The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/dashboard" className="dmart-btn dmart-btn-primary inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;