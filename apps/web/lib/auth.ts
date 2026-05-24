/**
 * Authentication helper functions for the web application
 * Provides utilities for getting current user, auth token management, and session handling
 */

import { apiGet, apiPost } from './api';

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: 'USER' | 'ADMIN';
  accountType?: 'TRAVELER' | 'TRANSPORTER';
  avatarUrl?: string | null;
  phoneNumber?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  user: User;
  token?: string;
  expiresAt?: number;
};

/**
 * Get the current authenticated user
 * Fetches user data from the API endpoint
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await apiGet<User>('/auth/me');
    return user || null;
  } catch (error) {
    // User is not authenticated or API call failed
    console.debug('Failed to fetch current user:', error);
    return null;
  }
}

/**
 * Get the current authentication session
 * Fetches both user and session information
 * @returns AuthSession object if authenticated, null otherwise
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const session = await apiGet<AuthSession>('/auth/session');
    return session || null;
  } catch (error) {
    console.debug('Failed to fetch auth session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns true if user has valid auth token, false otherwise
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(localStorage.getItem('auth_token'));
}

/**
 * Set authentication token
 * @param token - JWT token from API
 * @param expiresIn - Token expiration time in seconds (optional)
 */
export function setAuthToken(token: string, expiresIn?: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);

    const maxAge = expiresIn ?? 2592000;
    const expiresAt = Date.now() + maxAge * 1000;
    localStorage.setItem('auth_token_expires_at', String(expiresAt));

    // Save to document.cookie so server-side middleware can read it
    document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

/**
 * Get stored authentication token
 * @returns Auth token if available, null otherwise
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

/**
 * Check if authentication token is expired
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const expiresAtStr = localStorage.getItem('auth_token_expires_at');
  if (!expiresAtStr) {
    return false; // No expiration info, assume valid
  }

  const expiresAt = Number.parseInt(expiresAtStr, 10);
  return Date.now() > expiresAt;
}

/**
 * Clear authentication data
 * Removes auth token and session information
 */
export function clearAuthData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_expires_at');
    localStorage.removeItem('auth_user');

    // Clear access_token cookie
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

/**
 * Perform logout
 * Clears local auth data and optionally calls logout endpoint
 * @param callApi - Whether to call the logout API endpoint (default: true)
 */
export async function logout(callApi: boolean = true): Promise<void> {
  if (callApi) {
    try {
      await apiPost('/auth/logout');
    } catch (error) {
      console.debug('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    }
  }

  clearAuthData();
}

/**
 * Get user role for authorization checks
 * @returns User role if authenticated, null otherwise
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

/**
 * Check if user has specific role
 * @param role - Role to check for
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(role: string): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 * @param roles - Array of roles to check
 * @returns true if user has any of the roles, false otherwise
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole ? roles.includes(userRole) : false;
}
