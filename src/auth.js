/**
 * DEMO AUTHENTICATION ONLY — for hackathon/demo purposes.
 * No Firebase Auth, no OAuth, no server validation.
 * Credentials are hardcoded: admin / admin.
 * Login state is stored in localStorage so the portal stays "logged in" across refreshes.
 *
 * Why demo auth: Simplifies the hackathon demo; no backend or OAuth setup required.
 * In production you would use Firebase Auth or another identity provider.
 */

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin';
const AUTH_KEY = 'incident-portal-demo-user';

/**
 * Check if the provided credentials match the demo user.
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
export function validateDemoCredentials(username, password) {
  return username === DEMO_USERNAME && password === DEMO_PASSWORD;
}

/**
 * Get the currently logged-in user from localStorage (demo only).
 * @returns {string | null} Username or null if not logged in
 */
export function getCurrentUser() {
  return localStorage.getItem(AUTH_KEY);
}

/**
 * Set login state (store username in localStorage).
 * @param {string} username
 */
export function setLoggedIn(username) {
  localStorage.setItem(AUTH_KEY, username);
}

/**
 * Clear login state (logout).
 */
export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Check if user is authenticated (demo: has stored username).
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}
