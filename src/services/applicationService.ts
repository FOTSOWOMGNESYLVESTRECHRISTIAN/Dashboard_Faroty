// src/services/applicationService.ts
// Déclaration de type pour process.env
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};

import { API_ENDPOINTS } from "../utils/apiEndpoints";
import { apiClient } from "../utils/apiClient";
import { getUserProfile } from "./tokenStorage";

export interface AppStats {
  totalUsers?: number;
  activeUsers?: number;
  monthlyRevenue?: number;
  totalTransactions?: number;
  successRate?: number;
  avgSession?: string;
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    monthlyRevenue?: number;
    totalTransactions?: number;
    successRate?: number;
    avgSession?: string;
  };
  [key: string]: any;
}

export interface ApplicationPayload {
  name: string;
  description: string;
  version: string;
  type: string;
  platform: string;
  iconUrl: string;
  websiteUrl: string;
  supportEmail: string;
  documentationUrl: string;
  configuration?: Record<string, unknown> | null;
  status?: string;
  isActive?: boolean;
}

export interface Application extends ApplicationPayload {
  id: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  hasTrialPolicy?: boolean;
  trialPolicyEnabled?: boolean;
  trialPeriodInDays?: number;
  unlimitedAccess?: boolean;
  abonnements?: number;
  logo?: string;
}

export interface FeaturePayload {
  name: string;
  description: string;
  type: string;
  category: string;
  applicationId: string;
}

export interface PlanPayload {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxStorage?: number;
  priority: number;
  applicationId: string;
  trialPeriodInDays?: number;
  active?: boolean;
  currencyCode?: string;
}

export interface Plan extends PlanPayload {
  id: string;
  status?: string;
  interval?: 'month' | 'year';
  createdAt?: string;
  updatedAt?: string;
  maxStorage?: number;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureId: string;
  included: boolean;
  quotaLimit?: number | null;
  feature?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface PlanFeatureAssignmentPayload {
  planId: string;
  featureId: string;
  quotaLimit?: number | null;
  included?: boolean;
}

export interface TrialPolicyPayload {
  applicationId: string;
  enabled: boolean;
  trialPeriodInDays: number;
  unlimitedAccess: boolean;
}

export interface TrialPolicy {
  id: string;
  applicationId: string;
  applicationName?: string;
  enabled: boolean;
  trialPeriodInDays: number;
  unlimitedAccess: boolean;
  createdAt?: number;
  updatedAt?: number;
}

type ApiEnvelope<T> =
  | T
  | {
    data?: T | { content?: T; items?: T; records?: T };
    content?: T;
    result?: T;
    items?: T;
    records?: T;
  };

const unwrap = <T = any>(payload: ApiEnvelope<T>): T => {
  if (!payload) return payload as T;

  if (Array.isArray(payload)) {
    return payload as T;
  }

  if (typeof payload === "object") {
    const obj = payload as Record<string, any>;

    // Structure: { success, message, data: { content: [...] } }
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      const nested = obj.data;
      if (Array.isArray(nested.content)) return nested.content as T;
      if (Array.isArray(nested.items)) return nested.items as T;
      if (Array.isArray(nested.records)) return nested.records as T;
      if (Array.isArray(nested.data)) return nested.data as T;
      // Si data.content n'existe pas mais que data est un objet, on retourne data
      return nested as T;
    }

    // Structure: { data: [...] }
    if (Array.isArray(obj.data)) return obj.data as T;

    // Structure: { content: [...] }
    if (Array.isArray(obj.content)) return obj.content as T;

    // Structure: { items: [...] }
    if (Array.isArray(obj.items)) return obj.items as T;

    // Structure: { records: [...] }
    if (Array.isArray(obj.records)) return obj.records as T;

    // Structure: { result: [...] } ou { result: {...} }
    if (obj.result && typeof obj.result === "object") {
      return obj.result as T;
    }
  }

  return payload as T;
};

