import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Sidebar, SidebarContent, SidebarFooter } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ArrowLeft, Plus, Edit, Trash2, Check, X, Tag, Calendar, Percent, TrendingUp, User, Ticket, RefreshCw, Info, Clock, CalendarDays, HardDrive, Download, Upload, Settings, CreditCard, Users as UsersIcon, BarChart2, FileText, Shield, Bell, Globe, Code, Database } from "lucide-react";
import { toast } from "sonner";
import { applicationService, FeaturePayload, PlanPayload, TrialPolicyPayload, TrialPolicy } from "../services/applicationService";
import { promotionService, PromotionPayload, Promotion } from "../services/promotionService";
import { getUserProfile } from "../services/tokenStorage";

interface Feature {
  id: string;
  name: string;
  description: string;
  key: string;
  type?: string;
  category?: string;
  applicationId?: string;
}

interface PlanFeature {
  featureId: string;
  limit: number | null;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: PlanFeature[];
  currency?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  maxUsers?: number;
  maxStorage?: number;
  priority?: number;
}

interface PlanFeatureAssignmentForm {
  featureId: string;
  quotaLimit: string;
  included: boolean;
}

interface ProgramItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  stage?: string;
}

type DetailsTab =
  | "overview"
  | "tickets"
  | "promotions"
  | "participants"
  | "analytics"
  | "history";

export interface Application {
  id: string;
  name: string;
  category: string;
  version: string;
  status: "active" | "inactive" | "maintenance";
  abonnements?: number;
  lastUpdate: string;
  description: string;
  plans: Plan[];
  features: Feature[];
}

interface ApplicationDetailsProps {
  application: Application;
  onBack: () => void;
  onUpdate: (app: Application) => void;
}

const statusColors = {
  active: "bg-green-600",
  inactive: "bg-gray-400",
  maintenance: "bg-amber-500",
};

const statusLabels = {
  active: "Actif",
  inactive: "Inactif",
  maintenance: "Maintenance",
};

const resolveConnectedUserId = (): string | null => {
  const profile = getUserProfile<any>();
  if (!profile || typeof profile !== "object") {
    return null;
  }
  const candidates = [
    profile.id,
    profile.userId,
    profile.userID,
    profile.uuid,
    profile.reference,
    profile.accountId,
    profile?.user?.id,
  ];
  const matched = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return matched ? String(matched) : null;
};

const formatPromotionDate = (value: Promotion["startDate"]) => {
  let parsed: Date | null = null;
  if (Array.isArray(value) && value.length >= 3) {
    parsed = new Date(Number(value[0]), Number(value[1]) - 1, Number(value[2]));
  } else if (typeof value === "number") {
    parsed = new Date(value < 1e12 ? value * 1000 : value);
  } else if (typeof value === "string" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) parsed = date;
  }
  return parsed ? parsed.toLocaleDateString("fr-FR") : "—";
};

const formatPromotionStatus = (promo: Promotion) => {
  if (promo.status) return promo.status.toUpperCase();
  return promo.active === false ? "INACTIVE" : "ACTIVE";
};

const formatPercentage = (value: number | string | undefined | null) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? `${numeric.toFixed(2)} %` : "—";
};

