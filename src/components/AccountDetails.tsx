import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  User,
  UserCircle,
  Building2,
  RefreshCw,
  CreditCard,
  Wallet,
  Globe,
  Calendar,
  Clock,
  Mail,
  Phone,
  Activity,
  BarChart2,
  BarChart3,
  Edit,
  Trash2,
  PauseCircle,
  Play,
  MoreHorizontal,
  PlusCircle,
  FileText,
  Download,
  ChevronRight,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  ListOrdered,
  Shield,
  Settings,
  DollarSign,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from 'sonner';
import { Account } from '../types/payment';
import {
  getAccounts,
  formatCurrency,
  updateAccountStatus,
  deleteWallet
} from '../services/paymentService';

// Fonctions utilitaires pour les devises
const getCurrencyName = (currency: string): string => {
  const names: Record<string, string> = {
    'EUR': 'Euro',
    'USD': 'Dollar américain',
    'GBP': 'Livre sterling',
    'JPY': 'Yen japonais',
    'CAD': 'Dollar canadien',
    'AUD': 'Dollar australien',
  };
  return names[currency] || currency;
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'A$',
  };
  return symbols[currency] || currency;
};
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut
} from "./ui/dropdown-menu";

interface AccountDetailsProps {
  accountId: string;
  onBack: () => void;
}