const normalizeApplication = (raw: Record<string, any>): Application => {
  const fallbackId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Gérer createdAt qui peut être un timestamp numérique (en secondes dans la réponse Postman)
  let createdAt: string | null = null;
  if (raw.createdAt !== undefined && raw.createdAt !== null) {
    if (typeof raw.createdAt === "number") {
      // Le timestamp Postman est en secondes avec décimales (ex: 1763461335.915777000)
      // Si < 1e10, c'est en secondes, on multiplie par 1000 pour avoir des millisecondes
      // Si >= 1e10, c'est déjà en millisecondes
      const timestampMs = raw.createdAt < 1e10 ? raw.createdAt * 1000 : raw.createdAt;
      const date = new Date(timestampMs);
      createdAt = isNaN(date.getTime()) ? null : date.toISOString();
    } else {
      createdAt = raw.createdAt;
    }
  } else {
    createdAt = raw.created_at || raw.createdOn || raw.created_on || raw.creationDate || raw.createdDate || null;
  }

  // Gérer updatedAt qui peut être un timestamp numérique (en secondes dans la réponse Postman)
  let updatedAt: string | null = null;
  if (raw.updatedAt !== undefined && raw.updatedAt !== null) {
    if (typeof raw.updatedAt === "number") {
      // Le timestamp Postman est en secondes avec décimales (ex: 1763461335.915777000)
      // Si < 1e10, c'est en secondes, on multiplie par 1000 pour avoir des millisecondes
      // Si >= 1e10, c'est déjà en millisecondes
      const timestampMs = raw.updatedAt < 1e10 ? raw.updatedAt * 1000 : raw.updatedAt;
      const date = new Date(timestampMs);
      updatedAt = isNaN(date.getTime()) ? null : date.toISOString();
    } else {
      updatedAt = raw.updatedAt;
    }
  } else {
    updatedAt = raw.updated_at || raw.updatedOn || raw.updated_on || raw.updatedDate || null;
  }

  return {
    id:
      raw.id ||
      raw.applicationId ||
      raw.uuid ||
      raw.reference ||
      raw.code ||
      fallbackId,
    name: raw.name ?? raw.applicationName ?? "Sans nom",
    description: raw.description ?? "",
    version: raw.version ?? "",
    type: raw.type ?? raw.applicationType ?? "",
    platform: raw.platform ?? raw.platformType ?? "",
    iconUrl: raw.iconUrl ?? raw.iconURL ?? "",
    websiteUrl: raw.websiteUrl ?? raw.siteUrl ?? "",
    supportEmail: raw.supportEmail ?? raw.support_email ?? "",
    documentationUrl: raw.documentationUrl ?? raw.documentationURL ?? "",
    configuration: raw.configuration ?? null,
    // Gérer isActive qui peut être un booléen dans la réponse API
    status: raw.isActive === true ? "active" : (raw.isActive === false ? "inactive" : (raw.status ?? raw.state ?? null)),
    createdAt,
    updatedAt,
    // Informations sur la période d'essai
    hasTrialPolicy: raw.hasTrialPolicy ?? false,
    trialPolicyEnabled: raw.trialPolicyEnabled ?? false,
    trialPeriodInDays: raw.trialPeriodInDays ?? undefined,
    unlimitedAccess: raw.unlimitedAccess ?? undefined,
  };
};

// Helper pour nettoyer le payload et ne garder que les champs autorisés
const sanitizeApplicationPayload = (data: ApplicationPayload): Record<string, any> => {
  const { status, isActive, ...otherFields } = data;

  // Liste blanche des champs autorisés par le backend
  const allowedFields = [
    'name', 'description', 'version', 'type', 'platform',
    'iconUrl', 'websiteUrl', 'supportEmail', 'documentationUrl',
    'configuration'
  ];

  const payload: Record<string, any> = {};

  // Copier uniquement les champs autorisés
  for (const field of allowedFields) {
    // On vérifie si le champ existe dans les données (même si la valeur est null ou string vide)
    if (field in otherFields) {
      // @ts-ignore
      payload[field] = otherFields[field as keyof typeof otherFields];
    }
  }

  // Gérer la conversion status -> isActive
  payload.isActive = isActive !== undefined ? isActive : (status === 'active' || status === 'Active');

  // Si configuration est null, on le retire du payload car certains backends n'aiment pas null explicite
  if (payload.configuration === null) {
    delete payload.configuration;
  }

  return payload;
};

