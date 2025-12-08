import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import { normalizePhoneNumber } from "../utils/phoneUtils";
import { getAuthToken, decodeToken } from "./tokenStorage";
import { AxiosError } from "axios";

type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      data?: T;
      error?: any;
      errorCode?: any;
      content?: T;
      items?: T;
      records?: T;
    };

export interface ApiUser {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  accountStatus: string;
  lastLogin: number | null;
  createdAt: number;
  countryName: string | null;
  languageName: string | null;
  active: boolean;
  guest: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: "admin" | "user" | "moderator";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin: string | null;
  countryName: string | null;
  languageName: string | null;
  subscriptions: string[];
  applications: string[];
}

const unwrap = <T = any>(payload: ApiEnvelope<T>): T => {
  if (!payload) return payload as T;

  if (Array.isArray(payload)) {
    return payload as T;
  }

  if (typeof payload === "object") {
    const obj = payload as Record<string, any>;

    // Structure: { success, message, data: [...] }
    if (Array.isArray(obj.data)) return obj.data as T;

    // Structure: { data: { content: [...] } }
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      const nested = obj.data;
      if (Array.isArray(nested.content)) return nested.content as T;
      if (Array.isArray(nested.items)) return nested.items as T;
      if (Array.isArray(nested.records)) return nested.records as T;
      return nested as T;
    }

    // Structure: { content: [...] }
    if (Array.isArray(obj.content)) return obj.content as T;

    // Structure: { items: [...] }
    if (Array.isArray(obj.items)) return obj.items as T;

    // Structure: { records: [...] }
    if (Array.isArray(obj.records)) return obj.records as T;
  }

  return payload as T;
};

