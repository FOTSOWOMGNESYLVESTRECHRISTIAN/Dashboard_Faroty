import { useState, useEffect, useCallback, useRef, MouseEvent } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Plus, Edit, Trash2, Calendar, Percent, Tag, Clock, Check, X, Loader2, Gift, Sparkles, Trophy, Zap, Target, Users, Crown, Timer, BarChart3, TrendingUp, Shield } from "lucide-react";
import { toast } from "sonner";
import { promotionService, Promotion } from "../services/promotionService";
import { resolveConnectedUserId } from "../utils/authUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiClient } from "../utils/apiClient";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

// Types locaux pour le composant
type DiscountType = 'percentage' | 'fixed';

interface PromotionFormData {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate?: string;
  maxUsage: number;
  minPurchaseAmount: number;
  isActive: boolean;
  applicationId: string;
  planId: string;
  createdBy: string;
}

interface ApplicationDetailPromotionsProps {
  applicationId: string;
  onPromotionsUpdate?: () => void;
}

export function ApplicationDetailPromotions({ applicationId, onPromotionsUpdate }: ApplicationDetailPromotionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [errorStates, setErrorStates] = useState<Record<string, { message: string; retryCount: number }>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'ending-soon'>('all');

  const isMountedRef = useRef(true);
  const retryCountRef = useRef<Record<string, number>>({});
  const loadingRef = useRef(false);

  const [formData, setFormData] = useState<PromotionFormData>(() => ({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours par défaut
    maxUsage: 100,
    minPurchaseAmount: 0,
    isActive: true,
    applicationId,
    planId: "",
    createdBy: 'admin'
  }));

  // Fonction pour vérifier si une promotion est active
  const isPromotionActive = (promotion: Promotion) => {
    if (!promotion.isActive) return false;
    
    const now = new Date();
    const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
    
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    
    // Vérifier l'usage
    if (promotion.maxUsage > 0 && (promotion.currentUsage || 0) >= promotion.maxUsage) {
      return false;
    }
    
    return true;
  };

  // Calculer les statistiques
  const stats = {
    total: promotions.length,
    active: promotions.filter(p => isPromotionActive(p)).length,
    endingSoon: promotions.filter(p => {
      if (!isPromotionActive(p)) return false;
      const endDate = p.endDate ? new Date(p.endDate) : null;
      if (!endDate) return false;
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    }).length,
    totalUsage: promotions.reduce((sum, p) => sum + (p.currentUsage || 0), 0),
    maxUsage: promotions.reduce((sum, p) => sum + (p.maxUsage || 0), 0)
  };

  // Filtrer les promotions selon le filtre actif
  const filteredPromotions = promotions.filter(promotion => {
    const isActive = isPromotionActive(promotion);
    
    switch (activeFilter) {
      case 'active':
        return isActive;
      case 'inactive':
        return !isActive;
      case 'ending-soon':
        if (!isActive) return false;
        const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
        if (!endDate) return false;
        const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0;
      default:
        return true;
    }
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadData = useCallback(async () => {
    if (!applicationId) return;

    setIsLoading(true);

    try {
      // 1. Charger les plans
      const plansResponse = await apiClient.get<{ success: boolean, data: any[] }>(
        API_ENDPOINTS.ABONNEMENT.PLANS_BY_APPLICATION(applicationId)
      );

      let applicationPlans: { id: string; name: string }[] = [];
      if (plansResponse.success && Array.isArray(plansResponse.data)) {
        applicationPlans = plansResponse.data.map((p: any) => ({
          id: p.id,
          name: p.name
        }));
        if (isMountedRef.current) {
          setPlans(applicationPlans);
        }
      }

      // 2. Charger les promotions
      const promotionsData = await promotionService.listPromotions({ size: 100 });

      // Filtrer les promotions qui appartiennent à un des plans de l'application
      const applicationPlanIds = new Set(applicationPlans.map(p => p.id));
      const filteredPromotions = promotionsData.filter(promo => applicationPlanIds.has(promo.planId));

      if (isMountedRef.current) {
        setPromotions(filteredPromotions);
      }

      // Reset errors on success
      if (isMountedRef.current) {
        setErrorStates({});
        retryCountRef.current = {};
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("❌ Erreur lors du chargement des données");

      const errorId = 'load-data';
      retryCountRef.current[errorId] = (retryCountRef.current[errorId] || 0) + 1;
      if (isMountedRef.current) {
        setErrorStates(prev => ({
          ...prev,
          [errorId]: {
            message: error instanceof Error ? error.message : 'Erreur inattendue',
            retryCount: retryCountRef.current[errorId] || 1
          }
        }));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingPlans(false);
      }
    }
  }, [applicationId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const mapApiPromotionToFormData = (promo: Promotion): PromotionFormData => {
    let startDate: string;
    if (Array.isArray(promo.startDate)) {
      startDate = new Date().toISOString();
    } else if (typeof promo.startDate === 'number') {
      startDate = new Date(promo.startDate).toISOString();
    } else if (typeof promo.startDate === 'string') {
      startDate = new Date(promo.startDate).toISOString();
    } else {
      startDate = new Date().toISOString();
    }

    let endDate: string | undefined;
    if (promo.endDate) {
      if (Array.isArray(promo.endDate)) {
        endDate = undefined;
      } else if (typeof promo.endDate === 'number') {
        endDate = new Date(promo.endDate).toISOString();
      } else if (typeof promo.endDate === 'string') {
        endDate = new Date(promo.endDate).toISOString();
      }
    }

    return {
      code: promo.code,
      description: promo.description || "",
      discountType: promo.minPurchaseAmount > 0 ? 'fixed' : 'percentage',
      discountValue: promo.discountPercentage || 0,
      startDate,
      endDate,
      maxUsage: promo.maxUsage || 100,
      minPurchaseAmount: promo.minPurchaseAmount || 0,
      isActive: promo.active !== false,
      applicationId: applicationId,
      planId: promo.planId || "",
      createdBy: promo.createdBy || 'admin'
    };
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setSelectedPromotion(promotion);
      setFormData(mapApiPromotionToFormData(promotion));
    } else {
      setSelectedPromotion(null);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxUsage: 100,
        isActive: true,
        applicationId,
        planId: "",
        minPurchaseAmount: 0,
        createdBy: 'admin'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.discountValue <= 0 || !formData.planId) {
      toast.error("⚠️ Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!formData.endDate) {
      toast.error("⚠️ La date de fin est obligatoire");
      return;
    }

    const connectedUserId = resolveConnectedUserId();
    if (!connectedUserId) {
      toast.error("🔒 Impossible d'identifier l'utilisateur connecté");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("📅 Les dates fournies sont invalides");
      return;
    }

    if (startDate >= endDate) {
      toast.error("📅 La date de fin doit être postérieure à la date de début");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        discountPercentage: formData.discountType === 'percentage'
          ? Number(formData.discountValue)
          : 0,
        minPurchaseAmount: formData.discountType === 'fixed'
          ? Number(formData.discountValue)
          : Number(formData.minPurchaseAmount) || 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxUsage: Number(formData.maxUsage) || 0,
        planId: formData.planId,
        createdBy: connectedUserId,
        active: formData.isActive
      };

      if (selectedPromotion) {
        await promotionService.updatePromotion(selectedPromotion.id, payload);
        toast.success("✨ Promotion mise à jour avec succès");
      } else {
        await promotionService.createPromotion(payload);
        toast.success("🎉 Promotion créée avec succès");
      }

      setIsDialogOpen(false);
      await loadData();
      onPromotionsUpdate?.();
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la promotion:", error);

      if (error?.status === 409 || error?.message?.includes('conflit') || error?.message?.includes('existe déjà')) {
        toast.error(`⚠️ Une promotion avec le code "${formData.code}" existe déjà.`);
      } else {
        toast.error("❌ Erreur lors de l'enregistrement");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (promotion: Promotion, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPromotion(promotion);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    const connectedUserId = resolveConnectedUserId();
    if (!connectedUserId) {
      toast.error("🔒 Impossible d'identifier l'utilisateur connecté");
      return;
    }

    setIsSubmitting(true);

    try {
      await promotionService.deletePromotion(selectedPromotion.id);
      toast.success("🗑️ Promotion supprimée avec succès");
      setIsDeleteDialogOpen(false);
      await loadData();
      onPromotionsUpdate?.();
    } catch (error) {
      console.error("Erreur lors de la suppression de la promotion:", error);
      toast.error("❌ Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeDateConversion = (dateValue: string | number | any[]): string => {
    if (Array.isArray(dateValue)) {
      return new Date().toISOString();
    }
    return new Date(dateValue).toISOString();
  };

  const formatDate = (dateValue: string | number | any[]) => {
    try {
      if (Array.isArray(dateValue)) {
        if (dateValue.length >= 3) {
          return `${dateValue[2]}/${dateValue[1]}/${dateValue[0]}`;
        }
        return "Date invalide";
      }
      const date = new Date(dateValue);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };

  const formatDateTime = (dateValue: string | number | any[]) => {
    try {
      if (Array.isArray(dateValue)) {
        return formatDate(dateValue);
      }
      const date = new Date(dateValue);
      return format(date, 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (error) {
      return formatDate(dateValue);
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    if (!isPromotionActive(promotion)) return { text: "Inactif", color: "bg-gray-500", textColor: "text-gray-700" };
    
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
    if (endDate) {
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        return { text: "Bientôt terminé", color: "bg-amber-500", textColor: "text-amber-700" };
      }
    }
    
    return { text: "Active", color: "bg-gradient-to-r from-emerald-400 to-emerald-600", textColor: "text-emerald-700" };
  };

  const handleDiscountTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      discountType: value as DiscountType,
      discountValue: 0,
      minPurchaseAmount: 0
    }));
  };

  const getDaysLeft = (endDate: string | number | any[]): number | null => {
    try {
      const date = new Date(endDate);
      if (isNaN(date.getTime())) return null;
      const diff = date.getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getUsagePercentage = (promotion: Promotion) => {
    if (!promotion.maxUsage || promotion.maxUsage <= 0) return 0;
    return Math.min(100, ((promotion.currentUsage || 0) / promotion.maxUsage) * 100);
  };

  const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
          <X className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-red-900 mb-1">Erreur de chargement</div>
          <p className="text-sm text-red-700 mb-2">{message}</p>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Loader2 className="mr-2 h-3 w-3" />
            Réessayer
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin"></div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-pink-600 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700">Chargement des promotions...</p>
          <p className="text-sm text-gray-500">Préparation de vos offres spéciales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 via-white to-rose-50 border border-pink-100 p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-200/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg p-4">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-900 to-rose-800 bg-clip-text text-transparent">
                    Promotions & Offres
                  </h1>
                  <p className="text-pink-600 mt-1 text-base max-w-2xl">
                    Boostez vos ventes avec des offres spéciales et des réductions ciblées pour vos utilisateurs.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-pink-500">
                <Badge variant="outline" className="bg-pink-50 border-pink-200">
                  {promotions.length} promotion{promotions.length > 1 ? 's' : ''}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Augmentez vos conversions
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
                  style={{cursor: 'pointer'}}
                >
                  Grille
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-md"
                  style={{cursor: 'pointer'}}
                >
                  Liste
                </Button>
              </div>
              <Button
                onClick={() => handleOpenDialog()}
                className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 bg-primary hover:bg-primary hover:from-pink-700 hover:to-rose-700"
                style={{cursor: 'pointer'}}
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-semibold">Nouvelle Promotion</span>
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="bg-gradient-to-br from-white to-pink-50 border border-pink-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gift className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total des promotions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Promotions actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Timer className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expirent bientôt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.endingSoon}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Utilisations totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('all')}
            className="whitespace-nowrap"
            style={{cursor: 'pointer'}}
          >
            Toutes ({promotions.length})
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('active')}
            className="whitespace-nowrap"
            style={{cursor: 'pointer'}}
          >
            <Zap className="h-4 w-4 mr-2" />
            Actives ({stats.active})
          </Button>
          <Button
            variant={activeFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('inactive')}
            className="whitespace-nowrap"
            style={{cursor: 'pointer'}}
          >
            <X className="h-4 w-4 mr-2" />
            Inactives ({promotions.length - stats.active})
          </Button>
          <Button
            variant={activeFilter === 'ending-soon' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('ending-soon')}
            className="whitespace-nowrap"
            style={{cursor: 'pointer'}}
          >
            <Timer className="h-4 w-4 mr-2" />
            Bientôt terminées ({stats.endingSoon})
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {Object.entries(errorStates).map(([errorId, error]) => (
        <ErrorMessage
          key={errorId}
          message={error.message}
          onRetry={loadData}
        />
      ))}

      {/* Empty State */}
      {filteredPromotions.length === 0 ? (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-rose-50/50" />
          <Card className="border-2 border-dashed border-pink-300 bg-white/80 backdrop-blur-sm relative">
            <CardContent className="text-center p-12 md:p-16 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-pink-600 to-rose-600 p-6 rounded-2xl shadow-xl">
                  <Gift className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {activeFilter !== 'all' 
                  ? `Aucune promotion ${activeFilter === 'active' ? 'active' : activeFilter === 'inactive' ? 'inactive' : 'bientôt terminée'}`
                  : "Créez votre première promotion"}
              </h3>
              <p className="text-gray-600 max-w-md mb-8">
                {activeFilter !== 'all' 
                  ? "Aucune promotion ne correspond à ce filtre pour le moment."
                  : "Boostez vos ventes en créant des offres promotionnelles attractives pour vos utilisateurs."}
              </p>
              <Button 
                onClick={() => handleOpenDialog()} 
                className="rounded-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-primary"
                size="lg"
                style={{cursor: 'pointer'}}
              >
                <Plus className="mr-2 h-5 w-5" />
                Créer une promotion
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPromotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            const daysLeft = promotion.endDate ? getDaysLeft(promotion.endDate) : null;
            const usagePercentage = getUsagePercentage(promotion);
            const planName = plans.find(p => p.id === promotion.planId)?.name || "Plan inconnu";

            return (
              <div
                key={promotion.id}
                className="relative group transition-all duration-500 hover:-translate-y-2"
              >
                {/* Highlight badge for ending soon */}
                {daysLeft && daysLeft <= 7 && daysLeft > 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-yellow-500 text-white px-4 py-1.5 shadow-lg animate-pulse">
                      <Timer className="h-3 w-3 mr-1" /> {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-2 ${status.color.includes('emerald') ? 'border-emerald-200' : status.color.includes('amber') ? 'border-amber-200' : 'border-gray-200'} 
                  bg-gradient-to-b from-white to-gray-50/50 
                  shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-2xl overflow-hidden`}>
                  
                  {/* Status ribbon */}
                  <div className={`absolute top-0 right-0 w-24 h-24 overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-32 h-8 transform rotate-45 translate-x-8 translate-y-2 ${status.color}`}>
                      <span className="absolute top-1 left-0 w-full text-center text-[10px] font-bold text-white">
                        {status.text.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <CardHeader className="pb-4 pt-8 relative">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="bg-gray-100 to-slate-50 border-gray-200">
                        {planName}
                      </Badge>
                      {promotion.minPurchaseAmount > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-blue-100 to-cyan-50 border-blue-200 text-blue-700">
                                <Target className="h-3 w-3 mr-1" /> Min. {promotion.minPurchaseAmount} FCFA
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Montant minimum d'achat requis</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2 font-mono tracking-tight">
                      {promotion.code}
                    </CardTitle>
                    {promotion.description && (
                      <CardDescription className="line-clamp-2 min-h-[3em] text-gray-600">
                        {promotion.description}
                      </CardDescription>
                    )}

                    <div className="mt-6 space-y-3">
                      <div className="flex items-baseline gap-2">
                        {promotion.minPurchaseAmount > 0 ? (
                          <>
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {promotion.discountPercentage} FCFA
                            </span>
                            <span className="text-sm font-medium text-gray-500">de réduction</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                              -{promotion.discountPercentage}%
                            </span>
                            <span className="text-sm font-medium text-gray-500">de réduction</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Usage Progress */}
                    {promotion.maxUsage > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-600">Utilisations</span>
                          <span className="font-semibold text-gray-900">
                            {promotion.currentUsage || 0} / {promotion.maxUsage}
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="h-2 bg-gray-100" />
                        <div className="text-xs text-gray-500 text-center">
                          {Math.round(usagePercentage)}% du quota utilisé
                        </div>
                      </div>
                    )}

                    {/* Dates and Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-500 mb-1" />
                        <span className="text-xs text-gray-500 font-medium">Début</span>
                        <span className="font-semibold text-gray-900 text-center">
                          {formatDate(promotion.startDate)}
                        </span>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col items-center justify-center">
                        <Clock className="h-4 w-4 text-rose-500 mb-1" />
                        <span className="text-xs text-gray-500 font-medium">Fin</span>
                        <span className="font-semibold text-gray-900 text-center">
                          {promotion.endDate ? formatDate(promotion.endDate) : 'Indéfinie'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-200 bg-amber-500 text-blue-700 hover:bg-amber-100 text-white hover:text-white"
                        onClick={() => handleOpenDialog(promotion)}
                        size="sm"
                        style={{cursor: 'pointer'}}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-red-200 bg-red-500 hover:bg-red-100 text-white hover:text-white"
                              onClick={(e) => handleDeleteClick(promotion, e)}
                              title="Supprimer"
                              style={{cursor: 'pointer'}}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer la promotion</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredPromotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            const daysLeft = promotion.endDate ? getDaysLeft(promotion.endDate) : null;
            const planName = plans.find(p => p.id === promotion.planId)?.name || "Plan inconnu";

            return (
              <Card key={promotion.id} className="border border-gray-200 hover:border-pink-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <h3 className="text-xl font-bold text-gray-900 font-mono">{promotion.code}</h3>
                        </div>
                        <Badge className={`${status.textColor === 'text-emerald-700' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-700' : 
                                           status.textColor === 'text-amber-700' ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700' : 
                                           'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700'}`}>
                          {status.text}
                        </Badge>
                        {daysLeft && daysLeft <= 7 && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                            <Timer className="h-3 w-3 mr-1" /> {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-4 space-y-2">
                        <p className="text-gray-600">{promotion.description || "Aucune description"}</p>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {promotion.minPurchaseAmount > 0 
                                ? `${promotion.discountPercentage} FCFA de réduction`
                                : `${promotion.discountPercentage}% de réduction`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{planName}</span>
                          </div>
                          {promotion.maxUsage > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {promotion.currentUsage || 0} / {promotion.maxUsage} utilisations
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-500">Valable jusqu'au</div>
                        <div className="font-semibold text-gray-900">
                          {promotion.endDate ? formatDateTime(promotion.endDate) : 'Indéfinie'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(promotion)}
                          className="border-blue-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDeleteClick(promotion, e)}
                          className="border-red-200 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promotion Form Dialog - Design amélioré */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-500 max-w-2xl rounded-2xl overflow-hidden border-0 shadow-2xl p-0 h-[20vh] max-h-[200px] flex flex-col">
          {/* En-tête avec dégradé */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-2 h-20">
            <div className="absolute top-0 right-0 opacity-20">
              <div className="w-64 h-64 bg-white rounded-full -mt-32 -mr-32"></div>
            </div>
            <div className="relative z-10 flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-purple-600 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  {selectedPromotion ? (
                    <Crown className="h-8 w-8 text-white" />
                  ) : (
                    <Gift className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedPromotion ? 'Modifier la promotion' : 'Créer une nouvelle promotion'}
                  </h2>
                  <p className="text-purple-100 mt-1">
                    {selectedPromotion 
                      ? 'Personnalisez cette offre spéciale pour vos utilisateurs'
                      : 'Boostez vos conversions avec une offre irrésistible'
                    }
                  </p>
                </div>
              </div>
              <div className="hidden md:block w-64 h-64 border border-white/90 rounded-2xl flex items-center justify-center">
                <div className="bg-white backdrop-blur-sm rounded-xl p-2 w-64 h-64 border border-white/90 flex items-center">
                  <div className="text-xs text-white/80">Taux de conversion</div>
                  <div className="text-lg font-bold text-gray-500">+45%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <Tabs defaultValue="general" className="space-2">
              <TabsList className="grid w-20 grid-cols-3 bg-gray-100 hover:bg-white hover:text-gray-900 rounded-2xl">
                <TabsTrigger 
                  value="general" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-xl transition-all"
                  style={{cursor: 'pointer'}}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Général
                </TabsTrigger>
                <TabsTrigger 
                  value="conditions" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-xl transition-all"
                  style={{cursor: 'pointer'}}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Conditions
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg rounded-xl transition-all"
                  style={{cursor: 'pointer'}}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Avancé
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-2">
                {/* Section Générale */}
                <TabsContent value="general" className="space-2 animate-in fade-in-50 pb-1">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-2 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Informations de base</h3>
                        <p className="text-sm text-gray-500">Définissez l'identité de votre promotion</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="h-4 w-4 text-blue-500" />
                            Code promo
                            <span className="text-red-500">*</span>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="code"
                            placeholder="ex: SUMMER2024"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            required
                            className="h-12 rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 pl-4 font-mono uppercase tracking-wider text-lg"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Percent className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="planId" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-blue-500" />
                            Plan concerné
                            <span className="text-red-500">*</span>
                          </div>
                        </Label>
                        <Select
                          value={formData.planId}
                          onValueChange={(value) => setFormData({ ...formData, planId: value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-300 hover:border-blue-400" style={{cursor: 'pointer'}}>
                            <SelectValue placeholder="Sélectionner un plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map(plan => (
                              <SelectItem key={plan.id} value={plan.id} className="py-2" style={{cursor: 'pointer'}}>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <span>{plan.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <Label htmlFor="description" className="font-semibold text-gray-700">Description (optionnel)</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez cette promotion pour votre équipe et vos utilisateurs..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                        <Percent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Configuration de la réduction</h3>
                        <p className="text-sm text-gray-500">Définissez le type et la valeur de la promotion</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label htmlFor="discountType" className="font-semibold text-gray-700">
                          Type de réduction
                        </Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={handleDiscountTypeChange}
                        >
                          <SelectTrigger className="h-12 rounded-xl border-gray-300 hover:border-purple-400" style={{cursor: 'pointer'}}>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage" className="py-2" style={{cursor: 'pointer'}}>
                              <div className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-purple-500" />
                                Pourcentage (%)
                              </div>
                            </SelectItem>
                            <SelectItem value="fixed" className="py-2" style={{cursor: 'pointer'}}>
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-purple-500" />
                                Montant fixe (FCFA)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValue" className="font-semibold text-gray-700">
                          Valeur de la réduction
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="discountValue"
                            type="number"
                            min="0"
                            step={formData.discountType === 'percentage' ? '1' : '100'}
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                            required
                            className="h-12 rounded-xl border-gray-300 hover:border-purple-400 focus:border-purple-500 pl-4 text-lg font-bold"
                            placeholder={formData.discountType === 'percentage' ? '10' : '1000'}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600 font-bold">
                            {formData.discountType === 'percentage' ? '%' : 'FCFA'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Section Conditions */}
                <TabsContent value="conditions" className="space-y-6 animate-in fade-in-50 pb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Période de validité</h3>
                        <p className="text-sm text-gray-500">Définissez quand la promotion sera disponible</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            Date de début
                            <span className="text-red-500">*</span>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="startDate"
                            type="datetime-local"
                            value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                              setFormData({ ...formData, startDate: date });
                            }}
                            required
                            className="h-12 rounded-xl border-gray-300 hover:border-emerald-400 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            Date de fin
                            <span className="text-red-500">*</span>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="endDate"
                            type="datetime-local"
                            value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                              setFormData({ ...formData, endDate: date });
                            }}
                            required
                            className="h-12 rounded-xl border-gray-300 hover:border-emerald-400 focus:border-emerald-500"
                          />
                          {/* <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Timer className="h-5 w-5 text-gray-400" />
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Limites et conditions</h3>
                        <p className="text-sm text-gray-500">Contrôlez l'utilisation de la promotion</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxUsage" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-amber-500" />
                            Limite d'utilisations
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="maxUsage"
                            type="number"
                            min="1"
                            placeholder="Illimité si 0"
                            value={formData.maxUsage}
                            onChange={(e) => setFormData({ ...formData, maxUsage: parseInt(e.target.value) || 0 })}
                            className="h-12 rounded-xl border-gray-300 hover:border-amber-400 focus:border-amber-500"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600 font-medium">
                            utilisations
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minPurchaseAmount" className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-amber-500" />
                            Montant minimum
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="minPurchaseAmount"
                            type="number"
                            min="0"
                            placeholder="0 pour aucun minimum"
                            value={formData.minPurchaseAmount}
                            onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                            className="h-12 rounded-xl border-gray-300 hover:border-amber-400 focus:border-amber-500"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600 font-bold">
                            FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Section Avancée */}
                <TabsContent value="advanced" className="space-y-6 animate-in fade-in-50">
                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Paramètres avancés</h3>
                        <p className="text-sm text-gray-500">Options supplémentaires pour personnaliser votre promotion</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl border border-gray-200 hover:border-rose-200 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <Label htmlFor="isActive" className="font-semibold text-gray-900 block">
                              Promotion active
                            </Label>
                            <p className="text-sm text-gray-500">La promotion sera disponible immédiatement</p>
                          </div>
                        </div>
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                          className="data-[state=checked]:bg-rose-600"
                        />
                      </div>

                      {selectedPromotion && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                              <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900">Informations de suivi</h4>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="text-sm">
                                  <span className="text-gray-500">Créée le</span>
                                  <div className="font-medium text-gray-900">
                                    {selectedPromotion.createdAt ? formatDateTime(selectedPromotion.createdAt) : 'Date inconnue'}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">Utilisations</span>
                                  <div className="font-medium text-gray-900">
                                    {selectedPromotion.currentUsage || 0} fois
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Actions */}
                <DialogFooter className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-end gap-2 p-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                      className="h-12 px-6 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      style={{cursor: 'pointer'}}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="h-12 px-8 rounded-xl bg-primary hover:bg-primary hover:shadow-xl transition-all duration-300 shadow-lg"
                      style={{cursor: 'pointer'}}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : selectedPromotion ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Mettre à jour
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Créer la promotion
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-red-100 max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-bold text-red-900">
                  Supprimer la promotion ?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Cette action est irréversible
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="font-medium text-gray-900 mb-2">
                Êtes-vous sûr de vouloir supprimer définitivement cette promotion ?
              </p>
              <div className="p-3 bg-white rounded-lg border border-red-200 mt-2">
                <div className="font-mono font-bold text-lg text-red-600">
                  {selectedPromotion?.code}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedPromotion?.description || "Aucune description"}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span>
                  Cette promotion a été utilisée <strong>{selectedPromotion?.currentUsage || 0}</strong> fois.
                </span>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 border-none"
            >
              {isSubmitting ? (
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}