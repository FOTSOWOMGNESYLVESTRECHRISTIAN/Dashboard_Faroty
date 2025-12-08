// src/services/tokenStorage.ts

const TEMP_TOKEN_KEY = 'temp_token';
const TEMP_TOKEN_EXPIRES_AT_KEY = 'temp_token_expires_at';
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_PROFILE_KEY = 'user_profile';

export const setTempToken = (token: string, expiresAtMs?: number): void => {
  localStorage.setItem(TEMP_TOKEN_KEY, token);
  if (typeof expiresAtMs === 'number') {
    localStorage.setItem(TEMP_TOKEN_EXPIRES_AT_KEY, String(expiresAtMs));
  } else {
    localStorage.removeItem(TEMP_TOKEN_EXPIRES_AT_KEY);
  }
};

export const getTempToken = (): string | null => {
  return localStorage.getItem(TEMP_TOKEN_KEY);
};

export const clearTempToken = (): void => {
  localStorage.removeItem(TEMP_TOKEN_KEY);
  localStorage.removeItem(TEMP_TOKEN_EXPIRES_AT_KEY);
};

export const getTempTokenExpiresAt = (): number | null => {
  const v = localStorage.getItem(TEMP_TOKEN_EXPIRES_AT_KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const getTempTokenRemainingSeconds = (): number | null => {
  const exp = getTempTokenExpiresAt();
  if (!exp) return null;
  const remaining = Math.max(0, Math.floor((exp - Date.now()) / 1000));
  return remaining;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAllTokens = (): void => {
  clearTempToken();
  clearAuthToken();
  clearRefreshToken();
  clearUserProfile();
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    // Vérifier si le token est expiré (basique)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const setUserProfile = (user: any): void => {
  if (!user) {
    localStorage.removeItem(USER_PROFILE_KEY);
    return;
  }
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  } catch {
    localStorage.setItem(USER_PROFILE_KEY, '');
  }
};

export const getUserProfile = <T = any>(): T | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const clearUserProfile = (): void => {
  localStorage.removeItem(USER_PROFILE_KEY);
};

// Dans tokenStorage.ts
export const decodeToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};