'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Read the CSRF double-submit cookie set by the IAM service on login/refresh
// so it can be echoed back in the X-CSRF-Token header on mutating requests.
export function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function withCsrfHeader(options) {
  const method = (options.method || 'GET').toUpperCase();
  if (SAFE_METHODS.has(method)) return options;

  const token = getCsrfToken();
  if (!token) return options;

  return {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': token,
    },
  };
}

/**
 * Custom fetch wrapper that handles authentication errors globally.
 * If a 401 or 403 response is received, the user is redirected to login.
 * 
 * Usage:
 *   const { apiFetch } = useApi();
 *   const data = await apiFetch('/api/grades');
 */
export function useApi() {
  const router = useRouter();
  const { logout } = useAuth();

  const apiFetch = async (url, options = {}) => {
    // Ensure credentials are included for cookies
    const defaultOptions = withCsrfHeader({
      credentials: 'include',
      ...options,
    });

    const response = await fetch(url, defaultOptions);

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Clear auth state and redirect to login
      await logout();
      router.push('/login');
      // Return a rejected promise to stop further processing
      return Promise.reject(new Error('Authentication required'));
    }

    return response;
  };

  return { apiFetch };
}

/**
 * Standalone fetch wrapper for use in non-hook contexts
 * (e.g., server components, utility functions)
 */
export async function apiFetchStandalone(url, options = {}) {
  const defaultOptions = withCsrfHeader({
    credentials: 'include',
    ...options,
  });

  const response = await fetch(url, defaultOptions);

  if (response.status === 401 || response.status === 403) {
    // In a non-hook context, we can't use router.push
    // Just throw an error that the caller should handle
    throw new Error('Authentication required - redirect to login');
  }

  return response;
}