// Helper pour nettoyer le payload des plans
const sanitizePlanPayload = (data: PlanPayload): Record<string, any> => {
  const { maxStorage, active, ...otherFields } = data; // On extrait maxStorage pour l'exclure

  // Liste blanche des champs autorisés
  const allowedFields = [
    'name', 'description', 'monthlyPrice', 'yearlyPrice',
    'maxUsers', 'trialPeriodInDays', 'priority', 'applicationId',
    'currencyCode'
  ];

  const payload: Record<string, any> = {};

  // Copier uniquement les champs autorisés
  for (const field of allowedFields) {
    if (field in otherFields) {
      // @ts-ignore
      payload[field] = otherFields[field as keyof typeof otherFields];
    }
  }

  // Le backend attend "active" pour les plans (contrairement à "isActive" pour applications/feature updates)
  // On s'assure qu'il est présent, par défaut true
  payload.active = active !== undefined ? active : true;

  // Valeurs par défaut obligatoires si manquantes
  if (payload.trialPeriodInDays === undefined) payload.trialPeriodInDays = 0;
  if (payload.priority === undefined) payload.priority = 0;
  // @ts-ignore
  if (!payload.currencyCode && data.currencyCode) payload.currencyCode = data.currencyCode || 'XAF';
  if (!payload.currencyCode) payload.currencyCode = 'XAF';

  return payload;
};