const formatMoney = (value: number | string | undefined | null, currency = "XAF") => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency}`;
  }
};

export function ApplicationDetails({ application, onBack, onUpdate }: ApplicationDetailsProps) {
  const [localApp, setLocalApp] = useState<Application>(application);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isAddFeatureDialogOpen, setIsAddFeatureDialogOpen] = useState(false);
  const [isEditFeatureDialogOpen, setIsEditFeatureDialogOpen] = useState(false);
  const [isDeleteFeatureDialogOpen, setIsDeleteFeatureDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [isDeletePlanDialogOpen, setIsDeletePlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [promotionPlan, setPromotionPlan] = useState<Plan | null>(null);
  const [isCreatingPromotion, setIsCreatingPromotion] = useState(false);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [promotionsByPlan, setPromotionsByPlan] = useState<Record<string, Promotion[]>>({});
  const [promotionForm, setPromotionForm] = useState({
    code: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
    minPurchaseAmount: "",
  });
  
  const [featureForm, setFeatureForm] = useState({
    name: "",
    description: "",
    key: "",
    type: "payment",
    category: "finance",
  });

  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 0,
    priority: 1,
    interval: "month" as "month" | "year",
    features: [] as PlanFeature[],
  });
  const [isSavingFeature, setIsSavingFeature] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isAssignFeatureToPlanOpen, setIsAssignFeatureToPlanOpen] = useState(false);
  const [planToAssignFeature, setPlanToAssignFeature] = useState<Plan | null>(null);
  const [planFeatureAssignment, setPlanFeatureAssignment] = useState<PlanFeatureAssignmentForm>({
    featureId: "",
    quotaLimit: "",
    included: true,
  });
  const [isAssigningPlanFeature, setIsAssigningPlanFeature] = useState(false);
  const [trialPolicy, setTrialPolicy] = useState<TrialPolicy | null>(null);
  const [isLoadingTrialPolicy, setIsLoadingTrialPolicy] = useState(false);
  const [trialPolicyForm, setTrialPolicyForm] = useState({
    enabled: true,
    trialPeriodInDays: 90,
    unlimitedAccess: true,
  });
  const [isSavingTrialPolicy, setIsSavingTrialPolicy] = useState(false);

  useEffect(() => {
    setLocalApp(application);
  }, [application]);

  const loadFeatures = useCallback(
    async (appId: string) => {
      setIsLoadingFeatures(true);
      try {
        const remoteFeatures = await applicationService.getFeaturesByApplication(appId);
        const normalized: Feature[] = remoteFeatures.map((feature: any) => {
          const fallbackName = feature?.name || feature?.key || "Fonctionnalité";
          return {
            id: feature?.id || feature?.featureId || `feature-${Date.now()}-${Math.random()}`,
            name: fallbackName,
            description: feature?.description || "",
            key:
              feature?.key ||
              fallbackName
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^\w-]/g, ""),
            type: feature?.type || feature?.featureType || undefined,
            category: feature?.category || feature?.featureCategory || undefined,
            applicationId: feature?.applicationId,
          };
        });
        setLocalApp((prev) => {
          if (!prev || prev.id !== appId) {
            return { ...application, features: normalized };
          }
          return { ...prev, features: normalized };
        });
        return normalized;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Impossible de charger les fonctionnalités");
        return null;
      } finally {
        setIsLoadingFeatures(false);
      }
    },
    [application],
  );

  const loadPlans = useCallback(
    async (appId: string) => {
      setIsLoadingPlans(true);
      try {
        const remotePlans = await applicationService.getPlansByApplication(appId);
        const normalized: Plan[] = await Promise.all(
          remotePlans.map(async (plan: any) => {
          const baseMonthly = Number(plan?.monthlyPrice ?? plan?.price ?? 0);
          const annualPrice = Number(plan?.yearlyPrice ?? plan?.annualPrice ?? 0);
          const currencyCode =
            (typeof plan?.currency === "string" && plan.currency) ||
            plan?.currency?.code ||
            undefined;
            let planFeaturesRaw: any[] = [];
            if (plan?.id) {
              try {
                planFeaturesRaw = await applicationService.getPlanFeatures(plan.id);
              } catch (planFeatureError) {
                console.warn("[ApplicationDetails] Unable to load plan features", planFeatureError);
              }
            }
            const fallbackFeatures = Array.isArray(plan?.features) ? plan.features : [];
            const sourceFeatures = planFeaturesRaw.length > 0 ? planFeaturesRaw : fallbackFeatures;
            const planFeatures: PlanFeature[] = sourceFeatures
              .map((pf: any) => ({
                featureId: pf?.featureId || pf?.feature?.id || pf?.id || "",
                limit: pf?.quotaLimit ?? pf?.limit ?? pf?.quota ?? null,
              }))
              .filter((pf: PlanFeature) => Boolean(pf.featureId));

            return {
              id: plan?.id || plan?.planId || `plan-${Date.now()}-${Math.random()}`,
              name: plan?.name || "Plan",
              description: plan?.description || "",
              price: baseMonthly,
              currency: currencyCode,
              interval:
                plan?.interval === "year" || plan?.billingCycle === "year" ? "year" : "month",
              features: planFeatures,
              monthlyPrice: baseMonthly,
              yearlyPrice: annualPrice,
              maxUsers: plan?.maxUsers ?? plan?.userLimit ?? undefined,
              maxStorage: plan?.maxStorage ?? plan?.storageLimit ?? undefined,
              priority: plan?.priority ?? undefined,
            };
          }),
        );
        setLocalApp((prev) => {
          if (!prev || prev.id !== appId) {
            return { ...application, plans: normalized };
          }
          return { ...prev, plans: normalized };
        });
        return normalized;
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Impossible de charger les plans");
        return null;
      } finally {
        setIsLoadingPlans(false);
      }
    },
    [application],
  );

  const loadPromotions = useCallback(async () => {
    setIsLoadingPromotions(true);
    try {
      const list = await promotionService.listPromotions();
      const grouped = list.reduce<Record<string, Promotion[]>>((acc, promo) => {
        if (!promo?.planId) return acc;
        if (!acc[promo.planId]) {
          acc[promo.planId] = [];
        }
        acc[promo.planId].push(promo);
        return acc;
      }, {});
      setPromotionsByPlan(grouped);
    } catch (error: any) {
      console.error("[ApplicationDetails] Error loading promotions", error);
      toast.error(error?.message || "Impossible de récupérer les promotions");
    } finally {
      setIsLoadingPromotions(false);
    }
  }, []);

  const loadTrialPolicy = useCallback(
    async (appId: string) => {
      setIsLoadingTrialPolicy(true);
      try {
        const policy = await applicationService.getTrialPolicyByApplication(appId);
        setTrialPolicy(policy);
        if (policy) {
          setTrialPolicyForm({
            enabled: policy.enabled,
            trialPeriodInDays: policy.trialPeriodInDays,
            unlimitedAccess: policy.unlimitedAccess,
          });
        } else {
          // Reset to defaults if no policy exists
          setTrialPolicyForm({
            enabled: true,
            trialPeriodInDays: 90,
            unlimitedAccess: true,
          });
        }
      } catch (error: any) {
        console.error("[ApplicationDetails] Error loading trial policy", error);
        // Don't show error toast if policy doesn't exist (it's optional)
        if (error?.message && !error.message.includes("404")) {
          toast.error(error.message || "Impossible de charger la politique d'essai");
        }
      } finally {
        setIsLoadingTrialPolicy(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!application.id) return;
    loadFeatures(application.id);
    loadPlans(application.id);
    loadPromotions();
    loadTrialPolicy(application.id);
  }, [application.id, loadFeatures, loadPlans, loadPromotions, loadTrialPolicy]);

  // Feature handlers
  const resetFeatureForm = () => {
    setFeatureForm({ name: "", description: "", key: "", type: "payment", category: "finance" });
  };

  const handleAddFeature = async () => {
    if (!featureForm.name || !featureForm.type || !featureForm.category) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      setIsSavingFeature(true);
      const payload: FeaturePayload = {
        name: featureForm.name,
        description: featureForm.description,
        type: featureForm.type,
        category: featureForm.category,
        applicationId: localApp.id,
      };
      await applicationService.addFeature(payload);
      const updatedFeatures = await loadFeatures(localApp.id);
      if (updatedFeatures) {
        onUpdate({ ...localApp, features: updatedFeatures });
      }
      setIsAddFeatureDialogOpen(false);
      resetFeatureForm();
      toast.success("Fonctionnalité créée via l'API !");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Impossible de créer la fonctionnalité");
    } finally {
      setIsSavingFeature(false);
    }
  };

  const handleEditFeature = () => {
    if (!selectedFeature) return;
    const updatedApp = {
      ...localApp,
      features: localApp.features.map((f) =>
        f.id === selectedFeature.id
          ? {
              ...f,
              name: featureForm.name,
              description: featureForm.description,
              key: featureForm.key,
              type: featureForm.type,
              category: featureForm.category,
            }
          : f
      ),
    };
    setLocalApp(updatedApp);
    onUpdate(updatedApp);
    setIsEditFeatureDialogOpen(false);
    setSelectedFeature(null);
    resetFeatureForm();
    toast.success("Fonctionnalité modifiée avec succès!");
  };

  const handleDeleteFeature = () => {
    if (!selectedFeature) return;
    const updatedApp = {
      ...localApp,
      features: localApp.features.filter((f) => f.id !== selectedFeature.id),
      plans: localApp.plans.map((p) => ({
        ...p,
        features: p.features.filter((pf) => pf.featureId !== selectedFeature.id),
      })),
    };
    setLocalApp(updatedApp);
    onUpdate(updatedApp);
    setIsDeleteFeatureDialogOpen(false);
    setSelectedFeature(null);
    toast.success("Fonctionnalité supprimée avec succès!");
  };

  const openEditFeatureDialog = (feature: Feature) => {
    setSelectedFeature(feature);
    setFeatureForm({
      name: feature.name,
      description: feature.description,
      key: feature.key,
      type: feature.type || "payment",
      category: feature.category || "finance",
    });
    setIsEditFeatureDialogOpen(true);
  };

  const openDeleteFeatureDialog = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsDeleteFeatureDialogOpen(true);
  };

  // Plan handlers
  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      description: "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: 0,
      priority: 1,
      interval: "month",
      features: [],
    });
  };

  const handleAddPlan = async () => {
    const trimmedName = planForm.name.trim();
    if (!trimmedName) {
      toast.error("Le nom du plan est obligatoire");
      return;
    }
    try {
      setIsSavingPlan(true);
      const payload: PlanPayload = {
        name: trimmedName,
        description: planForm.description,
        monthlyPrice: planForm.monthlyPrice,
        yearlyPrice: planForm.yearlyPrice,
        maxUsers: planForm.maxUsers,
        priority: planForm.priority,
        applicationId: localApp.id,
      };
      const created: any = await applicationService.addPlan(payload);
      const createdPlanId =
        created?.id ||
        created?.data?.id ||
        created?.planId ||
        (Array.isArray(created?.data?.content) && created.data.content[0]?.id) ||
        null;

      if (createdPlanId && planForm.features.length > 0) {
        try {
          await Promise.all(
            planForm.features.map((feature) =>
              applicationService.assignFeatureToPlan({
                planId: createdPlanId,
                featureId: feature.featureId,
                quotaLimit: feature.limit ?? null,
                included: true,
              }),
            ),
          );
        } catch (assignError: any) {
          console.error(assignError);
          toast.warning(
            assignError?.message ||
              "Plan créé, mais l'association automatique des fonctionnalités a échoué.",
          );
        }
      }

      const updatedPlans = await loadPlans(localApp.id);
      if (updatedPlans) {
        onUpdate({ ...localApp, plans: updatedPlans });
      }
      setIsAddPlanDialogOpen(false);
      resetPlanForm();
      toast.success("Plan créé via l'API !");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Impossible de créer le plan");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const resetPromotionForm = () => {
    setPromotionForm({
      code: "",
      discountPercentage: "",
      startDate: "",
      endDate: "",
      maxUsage: "",
      minPurchaseAmount: "",
    });
  };

  const handleEditPlan = () => {
    if (!selectedPlan) return;
    const updatedApp = {
      ...localApp,
      plans: localApp.plans.map((p) =>
        p.id === selectedPlan.id
          ? {
              ...p,
              name: planForm.name,
              description: planForm.description,
              price: planForm.monthlyPrice,
              interval: planForm.interval,
              features: planForm.features,
              monthlyPrice: planForm.monthlyPrice,
              yearlyPrice: planForm.yearlyPrice,
              maxUsers: planForm.maxUsers,
              priority: planForm.priority,
            }
          : p
      ),
    };
    setLocalApp(updatedApp);
    onUpdate(updatedApp);
    setIsEditPlanDialogOpen(false);
    setSelectedPlan(null);
    resetPlanForm();
    toast.success("Plan modifié avec succès!");
  };

  const handleDeletePlan = () => {
    if (!selectedPlan) return;
    const updatedApp = {
      ...localApp,
      plans: localApp.plans.filter((p) => p.id !== selectedPlan.id),
    };
    setLocalApp(updatedApp);
    onUpdate(updatedApp);
    setIsDeletePlanDialogOpen(false);
    setSelectedPlan(null);
    toast.success("Plan supprimé avec succès!");
  };

  const openEditPlanDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice ?? plan.price,
      yearlyPrice: plan.yearlyPrice ?? 0,
      maxUsers: plan.maxUsers ?? 0,
      priority: plan.priority ?? 1,
      interval: plan.interval,
      features: [...plan.features],
    });
    setIsEditPlanDialogOpen(true);
  };

  const openDeletePlanDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeletePlanDialogOpen(true);
  };

  const openPromotionDialog = (plan: Plan) => {
    const normalizedName = plan.name.replace(/\s+/g, "").toUpperCase().slice(0, 16);
    const defaultCode = `${normalizedName || "PROMO"}${new Date().getFullYear()}`;
    setPromotionPlan(plan);
    setPromotionForm({
      code: defaultCode,
      discountPercentage: "",
      startDate: "",
      endDate: "",
      maxUsage: "",
      minPurchaseAmount: "",
    });
    setIsPromotionDialogOpen(true);
  };

  const handlePromotionFieldChange = (field: keyof typeof promotionForm, value: string) => {
    setPromotionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreatePromotion = async () => {
    if (!promotionPlan) {
      toast.error("Veuillez sélectionner un plan");
      return;
    }
    const connectedUserId = resolveConnectedUserId();
    if (!connectedUserId) {
      toast.error("Impossible d'identifier l'utilisateur connecté. Veuillez vous reconnecter.");
      return;
    }
    const trimmedCode = promotionForm.code.trim();
    if (!trimmedCode) {
      toast.error("Le code promotionnel est obligatoire");
      return;
    }
    const discount = parseFloat(promotionForm.discountPercentage);
    if (!Number.isFinite(discount) || discount <= 0) {
      toast.error("Le pourcentage de réduction doit être supérieur à 0");
      return;
    }
    if (!promotionForm.startDate || !promotionForm.endDate) {
      toast.error("Veuillez définir les dates de début et de fin");
      return;
    }
    if (new Date(promotionForm.startDate) > new Date(promotionForm.endDate)) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    const parsedMaxUsage =
      promotionForm.maxUsage.trim() === ""
        ? 0
        : parseInt(promotionForm.maxUsage, 10);
    const parsedMinAmount =
      promotionForm.minPurchaseAmount.trim() === ""
        ? 0
        : parseFloat(promotionForm.minPurchaseAmount);

    const payload: PromotionPayload = {
      code: trimmedCode,
      discountPercentage: discount,
      startDate: promotionForm.startDate,
      endDate: promotionForm.endDate,
      maxUsage: Number.isFinite(parsedMaxUsage) ? parsedMaxUsage : 0,
      minPurchaseAmount: Number.isFinite(parsedMinAmount) ? parsedMinAmount : 0,
      planId: promotionPlan.id,
      createdBy: connectedUserId,
    };

    try {
      setIsCreatingPromotion(true);
      const { response } = await promotionService.createPromotion(payload);
      toast.success(response?.message || "Promotion créée avec succès");
      await loadPromotions();
      setIsPromotionDialogOpen(false);
      setPromotionPlan(null);
      resetPromotionForm();
    } catch (error: any) {
      console.error("[ApplicationDetails] Promotion creation failed", error);
      toast.error(error?.message || "Impossible de créer la promotion");
    } finally {
      setIsCreatingPromotion(false);
    }
  };

  const toggleFeatureInPlan = (featureId: string) => {
    const existingFeature = planForm.features.find((f) => f.featureId === featureId);
    if (existingFeature) {
      setPlanForm({
        ...planForm,
        features: planForm.features.filter((f) => f.featureId !== featureId),
      });
    } else {
      setPlanForm({
        ...planForm,
        features: [...planForm.features, { featureId, limit: null }],
      });
    }
  };

  const updateFeatureLimit = (featureId: string, limit: number | null) => {
    setPlanForm({
      ...planForm,
      features: planForm.features.map((f) =>
        f.featureId === featureId ? { ...f, limit } : f
      ),
    });
  };

  const getFeatureName = (featureId: string) => {
    return localApp.features.find((f) => f.id === featureId)?.name || "Inconnue";
  };

  const getDefaultAssignableFeatureId = (plan?: Plan) => {
    const available = localApp.features.find(
      (feature) => !plan?.features.some((pf) => pf.featureId === feature.id),
    );
    return available?.id || localApp.features[0]?.id || "";
  };

  const openAssignPlanFeatureDialog = (plan: Plan) => {
    if (localApp.features.length === 0) {
      toast.error("Aucune fonctionnalité disponible. Créez-en d'abord.");
      return;
    }
    setPlanToAssignFeature(plan);
    setPlanFeatureAssignment({
      featureId: getDefaultAssignableFeatureId(plan),
      quotaLimit: "",
      included: true,
    });
    setIsAssignFeatureToPlanOpen(true);
  };

  const handleAssignFeatureToPlan = async () => {
    if (!planToAssignFeature || !planFeatureAssignment.featureId) {
      toast.error("Sélectionnez une fonctionnalité");
      return;
    }
    try {
      setIsAssigningPlanFeature(true);
      const parsedQuota =
        planFeatureAssignment.quotaLimit.trim() === ""
          ? null
          : Number(planFeatureAssignment.quotaLimit);
      const quotaValue = parsedQuota !== null && !Number.isFinite(parsedQuota) ? null : parsedQuota;
      await applicationService.assignFeatureToPlan({
        planId: planToAssignFeature.id,
        featureId: planFeatureAssignment.featureId,
        quotaLimit: quotaValue,
        included: planFeatureAssignment.included,
      });
      toast.success("Fonctionnalité assignée au plan !");
      await loadPlans(localApp.id);
      setIsAssignFeatureToPlanOpen(false);
      setPlanToAssignFeature(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Impossible d'assigner la fonctionnalité");
    } finally {
      setIsAssigningPlanFeature(false);
    }
  };

  const handleSaveTrialPolicy = async () => {
    if (trialPolicyForm.trialPeriodInDays < 1) {
      toast.error("La période d'essai doit être d'au moins 1 jour");
      return;
    }
    try {
      setIsSavingTrialPolicy(true);
      const payload: TrialPolicyPayload = {
        applicationId: localApp.id,
        enabled: trialPolicyForm.enabled,
        trialPeriodInDays: trialPolicyForm.trialPeriodInDays,
        unlimitedAccess: trialPolicyForm.unlimitedAccess,
      };
      // Passer l'ID de la politique existante si elle existe
      const created = await applicationService.createOrUpdateTrialPolicy(
        payload,
        trialPolicy?.id
      );
      setTrialPolicy(created);
      toast.success(
        trialPolicy
          ? "Politique d'essai mise à jour avec succès"
          : "Politique d'essai créée avec succès"
      );
      await loadTrialPolicy(localApp.id);
    } catch (error: any) {
      console.error("[ApplicationDetails] Error saving trial policy", error);
      toast.error(error?.message || "Impossible de sauvegarder la politique d'essai");
    } finally {
      setIsSavingTrialPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h2>{localApp.name}</h2>
          <p className="text-muted-foreground">Gestion complète de l'application</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'application</Label>
                  <div className="mt-2">{localApp.name}</div>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <div className="mt-2">{localApp.category}</div>
                </div>
                <div>
                  <Label>Version</Label>
                  <div className="mt-2">{localApp.version}</div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div className="mt-2">
                    <Badge
                      variant="secondary"
                      className={`${statusColors[localApp.status]} text-white`}
                    >
                      {statusLabels[localApp.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Nombre d'abonnements</Label>
                  <div className="mt-2">{(localApp.abonnements || 0).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Dernière mise à jour</Label>
                  <div className="mt-2">
                    {new Date(localApp.lastUpdate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-2 text-muted-foreground">
                  {localApp.description || "Aucune description"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#8b68a6]/20 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8b68a6] to-[#6b4685]"></div>
            <CardHeader className="bg-gradient-to-r from-[#8b68a6]/5 to-purple-50/30 border-b border-[#8b68a6]/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg ring-2 ring-blue-200/50">
                  <Clock className="h-6 w-6 text-black drop-shadow-sm" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Période d'essai</CardTitle>
                  <CardDescription className="text-gray-600">
                    Configurez la période d'essai pour cette application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {isLoadingTrialPolicy ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement de la politique d'essai...
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border-2 border-purple-50 bg-gradient-to-br from-white to-purple-50/30 p-6 space-y-6 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between space-x-4 p-5 rounded-xl bg-white/70 border-2 border-purple-50 shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg ring-2 ring-emerald-200/50 flex-shrink-0">
                          <Check className="h-6 w-6 text-emerald-900 drop-shadow-sm" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="trial-enabled" className="text-base font-bold text-gray-900 cursor-pointer">
                            Activer la période d'essai
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Active ou désactive la période d'essai pour cette application
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="trial-enabled"
                        checked={trialPolicyForm.enabled}
                        onCheckedChange={(checked: boolean) =>
                          setTrialPolicyForm({ ...trialPolicyForm, enabled: checked })
                        }
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-white to-purple-50/30 border-2 border-purple-100 shadow-md hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md ring-2 ring-purple-200/50 flex-shrink-0">
                          <CalendarDays className="h-5 w-5 text-purple-900 drop-shadow-sm" />
                        </div>
                        <Label htmlFor="trial-period" className="text-base font-bold text-gray-900 cursor-pointer">
                          Durée de la période d'essai
                        </Label>
                      </div>
                      <Input
                        id="trial-period"
                        type="number"
                        min={1}
                        value={trialPolicyForm.trialPeriodInDays}
                        onChange={(e) =>
                          setTrialPolicyForm({
                            ...trialPolicyForm,
                            trialPeriodInDays: parseInt(e.target.value) || 1,
                          })
                        }
                        disabled={!trialPolicyForm.enabled}
                        className="text-lg font-bold h-14 border-2 border-purple-100 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 bg-white/80 shadow-sm transition-all duration-200 hover:border-purple-200"
                        placeholder="90"
                      />
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span>Nombre de jours pendant lesquels l'application sera disponible en période d'essai</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between space-x-4 p-5 rounded-xl bg-white/70 border-2 border-orange-50 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg ring-2 ring-orange-200/50 flex-shrink-0">
                          <TrendingUp className="h-6 w-6 text-orange-900 drop-shadow-sm" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="trial-unlimited" className="text-base font-bold text-gray-900 cursor-pointer">
                            Accès illimité
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Permet un accès illimité pendant la période d'essai
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="trial-unlimited"
                        checked={trialPolicyForm.unlimitedAccess}
                        onCheckedChange={(checked: boolean) =>
                          setTrialPolicyForm({ ...trialPolicyForm, unlimitedAccess: checked })
                        }
                        disabled={!trialPolicyForm.enabled}
                        className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>
                  </div>

                  {trialPolicy && (
                    <div className="relative rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-6 shadow-lg overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-xl ring-4 ring-indigo-100/50">
                          <Info className="h-7 w-7 text-indigo-900 drop-shadow-md" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-lg font-bold text-gray-900">Informations actuelles</h4>
                            <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 px-3 py-1 font-semibold">
                              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                              Actif
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-200">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-blue-200/50 group-hover:scale-110 transition-transform duration-200">
                                <CalendarDays className="h-6 w-6 text-blue-900 drop-shadow-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Créée le</div>
                                <div className="font-bold text-base text-gray-900 mb-1">
                                  {trialPolicy.createdAt 
                                    ? new Date(trialPolicy.createdAt < 1e12 ? trialPolicy.createdAt * 1000 : trialPolicy.createdAt).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                      })
                                    : "—"}
                                </div>
                                {trialPolicy.createdAt && (
                                  <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md w-fit">
                                    <Clock className="h-3 w-3" />
                                    {new Date(trialPolicy.createdAt < 1e12 ? trialPolicy.createdAt * 1000 : trialPolicy.createdAt).toLocaleTimeString("fr-FR", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            {trialPolicy.updatedAt && trialPolicy.updatedAt !== trialPolicy.createdAt && (
                              <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-md hover:shadow-xl hover:border-emerald-300 transition-all duration-200">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-emerald-200/50 group-hover:scale-110 transition-transform duration-200">
                                  <Clock className="h-6 w-6 text-emerald-900 drop-shadow-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Modifiée le</div>
                                  <div className="font-bold text-base text-gray-900 mb-1">
                                    {new Date(trialPolicy.updatedAt < 1e12 ? trialPolicy.updatedAt * 1000 : trialPolicy.updatedAt).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric"
                                    })}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-md w-fit">
                                    <Clock className="h-3 w-3" />
                                    {new Date(trialPolicy.updatedAt < 1e12 ? trialPolicy.updatedAt * 1000 : trialPolicy.updatedAt).toLocaleTimeString("fr-FR", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-md hover:shadow-xl hover:border-purple-300 transition-all duration-200">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-200/50 group-hover:scale-110 transition-transform duration-200">
                                <Calendar className="h-6 w-6 text-purple-900 drop-shadow-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Période d'essai</div>
                                <div className="font-bold text-base text-gray-900 mb-1">
                                  {trialPolicy.trialPeriodInDays} jour{trialPolicy.trialPeriodInDays > 1 ? "s" : ""}
                                </div>
                                {trialPolicy.createdAt && (
                                  <div className="text-xs font-medium text-purple-600 bg-purple-100/50 px-2 py-1 rounded-md w-fit">
                                    Expire le: {(() => {
                                      const startDate = new Date(trialPolicy.createdAt < 1e12 ? trialPolicy.createdAt * 1000 : trialPolicy.createdAt);
                                      const endDate = new Date(startDate);
                                      endDate.setDate(endDate.getDate() + trialPolicy.trialPeriodInDays);
                                      return endDate.toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric"
                                      });
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-200">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-orange-200/50 group-hover:scale-110 transition-transform duration-200">
                                <TrendingUp className="h-6 w-6 text-orange-900 drop-shadow-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-orange-700 mb-1.5 uppercase tracking-wide">Accès</div>
                                <div className="font-bold text-base text-gray-900 mb-1">
                                  {trialPolicy.unlimitedAccess ? "Illimité" : "Limité"}
                                </div>
                                <div className="text-xs font-medium text-orange-600 bg-orange-100/50 px-2 py-1 rounded-md w-fit">
                                  Statut: {trialPolicy.enabled ? "Activé" : "Désactivé"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveTrialPolicy}
                    disabled={isSavingTrialPolicy || !trialPolicyForm.enabled}
                    className="w-full bg-[#8b68a6] hover:bg-[#6b4685]"
                  >
                    {isSavingTrialPolicy
                      ? "Enregistrement..."
                      : trialPolicy
                      ? "Mettre à jour la politique d'essai"
                      : "Créer la politique d'essai"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">Fonctionnalités</CardTitle>
                  <CardDescription className="text-gray-600">
                    {localApp.features.length} fonctionnalité(s)
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddFeatureDialogOpen(true)} className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une fonctionnalité
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFeatures ? (
                <div className="text-center py-12 text-gray-500">Chargement des fonctionnalités...</div>
              ) : localApp.features.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune fonctionnalité ajoutée
                </div>
              ) : (
                <div className="rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 sticky top-0 z-10">
                      <TableRow className="border-b-2 border-gray-300 hover:bg-transparent">
                        <TableHead className="text-gray-800 font-bold text-sm py-4">Nom</TableHead>
                        <TableHead className="text-gray-800 font-bold text-sm py-4">Description</TableHead>
                        <TableHead className="text-gray-800 font-bold text-sm py-4">Clé</TableHead>
                        <TableHead className="text-right text-gray-800 font-bold text-sm py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {localApp.features.map((feature, index) => (
                        <TableRow 
                          key={feature.id} 
                          className={`border-b border-gray-100 transition-colors duration-150 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          } hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent hover:shadow-sm`}
                        >
                          <TableCell className="py-4">
                            <div className="font-semibold text-gray-900">{feature.name}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-gray-600 text-sm max-w-md truncate" title={feature.description}>
                              {feature.description || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <code className="inline-flex items-center text-xs bg-yellow-500 hover-bg-yellow-100 text-gray-800 px-3 py-1.5 rounded-lg border border-yellow-300 font-mono font-semibold shadow-sm">
                              {feature.key}
                            </code>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditFeatureDialog(feature)}
                                className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteFeatureDialog(feature)}
                                className="h-8 w-8 hover:bg-red-100 hover:text-red-700 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plans de tarification</CardTitle>
                  <CardDescription>{localApp.plans.length} plan(s)</CardDescription>
                </div>
                <Button onClick={() => setIsAddPlanDialogOpen(true)} className="bg-[#8b68a6] hover:bg-[#6b4685]">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPlans ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des plans...
                </div>
              ) : localApp.plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun plan ajouté
                </div>
              ) : (
                <div className="grid gap-4">
                  {localApp.plans.map((plan) => {
                    const planPromotions = promotionsByPlan[plan.id] || [];
                    return (
                    <Card key={plan.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              title="Créer une promotion"
                              onClick={() => openPromotionDialog(plan)}
                              disabled={!plan.id}
                            >
                              <Tag className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Assigner une fonctionnalité"
                              onClick={() => openAssignPlanFeatureDialog(plan)}
                              disabled={localApp.features.length === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditPlanDialog(plan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openDeletePlanDialog(plan)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-muted-foreground text-sm">Prix mensuel</div>
                              <div className="text-lg font-semibold">
                                {plan.monthlyPrice ?? plan.price} {plan.currency || "XAF"}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-sm">Prix annuel</div>
                              <div className="text-lg font-semibold">
                                {plan.yearlyPrice ?? 0} {plan.currency || "XAF"}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-sm">Utilisateurs max</div>
                              <div>{plan.maxUsers ?? "—"}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-sm">Stockage max (Mo)</div>
                              <div>{plan.maxStorage ?? "—"}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-2">
                              Fonctionnalités incluses
                            </div>
                            {plan.features.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                Aucune fonctionnalité
                              </div>
                            ) : (
                              <ul className="space-y-2">
                                {plan.features.map((pf) => (
                                  <li key={pf.featureId} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>{getFeatureName(pf.featureId)}</span>
                                    {pf.limit !== null && (
                                      <Badge variant="secondary">
                                        Limite: {pf.limit}
                                      </Badge>
                                    )}
                                    {pf.limit === null && (
                                      <Badge variant="secondary">Illimité</Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Tag className="h-5 w-5 text-[#8b68a6]" />
                                <span className="font-semibold text-gray-900">Promotions liées</span>
                                {planPromotions.length > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    {planPromotions.length}
                                  </Badge>
                                )}
                              </div>
                              {isLoadingPromotions && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  Chargement...
                                </span>
                              )}
                            </div>
                            {planPromotions.length === 0 ? (
                              <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                                <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Aucune promotion pour ce plan
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Cliquez sur l'icône <Tag className="h-3 w-3 inline" /> pour créer une promotion
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-4">
                                {planPromotions.map((promo) => {
                                  const isActive = formatPromotionStatus(promo).toUpperCase() === "ACTIVE";
                                  // Vérifier si la promotion est expirée en utilisant la même logique que formatPromotionDate
                                  let isExpired = false;
                                  if (promo.endDate) {
                                    let endDate: Date | null = null;
                                    if (Array.isArray(promo.endDate) && promo.endDate.length >= 3) {
                                      endDate = new Date(Number(promo.endDate[0]), Number(promo.endDate[1]) - 1, Number(promo.endDate[2]));
                                    } else if (typeof promo.endDate === "number") {
                                      endDate = new Date(promo.endDate < 1e12 ? promo.endDate * 1000 : promo.endDate);
                                    } else if (typeof promo.endDate === "string" && promo.endDate) {
                                      const parsedDate = new Date(promo.endDate);
                                      if (!Number.isNaN(parsedDate.getTime())) {
                                        endDate = parsedDate;
                                      }
                                    }
                                    if (endDate && !isNaN(endDate.getTime())) {
                                      isExpired = endDate < new Date();
                                    }
                                  }
                                  const statusColor = isActive && !isExpired 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : "bg-gray-100 text-gray-600 border-gray-200";
                                  
                                  return (
                                    <div
                                      key={promo.id}
                                      className="group relative rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#8b68a6]/30"
                                    >
                                      {/* Header avec code et statut */}
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#8b68a6] to-[#6b4685] flex items-center justify-center shadow-sm">
                                              <Ticket className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                              <div className="font-bold text-lg text-gray-900 tracking-wide">
                                                {promo.code}
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                  {formatPromotionDate(promo.startDate)} →{" "}
                                                  {formatPromotionDate(promo.endDate)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Badge 
                                          className={`text-xs font-semibold px-3 py-1 ${statusColor} border`}
                                        >
                                          {formatPromotionStatus(promo)}
                                        </Badge>
                                      </div>

                                      {/* Informations principales */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-start gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Percent className="h-4 w-4 text-purple-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-0.5">
                                              Réduction
                                            </div>
                                            <div className="font-bold text-base text-gray-900">
                                              {formatPercentage(promo.discountPercentage)}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-0.5">
                                              Montant min.
                                            </div>
                                            <div className="font-semibold text-sm text-gray-900 truncate">
                                              {formatMoney(promo.minPurchaseAmount, plan.currency || "XAF")}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="h-4 w-4 text-orange-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-0.5">
                                              Utilisations
                                            </div>
                                            <div className="font-semibold text-sm text-gray-900">
                                              {promo.currentUsage ?? 0} / {(promo.maxUsage ?? 0) || "∞"}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-0.5">
                                              Créée par
                                            </div>
                                            <div className="font-semibold text-xs text-gray-900 truncate">
                                              {promo.createdBy ? (
                                                <span className="inline-block max-w-full truncate" title={promo.createdBy}>
                                                  {promo.createdBy.slice(0, 20)}
                                                  {promo.createdBy.length > 20 ? "..." : ""}
                                                </span>
                                              ) : (
                                                "—"
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Barre de progression pour le quota */}
                                      {promo.maxUsage && promo.maxUsage > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                            <span>Progression du quota</span>
                                            <span>
                                              {Math.round(
                                                ((promo.currentUsage ?? 0) / promo.maxUsage) * 100
                                              )}
                                              %
                                            </span>
                                          </div>
                                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-[#8b68a6] to-[#6b4685] rounded-full transition-all duration-300"
                                              style={{
                                                width: `${Math.min(
                                                  ((promo.currentUsage ?? 0) / promo.maxUsage) * 100,
                                                  100
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Ajouter une fonctionnalité */}
      <Dialog open={isAddFeatureDialogOpen} onOpenChange={setIsAddFeatureDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Ajouter une fonctionnalité</DialogTitle>
            <DialogDescription>
              Créez une nouvelle fonctionnalité pour cette application
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="feature-name">Nom de la fonctionnalité</Label>
              <Input
                id="feature-name"
                value={featureForm.name}
                onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                placeholder="Ex: Export PDF"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature-description">Description</Label>
              <Textarea
                id="feature-description"
                value={featureForm.description}
                onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                placeholder="Ex: Permet d'exporter les documents en PDF"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="feature-type">Type</Label>
                <Input
                  id="feature-type"
                  value={featureForm.type}
                  onChange={(e) => setFeatureForm({ ...featureForm, type: e.target.value })}
                  placeholder="payment"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feature-category">Catégorie</Label>
                <Input
                  id="feature-category"
                  value={featureForm.category}
                  onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                  placeholder="finance"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feature-key">Clé technique</Label>
              <Input
                id="feature-key"
                value={featureForm.key}
                onChange={(e) => setFeatureForm({ ...featureForm, key: e.target.value })}
                placeholder="Ex: export_pdf"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFeatureDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddFeature}
              className="bg-[#8b68a6] hover:bg-[#6b4685]"
              disabled={isSavingFeature || !featureForm.name || !featureForm.type || !featureForm.category}
            >
              {isSavingFeature ? "Envoi..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier une fonctionnalité */}
      <Dialog open={isEditFeatureDialogOpen} onOpenChange={setIsEditFeatureDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Modifier la fonctionnalité</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la fonctionnalité
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-feature-name">Nom de la fonctionnalité</Label>
              <Input
                id="edit-feature-name"
                value={featureForm.name}
                onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-feature-description">Description</Label>
              <Textarea
                id="edit-feature-description"
                value={featureForm.description}
                onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-feature-type">Type</Label>
                <Input
                  id="edit-feature-type"
                  value={featureForm.type}
                  onChange={(e) => setFeatureForm({ ...featureForm, type: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-feature-category">Catégorie</Label>
                <Input
                  id="edit-feature-category"
                  value={featureForm.category}
                  onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-feature-key">Clé technique</Label>
              <Input
                id="edit-feature-key"
                value={featureForm.key}
                onChange={(e) => setFeatureForm({ ...featureForm, key: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFeatureDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditFeature}
              className="bg-[#8b68a6] hover:bg-[#6b4685]"
              disabled={!featureForm.name || !featureForm.key}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Supprimer fonctionnalité */}
      <AlertDialog open={isDeleteFeatureDialogOpen} onOpenChange={setIsDeleteFeatureDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la fonctionnalité "{selectedFeature?.name}" et la retirera
              de tous les plans qui l'utilisent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Ajouter un plan */}
      <Dialog open={isAddPlanDialogOpen} onOpenChange={setIsAddPlanDialogOpen}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un plan</DialogTitle>
            <DialogDescription>
              Créez un nouveau plan de tarification avec ses fonctionnalités
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Nom du plan</Label>
              <Input
                id="plan-name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Ex: Premium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Ex: Toutes les fonctionnalités avancées"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-monthly-price">Prix mensuel (€)</Label>
                <Input
                  id="plan-monthly-price"
                  type="number"
                  step="0.01"
                  value={planForm.monthlyPrice}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-yearly-price">Prix annuel (€)</Label>
                <Input
                  id="plan-yearly-price"
                  type="number"
                  step="0.01"
                  value={planForm.yearlyPrice}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan-max-users">Utilisateurs max</Label>
                <Input
                  id="plan-max-users"
                  type="number"
                  value={planForm.maxUsers}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan-priority">Priorité</Label>
                <Input
                  id="plan-priority"
                  type="number"
                  value={planForm.priority}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, priority: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Période de facturation</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={planForm.interval === "month" ? "default" : "outline"}
                  onClick={() => setPlanForm({ ...planForm, interval: "month" })}
                  className={planForm.interval === "month" ? "bg-[#8b68a6] hover:bg-[#6b4685]" : ""}
                >
                  Mensuel
                </Button>
                <Button
                  type="button"
                  variant={planForm.interval === "year" ? "default" : "outline"}
                  onClick={() => setPlanForm({ ...planForm, interval: "year" })}
                  className={planForm.interval === "year" ? "bg-[#8b68a6] hover:bg-[#6b4685]" : ""}
                >
                  Annuel
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fonctionnalités incluses</Label>
              {localApp.features.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aucune fonctionnalité disponible. Créez-en d'abord dans l'onglet
                  Fonctionnalités.
                </div>
              ) : (
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {localApp.features.map((feature) => {
                    const planFeature = planForm.features.find(
                      (pf) => pf.featureId === feature.id
                    );
                    const isSelected = !!planFeature;
                    
                    return (
                      <div key={feature.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatureInPlan(feature.id)}
                            className="h-8"
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <span>{feature.name}</span>
                        </div>
                        {isSelected && (
                          <div className="ml-10 flex items-center gap-2">
                            <Label className="text-xs">Limite:</Label>
                            <Input
                              type="number"
                              placeholder="Illimité"
                              value={planFeature?.limit ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFeatureLimit(
                                  feature.id,
                                  value === "" ? null : parseInt(value)
                                );
                              }}
                              className="h-8 w-32"
                            />
                            <span className="text-xs text-muted-foreground">
                              (vide = illimité)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPlanDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddPlan}
              className="bg-[#8b68a6] hover:bg-[#6b4685]"
              disabled={isSavingPlan || !planForm.name}
            >
              {isSavingPlan ? "Envoi..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Créer une promotion */}
      <Dialog
        open={isPromotionDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsPromotionDialogOpen(open);
          if (!open) {
            setPromotionPlan(null);
            resetPromotionForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Créer une promotion</DialogTitle>
            <DialogDescription>
              Associez un code promotionnel au plan "{promotionPlan?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1 text-sm text-muted-foreground">
              <span>ID du plan: <strong>{promotionPlan?.id || "—"}</strong></span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotion-code">Code</Label>
              <Input
                id="promotion-code"
                value={promotionForm.code}
                onChange={(e) => handlePromotionFieldChange("code", e.target.value)}
                placeholder="SUMMER2024"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="promotion-discount">Réduction (%)</Label>
                <Input
                  id="promotion-discount"
                  type="number"
                  step="0.01"
                  min={0}
                  value={promotionForm.discountPercentage}
                  onChange={(e) => handlePromotionFieldChange("discountPercentage", e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promotion-max-usage">Utilisations max</Label>
                <Input
                  id="promotion-max-usage"
                  type="number"
                  min={0}
                  value={promotionForm.maxUsage}
                  onChange={(e) => handlePromotionFieldChange("maxUsage", e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="promotion-start">Date de début</Label>
                <Input
                  id="promotion-start"
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => handlePromotionFieldChange("startDate", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="promotion-end">Date de fin</Label>
                <Input
                  id="promotion-end"
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => handlePromotionFieldChange("endDate", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotion-min-amount">Montant minimum d'achat</Label>
              <Input
                id="promotion-min-amount"
                type="number"
                step="0.01"
                min={0}
                value={promotionForm.minPurchaseAmount}
                onChange={(e) =>
                  handlePromotionFieldChange("minPurchaseAmount", e.target.value)
                }
                placeholder="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromotionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePromotion} disabled={isCreatingPromotion}>
              {isCreatingPromotion ? "Création..." : "Créer la promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog assigner une fonctionnalité à un plan */}
      <Dialog
        open={isAssignFeatureToPlanOpen}
        onOpenChange={(open: boolean) => {
          setIsAssignFeatureToPlanOpen(open);
          if (!open) {
            setPlanToAssignFeature(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assigner une fonctionnalité</DialogTitle>
            <DialogDescription>
              Ajoutez une fonctionnalité existante au plan "{planToAssignFeature?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Fonctionnalité</Label>
              <Select
                value={planFeatureAssignment.featureId}
                onValueChange={(value: string) =>
                  setPlanFeatureAssignment((prev) => ({ ...prev, featureId: value }))
                }
                disabled={localApp.features.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une fonctionnalité" />
                </SelectTrigger>
                <SelectContent>
                  {localApp.features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan-feature-quota">Quota (optionnel)</Label>
              <Input
                id="plan-feature-quota"
                type="number"
                min={0}
                placeholder="Illimité"
                value={planFeatureAssignment.quotaLimit}
                onChange={(e) =>
                  setPlanFeatureAssignment((prev) => ({
                    ...prev,
                    quotaLimit: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="plan-feature-included"
                checked={planFeatureAssignment.included}
                onCheckedChange={(checked: boolean) =>
                  setPlanFeatureAssignment((prev) => ({ ...prev, included: checked }))
                }
              />
              <Label htmlFor="plan-feature-included" className="text-sm">
                Inclure dans le plan (actif par défaut)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignFeatureToPlanOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignFeatureToPlan} disabled={isAssigningPlanFeature}>
              {isAssigningPlanFeature ? "Association..." : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier un plan */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le plan</DialogTitle>
            <DialogDescription>
              Modifiez les informations du plan de tarification
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-name">Nom du plan</Label>
              <Input
                id="edit-plan-name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-description">Description</Label>
              <Textarea
                id="edit-plan-description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-monthly-price">Prix mensuel (€)</Label>
                <Input
                  id="edit-plan-monthly-price"
                  type="number"
                  step="0.01"
                  value={planForm.monthlyPrice}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-yearly-price">Prix annuel (€)</Label>
                <Input
                  id="edit-plan-yearly-price"
                  type="number"
                  step="0.01"
                  value={planForm.yearlyPrice}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-max-users">Utilisateurs max</Label>
                <Input
                  id="edit-plan-max-users"
                  type="number"
                  value={planForm.maxUsers}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-priority">Priorité</Label>
                <Input
                  id="edit-plan-priority"
                  type="number"
                  value={planForm.priority}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, priority: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Période de facturation</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={planForm.interval === "month" ? "default" : "outline"}
                  onClick={() => setPlanForm({ ...planForm, interval: "month" })}
                  className={planForm.interval === "month" ? "bg-[#8b68a6] hover:bg-[#6b4685]" : ""}
                >
                  Mensuel
                </Button>
                <Button
                  type="button"
                  variant={planForm.interval === "year" ? "default" : "outline"}
                  onClick={() => setPlanForm({ ...planForm, interval: "year" })}
                  className={planForm.interval === "year" ? "bg-[#8b68a6] hover:bg-[#6b4685]" : ""}
                >
                  Annuel
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fonctionnalités incluses</Label>
              {localApp.features.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aucune fonctionnalité disponible
                </div>
              ) : (
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {localApp.features.map((feature) => {
                    const planFeature = planForm.features.find(
                      (pf) => pf.featureId === feature.id
                    );
                    const isSelected = !!planFeature;
                    
                    return (
                      <div key={feature.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatureInPlan(feature.id)}
                            className="h-8"
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <span>{feature.name}</span>
                        </div>
                        {isSelected && (
                          <div className="ml-10 flex items-center gap-2">
                            <Label className="text-xs">Limite:</Label>
                            <Input
                              type="number"
                              placeholder="Illimité"
                              value={planFeature?.limit ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFeatureLimit(
                                  feature.id,
                                  value === "" ? null : parseInt(value)
                                );
                              }}
                              className="h-8 w-32"
                            />
                            <span className="text-xs text-muted-foreground">
                              (vide = illimité)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlanDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditPlan}
              className="bg-[#8b68a6] hover:bg-[#6b4685]"
              disabled={!planForm.name}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Supprimer plan */}
      <AlertDialog open={isDeletePlanDialogOpen} onOpenChange={setIsDeletePlanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le plan "{selectedPlan?.name}" de manière définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}