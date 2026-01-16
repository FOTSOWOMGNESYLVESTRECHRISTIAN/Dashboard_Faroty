import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import type { Abonnement } from "../components/AbonnementDetails";

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

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ApiAbonnement {
  id: string;
  contextId: string;
  contextType: string;
  startDate: number[] | string;
  trialEndDate: number[] | string | null;
  endDate: number[] | string;
  nextBillingDate: number[] | string | null;
  isFreeSubscription: boolean;
  status: "ACTIVE" | "CANCELLED" | "PENDING" | "TRIAL" | "EXPIRED";
  billingCycle: "MONTHLY" | "YEARLY" | "WEEKLY" | "DAILY";
  activatedAt: number | null;
  autoRenew: boolean;
  cancelledAt: number | null;
  cancelReason: string | null;
  originalPrice: number;
  finalPrice: number;
  appliedPromotionCode: string | null;
  cancellationReason: string | null;
  isPendingActivation: boolean;
  applicationId: string;
  applicationName: string;
  planId: string;
  planName: string;
  planDescription: string | null;
  planFeatures: Array<{
    featureId: string;
    featureName: string;
    limit: number | null;
    used?: number;
  }>;
  currency: string;
  createdAt: number;
  updatedAt: number;
  contextName: string;
  numberOfPeople: number;
  people: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

// Fonction utilitaire pour déballer la réponse de l'API
function unwrap<T>(payload: ApiEnvelope<T>): T {
  if (typeof payload !== "object" || payload === null) {
    return payload;
  }

  if ("data" in payload && payload.data !== undefined) {
    return payload.data;
  }

  if ("content" in payload && payload.content !== undefined) {
    return payload.content;
  }

  if ("items" in payload && payload.items !== undefined) {
    return payload.items;
  }

  if ("records" in payload && payload.records !== undefined) {
    return payload.records;
  }

  // Si nous arrivons ici, c'est que la réponse est déjà déballée
  return payload as T;
}

// Convertir un tableau [year, month, day] en string ISO
function formatDateFromArray(dateArray: number[] | string | null | undefined): string {
  if (!dateArray) return "";
  if (typeof dateArray === "string") return dateArray;
  if (!Array.isArray(dateArray) || dateArray.length < 3) return "";

  const [year, month, day] = dateArray;
  const date = new Date(year, month - 1, day);
  return date.toISOString().split('T')[0];
}

// Convertir un timestamp en string ISO
function formatDateFromTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString();
}

// Normaliser le statut de l'API vers le format attendu par le composant
function normalizeStatus(
  status: string,
  isPendingActivation?: boolean,
): "active" | "expired" | "cancelled" {
  if (isPendingActivation) return "cancelled";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
    case "TRIAL":
      return "active";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    default:
      return "cancelled";
  }
}

// Normaliser un abonnement de l'API vers le format attendu par le composant
function normalizeAbonnement(raw: ApiAbonnement): Abonnement {
  return {
    id: raw.id,
    contextName: raw.contextName || "Sans nom",
    numberOfPeople: raw.numberOfPeople || 0,
    people: raw.people || [],
    application: raw.applicationName || "Application inconnue",
    applicationId: raw.applicationId,
    plans: [
      {
        planId: raw.planId,
        planName: raw.planName,
        interval: raw.billingCycle === "YEARLY" ? "year" : "month",
        price: raw.finalPrice,
        currency: raw.currency || "XAF",
        features: (raw.planFeatures || []).map(feature => ({
          featureId: feature.featureId,
          featureName: feature.featureName,
          limit: feature.limit,
          used: feature.used,
        })),
      },
    ],
    promotionCode: raw.appliedPromotionCode,
    promotionPrice: raw.appliedPromotionCode ? raw.originalPrice - raw.finalPrice : null,
    originalPrice: raw.originalPrice,
    finalPrice: raw.finalPrice,
    currency: raw.currency || "XAF",
    status: normalizeStatus(raw.status, raw.isPendingActivation),
    startDate: typeof raw.startDate === "string" ? raw.startDate : formatDateFromArray(raw.startDate as number[]),
    endDate: typeof raw.endDate === "string" ? raw.endDate : formatDateFromArray(raw.endDate as number[]),
  };
}

export const abonnementService = {
  async getAllAbonnements(
    page: number = 0,
    size: number = 10,
  ): Promise<PaginatedResponse<Abonnement>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ABONNEMENT.ABONNEMENTS, {
        query: {
          page,
          size,
          sort: 'createdAt,desc',
        },
      });

      const data = unwrap<{ content: ApiAbonnement[] } & Omit<PaginatedResponse<ApiAbonnement>, 'content'>>(response as any);

      // Gérer le cas où la réponse pourrait être directement le tableau de contenu
      if (Array.isArray(data)) {
        return {
          content: data.map(normalizeAbonnement),
          page: 0,
          size: data.length,
          totalElements: data.length,
          totalPages: 1,
          last: true,
          first: true,
          hasNext: false,
          hasPrevious: false,
        };
      }

      // Cas normal où la réponse est paginée
      const rawContent = data.content || [];
      const enrichedSubscriptions = await Promise.all(
        rawContent.map(async (raw) => {
          const sub = normalizeAbonnement(raw);
          try {
            if (raw.contextType === 'USER' && raw.contextId) {
              const { userService } = await import('./userService');
              const user = await userService.getUserById(raw.contextId);
              if (user) {
                sub.contextName = user.name;
              }
            }
          } catch (err) {
            console.warn(`Impossible de résoudre le nom du contexte pour ${raw.id}`, err);
          }
          return sub;
        })
      );

      return {
        content: enrichedSubscriptions,
        page: data.page || 0,
        size: data.size || 10,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        last: data.last ?? true,
        first: data.first ?? true,
        hasNext: data.hasNext ?? false,
        hasPrevious: data.hasPrevious ?? false,
      };
    } catch (error) {
      console.error('[abonnementService] Error fetching abonnements:', error);
      throw error;
    }
  },

  async getUserSubscriptionContexts(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        API_ENDPOINTS.ABONNEMENT.SUBSCRIPTION_USERS_BY_USER(userId)
      );
      return unwrap(response) || [];
    } catch (error) {
      console.error('[abonnementService] Error fetching user subscription contexts:', error);
      throw error;
    }
  },

  async getSubscriptionUsers(subscriptionId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiEnvelope<any[]>>(
        API_ENDPOINTS.ABONNEMENT.SUBSCRIPTION_USERS_BY_SUBSCRIPTION(subscriptionId)
      );
      return unwrap(response) || [];
    } catch (error) {
      console.error('[abonnementService] Error fetching subscription users:', error);
      throw error;
    }
  },

  async addSubscriptionUser(subscriptionId: string, userId: string): Promise<any> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.ABONNEMENT.subscriptionUsers,
        { subscriptionId, userId }
      );
      return unwrap(response);
    } catch (error) {
      console.error('[abonnementService] Error adding subscription user:', error);
      throw error;
    }
  },

  async removeSubscriptionUser(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.ABONNEMENT.DELETE_SUBSCRIPTION_USER(id));
    } catch (error) {
      console.error('[abonnementService] Error removing subscription user:', error);
      throw error;
    }
  },
};