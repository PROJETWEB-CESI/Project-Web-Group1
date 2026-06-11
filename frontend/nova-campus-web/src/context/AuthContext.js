'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCsrfToken } from '@/lib/api';

const AuthContext = createContext(null);

const API_BASE = '/api/auth'; // Proxied through nginx in full stack

// How often to check that the current session is still valid, so a session
// revoked from another device signs this device out without a manual refresh.
const SESSION_CHECK_INTERVAL_MS = 15000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to refresh access token using httpOnly refresh cookie
  const refreshAccessToken = async () => {
    const csrfToken = getCsrfToken();
    const res = await fetch(`${API_BASE}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
    });
    if (!res.ok) {
      throw new Error('Failed to refresh session');
    }
    return true;
  };

  // Load user from cookie-based session on mount (no token in localStorage anymore)
  useEffect(() => {
    const loadUser = async () => {
      try {
        let res = await fetch(`${API_BASE}/me`, {
          credentials: 'include',
        });

        if (res.status === 401) {
          // Access token expired (short lived), try refresh using httpOnly refresh cookie
          await refreshAccessToken();
          res = await fetch(`${API_BASE}/me`, {
            credentials: 'include',
          });
        }

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Periodically verify the session is still valid so that revoking it from
  // another device signs this device out without needing a manual refresh.
  useEffect(() => {
    if (loading || !user) return;

    const checkSession = async () => {
      try {
        let res = await fetch(`${API_BASE}/me`, { credentials: 'include' });

        if (res.status === 401) {
          try {
            await refreshAccessToken();
            res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
          } catch (err) {
            res = null;
          }
        }

        if (!res || !res.ok) {
          setUser(null);
          localStorage.removeItem('authToken');
          router.replace('/login');
        }
      } catch (err) {
        // Network error: ignore, will retry on next interval
      }
    };

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loading, user, router]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // important for httpOnly cookies to be set by browser
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);

    return data.user; // Return for redirect logic
  };

  const logout = async () => {
    try {
      const csrfToken = getCsrfToken();
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
      });
    } catch (e) {
      // ignore network errors on logout
    }
    // clean up any legacy localStorage token
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
