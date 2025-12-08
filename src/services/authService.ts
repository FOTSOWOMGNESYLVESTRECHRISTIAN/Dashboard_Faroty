// src/services/authService.ts
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import {
  setTempToken,
  setAuthToken,
  setRefreshToken,
  clearAllTokens,
  setUserProfile,
} from "./tokenStorage";

const env =
  typeof import.meta !== "undefined" && (import.meta as any).env
    ? ((import.meta as any).env as Record<string, string | undefined>)
    : undefined;

const SERVICE_AUTH_HEADER =
  env?.VITE_SERVICE_AUTH_HEADER?.trim() || "Authorization";
const SERVICE_AUTH_SCHEME =
  env?.VITE_SERVICE_AUTH_SCHEME?.trim() || "Bearer";
const SERVICE_AUTH_TOKEN = env?.VITE_SERVICE_AUTH_TOKEN?.trim() || "";

const buildServiceHeaders = (): HeadersInit => {
  if (!SERVICE_AUTH_TOKEN) return {};
  const value = SERVICE_AUTH_SCHEME
    ? `${SERVICE_AUTH_SCHEME} ${SERVICE_AUTH_TOKEN}`.trim()
    : SERVICE_AUTH_TOKEN;
  return {
    [SERVICE_AUTH_HEADER]: value,
  };
};

export interface LoginRequest {
  contact: string;
  deviceInfo: {
    deviceId: string;
    deviceType: 'MOBILE' | 'WEB' | 'DESKTOP';
    deviceModel: string;
    osName: string;
  };
}

export interface LoginResponse {
  tempToken: string;
  message?: string;
}

export interface VerifyOtpRequest {
  contact: string;
  otpCode: string;
  tempToken: string;
  deviceInfo: {
    deviceId: string;
    deviceType: 'MOBILE' | 'WEB' | 'DESKTOP';
    deviceName: string;
    osName: string;
  };
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export const authService = {

  /** ======================
   *        LOGIN
   *  ====================== */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...buildServiceHeaders(),
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      // Erreur backend
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || `Erreur serveur (${response.status})`);
      }

      const payload = await response.json();
      const data = payload.data ?? payload;

      if (!data.tempToken) {
        throw new Error("Le serveur n'a pas renvoyé de tempToken.");
      }

      // TTL : 10 minutes
      const expiresAt = Date.now() + 10 * 60 * 1000;

      // ✔ On stocke le token temporaire
      setTempToken(data.tempToken, expiresAt);

      return {
        tempToken: data.tempToken,
        message: data.message ?? "OTP envoyé",
      };

    } catch (error: any) {
      if (/Failed to fetch/i.test(error.message)) {
        throw new Error(
          "Impossible de contacter le serveur. Vérifiez que le backend autorise votre domaine (CORS)."
        );
      }
      throw new Error(error.message || "Erreur inconnue lors du login.");
    }
  },

  /** ======================
   *     VERIFY OTP
   *  ====================== */
  async verifyOtp(credentials: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...buildServiceHeaders(),
        },
        body: JSON.stringify(credentials),
        mode: "cors",
        credentials: "include",
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || `Erreur OTP (${response.status})`);
      }

      const payload = await response.json();
      const data = payload.data ?? payload;

      if (!data.accessToken) {
        throw new Error("Token d'accès non fourni par le serveur");
      }

      // ✔ stockage des tokens
      setAuthToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUserProfile(data.user);

      return data;

    } catch (error: any) {
      if (/Failed to fetch/i.test(error.message)) {
        throw new Error(
          "Impossible de contacter le serveur pour vérifier l’OTP (CORS ou réseau)."
        );
      }
      throw new Error(error.message || "Erreur lors de la vérification de l'OTP.");
    }
  },

  /** ======================
   *        LOGOUT
   *  ====================== */
  async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } finally {
      clearAllTokens();
    }
  },

};
