export function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * Authenticated fetch wrapper. Automatically adds Authorization: Bearer <token>
 * and Content-Type: application/json headers.
 * Redirects to /login on 401.
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  return response;
}

