'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [count, setCount] = useState(0);

  // Initialize count based on role (demo data). Resets on login/role change.
  useEffect(() => {
    if (loading || !isAuthenticated || !user) {
      setCount(0);
      return;
    }
    const role = (user.role || 'student').toLowerCase();
    let initial = 0;
    if (role === 'student') initial = 3;
    else if (role === 'teacher') initial = 1;
    else if (role === 'admin') initial = 4;
    // executive stays low or 0 for demo
    setCount(initial);
  }, [user, isAuthenticated, loading]);

  // Live updates: simulate incoming notifications over time without requiring refresh.
  // This makes the badge appear/increase/disappear live as the count changes in React state.
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      // Occasional new notification (demo liveliness, ~every 45-90s on average)
      if (Math.random() < 0.25) {
        setCount((c) => Math.min(9, c + 1));
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
