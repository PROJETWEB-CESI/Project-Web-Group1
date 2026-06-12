'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [count, setCount] = useState(0);

  // Reset to 0 on logout
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) setCount(0);
  }, [user, isAuthenticated, loading]);

  const clearNotifications = () => setCount(0);
  const markOneRead = () => setCount((c) => Math.max(0, c - 1));

  return (
    <NotificationContext.Provider
      value={{ notificationCount: count, clearNotifications, markOneRead, setNotificationCount: setCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Safe fallback if used outside provider (e.g. public pages)
    return {
      notificationCount: 0,
      clearNotifications: () => {},
      markOneRead: () => {},
      setNotificationCount: () => {},
    };
  }
  return context;
}
