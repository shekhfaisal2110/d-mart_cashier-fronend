// src/context/RefreshContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // No JSX – using React.createElement
  return React.createElement(
    RefreshContext.Provider,
    { value: { refreshKey, refresh } },
    children
  );
};

export const useRefresh = () => useContext(RefreshContext);