export const applicationService = {
  // Récupérer toutes les applications
  async getAllApplications(): Promise<Application[]> {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(API_ENDPOINTS.ABONNEMENT.APPLICATIONS);
      const list = unwrap<any[]>(payload) ?? [];
      return (Array.isArray(list) ? list : [list].filter(Boolean)).map(normalizeApplication);
    } catch (error) {
      console.error("[applicationService] Error fetching applications:", error);
      console.warn("[applicationService] Falling back to bundled application catalog");
      return FALLBACK_APPLICATIONS.map(normalizeApplication);
    }
  },

  // Ajouter une application
  async addApplication(data: ApplicationPayload): Promise<Application> {
    try {
      const payloadData = sanitizeApplicationPayload(data);
      const payload = await apiClient.post<ApiEnvelope<any>>(API_ENDPOINTS.ABONNEMENT.APPLICATIONS, payloadData);
      const raw = unwrap<Record<string, any>>(payload);
      return normalizeApplication(raw);
    } catch (error) {
      console.error("[applicationService] Error adding application:", error, data);
      throw error instanceof Error ? error : new Error("Échec de l'ajout de l'application");
    }
  },

  // Modifier une application
  async updateApplication(id: string, data: ApplicationPayload): Promise<Application> {
    try {
      const payloadData = sanitizeApplicationPayload(data);
      const payload = await apiClient.put<ApiEnvelope<any>>(`${API_ENDPOINTS.ABONNEMENT.APPLICATIONS}/${id}`, payloadData);
      const raw = unwrap<Record<string, any>>(payload);
      return normalizeApplication(raw);
    } catch (error) {
      console.error("[applicationService] Error updating application:", error, { id, data });
      throw error instanceof Error ? error : new Error("Échec de la modification de l'application");
    }
  },

  // Supprimer une application
  async deleteApplication(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_ENDPOINTS.ABONNEMENT.APPLICATIONS}/${id}`);
    } catch (error) {
      console.error("[applicationService] Error deleting application:", error, { id });
      throw error instanceof Error ? error : new Error("Échec de la suppression de l'application");
    }
  },

  async getFeaturesByApplication(applicationId: string) {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(
        API_ENDPOINTS.ABONNEMENT.FEATURES_BY_APPLICATION(applicationId),
      );
      const list = unwrap<any[]>(payload) ?? [];
      return Array.isArray(list) ? list : [list].filter(Boolean);
    } catch (error) {
      console.error("[applicationService] Error fetching features:", error, { applicationId });
      throw error instanceof Error ? error : new Error("Impossible de récupérer les fonctionnalités");
    }
  },

  async getAllPlans() {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(API_ENDPOINTS.ABONNEMENT.PLANS);
      const raw = unwrap<any>(payload);
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.content)) return raw.content;
      if (raw && Array.isArray(raw.data)) return raw.data;
      return [];
    } catch (error) {
      console.error("[applicationService] Error fetching all plans:", error);
      throw error instanceof Error ? error : new Error("Impossible de récupérer les plans");
    }
  },

  async addFeature(data: FeaturePayload) {
    try {
      return await apiClient.post(API_ENDPOINTS.ABONNEMENT.FEATURES, data);
    } catch (error) {
      console.error("[applicationService] Error adding feature:", error, data);
      throw error instanceof Error ? error : new Error("Échec de la création de la fonctionnalité");
    }
  },

  async getPlansByApplication(applicationId: string, options: { signal?: AbortSignal } = {}) {
    // Délai d'attente de 10 secondes maximum
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Request timeout'), 10000);

    try {
      // Utiliser l'AbortSignal passé en paramètre ou créer un nouveau
      const signal = options.signal || controller.signal;

      const payload = await apiClient.get<ApiEnvelope<any>>(
        API_ENDPOINTS.ABONNEMENT.PLANS_BY_APPLICATION(applicationId),
        { signal }
      );

      clearTimeout(timeoutId);

      const list = unwrap<any[]>(payload) ?? [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }

      // Si pas de plans, retourner un tableau vide au lieu d'essayer de filtrer les plans globaux
      // pour éviter un double appel API inutile
      return [];

    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`[applicationService] Timeout when fetching plans for application ${applicationId}`);
          throw new Error('Le chargement des plans a pris trop de temps');
        }

        console.warn(`[applicationService] Error fetching plans by application ${applicationId}:`, error);
      } else {
        console.warn(`[applicationService] Unknown error fetching plans by application ${applicationId}:`, error);
      }

      // En cas d'erreur, ne pas essayer de charger tous les plans pour éviter des appels API inutiles
      // et des problèmes de performance
      return [];
    }
  },

  async getPlanFeatures(planId: string, options: { signal?: AbortSignal } = {}): Promise<PlanFeature[]> {
    const controller = new AbortController();
    const timeoutDuration = 30000; // 30 secondes pour toutes les environnements
    const timeoutId = setTimeout(() => {
      console.warn(`[applicationService] Timeout reached for plan ${planId}, aborting...`);
      controller.abort('Request timeout');
    }, timeoutDuration);

    try {
      const signal = options.signal || controller.signal;

      console.log(`[applicationService] Fetching features for plan ${planId}...`);

      const payload = await apiClient.get<ApiEnvelope<PlanFeature[]>>(
        API_ENDPOINTS.ABONNEMENT.PLAN_FEATURES_BY_PLAN(planId),
        {
          signal,
          // Ne pas utiliser le cache pour éviter les problèmes de données obsolètes
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!payload) {
        console.warn(`[applicationService] Empty response for plan ${planId}`);
        return [];
      }

      const list = unwrap<PlanFeature[]>(payload) ?? [];
      const result = Array.isArray(list) ? list : [];

      console.log(`[applicationService] Successfully loaded ${result.length} features for plan ${planId}`);
      return result;

    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const message = `Le chargement des fonctionnalités pour le plan ${planId} a pris trop de temps (${timeoutDuration / 1000}s)`;
          console.warn(`[applicationService] ${message}`, error);
          throw new Error(message);
        }

        console.warn(`[applicationService] Error fetching features for plan ${planId}:`, error);
        // En cas d'erreur, on retourne un tableau vide au lieu de propager l'erreur
        return [];
      } else {
        console.warn(`[applicationService] Unknown error when fetching features for plan ${planId}:`, error);
        return [];
      }
    }
  },

  async addPlan(data: PlanPayload) {
    try {
      const payload = sanitizePlanPayload(data);
      return await apiClient.post(API_ENDPOINTS.ABONNEMENT.PLANS, payload);
    } catch (error) {
      console.error("[applicationService] Error adding plan:", error, data);
      throw error instanceof Error ? error : new Error("Échec de la création du plan");
    }
  },

  async updatePlan(id: string, data: PlanPayload) {
    try {
      const payload = sanitizePlanPayload(data);
      // Pour l'update, on peut avoir besoin de remettre l'ID dans le payload ou non,
      // ça dépend du backend, mais généralement PUT /plans/{id} suffit avec le body.
      return await apiClient.put(`${API_ENDPOINTS.ABONNEMENT.PLANS}/${id}`, payload);
    } catch (error) {
      console.error("[applicationService] Error updating plan:", error, data);
      throw error instanceof Error ? error : new Error("Échec de la mise à jour du plan");
    }
  },

  async assignFeatureToPlan(data: PlanFeatureAssignmentPayload) {
    try {
      return await apiClient.post(API_ENDPOINTS.ABONNEMENT.PLAN_FEATURES, {
        planId: data.planId,
        featureId: data.featureId,
        quotaLimit: data.quotaLimit ?? null,
        included: data.included ?? true,
      });
    } catch (error) {
      console.error("[applicationService] Error assigning feature to plan:", error, data);
      throw error instanceof Error ? error : new Error("Échec de l'association fonctionnalité/plan");
    }
  },

  async getAllTrialPolicies(page: number = 0, size: number = 10): Promise<{
    content: TrialPolicy[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(
        API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES,
        {
          query: { page, size },
        },
      );
      const raw = unwrap<Record<string, any>>(payload);

      // La réponse peut être dans data.content ou directement dans raw
      const responseData = raw?.data || raw;

      // Si c'est directement une liste (array), on la wrappe
      if (Array.isArray(responseData)) {
        return {
          content: responseData.map((item: any) => ({
            id: item.id,
            applicationId: item.applicationId,
            applicationName: item.applicationName || undefined,
            enabled: item.enabled ?? true,
            trialPeriodInDays: item.trialPeriodInDays ?? 0,
            unlimitedAccess: item.unlimitedAccess ?? false,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
          page: 0,
          size: responseData.length,
          totalElements: responseData.length,
          totalPages: 1,
          last: true,
          first: true,
          hasNext: false,
          hasPrevious: false,
        };
      }

      // Sinon, c'est un objet paginé
      const content = responseData?.content || responseData?.items || [];

      return {
        content: content.map((item: any) => ({
          id: item.id,
          applicationId: item.applicationId,
          applicationName: item.applicationName || undefined,
          enabled: item.enabled ?? true,
          trialPeriodInDays: item.trialPeriodInDays ?? 0,
          unlimitedAccess: item.unlimitedAccess ?? false,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        page: responseData?.page ?? page,
        size: responseData?.size ?? size,
        totalElements: responseData?.totalElements ?? content.length,
        totalPages: responseData?.totalPages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
        hasNext: responseData?.hasNext ?? false,
        hasPrevious: responseData?.hasPrevious ?? false,
      };
    } catch (error) {
      console.error("[applicationService] Error fetching trial policies:", error);
      console.warn("[applicationService] Falling back to bundled trial policy catalog");
      return {
        content: FALLBACK_TRIAL_POLICIES,
        page: 0,
        size: FALLBACK_TRIAL_POLICIES.length,
        totalElements: FALLBACK_TRIAL_POLICIES.length,
        totalPages: 1,
        last: true,
        first: true,
        hasNext: false,
        hasPrevious: false,
      };
    }
  },

  async getTrialPolicyByApplication(applicationId: string): Promise<TrialPolicy | null> {
    try {
      // Essayer d'abord avec le chemin spécifique
      try {
        const payload = await apiClient.get<ApiEnvelope<any>>(
          API_ENDPOINTS.ABONNEMENT.TRIAL_POLICY_BY_APPLICATION(applicationId),
        );
        const raw = unwrap<Record<string, any>>(payload);

        // Gérer la réponse qui peut être dans data ou directement dans raw
        const policyData = raw?.data || raw;

        if (!policyData || !policyData.id) {
          return null;
        }

        return {
          id: policyData.id,
          applicationId: policyData.applicationId || applicationId,
          applicationName: policyData.applicationName || undefined,
          enabled: policyData.enabled ?? true,
          trialPeriodInDays: policyData.trialPeriodInDays ?? 0,
          unlimitedAccess: policyData.unlimitedAccess ?? false,
          createdAt: policyData.createdAt,
          updatedAt: policyData.updatedAt,
        };
      } catch (pathError: any) {
        // Si le chemin spécifique ne fonctionne pas, essayer avec un query parameter
        console.warn("[applicationService] Path-based fetch failed, trying with query parameter...");
        const payload = await apiClient.get<ApiEnvelope<any>>(
          API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES,
          {
            query: { applicationId },
          },
        );
        const raw = unwrap<Record<string, any>>(payload);

        // Si c'est une liste, prendre le premier
        if (Array.isArray(raw)) {
          const policy = raw.find((p: any) => p.applicationId === applicationId);
          if (!policy || !policy.id) {
            return null;
          }
          return {
            id: policy.id,
            applicationId: policy.applicationId || applicationId,
            applicationName: policy.applicationName || undefined,
            enabled: policy.enabled ?? true,
            trialPeriodInDays: policy.trialPeriodInDays ?? 0,
            unlimitedAccess: policy.unlimitedAccess ?? false,
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
          };
        }

        // Sinon, traiter comme un objet unique
        const policyData = raw?.data || raw;
        if (!policyData || !policyData.id) {
          return null;
        }

        return {
          id: policyData.id,
          applicationId: policyData.applicationId || applicationId,
          applicationName: policyData.applicationName || undefined,
          enabled: policyData.enabled ?? true,
          trialPeriodInDays: policyData.trialPeriodInDays ?? 0,
          unlimitedAccess: policyData.unlimitedAccess ?? false,
          createdAt: policyData.createdAt,
          updatedAt: policyData.updatedAt,
        };
      }
    } catch (error) {
      console.error("[applicationService] Error fetching trial policy:", error, { applicationId });
      // Si la politique n'existe pas encore, retourner null plutôt que d'échouer
      return null;
    }
  },

  async createOrUpdateTrialPolicy(data: TrialPolicyPayload, existingPolicyId?: string): Promise<TrialPolicy> {
    try {
      // Si on a déjà l'ID de la politique, utiliser PUT directement avec l'ID dans l'URL
      if (existingPolicyId) {
        const payload = await apiClient.put<ApiEnvelope<any>>(
          `${API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES}/${existingPolicyId}`,
          data,
        );
        const raw = unwrap<Record<string, any>>(payload);
        const policyData = raw.data || raw;

        return {
          id: policyData.id || raw.id || existingPolicyId,
          applicationId: policyData.applicationId || data.applicationId,
          enabled: policyData.enabled ?? data.enabled,
          trialPeriodInDays: policyData.trialPeriodInDays ?? data.trialPeriodInDays,
          unlimitedAccess: policyData.unlimitedAccess ?? data.unlimitedAccess,
          createdAt: policyData.createdAt || raw.createdAt,
          updatedAt: policyData.updatedAt || raw.updatedAt,
        };
      }

      // Sinon, vérifier si une politique existe déjà pour cette application
      const existingPolicy = await this.getTrialPolicyByApplication(data.applicationId);

      // Si une politique existe, utiliser PUT pour la mettre à jour avec l'ID dans l'URL
      if (existingPolicy && existingPolicy.id) {
        // Utiliser PUT avec l'ID dans l'URL (comme pour updateApplication)
        const payload = await apiClient.put<ApiEnvelope<any>>(
          `${API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES}/${existingPolicy.id}`,
          data,
        );
        const raw = unwrap<Record<string, any>>(payload);
        const policyData = raw.data || raw;

        return {
          id: policyData.id || raw.id || existingPolicy.id,
          applicationId: policyData.applicationId || data.applicationId,
          enabled: policyData.enabled ?? data.enabled,
          trialPeriodInDays: policyData.trialPeriodInDays ?? data.trialPeriodInDays,
          unlimitedAccess: policyData.unlimitedAccess ?? data.unlimitedAccess,
          createdAt: policyData.createdAt || raw.createdAt || existingPolicy.createdAt,
          updatedAt: policyData.updatedAt || raw.updatedAt,
        };
      }

      // Aucune politique existante, utiliser POST pour créer
      const payload = await apiClient.post<ApiEnvelope<any>>(
        API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES,
        data,
      );
      const raw = unwrap<Record<string, any>>(payload);
      const policyData = raw.data || raw;

      return {
        id: policyData.id || raw.id,
        applicationId: policyData.applicationId || data.applicationId,
        enabled: policyData.enabled ?? data.enabled,
        trialPeriodInDays: policyData.trialPeriodInDays ?? data.trialPeriodInDays,
        unlimitedAccess: policyData.unlimitedAccess ?? data.unlimitedAccess,
        createdAt: policyData.createdAt || raw.createdAt,
        updatedAt: policyData.updatedAt || raw.updatedAt,
      };
    } catch (error: any) {
      // Si l'erreur est 409 (conflit), cela signifie qu'une politique existe mais n'a pas été trouvée
      // Réessayer en récupérant la politique et en utilisant PUT avec l'ID
      if (error.message?.includes("409") || error.message?.includes("conflit") || error.message?.includes("conflict") || error.message?.includes("Conflict")) {
        console.warn("[applicationService] Conflict (409) detected, fetching existing policy and retrying with PUT...");
        try {
          const existing = await this.getTrialPolicyByApplication(data.applicationId);
          if (existing && existing.id) {
            const payload = await apiClient.put<ApiEnvelope<any>>(
              `${API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES}/${existing.id}`,
              data,
            );
            const raw = unwrap<Record<string, any>>(payload);
            const policyData = raw.data || raw;

            return {
              id: policyData.id || raw.id || existing.id,
              applicationId: policyData.applicationId || data.applicationId,
              enabled: policyData.enabled ?? data.enabled,
              trialPeriodInDays: policyData.trialPeriodInDays ?? data.trialPeriodInDays,
              unlimitedAccess: policyData.unlimitedAccess ?? data.unlimitedAccess,
              createdAt: policyData.createdAt || raw.createdAt || existing.createdAt,
              updatedAt: policyData.updatedAt || raw.updatedAt,
            };
          }
        } catch (retryError: any) {
          console.error("[applicationService] Retry with PUT after 409 conflict failed:", retryError);
          throw retryError;
        }
      }

      // Si l'erreur est 500 et qu'on a un existingPolicyId, essayer PUT avec l'ID directement
      if ((error.message?.includes("500") || error.message?.includes("500")) && existingPolicyId) {
        console.warn("[applicationService] 500 error detected, retrying with PUT using ID in URL...");
        try {
          const payload = await apiClient.put<ApiEnvelope<any>>(
            `${API_ENDPOINTS.ABONNEMENT.TRIAL_POLICIES}/${existingPolicyId}`,
            data,
          );
          const raw = unwrap<Record<string, any>>(payload);
          const policyData = raw.data || raw;

          return {
            id: policyData.id || raw.id || existingPolicyId,
            applicationId: policyData.applicationId || data.applicationId,
            enabled: policyData.enabled ?? data.enabled,
            trialPeriodInDays: policyData.trialPeriodInDays ?? data.trialPeriodInDays,
            unlimitedAccess: policyData.unlimitedAccess ?? data.unlimitedAccess,
            createdAt: policyData.createdAt || raw.createdAt,
            updatedAt: policyData.updatedAt || raw.updatedAt,
          };
        } catch (retryError: any) {
          console.error("[applicationService] Retry with PUT using ID failed:", retryError);
          throw retryError;
        }
      }

      console.error("[applicationService] Error creating/updating trial policy:", error, data);
      throw error instanceof Error ? error : new Error("Échec de la création/mise à jour de la politique d'essai");
    }
  },

  async deleteTrialPolicy(policyId: string): Promise<void> {
    try {
      await apiClient.delete(`/applications/trial-policies/${policyId}`);
    } catch (error) {
      console.error('Error deleting trial policy:', error);
      throw error;
    }
  },

  async getApplicationStats(applicationId: string): Promise<AppStats> {
    try {
      const response = await apiClient.get<AppStats>(`/applications/${applicationId}/stats`);
      return response.data || {};
    } catch (error) {
      console.error('Error fetching application stats:', error);
      return {};
    }
  }
};

const FALLBACK_APPLICATIONS: Record<string, any>[] = [
  {
    id: "f31f2f37-df35-4195-a41f-35fc44a6e6db",
    name: "Analytics Platform",
    description: "Plateforme d'analyse de données",
    version: null,
    type: null,
    platform: null,
    iconUrl: null,
    websiteUrl: null,
    supportEmail: null,
    documentationUrl: null,
    isActive: true,
    configuration: null,
    createdAt: 1763461335.915777,
    updatedAt: 1763461335.915777,
    activeSubscriptionsCount: null,
    totalPlansCount: null,
    totalFeaturesCount: null,
  },
  {
    id: "6bd2b34a-5be4-4c24-a395-ce92fe64836c",
    name: "Notification Service",
    description: "Service de notifications push et email",
    version: null,
    type: null,
    platform: null,
    iconUrl: null,
    websiteUrl: null,
    supportEmail: null,
    documentationUrl: null,
    isActive: true,
    configuration: null,
    createdAt: 1763461335.903919,
    updatedAt: 1763461335.903919,
    activeSubscriptionsCount: null,
    totalPlansCount: null,
    totalFeaturesCount: null,
  },
  {
    id: "60cfae3c-f71d-4420-82b4-dcf13e594d66",
    name: "Payment Gateway",
    description: "Passerelle de paiement sécurisée",
    version: null,
    type: null,
    platform: null,
    iconUrl: null,
    websiteUrl: null,
    supportEmail: null,
    documentationUrl: null,
    isActive: true,
    configuration: null,
    createdAt: 1763461335.912187,
    updatedAt: 1763461335.912187,
    activeSubscriptionsCount: null,
    totalPlansCount: null,
    totalFeaturesCount: null,
  },
];

const FALLBACK_TRIAL_POLICIES: TrialPolicy[] = [
  {
    id: "2098ea37-3581-4075-b038-ad8e137b2dc2",
    applicationId: "ee7c282e-43e2-4783-a1c0-e4c9543bb2b9",
    applicationName: "Asso Plus",
    enabled: true,
    trialPeriodInDays: 5,
    unlimitedAccess: true,
    createdAt: 1764075593.035351,
    updatedAt: 1764075593.035351,
  },
  {
    id: "7bf0b95a-9744-4e06-a2b7-77216e5ce15a",
    applicationId: "28018466-b0e0-4284-88ae-1f23a080956c",
    applicationName: "Crowdfunding",
    enabled: true,
    trialPeriodInDays: 90,
    unlimitedAccess: true,
    createdAt: 1764072774.467979,
    updatedAt: 1764072774.467979,
  },
  {
    id: "16ce966b-d029-461a-9ffd-642b00013e65",
    applicationId: "60cfae3c-f71d-4420-82b4-dcf13e594d66",
    applicationName: "Payment Gateway",
    enabled: true,
    trialPeriodInDays: 90,
    unlimitedAccess: true,
    createdAt: 1764069176.66149,
    updatedAt: 1764069176.66149,
  },
  {
    id: "67accc64-9def-4f7c-a957-82348f1a822c",
    applicationId: "30464f2b-1c32-4262-927e-708d8cc6d41a",
    applicationName: "appel2",
    enabled: true,
    trialPeriodInDays: 90,
    unlimitedAccess: true,
    createdAt: 1764069109.640175,
    updatedAt: 1764069109.640175,
  },
  {
    id: "ca41598f-2b4a-4be8-bc19-4662d1c5953b",
    applicationId: "6bd2b34a-5be4-4c24-a395-ce92fe64836c",
    applicationName: "Notification Service",
    enabled: true,
    trialPeriodInDays: 14,
    unlimitedAccess: true,
    createdAt: 1763461336.617582,
    updatedAt: 1763461336.617582,
  },
];
