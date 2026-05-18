/**
 * Centralized API client with automatic token refresh on 401 errors.
 * Handles JWT token expiration gracefully.
 */

const API_BASE = '/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

/**
 * Refresh the JWT access token using the refresh token
 */
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access);
  
  return data.access;
}

/**
 * Handle 401 Unauthorized errors
 * Tries to refresh token, otherwise redirects to login
 */
async function handle401() {
  if (isRefreshing) {
    // Queue subsequent requests while refresh is in progress
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshToken();
    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    processQueue(error, null);
    // Clear auth state and dispatch event to notify React
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event('tokenExpired'));
    window.location.href = '/admin/login';
    throw error;
  }
}

/**
 * Main fetch wrapper with automatic 401 handling
 * @param {string} url - The API endpoint
 * @param {object} options - Fetch options
 * @param {boolean} retry - Internal flag to prevent infinite retries
 */
export async function apiCall(url, options = {}, retry = true) {
  const token = localStorage.getItem('token');
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && retry) {
    try {
      const newToken = await handle401();
      if (newToken) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    } catch (error) {
      // Token refresh failed, let it fall through to error handling below
      console.error('Token refresh failed:', error);
    }
  }

  // Check for other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response;
}

/**
 * GET request wrapper
 */
export async function get(url, options = {}) {
  const response = await apiCall(url, { ...options, method: 'GET' });
  return response.json();
}

/**
 * POST request wrapper
 */
export async function post(url, body, options = {}) {
  const response = await apiCall(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * PUT request wrapper
 */
export async function put(url, body, options = {}) {
  const response = await apiCall(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * PATCH request wrapper
 */
export async function patch(url, body, options = {}) {
  const response = await apiCall(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * DELETE request wrapper
 */
export async function del(url, options = {}) {
  const response = await apiCall(url, { ...options, method: 'DELETE' });
  
  // DELETE might return 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

/**
 * Helper to get auth header
 */
export function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
