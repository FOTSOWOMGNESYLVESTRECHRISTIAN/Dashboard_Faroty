import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import type { Abonnement as Subscription } from "../components/AbonnementDetails";

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

interface PaginatedResponse<T> {
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

interface ApiSubscription {
  id: string;
  contextId: string;
  contextType: string;
  startDate: number[] | string; // [2025, 11, 25] ou string ISO
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
  createdAt: number;
  updatedAt: number;
}

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

// Convertir un tableau [year, month, day] en string ISO
const formatDateFromArray = (dateArray: number[] | string | null | undefined): string => {
  if (!dateArray) return "";
  if (typeof dateArray === "string") return dateArray;
  if (Array.isArray(dateArray) && dateArray.length >= 3) {
    const [year, month, day] = dateArray;
    // Les mois dans les tableaux sont 1-based, mais Date attend 0-based
    const date = new Date(year, month - 1, day);
    return date.toISOString().split("T")[0];
  }
  return "";
};

// Convertir un timestamp en string ISO
const formatDateFromTimestamp = (timestamp: number | null | undefined): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  return date.toISOString().split("T")[0];
};

// Normaliser le statut de l'API vers le format attendu par le composant
const normalizeStatus = (
  status: string,
  isPendingActivation?: boolean,
): "active" | "expired" | "cancelled" => {
  if (isPendingActivation) return "expired"; // On traite PENDING comme expired pour l'UI
  const upperStatus = status.toUpperCase();
  if (upperStatus === "ACTIVE" || upperStatus === "TRIAL") return "active";
  if (upperStatus === "CANCELLED") return "cancelled";
  if (upperStatus === "PENDING") return "expired";
  return "expired";
};

// Normaliser une subscription de l'API vers le format attendu par le composant
const normalizeSubscription = (raw: ApiSubscription): Subscription => {
  const startDate = Array.isArray(raw.startDate)
    ? formatDateFromArray(raw.startDate)
    : raw.startDate || formatDateFromTimestamp(raw.createdAt);
  const endDate = Array.isArray(raw.endDate)
    ? formatDateFromArray(raw.endDate)
    : raw.endDate || "";

  // Calculer le prix de promotion si un code est appliqué
  const hasPromotion = !!raw.appliedPromotionCode && raw.finalPrice < raw.originalPrice;
  const promotionPrice = hasPromotion ? raw.finalPrice : null;

  return {
    id: raw.id,
    contextName: raw.contextId || "Contexte inconnu", // On utilisera contextId comme nom par défaut
    numberOfPeople: 0, // Cette information n'est pas disponible dans l'API
    people: [], // Cette information n'est pas disponible dans l'API
    application: raw.applicationName || "Application inconnue",
    applicationId: raw.applicationId,
    plans: [
      {
        planId: raw.planId,
        planName: raw.planName,
        interval: raw.billingCycle === "YEARLY" ? "year" : "month",
        price: raw.originalPrice,
        currency: "XFA", // Par défaut, on suppose XFA
        features: [], // Les fonctionnalités ne sont pas dans la réponse
      },
    ],
    promotionCode: raw.appliedPromotionCode || null,
    promotionPrice,
    originalPrice: raw.originalPrice,
    finalPrice: raw.finalPrice,
    currency: "XFA", // Par défaut, on suppose XFA
    status: normalizeStatus(raw.status, raw.isPendingActivation),
    startDate,
    endDate,
    planName: raw.planName,
    planId: raw.planId
  };
};

