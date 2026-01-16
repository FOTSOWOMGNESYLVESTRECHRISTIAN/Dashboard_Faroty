import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

export interface PromotionPayload {
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
  minPurchaseAmount: number;
  planId: string;
  createdBy: string;
}

export interface Promotion {
  id: string;
  code: string;
  discountPercentage: number;
  startDate: string | number | any[];
  endDate: string | number | any[];
  maxUsage: number;
  currentUsage?: number;
  minPurchaseAmount: number;
  active?: boolean;
  createdBy: string;
  status?: string;
  planId: string;
  planName?: string | null;
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface PromotionApiResponse {
  success?: boolean;
  message?: string;
  data?: any;
  error?: any;
  errorCode?: any;
  [key: string]: any;
}

export interface PromotionListOptions {
  planId?: string;
  code?: string;
  page?: number;
  size?: number;
}

const normalizePromotion = (raw: Record<string, any> | null | undefined): Promotion | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return {
    id: raw.id || raw.promotionId || "",
    code: raw.code || "",
    discountPercentage: Number(raw.discountPercentage ?? raw.discount ?? 0),
    startDate: raw.startDate ?? raw.start_date ?? raw.start ?? "",
    endDate: raw.endDate ?? raw.end_date ?? raw.end ?? "",
    maxUsage: Number(raw.maxUsage ?? raw.max_usage ?? 0),
    currentUsage: raw.currentUsage ?? raw.current_usage ?? 0,
    minPurchaseAmount: Number(raw.minPurchaseAmount ?? raw.min_purchase_amount ?? 0),
    active: raw.active ?? raw.isActive ?? true,
    createdBy: raw.createdBy ?? raw.creatorId ?? "",
    status: raw.status ?? raw.state ?? undefined,
    planId: raw.planId ?? raw.plan_id ?? "",
    planName: raw.planName ?? raw.plan_name ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
};

const extractPromotion = (payload: PromotionApiResponse): Promotion | null => {
  if (!payload) return null;
  if (payload.data && typeof payload.data === "object") {
    return normalizePromotion(payload.data);
  }
  if (payload.result && typeof payload.result === "object") {
    return normalizePromotion(payload.result);
  }
  return normalizePromotion(payload as Record<string, any>);
};

const extractPromotionList = (payload: PromotionApiResponse): Promotion[] => {
  if (!payload) return [];
  const container =
    payload?.data?.content ||
    payload?.data?.items ||
    payload?.data?.records ||
    payload?.data?.data ||
    payload?.content ||
    payload?.items ||
    payload?.records ||
    payload?.result;
  if (Array.isArray(container)) {
    return container.map((item) => normalizePromotion(item)).filter(Boolean) as Promotion[];
  }
  return [];
};

export const promotionService = {
  async getPromotionsByApplication(applicationId: string): Promise<Promotion[]> {
    try {
      const response = await apiClient.get<PromotionApiResponse>(
        `${API_ENDPOINTS.ABONNEMENT.PROMOTIONS}/application/${applicationId}`
      );
      return extractPromotionList(response);
    } catch (error: any) {
      console.error("[promotionService] Error fetching promotions by application:", error, applicationId);
      const message =
        error instanceof Error ? error.message : "Impossible de récupérer les promotions de l'application";
      throw new Error(message);
    }
  },

  async createPromotion(payload: PromotionPayload): Promise<{
    response: PromotionApiResponse;
    promotion: Promotion | null;
  }> {
    try {
      // Nettoyer le payload pour ne garder que les champs acceptés par le backend
      // Backend expects: "startDate", "planId", "active", "endDate", "discountPercentage", "code", "createdBy", "minPurchaseAmount", "maxUsage"
      const sanitizedPayload = {
        code: payload.code,
        discountPercentage: payload.discountPercentage,
        startDate: payload.startDate,
        endDate: payload.endDate,
        maxUsage: payload.maxUsage,
        minPurchaseAmount: payload.minPurchaseAmount,
        planId: payload.planId,
        createdBy: payload.createdBy,
        active: true // Toujours active à la création
      };

      const response = await apiClient.post<PromotionApiResponse>(
        API_ENDPOINTS.ABONNEMENT.PROMOTIONS,
        sanitizedPayload,
      );
      return {
        response,
        promotion: extractPromotion(response),
      };
    } catch (error: any) {
      console.error("[promotionService] Error creating promotion:", error, payload);
      const message =
        error instanceof Error ? error.message : "Impossible de créer la promotion";
      throw new Error(message);
    }
  },

  async listPromotions(options: PromotionListOptions = {}): Promise<Promotion[]> {
    try {
      const response = await apiClient.get<PromotionApiResponse>(
        API_ENDPOINTS.ABONNEMENT.PROMOTIONS,
        {
          query: {
            planId: options.planId,
            code: options.code,
            page: options.page,
            size: options.size,
          },
        },
      );
      return extractPromotionList(response);
    } catch (error: any) {
      console.error("[promotionService] Error listing promotions:", error, options);
      const message =
        error instanceof Error ? error.message : "Impossible de récupérer les promotions";
      throw new Error(message);
    }
  },
};

