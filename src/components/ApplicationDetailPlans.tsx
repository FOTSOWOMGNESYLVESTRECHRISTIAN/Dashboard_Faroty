import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, Edit, Trash2, Loader2, Check, X, Settings, Gift, Users, Calendar, Database, Star, Zap, Tag, ChevronRight, Sparkles, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import { promotionService } from "../services/promotionService";
import { applicationService } from "../services/applicationService";
import { resolveConnectedUserId } from "../utils/authUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  trialPeriodInDays: number;
  priority: number;
  active: boolean;
  applicationId: string;
  applicationName: string | null;
  currency: {
    code: string;
    name: string | null;
    symbol: string | null;
    decimalPrecision: number | null;
  };
  hasTrial: boolean;
  hasActivePromotion: boolean | null;
  activePromotion: any | null;
  isDefaultFreePlan: boolean;
  createdAt: number;
  updatedAt: number;
  maxStorage?: number;
}

// Helper for price formatting
const formatPrice = (price: number, currencyCode = "XAF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

interface ApplicationDetailPlansProps {
  applicationId: string;
  onPlansUpdate?: (plans: Plan[]) => void;
}

const getPriorityBadgeStyle = (priority: number) => {
  switch (priority) {
    case 1:
      return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
    case 2:
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    case 3:
      return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
    case 4:
      return "bg-gradient-to-r from-purple-500 to-violet-500 text-white";
    default:
      return "bg-gradient-to-r from-gray-500 to-slate-500 text-white";
  }
};

const getPlanCardGradient = (priority: number) => {
  switch (priority) {
    case 1:
      return "from-amber-50 via-orange-50 to-yellow-50 border-amber-200";
    case 2:
      return "from-blue-50 via-cyan-50 to-sky-50 border-blue-200";
    case 3:
      return "from-emerald-50 via-green-50 to-lime-50 border-emerald-200";
    case 4:
      return "from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200";
    default:
      return "from-gray-50 via-slate-50 to-zinc-50 border-gray-200";
  }
};

export function ApplicationDetailPlans({
  applicationId,
  onPlansUpdate,
}: ApplicationDetailPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planFeatures, setPlanFeatures] = useState<Record<string, PlanFeature[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Feature Assignment States
  const [isFeatureAssignDialogOpen, setIsFeatureAssignDialogOpen] = useState(false);
  const [selectedPlanForFeature, setSelectedPlanForFeature] = useState<Plan | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<PlanFeature[]>([]);
  const [selectedFeatureIdToAssign, setSelectedFeatureIdToAssign] = useState<string>("");
  const [isAssigningFeature, setIsAssigningFeature] = useState(false);

  // Promotion States
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [selectedPlanForPromotion, setSelectedPlanForPromotion] = useState<Plan | null>(null);
  const [promotionFormData, setPromotionFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    maxUsage: 100,
    minPurchaseAmount: 0,
    isActive: true
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    trialPeriodInDays: 0,
    priority: 1,
    active: true,
    isDefaultFreePlan: false,
    currencyCode: 'XAF',
    maxStorage: 0,
  });

  const openPlanForm = (plan: Plan | null = null) => {
    if (plan) {
      setCurrentPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxUsers: plan.maxUsers,
        trialPeriodInDays: plan.trialPeriodInDays,
        priority: plan.priority,
        active: plan.active,
        isDefaultFreePlan: plan.isDefaultFreePlan,
        currencyCode: plan.currency?.code || 'XAF',
        maxStorage: plan.maxStorage || 0,
      });
    } else {
      setCurrentPlan(null);
      setFormData({
        name: '',
        description: '',
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 1,
        trialPeriodInDays: 0,
        priority: 1,
        active: true,
        isDefaultFreePlan: false,
        currencyCode: 'XAF',
        maxStorage: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const basePayload: any = {
        name: formData.name,
        description: formData.description,
        monthlyPrice: formData.monthlyPrice,
        yearlyPrice: formData.yearlyPrice,
        maxUsers: formData.maxUsers,
        trialPeriodInDays: formData.trialPeriodInDays,
        priority: formData.priority,
        active: formData.active,
        currencyCode: formData.currencyCode,
        applicationId
      };

      if (currentPlan) {
        await applicationService.updatePlan(currentPlan.id, basePayload);
        toast.success('✅ Plan mis à jour avec succès');
      } else {
        await applicationService.addPlan(basePayload);
        toast.success('🎉 Plan créé avec succès');
      }

      await loadPlans();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du plan:', error);
      toast.error('❌ Erreur lors de la sauvegarde du plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const fetchPlanFeatures = async (planId: string) => {
    try {
      const response = await apiClient.get<{ success: boolean, data: PlanFeature[] }>(
        API_ENDPOINTS.ABONNEMENT.PLAN_FEATURES_BY_PLAN(planId)
      );
      if (response.success) {
        setPlanFeatures(prev => ({
          ...prev,
          [planId]: response.data || []
        }));
      }
    } catch (error) {
      console.error(`Erreur fetch features plan ${planId}`, error);
    }
  };

  const loadPlans = useCallback(async () => {
    if (!applicationId) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Plan[];
        message?: string;
      }>(`${API_ENDPOINTS.ABONNEMENT.PLANS}/application/${applicationId}`);

      if (response.success && Array.isArray(response.data)) {
        const formattedPlans = response.data.map(plan => ({
          ...plan,
          monthlyPrice: Number(plan.monthlyPrice) || 0,
          yearlyPrice: Number(plan.yearlyPrice) || 0,
          maxUsers: Number(plan.maxUsers) || 0,
          trialPeriodInDays: Number(plan.trialPeriodInDays) || 0,
          priority: Number(plan.priority) || 0,
          maxStorage: Number(plan.maxStorage) || 0,
          active: Boolean(plan.active),
          hasTrial: Boolean(plan.hasTrial),
          isDefaultFreePlan: Boolean(plan.isDefaultFreePlan),
          currency: plan.currency || {
            code: "XAF",
            name: null,
            symbol: null,
            decimalPrecision: 0,
          },
        }));

        setPlans(formattedPlans);
        onPlansUpdate?.(formattedPlans);

        formattedPlans.forEach(plan => fetchPlanFeatures(plan.id));
      } else {
        toast.error(response.message || "Erreur lors du chargement des plans");
        setPlans([]);
      }
    } catch (err) {
      console.error("Erreur chargement plans:", err);
      toast.error("Erreur lors du chargement des plans");
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadPlans();
    fetchAvailableFeatures();
  }, [loadPlans]);

  const fetchAvailableFeatures = async () => {
    if (!applicationId) return;
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        API_ENDPOINTS.ABONNEMENT.FEATURES_BY_APPLICATION(applicationId)
      );
      if (response.success && Array.isArray(response.data)) {
        setAvailableFeatures(response.data.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          code: f.code
        })));
      }
    } catch (error) {
      console.error("Erreur chargement features application", error);
      toast.error("Impossible de charger les fonctionnalités disponibles");
    }
  };

  const openAssignFeatureDialog = async (plan: Plan) => {
    setSelectedPlanForFeature(plan);
    setSelectedFeatureIdToAssign("");
    setIsFeatureAssignDialogOpen(true);
    await fetchAvailableFeatures();
  };

  const handleAssignFeature = async () => {
    if (!selectedPlanForFeature || !selectedFeatureIdToAssign) {
      toast.error("Veuillez sélectionner une fonctionnalité");
      return;
    }

    setIsAssigningFeature(true);
    try {
      const payload = {
        planId: selectedPlanForFeature.id,
        featureId: selectedFeatureIdToAssign,
      };

      await apiClient.post(API_ENDPOINTS.ABONNEMENT.PLAN_FEATURES, payload);
      toast.success("✨ Fonctionnalité assignée avec succès");

      await fetchPlanFeatures(selectedPlanForFeature.id);
      setIsFeatureAssignDialogOpen(false);
    } catch (error: any) {
      console.error("Erreur assignation feature", error);
      if (error?.status === 409 || error?.message?.includes("conflit") || error?.details?.includes("conflit")) {
        toast.error("⚠️ Cette fonctionnalité est déjà assignée à ce plan.");
      } else {
        toast.error("❌ Erreur lors de l'assignation");
      }
    } finally {
      setIsAssigningFeature(false);
    }
  };

  const handleOpenPromotionDialog = (plan: Plan) => {
    setSelectedPlanForPromotion(plan);
    setPromotionFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxUsage: 100,
      minPurchaseAmount: 0,
      isActive: true
    });
    setIsPromotionDialogOpen(true);
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPromotion) return;

    if (!promotionFormData.code || promotionFormData.discountValue <= 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!promotionFormData.endDate) {
      toast.error("La date de fin est obligatoire");
      return;
    }

    const startDate = new Date(promotionFormData.startDate);
    const endDate = new Date(promotionFormData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Les dates fournies sont invalides");
      return;
    }

    if (startDate >= endDate) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        code: promotionFormData.code.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxUsage: Number(promotionFormData.maxUsage) || 0,
        planId: selectedPlanForPromotion.id,
        applicationId,
        createdBy: resolveConnectedUserId() || 'admin',
        active: promotionFormData.isActive,
        discountPercentage: promotionFormData.discountType === 'percentage' ? Number(promotionFormData.discountValue) : 0,
        minPurchaseAmount: promotionFormData.discountType === 'fixed' ? Number(promotionFormData.discountValue) : Number(promotionFormData.minPurchaseAmount)
      };

      await promotionService.createPromotion(payload);
      toast.success("🎉 Promotion créée avec succès");
      setIsPromotionDialogOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de la création de la promotion:", error);

      if (error?.status === 409 || error?.message?.includes('conflit') || error?.message?.includes('existe déjà')) {
        toast.error(`⚠️ Une promotion avec le code "${promotionFormData.code}" existe déjà.`);
      } else {
        toast.error("❌ Erreur lors de la création");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(
        `${API_ENDPOINTS.ABONNEMENT.PLANS}/${planToDelete.id}`
      );
      setPlans(prev => prev.filter(p => p.id !== planToDelete.id));
      toast.success("🗑️ Plan supprimé");
      setPlanToDelete(null);
    } catch {
      toast.error("❌ Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-violet-600 animate-pulse" />
        </div>
        <p className="text-lg font-medium text-gray-600">Chargement des plans...</p>
        <p className="text-sm text-gray-400">Préparation de votre espace d'abonnement</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section Enhanced */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-white to-indigo-50 border border-violet-100 p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-200/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg p-2">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-900 to-indigo-800 bg-clip-text text-transparent">
                    Plans d'abonnement
                  </h1>
                  <p className="text-violet-600 mt-1 text-base max-w-2xl">
                    Configurez et gérez les différents plans d'abonnement disponibles pour votre application. 
                    Chaque plan est une étape vers le succès de vos utilisateurs.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-violet-500">
                <Badge variant="outline" className="bg-violet-50 border-violet-200">
                  {plans.length} plan{plans.length > 1 ? 's' : ''}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Créez des expériences uniques
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-md"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  color="default"
                  style={{cursor: 'pointer'}}
                >
                  Grille
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-md"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  color="default"
                  style={{cursor: 'pointer'}}
                >
                  Liste
                </Button>
              </div>
              <Button
                onClick={() => openPlanForm()}
                className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 bg-purple-600 hover:bg-purple-700"
                size="lg"
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="default"
                color="default"
                style={{cursor: 'pointer'}}
              >
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-semibold">Nouveau Plan</span>
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Plans actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.filter(p => p.active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Plans avec essai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.filter(p => p.trialPeriodInDays > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gratuits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.filter(p => p.isDefaultFreePlan).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Crown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.filter(p => p.priority === 1).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-indigo-50/50" />
          <Card className="border-2 border-dashed border-violet-300 bg-white/80 backdrop-blur-sm relative">
            <CardContent className="text-center p-12 md:p-16 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 p-6 rounded-2xl shadow-xl">
                  <Settings className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Commencez votre voyage d'abonnement
              </h3>
              <p className="text-gray-600 max-w-md mb-8">
                Créez votre premier plan d'abonnement pour offrir des expériences personnalisées à vos utilisateurs. 
                Chaque plan est une opportunité de croissance.
              </p>
              <Button 
                onClick={() => openPlanForm()} 
                className="rounded-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-purple-600 hover:bg-purple-700"
                size="lg"
                style={{cursor: 'pointer'}}
              >
                <Plus className="mr-2 h-5 w-5" />
                Créer mon premier plan
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-gray-400 mt-4">
                Recommandé : Commencez avec un plan gratuit pour attirer vos premiers utilisateurs
              </p>
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative group transition-all duration-500 hover:-translate-y-2 ${
                plan.priority === 1 ? 'scale-[1.02]' : ''
              }`}
            >
              {plan.priority === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="bg-amber-500 to-orange-500 text-white px-4 py-1.5 shadow-lg animate-pulse">
                    <Star className="h-3 w-3 mr-1" /> POPULAIRE
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full border-2 ${plan.active ? 'border-violet-200' : 'border-gray-200'} 
                bg-gradient-to-b ${getPlanCardGradient(plan.priority)} 
                shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-2xl overflow-hidden`}>
                
                {/* Plan Status Ribbon */}
                <div className={`absolute top-0 right-0 w-24 h-24 overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-8 transform rotate-45 translate-x-8 translate-y-2 ${
                    plan.active ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    <span className="absolute top-1 left-0 w-full text-center text-[10px] font-bold text-white">
                      {plan.active ? 'ACTIF' : 'ARCHIVÉ'}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-4 pt-8 relative">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`${getPriorityBadgeStyle(plan.priority)}`}>
                      Priorité {plan.priority}
                    </Badge>
                    {plan.hasActivePromotion && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 text-pink-700">
                              <Gift className="h-3 w-3 mr-1" /> Promo
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Promotion active disponible</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    {plan.name}
                    {plan.isDefaultFreePlan && (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-500">
                        GRATUIT
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[3em] text-gray-600">
                    {plan.description || "Un plan conçu pour votre réussite"}
                  </CardDescription>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent">
                        {formatPrice(plan.monthlyPrice, plan.currency?.code)}
                      </span>
                      <span className="text-lg font-medium text-gray-500">/ mois</span>
                    </div>
                    {plan.yearlyPrice > 0 && (
                      <div className="text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 p-4 rounded-lg border border-gray-500">
                        <span className="font-semibold text-gray-700">
                          {formatPrice(plan.yearlyPrice, plan.currency?.code)}
                        </span>
                        <span className="text-gray-500"> / an</span>
                        <div className="text-xs text-green-600 mt-1">
                          Économisez {Math.round((1 - (plan.yearlyPrice / (plan.monthlyPrice * 12))) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-100 hover:bg-gray-200 p-6 rounded-xl border border-gray-500 shadow-sm text-center">
                      <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{plan.maxUsers}</div>
                      <div className="text-xs text-gray-500">Utilisateurs</div>
                    </div>
                    <div className="bg-gray-100 hover:bg-gray-200 p-6 rounded-xl border border-gray-500 shadow-sm text-center">
                      <Calendar className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {plan.trialPeriodInDays > 0 ? `${plan.trialPeriodInDays}j` : "-"}
                      </div>
                      <div className="text-xs text-gray-500">Essai gratuit</div>
                    </div>
                    <div className="bg-gray-100 hover:bg-gray-200 p-6 rounded-xl border border-gray-500 shadow-sm text-center">
                      <Database className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">
                        {plan.maxStorage ? `${plan.maxStorage} MB` : '∞'}
                      </div>
                      <div className="text-xs text-gray-500">Stockage</div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-lg">
                          <Zap className="h-4 w-4 text-violet-600" />
                        </div>
                        <span className="font-semibold text-gray-900">Fonctionnalités incluses</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:bg-green-100"
                              onClick={() => openAssignFeatureDialog(plan)}
                              style={{cursor: 'pointer'}}
                            >
                              <Plus className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ajouter une fonctionnalité</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="min-h-[80px] bg-white/50 rounded-xl p-4 border border-gray-500">
                      {planFeatures[plan.id] && planFeatures[plan.id].length > 0 ? (
                        <div className="space-y-2">
                          {planFeatures[plan.id].slice(0, 3).map((feature: any) => {
                            const featureName = feature.name
                              || feature.feature?.name
                              || availableFeatures.find(f => f.id === feature.featureId)?.name
                              || availableFeatures.find(f => f.id === feature.id)?.name;

                            return (
                              <div key={feature.id} className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{featureName || "Fonctionnalité"}</span>
                              </div>
                            );
                          })}
                          {planFeatures[plan.id].length > 3 && (
                            <div className="pt-2 text-center">
                              <Badge variant="outline" className="text-xs">
                                +{planFeatures[plan.id].length - 3} autres
                              </Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400 gap-2">
                          <Settings className="h-6 w-6" />
                          <span>Aucune fonctionnalité configurée</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <div className="p-6 pt-4 border-t border-gray-100 bg-gradient-to-t from-white to-gray-50/50">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 border-yellow-200 text-white hover:bg-amber-100 hover:text-white"
                      onClick={() => handleOpenPromotionDialog(plan)}
                      style={{cursor: 'pointer'}}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Promotions
                    </Button>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-blue-200 bg-blue-50 text-blue-600 hover:text-blue-600 hover:bg-blue-100"
                              onClick={() => openPlanForm(plan)}
                              style={{cursor: 'pointer'}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier le plan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-red-200 bg-red-500 text-white hover:text-white hover:bg-red-100"
                              onClick={() => setPlanToDelete(plan)}
                              style={{cursor: 'pointer'}}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer le plan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {plans.map(plan => (
            <Card key={plan.id} className="border border-gray-200 hover:border-violet-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <Badge className={getPriorityBadgeStyle(plan.priority)}>
                        Priorité {plan.priority}
                      </Badge>
                      {!plan.active && (
                        <Badge variant="outline" className="border-gray-300">
                          Archivé
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{plan.description || "Aucune description"}</p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{plan.maxUsers} utilisateurs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{plan.maxStorage || '∞'} MB stockage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {plan.trialPeriodInDays > 0 ? `${plan.trialPeriodInDays} jours essai` : "Pas d'essai"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(plan.monthlyPrice, plan.currency?.code)}
                      </div>
                      <div className="text-sm text-gray-500">/ mois</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
                        variant="outline"
                        size="sm"
                        onClick={() => openPlanForm(plan)}
                        style={{cursor: 'pointer'}}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        className="bg-amber-500 hover:bg-amber-600 text-white hover:text-white"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPromotionDialog(plan)}
                        style={{cursor: 'pointer'}}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Promos
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <Dialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl border-red-100">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Confirmer la suppression</DialogTitle>
                  <DialogDescription>
                    Cette action est irréversible
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                <p className="font-medium text-gray-900 mb-2">Êtes-vous sûr de vouloir supprimer le plan ?</p>
                <p className="text-sm text-gray-600">
                  Le plan <span className="font-bold text-red-600">{planToDelete.name}</span> sera définitivement supprimé.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPlanToDelete(null)}
                className="border-gray-300"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlan}
                disabled={isDeleting}
                className="bg-gradient-to-r from-red-600 to-rose-600 border-none"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Plan Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                currentPlan 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-600 text-white'
              }`}>
                {currentPlan ? (
                  <Edit className="h-6 w-6 text-white" />
                ) : (
                  <Plus className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {currentPlan ? 'Modifier le plan' : 'Créer un nouveau plan'}
                </DialogTitle>
                <DialogDescription>
                  {currentPlan 
                    ? 'Personnalisez les détails de votre plan existant'
                    : 'Définissez un nouveau plan d\'abonnement pour votre application'
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" style={{cursor: 'pointer'}}>Général</TabsTrigger>
              <TabsTrigger value="pricing" style={{cursor: 'pointer'}}>Tarification</TabsTrigger>
              <TabsTrigger value="features" style={{cursor: 'pointer'}}>Fonctionnalités</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit}>
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <span>Nom du plan</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-violet-500"
                      placeholder="ex: Plan Premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={formData.priority.toString()}
                      onValueChange={(value) => setFormData({...formData, priority: parseInt(value)})}
                    >
                      <SelectTrigger className="border-gray-300" style={{cursor: 'pointer'}}>
                        <SelectValue placeholder="Sélectionner la priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1" style={{cursor: 'pointer'}}>1 - Très élevée</SelectItem>
                        <SelectItem value="2" style={{cursor: 'pointer'}}>2 - Élevée</SelectItem>
                        <SelectItem value="3" style={{cursor: 'pointer'}}>3 - Moyenne</SelectItem>
                        <SelectItem value="4" style={{cursor: 'pointer'}}>4 - Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="border-gray-300 focus:border-violet-500"
                    placeholder="Décrivez les avantages de ce plan..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Utilisateurs maximum</Label>
                    <Input
                      id="maxUsers"
                      name="maxUsers"
                      type="number"
                      min="1"
                      value={formData.maxUsers}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trialPeriodInDays">Période d'essai (jours)</Label>
                    <Input
                      id="trialPeriodInDays"
                      name="trialPeriodInDays"
                      type="number"
                      min="0"
                      value={formData.trialPeriodInDays}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Prix mensuel (FCFA)</Label>
                    <div className="relative">
                      <Input
                        id="monthlyPrice"
                        name="monthlyPrice"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.monthlyPrice}
                        onChange={handleInputChange}
                        className="border-gray-300 pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">F</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearlyPrice">Prix annuel (FCFA)</Label>
                    <div className="relative">
                      <Input
                        id="yearlyPrice"
                        name="yearlyPrice"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.yearlyPrice}
                        onChange={handleInputChange}
                        className="border-gray-300 pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">F</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStorage">Stockage maximum (MB)</Label>
                  <Input
                    id="maxStorage"
                    name="maxStorage"
                    type="number"
                    min="0"
                    value={formData.maxStorage}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    placeholder="0 pour illimité"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currencyCode">Devise</Label>
                    <Select
                      value={formData.currencyCode}
                      onValueChange={(value) => setFormData({...formData, currencyCode: value})}
                    >
                      <SelectTrigger className="border-gray-300" style={{cursor: 'pointer'}}>
                        <SelectValue placeholder="Sélectionner la devise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XAF" style={{cursor: 'pointer'}}>FCFA (XAF)</SelectItem>
                        <SelectItem value="EUR" style={{cursor: 'pointer'}}>Euro (€)</SelectItem>
                        <SelectItem value="USD" style={{cursor: 'pointer'}}>Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Configuration</p>
                    <p className="text-sm text-gray-500">Activez ou désactivez les options</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-500 rounded-lg">
                    <div>
                      <Label htmlFor="active" className="font-medium">Plan actif</Label>
                      <p className="text-sm text-gray-500">Le plan est disponible pour les souscriptions</p>
                    </div>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleToggleChange('active', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-500 rounded-lg">
                    <div>
                      <Label htmlFor="isDefaultFreePlan" className="font-medium">Plan gratuit par défaut</Label>
                      <p className="text-sm text-gray-500">Offert gratuitement à tous les nouveaux utilisateurs</p>
                    </div>
                    <Switch
                      id="isDefaultFreePlan"
                      checked={formData.isDefaultFreePlan}
                      onCheckedChange={(checked) => handleToggleChange('isDefaultFreePlan', checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-300"
                  style={{cursor: 'pointer'}}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary"
                  style={{cursor: 'pointer'}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : currentPlan ? (
                    'Mettre à jour'
                  ) : (
                    'Créer le plan'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Feature Assignment Dialog */}
      <Dialog open={isFeatureAssignDialogOpen} onOpenChange={setIsFeatureAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden border-0 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Ajouter une fonctionnalité</DialogTitle>
                <DialogDescription>
                  Au plan <span className="font-semibold">{selectedPlanForFeature?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sélectionner une fonctionnalité</Label>
              <Select
                value={selectedFeatureIdToAssign}
                onValueChange={setSelectedFeatureIdToAssign}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Choisir une fonctionnalité..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFeatures
                    .filter(f => {
                      if (!selectedPlanForFeature) return true;
                      const currentPlanFeatures = planFeatures[selectedPlanForFeature.id] || [];
                      return !currentPlanFeatures.some(pf => pf.id === f.id);
                    })
                    .map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-violet-500" />
                          <div>
                            <p className="font-medium">{f.name}</p>
                            {f.description && (
                              <p className="text-xs text-gray-500 truncate">{f.description}</p>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {availableFeatures.filter(f => {
                if (!selectedPlanForFeature) return true;
                const currentPlanFeatures = planFeatures[selectedPlanForFeature.id] || [];
                return !currentPlanFeatures.some(pf => pf.id === f.id);
              }).length === 0 && availableFeatures.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-700">
                      Toutes les fonctionnalités sont déjà assignées à ce plan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFeatureAssignDialogOpen(false)}
              className="border-gray-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignFeature}
              disabled={isAssigningFeature || !selectedFeatureIdToAssign}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isAssigningFeature ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assignation...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Assigner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-pink-50 to-rose-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">Nouvelle promotion</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Pour le plan <span className="font-bold">{selectedPlanForPromotion?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handlePromotionSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="promo-code" className="font-semibold">Code promo *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="promo-code"
                    value={promotionFormData.code}
                    onChange={e => setPromotionFormData({ ...promotionFormData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="EX: HIVER25"
                    className="pl-10 font-bold text-lg border-gray-300 uppercase tracking-wider"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discountType" className="font-semibold">Type de réduction *</Label>
                <Select
                  value={promotionFormData.discountType}
                  onValueChange={(value: string) => setPromotionFormData({ ...promotionFormData, discountType: value })}
                >
                  <SelectTrigger className="border-gray-300" style={{cursor: 'pointer'}}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                        <span>Pourcentage</span>
                        <Badge variant="outline" className="ml-2">%</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                        <span>Montant fixe</span>
                        <Badge variant="outline" className="ml-2">FCFA</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="promo-value" className="font-semibold">Valeur *</Label>
                <div className="relative">
                  <Input
                    id="promo-value"
                    type="number"
                    min="0"
                    step={promotionFormData.discountType === 'percentage' ? '1' : '100'}
                    value={promotionFormData.discountValue}
                    onChange={e => setPromotionFormData({ ...promotionFormData, discountValue: Number(e.target.value) })}
                    required
                    className="pr-12 font-bold border-gray-300"
                    placeholder="0"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {promotionFormData.discountType === 'percentage' ? '%' : 'FCFA'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-max" className="font-semibold">Limite d'usage</Label>
                <Input
                  id="promo-max"
                  type="number"
                  min="1"
                  value={promotionFormData.maxUsage}
                  onChange={e => setPromotionFormData({ ...promotionFormData, maxUsage: Number(e.target.value) })}
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="promo-start" className="font-semibold">Date de début *</Label>
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={promotionFormData.startDate}
                  onChange={e => setPromotionFormData({ ...promotionFormData, startDate: e.target.value })}
                  required
                  className="border-gray-300"
                  style={{cursor: 'pointer'}}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-end" className="font-semibold">Date de fin *</Label>
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={promotionFormData.endDate}
                  onChange={e => setPromotionFormData({ ...promotionFormData, endDate: e.target.value })}
                  required
                  className="border-gray-300"
                  style={{cursor: 'pointer'}}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="promo-active" className="font-medium">Promotion active</Label>
                <p className="text-sm text-gray-500">La promotion sera immédiatement disponible</p>
              </div>
              <Switch
                id="promo-active"
                checked={promotionFormData.isActive}
                onCheckedChange={(checked) => setPromotionFormData({ ...promotionFormData, isActive: checked })}
              />
            </div>

            <DialogFooter className="pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPromotionDialogOpen(false)}
                disabled={isSubmitting}
                className="border-gray-300"
                style={{cursor: 'pointer'}}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-rimary"
                style={{cursor: 'pointer'}}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Créer la promotion
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}