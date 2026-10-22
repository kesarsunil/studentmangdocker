// Centralized API configuration & Automatic Endpoint Interceptor
// In local development: VITE_API_URL is empty, so requests like /api/... use Vite's dev proxy
// In Vercel / production: set VITE_API_URL (e.g. https://your-backend.vercel.app) in Frontend Environment Variables
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Intercept window.fetch so all relative '/api/...' calls automatically prepend the backend URL if configured
if (typeof window !== 'undefined' && API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${API_BASE_URL}${input}`;
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${API_BASE_URL}${input.url}`, input);
    }
    return originalFetch.call(this, input, init);
  };
  console.info(`[AttendSphere] Connected to Backend at: ${API_BASE_URL}`);
}

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
