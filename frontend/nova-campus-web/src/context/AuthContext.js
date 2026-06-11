'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCsrfToken } from '@/lib/api';

const AuthContext = createContext(null);

const API_BASE = '/api/auth'; // Proxied through nginx in full stack

// Delay before retrying the SSE connection after it drops.
const EVENTS_RETRY_DELAY_MS = 2000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsVersion, setSessionsVersion] = useState(0);
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

  // Subscribe to the server's session event stream so that revoking this
  // session from another device signs the user out immediately, and so the
  // sessions list updates in real time without polling.
  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;
    let source;
    let retryTimeout;

    const forceLogout = () => {
      setUser(null);
      localStorage.removeItem('authToken');
      router.replace('/login');
    };

    const connect = () => {
      if (cancelled) return;

      source = new EventSource(`${API_BASE}/events`, { withCredentials: true });

      source.addEventListener('session-revoked', () => {
        source.close();
        forceLogout();
      });

      source.addEventListener('sessions-changed', () => {
        setSessionsVersion((v) => v + 1);
      });

      source.onerror = async () => {
        source.close();
        if (cancelled) return;

        // The connection may have dropped because the access token expired.
        // Try to refresh it before reconnecting; if that also fails the
        // session is gone, so sign out.
        try {
          await refreshAccessToken();
          retryTimeout = setTimeout(connect, EVENTS_RETRY_DELAY_MS);
        } catch (err) {
          forceLogout();
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      clearTimeout(retryTimeout);
    };
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
    sessionsVersion,
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