export const subscriptionService = {
  async getAllSubscriptions(
    page: number = 0,
    size: number = 10,
  ): Promise<PaginatedResponse<Subscription>> {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(
        API_ENDPOINTS.ABONNEMENT.ABONNEMENTS,
        {
          query: { page, size },
        },
      );

      const raw = unwrap<Record<string, any>>(payload);
      let responseData = raw;

      if (raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
        responseData = raw.data;
      }

      // Extraction du contenu brut
      let rawContent: any[] = [];
      if (Array.isArray(responseData)) {
        rawContent = responseData;
      } else if (responseData?.content || responseData?.items) {
        rawContent = responseData.content || responseData.items || [];
      } else if (raw?.data && Array.isArray(raw.data)) {
        rawContent = raw.data;
      }

      // Enrichissement des données
      const enrichedContent = await Promise.all(
        rawContent.map(async (item) => {
          const sub = normalizeSubscription(item);
          try {
            if (item.contextType === 'USER' && item.contextId) {
              const { userService } = await import('./userService');
              const user = await userService.getUserById(item.contextId);
              if (user) {
                sub.contextName = user.name;
              } else {
                sub.contextName = "Utilisateur";
              }
            } else if (item.contextType) {
              sub.contextName = item.contextType.charAt(0).toUpperCase() + item.contextType.slice(1).toLowerCase();
            }
          } catch (e) {
            console.warn(`Failed to resolve context name for ${sub.id}`, e);
            if (item.contextType) {
              sub.contextName = item.contextType.charAt(0).toUpperCase() + item.contextType.slice(1).toLowerCase();
            }
          }
          return sub;
        })
      );

      // Construction de la réponse paginée
      if (Array.isArray(responseData) || (raw?.data && Array.isArray(raw.data))) {
        return {
          content: enrichedContent,
          page: 0,
          size: enrichedContent.length,
          totalElements: enrichedContent.length,
          totalPages: 1,
          last: true,
          first: true,
          hasNext: false,
          hasPrevious: false,
        };
      }

      return {
        content: enrichedContent,
        page: responseData?.page ?? page,
        size: responseData?.size ?? size,
        totalElements: responseData?.totalElements ?? enrichedContent.length,
        totalPages: responseData?.totalPages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
        hasNext: responseData?.hasNext ?? false,
        hasPrevious: responseData?.hasPrevious ?? false,
      };

    } catch (error: any) {
      console.error("[subscriptionService] Error fetching subscriptions:", error);

      if (error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        const forbiddenError = new Error(
          "Accès refusé. Vous n'avez pas les permissions nécessaires pour consulter les souscriptions."
        );
        (forbiddenError as any).code = "FORBIDDEN";
        (forbiddenError as any).status = 403;
        throw forbiddenError;
      }

      throw error instanceof Error
        ? error
        : new Error("Impossible de récupérer les souscriptions");
    }
  },

  async getUserSubscriptionContexts(userId: string): Promise<any[]> {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(
        `${API_ENDPOINTS.ABONNEMENT.subscriptionUsers}/user/${userId}`
      );
      const raw = unwrap<Record<string, any>>(payload);
      return Array.isArray(raw) ? raw : (raw.data || []);
    } catch (error) {
      console.error(`[subscriptionService] Error fetching contexts for user ${userId}:`, error);
      throw error;
    }
  },

  async getSubscriptionByContext(
    contextId: string,
    contextType: string,
    applicationId: string
  ): Promise<Subscription | null> {
    try {
      const payload = await apiClient.get<ApiEnvelope<any>>(
        `${API_ENDPOINTS.ABONNEMENT.subscriptionContext}/${contextId}/${contextType}/get-or-create`,
        {
          query: { applicationId }
        }
      );

      const raw = unwrap<Record<string, any>>(payload);
      // La donnée est souvent dans raw.data pour ce endpoint spécifique
      const data = raw.data || raw;

      const sub = normalizeSubscription(data);

      try {
        if (data.contextType === 'USER' && data.contextId) {
          const { userService } = await import('./userService');
          const user = await userService.getUserById(data.contextId);
          if (user) {
            sub.contextName = user.name;
          } else {
            sub.contextName = "Utilisateur";
          }
        } else if (data.contextType) {
          sub.contextName = data.contextType.charAt(0).toUpperCase() + data.contextType.slice(1).toLowerCase();
        }
      } catch (e) {
        console.warn(`Failed to resolve context name for single subscription ${sub.id}`, e);
        if (data.contextType) {
          sub.contextName = data.contextType.charAt(0).toUpperCase() + data.contextType.slice(1).toLowerCase();
        }
      }

      return sub;
    } catch (error) {
      console.error(`[subscriptionService] Error fetching subscription for context ${contextId}:`, error);
      throw error;
    }
  }
};

