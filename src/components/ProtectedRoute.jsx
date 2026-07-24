// import React, { useState, useEffect } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { auth } from '../firebase/firebase';
// import axios from 'axios';

// const ProtectedRoute = ({ children }) => {
//   const [user, loading] = useAuthState(auth);
//   const [verifying, setVerifying] = useState(true);
//   const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

//   useEffect(() => {
//     const ensureCashierId = async () => {
//       if (user) {
//         let cashierId = localStorage.getItem('cashierId');
//         if (!cashierId) {
//           try {
//             const res = await axios.get(`${API_BASE}/cashier/me?uid=${user.uid}`);
//             cashierId = res.data.cashierId;
//             localStorage.setItem('cashierId', cashierId);
//             // Update recent IDs
//             let recent = JSON.parse(localStorage.getItem('recentCashierIds') || '[]');
//             recent = recent.filter(id => id !== cashierId);
//             recent = [cashierId, ...recent].slice(0, 3);
//             localStorage.setItem('recentCashierIds', JSON.stringify(recent));
//           } catch (err) {
//             console.error('Failed to fetch cashierId:', err);
//           }
//         }
//       }
//       setVerifying(false);
//     };
//     ensureCashierId();
//   }, [user, API_BASE]);

//   if (loading || verifying) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
//         <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-red-600 border-t-transparent" />
//         <p className="text-sm sm:text-base text-gray-500 mt-4 animate-pulse">Loading...</p>
//       </div>
//     );
//   }
//   if (!user) return <Navigate to="/login" replace />;
//   const cashierId = localStorage.getItem('cashierId');
//   if (!cashierId) return <Navigate to="/login" replace />;
//   return children;
// };

// export default ProtectedRoute;













import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        // Verify token with backend (optional but recommended)
        const res = await axios.get(`${API_BASE}/auth/verify-token`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(res.data.valid);
      } catch (err) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('cashierId');
        localStorage.removeItem('isAdmin');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
        <p className="text-sm text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;