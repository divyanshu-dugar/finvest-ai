// Pages reachable without signing in.
// The email-link pages work whether or not someone is signed in.
export const PUBLIC_PATHS = [
  '/', '/login', '/register', '/privacy', '/terms', '/forgot-password', '/reset-password', '/verify-email',
];

// Signed-in pages shown full screen, without the app sidebar.
export const FOCUS_PATHS = ['/welcome'];

// Auth forms: signed-in users are sent to the dashboard instead.
export const AUTH_PATHS = ['/login', '/register', '/forgot-password'];