// Convertir un timestamp en string ISO
const formatDateFromTimestamp = (timestamp: number | null | undefined): string | null => {
  if (!timestamp) return null;
  const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

// Normaliser le statut de l'API vers le format attendu par le composant
const normalizeStatus = (accountStatus: string, active: boolean): "active" | "inactive" | "suspended" => {
  if (!active) return "inactive";
  
  const upperStatus = accountStatus?.toUpperCase() || "";
  if (upperStatus === "ACTIVE" || upperStatus === "VERIFIED" || upperStatus === "EMAIL_VERIFIED") {
    return "active";
  }
  if (upperStatus === "SUSPENDED" || upperStatus === "BANNED") {
    return "suspended";
  }
  return "inactive";
};

// Normaliser le rôle - par défaut "user" car l'API ne fournit pas de rôle
const normalizeRole = (fullName?: string): "admin" | "user" | "moderator" => {
  // Si le nom contient "admin" ou "Admin", on considère que c'est un admin
  if (fullName?.toLowerCase().includes("admin")) {
    return "admin";
  }
  return "user";
};

// Normaliser un utilisateur de l'API vers le format attendu par le composant
const normalizeUser = (raw: ApiUser): User => {
  return {
    id: raw.id,
    name: raw.fullName || "Utilisateur sans nom",
    email: raw.email || raw.phoneNumber || "Non renseigné",
    phoneNumber: normalizePhoneNumber(raw.phoneNumber),
    profilePictureUrl: raw.profilePictureUrl,
    role: normalizeRole(raw.fullName),
    status: normalizeStatus(raw.accountStatus, raw.active),
    createdAt: formatDateFromTimestamp(raw.createdAt) || new Date().toISOString(),
    lastLogin: formatDateFromTimestamp(raw.lastLogin),
    countryName: raw.countryName,
    languageName: raw.languageName,
    subscriptions: [], // Cette information n'est pas disponible dans l'API
    applications: [], // Cette information n'est pas disponible dans l'API
  };
};

// Dans userService.ts
// Interface pour les erreurs API
export interface ApiError extends Error {
  response?: {
    status: number;
    data?: any;
    headers?: any;
  };
  request?: any;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      // Vérifier le token d'authentification
      const token = getAuthToken();
      if (!token) {
        throw new Error("Aucun token d'authentification trouvé");
      }

      // Décoder le token pour le débogage
      try {
        const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        const decoded = decodeToken(tokenValue);
        console.log('[userService] Token payload:', decoded);
      } catch (tokenError) {
        console.warn('[userService] Erreur lors du décodage du token:', tokenError);
      }

      console.log('[userService] Récupération des utilisateurs depuis:', API_ENDPOINTS.USERS.BASE);
      
      // Faire la requête avec gestion des erreurs détaillée
      const response = await apiClient.get<ApiEnvelope<any>>(API_ENDPOINTS.USERS.BASE);
      console.log('[userService] Réponse de l\'API:', response);

      // Vérifier si la réponse est vide ou non définie
      if (!response) {
        console.error('[userService] Réponse vide de l\'API');
        return [];
      }

      // Essayer de déballer la réponse
      let list;
      try {
        list = unwrap<ApiUser[]>(response);
        console.log('[userService] Liste déballée:', list);
      } catch (unwrapError) {
        console.warn('[userService] Format de réponse inattendu, tentative de récupération directe des données');
        // Essayer de récupérer directement les données si la structure est différente
        if (Array.isArray(response)) {
          list = response;
        } else if (response && typeof response === 'object' && 'data' in response) {
          list = response.data;
        } else {
          console.error('[userService] Format de réponse inconnu:', response);
          throw new Error('Format de réponse inattendu de l\'API');
        }
      }

      // S'assurer que nous avons un tableau
      const usersList = Array.isArray(list) ? list : [list].filter(Boolean);
      console.log(`[userService] ${usersList.length} utilisateurs trouvés`);

      // Normaliser chaque utilisateur
      return usersList.map(user => {
        try {
          return normalizeUser(user);
        } catch (normalizeError) {
          console.error('[userService] Erreur de normalisation pour l\'utilisateur:', user, normalizeError);
          // Retourner un utilisateur par défaut en cas d'erreur
          return {
            id: user?.id || 'unknown-' + Math.random().toString(36).substr(2, 9),
            name: user?.fullName || 'Utilisateur invalide',
            email: user?.email || 'invalide@example.com',
            phoneNumber: user?.phoneNumber || null,
            profilePictureUrl: user?.profilePictureUrl || null,
            role: 'user',
            status: 'inactive',
            createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
            lastLogin: user?.lastLogin ? new Date(user.lastLogin).toISOString() : null,
            countryName: user?.countryName || null,
            languageName: user?.languageName || null,
            subscriptions: [],
            applications: []
          };
        }
      });
    } catch (error) {
      console.error("[userService] Erreur lors de la récupération des utilisateurs:", error);
      
      // Gestion détaillée des erreurs
      const apiError = error as ApiError;
      
      if (apiError.response) {
        console.error('Détails de la réponse d\'erreur:', {
          status: apiError.response.status,
          headers: apiError.response.headers,
          data: apiError.response.data
        });
        
        // Gestion spécifique des codes d'erreur
        if (apiError.response.status === 401) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        } else if (apiError.response.status === 403) {
          throw new Error("Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.");
        } else if (apiError.response.status === 404) {
          console.warn('Endpoint non trouvé, vérifiez la configuration des API');
          return [];
        }
        
        // Essayer d'extraire un message d'erreur de la réponse
        const errorMessage = apiError.response.data?.message || 
                            apiError.response.data?.error ||
                            `Erreur serveur (${apiError.response.status})`;
        throw new Error(errorMessage);
      } else if (apiError.request) {
        console.error('Aucune réponse reçue du serveur:', apiError.request);
        throw new Error("Le serveur ne répond pas. Veuillez vérifier votre connexion Internet.");
      } else {
        console.error('Erreur lors de la configuration de la requête:', apiError.message);
        throw new Error(`Erreur de configuration: ${apiError.message}`);
      }
    }
  },
};
