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

// Endpoints that count against the plan's monthly usage (see finvest-ai-api/config/plans.js).
// Also companies (added/deleted), which count against the plan's workspace cap.
const METERED_PATH = /\/(api\/(research-message|sec\/analyze|swot|summary|extract\/table)|documents(\/ingest)?|companies(\/[a-f\d]{24})?)$/;

export const USAGE_CHANGED_EVENT = 'finvest:usage-changed';
export const QUOTA_EXCEEDED_EVENT = 'finvest:quota-exceeded';

/** Tell the app when usage changed or a plan limit was hit, so the sidebar and upgrade dialog react. */
function announceUsage(url, options, response) {
  if (typeof window === 'undefined') return;
  if (response.status === 402) {
    response.clone().json()
      .then((body) => window.dispatchEvent(new CustomEvent(QUOTA_EXCEEDED_EVENT, { detail: body })))
      .catch(() => {});
  } else if (response.ok && (options.method || 'GET') !== 'GET' && METERED_PATH.test(new URL(url).pathname)) {
    window.dispatchEvent(new Event(USAGE_CHANGED_EVENT));
  }
}

/**
 * Authenticated fetch wrapper. Adds `Authorization: Bearer <token>`, and a JSON Content-Type
 * unless the body is FormData (the browser sets the multipart boundary itself).
 * Redirects to /login on 401.
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  announceUsage(url, options, response);
  return response;
}

/**
 * Error for a failed API response. Plan-limit errors (402) are flagged with `isQuota`, because the
 * app-wide upgrade dialog already explains them and callers shouldn't show a second message.
 */
export function apiError(res, data, fallback) {
  const err = new Error(data?.error || data?.message || fallback);
  err.isQuota = res.status === 402;
  return err;
}