export function AccountDetails({ accountId, onBack }: AccountDetailsProps) {
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch all accounts and find the one with the matching ID
      const accounts = await getAccounts();
      const accountData = accounts.find(acc => acc.id === accountId);
      
      if (!accountData) {
        throw new Error('Compte non trouvé');
      }
      
      setAccount(accountData);
    } catch (err) {
      console.error('Erreur lors du chargement du compte:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(`Impossible de charger les détails du compte: ${errorMessage}`);
      toast.error('Erreur lors du chargement du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!account) return;

    try {
      setIsUpdating(true);
      const newStatus = ['active', 'ACTIVE'].includes(account.status) ? 'SUSPENDED' : 'ACTIVE';
      await updateAccountStatus(accountId, newStatus);

      setAccount(prev => prev ? { ...prev, status: newStatus } : null);

      toast.success(`Le compte a été ${newStatus === 'ACTIVE' ? 'activé' : 'suspendu'} avec succès`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la mise à jour du statut: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.')) {
      return;
    }

    try {
      setIsUpdating(true);
      // Use deleteWallet instead of deleteAccount since it's the available function
      await deleteWallet(accountId);
      toast.success('Le compte a été supprimé avec succès');
      onBack();
    } catch (err) {
      console.error('Erreur lors de la suppression du compte:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      toast.error(`Erreur lors de la suppression du compte: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Chargement du compte</h3>
          <p className="text-sm text-muted-foreground">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error || 'Compte introuvable'}</p>
            <div className="mt-4 space-x-2">
              <Button variant="outline" size="sm" onClick={onBack} style={{cursor: 'pointer'}}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button variant="outline" size="sm" onClick={loadAccount} disabled={isLoading} style={{cursor: 'pointer'}}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête avec boutons de navigation et actions */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-card/95 to-card/90 backdrop-blur-sm p-6 rounded-2xl border border-border/20 shadow-sm transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl border-border/40 hover:bg-accent/50 hover:border-accent-foreground/20 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm"
          style={{cursor:'pointer'}}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Retour</span>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Détails du compte
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>Gestion et suivi complet du compte client</span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-muted-foreground/80 font-medium">Nom: {account.accountName || 'Sans nom'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center px-4 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 cursor-default ${
                  ['active', 'ACTIVE'].includes(account.status)
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                    : 'bg-destructive/10 border-destructive/20 hover:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full mr-2.5 ${
                    ['active', 'ACTIVE'].includes(account.status)
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-destructive'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  ['active', 'ACTIVE'].includes(account.status)
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-destructive'
                }`}>
                  {['active', 'ACTIVE'].includes(account.status) ? 'Actif' : 'Suspendu'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {['active', 'ACTIVE'].includes(account.status) 
                ? 'Ce compte est actuellement actif' 
                : 'Ce compte est actuellement suspendu'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={['active', 'ACTIVE'].includes(account.status) ? 'outline' : 'default'}
                size="sm"
                onClick={handleStatusChange}
                disabled={isUpdating}
                className={`gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  ['active', 'ACTIVE'].includes(account.status)
                    ? 'border-border/50 hover:bg-accent/50 hover:border-accent-foreground/20'
                    : 'bg-purple-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-500/20'
                    
                }`}
                style={{cursor:'pointer'}}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : ['active', 'ACTIVE'].includes(account.status) ? (
                  <PauseCircle className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span>{['active', 'ACTIVE'].includes(account.status) ? 'Suspendre' : 'Activer'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {['active', 'ACTIVE'].includes(account.status) 
                ? 'Suspendre ce compte' 
                : 'Activer ce compte'}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl border-border/40 hover:bg-accent/50 hover:border-accent-foreground/20 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{cursor:'pointer'}}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => navigate(`/accounts/${account.id}/edit`)}
                className="cursor-pointer"
                style={{cursor:'pointer'}}
              >
                <Edit className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Modifier</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" style={{cursor:'pointer'}}>
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Envoyer un email</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                onClick={handleDeleteAccount}
                disabled={isUpdating}
                style={{cursor:'pointer'}}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Supprimer le compte</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grille principale du contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Informations du compte */}
        <div className="space-y-6 lg:col-span-2">
          {/* Carte d'informations du compte */}
          <Card className="border-border/30 overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3 border-b border-border/20 bg-gradient-to-r from-card to-card/90">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Informations du compte</span>
                  </CardTitle>
                  <CardDescription className="mt-1">Détails généraux et informations de contact</CardDescription>
                </div>
                <Badge variant="outline" className="border-border/50 bg-background/80 backdrop-blur-sm">
                  {/* ID: {account.id.slice(0, 8)}... */}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="relative">
                    <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      {account.accountMode === 'BUSINESS' ? (
                        <Building2 className="h-8 w-8 text-primary" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    {['active', 'ACTIVE'].includes(account.status) && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{account.accountName || 'Sans nom'}</h2>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge 
                        variant="secondary" 
                        className="capitalize text-xs font-medium px-2 py-0.5 rounded-full border"
                      >
                        {account.accountMode?.toLowerCase() === 'business' ? 'Entreprise' : 'Particulier'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-background"
                      >
                        {/* ID: {account.id?.substring(0, 6)}... */}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadAccount} 
                  disabled={isLoading}
                  className="gap-1.5 bg-purple-100 hover:bg-purple-200"
                  style={{cursor:'pointer'}}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full max-w-md mb-6">
              <TabsTrigger 
                value="overview"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              style={{cursor:'pointer'}}
              >
                <User className="h-4 w-4 mr-2" />
                <span>Aperçu</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              style={{cursor:'pointer'}}
              >
                <Activity className="h-4 w-4 mr-2" />
                <span>Activité</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              style={{cursor:'pointer'}}
              >
                <Settings className="h-4 w-4 mr-2" />
                <span>Paramètres</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Aperçu */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Informations de base */}
                <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-3">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base">Informations de base</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type de compte</p>
                      <div className="flex items-center">
                        {account.accountMode === 'BUSINESS' ? (
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        ) : (
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        )}
                        <p className="font-medium text-foreground">
                          {account.accountMode === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p className="font-medium text-foreground break-all">
                          {account.email || 'Non spécifié'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</p>
                      <p className="font-medium text-foreground">
                        {account.phoneNumber ? (
                          <a href={`tel:${account.phoneNumber}`} className="hover:text-primary transition-colors">
                            {account.phoneNumber}
                          </a>
                        ) : 'Non spécifié'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pays</p>
                      <p className="font-medium flex items-center text-foreground">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span>{account.country?.nameFr || 'Non spécifié'}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date de création</p>
                      <p className="font-medium flex items-center text-foreground">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span>{format(new Date(account.createdAt), 'PPP', { locale: fr })}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dernière mise à jour</p>
                      <p className="font-medium flex items-center text-foreground">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span>{format(new Date(account.updatedAt), 'PPPp', { locale: fr })}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Statut et solde */}
                <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-center">
                      <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 mr-3">
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-semibold text-base">Solde et statistiques</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 p-5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Solde total</p>
                      <p className="text-3xl font-bold text-emerald-900 dark:text-white">
                        {formatCurrency(account.totalBalance || 0, account.country?.currency?.code || 'XOF')}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        <span>Solde à jour</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Statistiques financières</p>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Dépôts totaux</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(account.totalDeposits || 0, account.country?.currency?.code || 'XOF')}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500/80 rounded-full" 
                                style={{ width: `${Math.min(100, (account.totalDeposits || 0) / Math.max(1, (account.totalDeposits || 0) + (account.totalWithdrawals || 0)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Retraits totaux</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(account.totalWithdrawals || 0, account.country?.currency?.code || 'XOF')}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-500/80 rounded-full" 
                                style={{ width: `${Math.min(100, (account.totalWithdrawals || 0) / Math.max(1, (account.totalDeposits || 0) + (account.totalWithdrawals || 0)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Frais totaux</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(account.totalFees || 0, account.country?.currency?.code || 'XOF')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut du compte</p>
                          <div className="flex items-center">
                            {['active', 'ACTIVE'].includes(account.status) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive mr-2" />
                            )}
                            <span className="font-medium text-foreground">
                              {['active', 'ACTIVE'].includes(account.status) ? 'Compte actif' : 'Compte suspendu'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={['active', 'ACTIVE'].includes(account.status) ? 'outline' : 'default'}
                          size="sm"
                          onClick={handleStatusChange}
                          disabled={isUpdating}
                          className="gap-1.5"
                          style={{cursor:'pointer'}}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : ['active', 'ACTIVE'].includes(account.status) ? (
                            <PauseCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          {['active', 'ACTIVE'].includes(account.status) ? 'Suspendre' : 'Activer'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dernières activités */}
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-2">
                    <h3 className="font-medium flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Dernières activités
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {account.recentTransactions && account.recentTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {account.recentTransactions.map((transaction, index) => (
                          <div key={index} className="flex items-start justify-between pb-2 border-b last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{transaction.description || 'Transaction'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(transaction.createdAt), 'PPp', { locale: fr })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {transaction.amount >= 0 ? '+' : ''}
                                {formatCurrency(transaction.amount, transaction.currency || 'XOF')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.status || 'Complétée'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Aucune activité récente</p>
                        <p className="text-sm mt-1">Les transactions apparaîtront ici</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Activité */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>
                    Historique complet des transactions et activités du compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Aucune activité récente</p>
                    <p className="text-sm mt-2">Les transactions apparaîtront ici</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Paramètres */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres du compte</CardTitle>
                  <CardDescription>
                    Gérer les paramètres et les préférences de ce compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Informations de facturation</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Nom :</span>{' '}
                        <span className="font-medium">{account.billingName || 'Non défini'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Email :</span>{' '}
                        <span className="font-medium">{account.billingEmail || 'Non défini'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Téléphone :</span>{' '}
                        <span className="font-medium">{account.billingPhone || 'Non défini'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Adresse :</span>{' '}
                        <span className="font-medium">
                          {account.billingAddress ? (
                            `${account.billingAddress.line1 || ''} ${account.billingAddress.city || ''} ${account.billingAddress.postalCode || ''}`
                          ) : 'Non définie'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-16 justify-start" style={{cursor:'pointer'}}>
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer un email de bienvenue
                      </Button>&nbsp;
                      <Button
                        variant="outline"
                        className="w-16 justify-start"
                        disabled={true}
                        style={{cursor:'pointer'}}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Réinitialiser le mot de passe
                      </Button> &nbsp;
                      <Button
                        variant="outline"
                        className="w-16 justify-start text-destructive"
                        onClick={handleDeleteAccount}
                        disabled={isUpdating}
                        style={{cursor:'pointer'}}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer le compte
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
