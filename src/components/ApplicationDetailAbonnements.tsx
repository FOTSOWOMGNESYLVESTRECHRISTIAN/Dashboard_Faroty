import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Loader2, AlertCircle, Clock, CheckCircle, XCircle, Zap, Calendar, RefreshCw, Users, CreditCard, TrendingUp, Download, Filter, ChevronRight, Crown, Shield, Sparkles, BarChart3, Target, Award, Receipt } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";
import { AbonnementDetails } from "./AbonnementDetails";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ApplicationDetailAbonnementsProps {
  applicationId: string;
  contextId?: string;
  onViewDetails?: (subscription: any) => void;
}

type SubscriptionStatus = 'active' | 'cancelled' | 'pending' | 'trial' | 'expired' | 'all';
type BillingCycle = 'monthly' | 'yearly' | 'all';

export function ApplicationDetailAbonnements({
  applicationId,
  contextId,
  onViewDetails
}: ApplicationDetailAbonnementsProps) {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus>('all');
  const [billingCycleFilter, setBillingCycleFilter] = useState<BillingCycle>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (contextId) {
        try {
          const sub = await subscriptionService.getSubscriptionByContext(contextId, 'GROUP', applicationId);
          if (sub) {
            setSubscriptions([sub]);
            setFilteredSubscriptions([sub]);
            setSelectedSubscription(sub);
            return;
          }
        } catch (ctxErr) {
          console.warn("Impossible de récupérer l'abonnement par contexte, tentative de récupération liste globale...", ctxErr);
        }
      }

      const response = await subscriptionService.getAllSubscriptions(0, 100);
      const appSubscriptions = response.content.filter(
        (sub: any) => sub.applicationId === applicationId
      );

      setSubscriptions(appSubscriptions);
      setFilteredSubscriptions(appSubscriptions);

      if (appSubscriptions.length > 0) {
        setSelectedSubscription(appSubscriptions[0]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des abonnements:", err);
      setError("Impossible de charger les abonnements. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [applicationId, contextId]);

  useEffect(() => {
    let filtered = subscriptions;

    // Appliquer le filtre de recherche
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(sub =>
        (sub.planName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Appliquer le filtre de statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => 
        sub.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Appliquer le filtre de cycle de facturation
    if (billingCycleFilter !== 'all') {
      filtered = filtered.filter(sub => 
        sub.billingCycle?.toLowerCase() === billingCycleFilter.toLowerCase()
      );
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, subscriptions, statusFilter, billingCycleFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const formatDate = (dateString: string | number[] | null | undefined): string => {
    if (!dateString) return 'Non défini';

    try {
      if (Array.isArray(dateString)) {
        const [year, month, day] = dateString;
        const date = new Date(year, month - 1, day);
        return format(date, 'dd MMM yyyy', { locale: fr });
      } else if (typeof dateString === 'number') {
        return format(new Date(dateString * 1000), 'dd MMM yyyy HH:mm', { locale: fr });
      } else {
        return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
      }
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return 'Date invalide';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 px-3 py-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Actif
            </div>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 px-3 py-1">
            Annulé
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 px-3 py-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              En attente
            </div>
          </Badge>
        );
      case 'trial':
        return (
          <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 px-3 py-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Essai
            </div>
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200 px-3 py-1">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3" />
              Expiré
            </div>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 px-3 py-1">
            {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'trial':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white';
      case 'cancelled': return 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-white';
      case 'pending': return 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-white';
      case 'trial': return 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-white';
      case 'expired': return 'border-red-200 bg-gradient-to-br from-red-50/50 to-white';
      default: return 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-white';
    }
  };

  // Calculer les statistiques
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status.toLowerCase() === 'active').length,
    trial: subscriptions.filter(s => s.status.toLowerCase() === 'trial').length,
    monthly: subscriptions.filter(s => s.billingCycle?.toLowerCase() === 'monthly').length,
    yearly: subscriptions.filter(s => s.billingCycle?.toLowerCase() === 'yearly').length,
    totalRevenue: subscriptions
      .filter(s => s.status.toLowerCase() === 'active')
      .reduce((sum, sub) => sum + (sub.finalPrice || 0), 0),
    conversionRate: subscriptions.length > 0 
      ? Math.round((subscriptions.filter(s => s.status.toLowerCase() === 'active').length / subscriptions.length) * 100)
      : 0
  };

  const getDaysUntilExpiry = (endDate: string | number[] | null | undefined): number | null => {
    if (!endDate) return null;
    
    try {
      let date: Date;
      if (Array.isArray(endDate)) {
        const [year, month, day] = endDate;
        date = new Date(year, month - 1, day);
      } else if (typeof endDate === 'number') {
        date = new Date(endDate * 1000);
      } else {
        date = new Date(endDate);
      }
      
      const diff = date.getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-violet-600 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700">Chargement des abonnements...</p>
          <p className="text-sm text-gray-500">Récupération de vos données d'abonnement</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-rose-50/50" />
        <Card className="border-2 border-dashed border-red-300 bg-white/80 backdrop-blur-sm relative">
          <CardContent className="text-center p-12 md:p-16 flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 rounded-full blur-xl opacity-20 animate-pulse" />
              <div className="relative bg-gradient-to-br from-red-600 to-rose-600 p-6 rounded-2xl shadow-xl">
                <AlertCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 max-w-md mb-8">
              {error}
            </p>
            <Button 
              onClick={loadSubscriptions} 
              className="rounded-xl px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-red-600 to-rose-600"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Réessayer
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-200/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 to-purple-800 bg-clip-text text-transparent">
                    Abonnements
                  </h1>
                  <p className="text-indigo-600 mt-1 text-base max-w-2xl">
                    Gérez et suivez tous les abonnements actifs pour votre application.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-500">
                <Badge variant="outline" className="bg-indigo-50 border-indigo-200">
                  {subscriptions.length} abonnement{subscriptions.length > 1 ? 's' : ''}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Suivez votre croissance
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:bg-indigo-100"
                style={{cursor: 'pointer'}}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
        <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abonnements actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 ">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenu mensuel estimé</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue} XOF</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Essais en cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de conversion</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher par nom de plan, ID, email ou statut..."
                className="pl-10 border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={(value: SubscriptionStatus) => setStatusFilter(value)}>
                  <SelectTrigger className="w-36 border-gray-300" style={{cursor: 'pointer'}}>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{cursor: 'pointer'}}>Tous les statuts</SelectItem>
                    <SelectItem value="active" style={{cursor: 'pointer'}}>Actifs</SelectItem>
                    <SelectItem value="trial" style={{cursor: 'pointer'}}>Essais</SelectItem>
                    <SelectItem value="pending" style={{cursor: 'pointer'}}>En attente</SelectItem>
                    <SelectItem value="cancelled" style={{cursor: 'pointer'}}>Annulés</SelectItem>
                    <SelectItem value="expired" style={{cursor: 'pointer'}}>Expirés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Select value={billingCycleFilter} onValueChange={(value: BillingCycle) => setBillingCycleFilter(value)}>
                  <SelectTrigger className="w-36 border-gray-300" style={{cursor: 'pointer'}}>
                    <SelectValue placeholder="Cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{cursor: 'pointer'}}>Tous les cycles</SelectItem>
                    <SelectItem value="monthly" style={{cursor: 'pointer'}}>Mensuel</SelectItem>
                    <SelectItem value="yearly" style={{cursor: 'pointer'}}>Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{filteredSubscriptions.length}</span> résultat{filteredSubscriptions.length > 1 ? 's' : ''} trouvé{filteredSubscriptions.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50" />
          <Card className="border-2 border-dashed border-indigo-300 bg-white/80 backdrop-blur-sm relative">
            <CardContent className="text-center p-12 md:p-16 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-xl">
                  <Crown className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm || statusFilter !== 'all' || billingCycleFilter !== 'all' 
                  ? "Aucun abonnement trouvé"
                  : "Aucun abonnement actif"}
              </h3>
              <p className="text-gray-600 max-w-md mb-8">
                {searchTerm 
                  ? "Aucun résultat ne correspond à votre recherche. Essayez d'autres termes."
                  : statusFilter !== 'all' || billingCycleFilter !== 'all'
                  ? "Aucun abonnement ne correspond aux filtres sélectionnés."
                  : "Commencez par créer des plans d'abonnement pour votre application."
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || billingCycleFilter !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setBillingCycleFilter('all');
                  }}
                  className="rounded-xl px-6 py-3 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => {
            const daysUntilExpiry = getDaysUntilExpiry(subscription.endDate);
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            const isSelected = selectedSubscription?.id === subscription.id;

            return (
              <div
                key={subscription.id}
                className="relative group transition-all duration-500 hover:-translate-y-1"
              >
                {/* Expiry warning badge */}
                {isExpiringSoon && subscription.status.toLowerCase() === 'active' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 shadow-lg animate-pulse">
                      <Timer className="h-3 w-3 mr-1" /> Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-2 ${getStatusColor(subscription.status)} 
                  shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-2xl overflow-hidden
                  ${isSelected ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}>
                  
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(subscription.status)}
                      <div className="flex items-center gap-2">
                        {subscription.billingCycle && (
                          <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                            <Calendar className="h-3 w-3 mr-1" />
                            {subscription.billingCycle.toLowerCase() === 'monthly' ? 'Mensuel' : 'Annuel'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          {getStatusIcon(subscription.status)}
                          {subscription.planName || "Plan inconnu"}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          ID: <span className="font-mono text-sm">{subscription.id}</span>
                          {subscription.userEmail && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{subscription.userEmail}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      
                      <div className="text-right">
                        {subscription.finalPrice !== undefined && (
                          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                            {subscription.finalPrice}€
                            <span className="text-sm font-normal text-gray-500">
                              /{subscription.billingCycle?.toLowerCase() === 'yearly' ? 'an' : 'mois'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Key Information Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">Début</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(subscription.startDate)}
                        </div>
                      </div>
                      
                      <div className="bg-white/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">Fin</div>
                        <div className="font-semibold text-gray-900">
                          {subscription.endDate ? formatDate(subscription.endDate) : 'Illimité'}
                        </div>
                      </div>
                      
                      <div className="bg-white/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">Prochain renouvellement</div>
                        <div className="font-semibold text-gray-900">
                          {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'Non défini'}
                        </div>
                      </div>
                    </div>

                    {/* Promotion Info if exists */}
                    {subscription.appliedPromotionCode && (
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-pink-600" />
                          <div>
                            <div className="text-sm font-medium text-pink-900">Code promo appliqué</div>
                            <div className="text-sm text-pink-700 font-mono">{subscription.appliedPromotionCode}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-gray-100 bg-gradient-to-t from-white to-gray-50/50">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={`flex-1 ${isSelected 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                          : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:bg-indigo-100'}`}
                        onClick={() => {
                          setSelectedSubscription(isSelected ? null : subscription);
                          if (!isSelected && onViewDetails) {
                            onViewDetails(subscription);
                          }
                        }}
                        style={{pointer: 'pointer'}}
                      >
                        {isSelected ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Masquer les détails
                          </>
                        ) : (
                          <>
                            <ChevronRight className="mr-2 h-4 w-4" />
                            Voir les détails
                          </>
                        )}
                      </Button>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 hover:bg-gray-100"
                              title="Télécharger la facture"
                              style={{pointer: 'pointer'}}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Télécharger la facture</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Details Panel */}
      {selectedSubscription && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-100 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Détails de l'abonnement</h3>
                    <p className="text-indigo-100 text-sm">Informations complètes et gestion</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedSubscription(null)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <AbonnementDetails
                abonnement={selectedSubscription}
                onBack={() => {
                  setSelectedSubscription(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}