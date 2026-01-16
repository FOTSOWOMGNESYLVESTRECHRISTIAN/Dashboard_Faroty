import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Mail, Calendar, Wallet, Eye, PauseCircle, Play, Trash2,
  MoreHorizontal, RefreshCw, ChevronLeft, ChevronRight, Filter,
  TrendingUp, Users, Shield, Globe, CreditCard, Zap, Star,
  CheckCircle, XCircle, Activity, MapPin, Smartphone, ExternalLink,
  ArrowUpRight, Clock, DollarSign, Target, Award, Info
} from 'lucide-react';
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, User, Building2, Loader2, AlertCircle } from "lucide-react";
import { Account } from "../types/payment";
import { getAccounts, updateAccountStatus, deleteWallet, createAccount, getTransactions } from "../services/paymentService";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardFooter } from "./ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { CreateAccountDialog } from "./CreateAccountDialog";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { motion } from 'framer-motion';

interface AccountsProps {
  onViewDetails?: (account: Account) => void;
}

export function Accounts({ onViewDetails }: AccountsProps = {}) {
  const { toast: showToast } = useToast();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [accountTransactions, setAccountTransactions] = useState<Record<string, number>>({});
  const [accountGrowth, setAccountGrowth] = useState<Record<string, number>>({});

  // Statistiques des comptes
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter(a => !a.frozen).length;
    const suspended = accounts.filter(a => a.frozen).length;
    const live = accounts.filter(a => a.accountMode === 'LIVE').length;
    const sandbox = accounts.filter(a => a.accountMode === 'SANDBOX').length;
    return { total, active, suspended, live, sandbox };
  }, [accounts]);

  // Fonction utilitaire pour mapper les données de l'API vers le type Account
  const mapApiAccountToAccount = (apiAccount: any): Account => {
    return {
      id: apiAccount.id,
      userId: apiAccount.userId,
      accountName: apiAccount.accountName,
      accountSubName: apiAccount.accountSubName || '',
      accountMode: apiAccount.accountMode,
      publicKey: apiAccount.publicKey,
      expiresAt: apiAccount.expiresAt,
      frozenReason: apiAccount.frozenReason,
      depositFeeRate: apiAccount.depositFeeRate,
      withdrawalFeeRate: apiAccount.withdrawalFeeRate,
      status: apiAccount.frozen ? 'suspended' as const : 'active' as const,
      createdAt: apiAccount.createdAt,
      updatedAt: apiAccount.updatedAt,
      country: apiAccount.country,
      walletsCount: apiAccount.walletsCount || 0,
      accountPaymentMethodsCount: apiAccount.accountPaymentMethodsCount || 0,
      webhooksCount: apiAccount.webhooksCount || 0,
      frozen: apiAccount.frozen || false
    };
  };

  // Fonction pour charger les données complètes d'un compte
  const loadAccountData = async (accountId: string) => {
    try {
      // Charger tous les comptes et filtrer pour obtenir le compte spécifique
      const accounts = await getAccounts();
      const account = accounts.find(acc => acc.id === accountId);

      // Utiliser le solde du compte s'il est disponible
      const totalBalance = account?.balance || 0;


      // Charger les transactions du compte - DÉSACTIVÉ POUR ÉVITER LES ERREURS 500
      // Le backend ne supporte pas la charge de récupérer les transactions pour chaque compte en parallèle
      // const transactionsResponse = await getTransactions(0, 100); 
      // const accountTransactions = transactionsResponse.data?.content?.filter(
      //   tx => tx.accountId === accountId
      // ) || [];
      const accountTransactions: any[] = [];

      // Calculer les statistiques
      const transactionsCount = accountTransactions.length;
      const growth = calculateGrowth(accountTransactions);

      // Mettre à jour les états
      setAccountBalances(prev => ({
        ...prev,
        [accountId]: totalBalance
      }));

      setAccountTransactions(prev => ({
        ...prev,
        [accountId]: transactionsCount
      }));

      setAccountGrowth(prev => ({
        ...prev,
        [accountId]: growth
      }));

      return { balance: totalBalance, transactions: transactionsCount, growth };
    } catch (error) {
      console.error(`Erreur lors du chargement des données du compte ${accountId}:`, error);
      return { balance: 0, transactions: 0, growth: 0 };
    }
  };

  // Fonction pour calculer la croissance basée sur les transactions
  const calculateGrowth = (transactions: any[]) => {
    if (transactions.length === 0) return 0;

    // Trier les transactions par date (les plus récentes en premier)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Prendre les 10 dernières transactions (ou moins si pas assez)
    const recentTransactions = sortedTransactions.slice(0, 10);

    if (recentTransactions.length < 2) return 0;

    // Calculer la moyenne des montants
    const totalAmount = recentTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0), 0
    );
    const averageAmount = totalAmount / recentTransactions.length;

    // Calculer l'écart type
    const variance = recentTransactions.reduce(
      (sum, tx) => sum + Math.pow((tx.amount || 0) - averageAmount, 2), 0
    ) / recentTransactions.length;

    const stdDev = Math.sqrt(variance);

    // Éviter la division par zéro
    if (stdDev === 0) return 0;

    // Calculer le coefficient de variation comme indicateur de croissance
    const coefficientOfVariation = (stdDev / averageAmount) * 100;

    // Normaliser entre -100 et 100
    return Math.min(Math.max(Math.round(coefficientOfVariation * 10), -100), 100);
  };

  const loadAccounts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAccounts();
      const mappedAccounts = response.map(mapApiAccountToAccount);
      setAccounts(mappedAccounts);
      setFilteredAccounts(mappedAccounts);

      // Charger les données pour chaque compte
      const accountDataPromises = mappedAccounts.map(account =>
        loadAccountData(account.id)
      );
      await Promise.all(accountDataPromises);
    } catch (err) {
      console.error('Error loading accounts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      setError('Erreur lors du chargement des comptes: ' + errorMessage);
      showToast({
        title: 'Erreur',
        description: 'Impossible de charger les comptes: ' + errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    let filtered = [...accounts];

    // Filtrage par statut (actif/suspendu)
    if (activeFilter !== 'all') {
      filtered = filtered.filter(account =>
        activeFilter === 'active' ? !account.frozen : account.frozen
      );
    }

    // Filtrage par terme de recherche
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((account) => {
        return (
          account.accountName?.toLowerCase().includes(lowercasedTerm) ||
          account.id?.toLowerCase().includes(lowercasedTerm) ||
          account.country?.nameFr?.toLowerCase().includes(lowercasedTerm) ||
          account.accountMode?.toLowerCase().includes(lowercasedTerm) ||
          (account.frozen ? 'suspendu' : 'actif').includes(lowercasedTerm)
        );
      });
    }

    // Tri des résultats
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.accountName.localeCompare(b.accountName);
        case 'status':
          return (a.frozen ? 1 : 0) - (b.frozen ? 1 : 0);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [accounts, searchTerm, activeFilter, sortBy]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement> | string): void => {
    const term = typeof e === 'string' ? e : e.target.value;
    setSearchTerm(term);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleCreateAccount = async (accountData: {
    accountName: string;
    accountMode: 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE';
    email: string;
    country: string;
    currency?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      const newAccount = await createAccount({
        ...accountData,
        currency: accountData.currency || 'XOF',
      });

      setAccounts(prev => [newAccount, ...prev]);

      showToast({
        title: 'Succès 🎉',
        description: 'Le compte a été créé avec succès',
      });
      return true;
    } catch (err) {
      console.error('Error creating account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      showToast({
        title: 'Erreur',
        description: 'Impossible de créer le compte: ' + errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
      setIsCreateDialogOpen(false);
    }
  };

  // Rafraîchir les données d'un compte spécifique
  const refreshAccountData = async (accountId: string) => {
    await loadAccountData(accountId);
  };

  const handleStatusChange = async (e: React.MouseEvent, accountId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await updateAccountStatus(accountId, newStatus);

      setAccounts(prev => prev.map(account =>
        account.id === accountId ? {
          ...account,
          status: newStatus,
          frozen: newStatus === 'SUSPENDED'
        } : account
      ));

      // Rafraîchir les données après la mise à jour du statut
      await refreshAccountData(accountId);

      toast.success(`Statut du compte mis à jour avec succès`);
    } catch (err) {
      console.error('Error updating account status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      showToast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du compte: ' + errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async (e: React.MouseEvent<HTMLElement>, accountId: string): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      return;
    }

    try {
      // Use deleteWallet instead of deleteAccount since it's the available function
      await deleteWallet(accountId);

      // Update the accounts list by removing the deleted account
      setAccounts(prev => prev.filter(account => account.id !== accountId));

      toast.success('Compte supprimé avec succès');
    } catch (err) {
      console.error('Error deleting account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      showToast({
        title: 'Erreur',
        description: 'Impossible de supprimer le compte: ' + errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Fonction pour gérer le clic sur le bouton Voir les détails
  const handleViewDetails = (e: React.MouseEvent | Account, account?: Account) => {
    // Gérer les deux signatures possibles :
    // 1. handleViewDetails(e, account) - avec événement et compte
    // 2. handleViewDetails(account) - avec seulement le compte
    const event = account ? e as React.MouseEvent : undefined;
    const targetAccount = account || e as unknown as Account;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (onViewDetails) {
      onViewDetails(targetAccount);
    } else {
      navigate(`/accounts/${targetAccount.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-300/5',
          text: 'text-emerald-600',
          border: 'border-emerald-300/40',
          icon: 'bg-emerald-500',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          accent: 'rgb(16, 185, 129)'
        };
      case 'SUSPENDED':
        return {
          bg: 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-300/5',
          text: 'text-amber-600',
          border: 'border-amber-300/40',
          icon: 'bg-amber-500',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          accent: 'rgb(245, 158, 11)'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 via-gray-400/10 to-gray-300/5',
          text: 'text-gray-600',
          border: 'border-gray-300/40',
          icon: 'bg-gray-500',
          glow: 'shadow-[0_0_20px_rgba(156,163,175,0.15)]',
          accent: 'rgb(156, 163, 175)'
        };
    }
  };

  const getAccountTypeStyle = (type: string) => {
    switch (type) {
      case 'BUSINESS':
        return {
          gradient: 'from-blue-500/20 via-indigo-400/10 to-purple-300/5',
          border: 'border-blue-300/30',
          accent: 'rgb(59, 130, 246)'
        };
      case 'PERSONAL':
        return {
          gradient: 'from-purple-500/20 via-pink-400/10 to-rose-300/5',
          border: 'border-purple-300/30',
          accent: 'rgb(168, 85, 247)'
        };
      case 'LIVE':
        return {
          gradient: 'from-green-500/20 via-teal-400/10 to-cyan-300/5',
          border: 'border-green-300/30',
          accent: 'rgb(34, 197, 94)'
        };
      default:
        return {
          gradient: 'from-gray-500/20 via-slate-400/10 to-zinc-300/5',
          border: 'border-gray-300/30',
          accent: 'rgb(156, 163, 175)'
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityLevel = (activity: number) => {
    if (activity >= 80) return { color: 'bg-emerald-500', label: 'Élevée', text: 'text-emerald-600' };
    if (activity >= 60) return { color: 'bg-amber-500', label: 'Moyenne', text: 'text-amber-600' };
    return { color: 'bg-red-500', label: 'Faible', text: 'text-red-600' };
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary border-r-primary/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Wallet className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground animate-pulse">Chargement des comptes</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Préparation de votre espace de gestion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-8">
        {/* En-tête avec indicateur en temps réel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Tableau de bord des comptes
            </h2>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Statistiques en temps réel • Dernière mise à jour à l'instant
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/5 text-primary font-medium">
            <Activity className="h-3 w-3 mr-1.5 animate-pulse" />
            LIVE
          </Badge>
        </div>

        {/* Stats Cards améliorées avec effets visuels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total des comptes',
              value: stats.total,
              icon: Users,
              color: 'from-blue-500 via-blue-400 to-cyan-500',
              glowColor: 'rgba(59, 130, 246, 0.25)',
              trend: '+12% ce mois',
              trendIcon: TrendingUp,
              description: 'Tous les comptes enregistrés'
            },
            {
              label: 'Comptes actifs',
              value: stats.active,
              icon: TrendingUp,
              color: 'from-emerald-500 via-emerald-400 to-green-500',
              glowColor: 'rgba(16, 185, 129, 0.25)',
              trend: '+8% ce mois',
              trendIcon: TrendingUp,
              description: 'Comptes actuellement actifs'
            },
            {
              label: 'Comptes suspendus',
              value: stats.suspended,
              icon: PauseCircle,
              color: 'from-amber-500 via-amber-400 to-yellow-500',
              glowColor: 'rgba(245, 158, 11, 0.25)',
              trend: '+3% ce mois',
              trendIcon: TrendingUp,
              description: 'Comptes temporairement suspendus'
            },
            {
              label: 'Comptes business',
              value: stats.business,
              icon: Building2,
              color: 'from-purple-500 via-purple-400 to-pink-500',
              glowColor: 'rgba(168, 85, 247, 0.25)',
              trend: '+15% ce mois',
              trendIcon: TrendingUp,
              description: 'Comptes professionnels'
            },
          ].map((stat, index) => {
            const baseColor = stat.color.split('-')[1];

            return (
              <div
                key={index}
                className="relative group cursor-pointer"
              >
                {/* Effet de lueur externe au survol */}
                <div
                  className="absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                  style={{
                    background: `linear-gradient(45deg, ${stat.glowColor}, transparent 70%)`,
                  }}
                />

                {/* Effet de bordure animée */}
                <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-500 animate-pulse-slow"
                  style={{ background: stat.color }} />

                {/* Carte principale */}
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/90 via-background/85 to-background/80 backdrop-blur-xl border border-${baseColor}-500/30 p-6 transition-all duration-500 
                  group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-${baseColor}-500/20
                  group-hover:border-${baseColor}-500/50`}
                  style={{
                    boxShadow: `0 8px 32px -10px ${stat.glowColor}`,
                  }}
                >
                  {/* Effet de fond animé au survol */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 80% 20%, ${stat.glowColor} 0%, transparent 60%)`,
                    }}
                  />

                  {/* Particules animées */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute h-1 w-1 rounded-full bg-${baseColor}-500/20 animate-float`}
                        style={{
                          left: `${15 + i * 30}%`,
                          top: `${25 + i * 15}%`,
                          animationDelay: `${i * 0.4}s`,
                          animationDuration: `${3 + i * 0.8}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Contenu principal */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        {/* Label avec effet de bordure */}
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${stat.color}/10 border border-${baseColor}-500/20 flex items-center justify-center`}>
                              <stat.icon className={`h-4.5 w-4.5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          </div>
                          {/* Ligne décorative */}
                          <div className={`absolute -left-1 top-0 h-full w-[2px] bg-gradient-to-b ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>

                        {/* Valeur avec effet 3D */}
                        <div className="relative">
                          <p
                            className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent drop-shadow-lg`}
                            style={{
                              textShadow: `0 2px 10px ${stat.glowColor}`,
                            }}
                          >
                            {stat.value}
                          </p>
                          {/* Effet de profondeur */}
                          <div
                            className={`absolute -inset-x-3 -inset-y-2 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`}
                          />
                        </div>

                        {/* Description et tendance */}
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            {stat.description}
                          </p>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color}/10 border border-${baseColor}-500/20`}>
                                <stat.trendIcon className={`h-3.5 w-3.5 text-${baseColor}-500`} />
                              </div>
                              <span className={`text-xs font-semibold text-${baseColor}-600 bg-gradient-to-r from-${baseColor}-500/10 to-transparent px-2.5 py-1 rounded-full`}>
                                {stat.trend}
                              </span>
                            </div>

                            {/* Barre de progression animée */}
                            <div className="relative">
                              <div className="h-1.5 w-16 rounded-full bg-background/30 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full bg-gradient-to-r ${stat.color} animate-progress`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (index + 1) * 25)}%` }}
                                  transition={{ duration: 1.5, delay: index * 0.1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Icône avec effet de rotation et lueur */}
                      <div className="relative ml-4">
                        {/* Lueur derrière l'icône */}
                        <div
                          className={`absolute -inset-2 rounded-full bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-25 blur-xl transition-all duration-500 group-hover:scale-125`}
                        />

                        {/* Cercle de l'icône avec effet de brillance */}
                        <div
                          className={`relative h-16 w-16 rounded-full bg-gradient-to-br ${stat.color}/20 backdrop-blur-sm border-2 border-${baseColor}-500/30 flex items-center justify-center 
                          transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`}
                          style={{
                            boxShadow: `inset 0 4px 24px ${stat.glowColor}, 0 8px 24px -8px ${stat.glowColor}`,
                          }}
                        >
                          {/* Effet de brillance interne */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <stat.icon
                            className={`h-7 w-7 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                            style={{
                              filter: `drop-shadow(0 2px 8px ${stat.glowColor})`,
                            }}
                          />
                        </div>

                        {/* Points orbitaux animés */}
                        <div className="absolute -inset-3">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`absolute h-2 w-2 rounded-full bg-${baseColor}-500/40 animate-orbit`}
                              style={{
                                left: '50%',
                                top: '50%',
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: '3.5s',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Effet de lumière au survol (coin supérieur droit) */}
                  <div
                    className="absolute -top-10 -right-10 h-20 w-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle, ${stat.glowColor} 0%, transparent 70%)`,
                      filter: 'blur(12px)',
                    }}
                  />

                  {/* Bordure inférieure animée */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`}
                  />

                  {/* Indicateur de coin */}
                  <div className={`absolute top-0 right-0 h-0 w-0 border-t-[40px] border-r-[40px] border-t-transparent border-r-${baseColor}-500/10`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende et outils */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">En croissance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">À surveiller</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Stable</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary/60" />
              <span>Données mises à jour automatiquement</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm border border-border/30 hover:bg-background/80"
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-sm">
                <p className="font-medium mb-1">Statistiques en temps réel</p>
                <p>Les données sont actualisées automatiquement toutes les 5 minutes. Les pourcentages représentent l'évolution mensuelle.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm border border-border/50 p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Gestion des Comptes
              </h1>
              <p className="text-sm text-muted-foreground">
                Gérez efficacement tous les comptes de votre plateforme
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2 bg-primary hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              style={{ cursor: 'pointer' }}
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Nouveau compte
            </Button>
          </div>

          {/* Filtres et recherche */}
          <div className="relative group">
            {/* Effets de lueur extérieure */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 
            to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-primary/15 via-transparent 
            to-emerald-500/10 blur-xl opacity-0 group-hover:opacity-50 transition-all duration-500" />

            {/* Conteneur principal */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-xl border border-border/40 hover:border-primary/30 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-6">

              {/* Barre de recherche */}
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un compte par nom, email ou ID..."
                    className="pl-10 h-12 w-full rounded-xl border border-input bg-background/80 focus:border-primary focus:ring-2 
                    focus:ring-primary/20 transition-all duration-300 border-border/40"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e)}
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Tabs
                    value={activeFilter}
                    onValueChange={(v: any) => setActiveFilter(v)}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 bg-background/50 backdrop-blur-sm border border-border/30 p-1 h-auto rounded-xl">
                      <TabsTrigger
                        value="all"
                        className={`
                          py-2 text-sm font-medium transition-all duration-300 rounded-lg
                          ${activeFilter === 'all'
                            ? 'bg-primary to-primary/80 text-primary shadow-md shadow-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }
                        `}
                        style={{ cursor: 'pointer' }}
                      >
                        Tous ({accounts.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="active"
                        className={`
                          py-2 text-sm font-medium transition-all duration-300 rounded-lg
                          ${activeFilter === 'active'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-primary shadow-md shadow-emerald-500/20'
                            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
                          }
                        `}
                        style={{ cursor: 'pointer' }}
                      >
                        Actifs ({stats.active})
                      </TabsTrigger>
                      <TabsTrigger
                        value="suspended"
                        className={`
                          py-2 text-sm font-medium transition-all duration-300 rounded-lg
                          ${activeFilter === 'suspended'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-primary shadow-md shadow-amber-500/20'
                            : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
                          }
                        `}
                        style={{ cursor: 'pointer' }}
                      >
                        Suspendus ({stats.suspended})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">Trier par :</span>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border/40" style={{ cursor: 'pointer' }}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name" style={{ cursor: 'pointer' }}>Nom (A-Z)</SelectItem>
                      <SelectItem value="date" style={{ cursor: 'pointer' }}>Date de création</SelectItem>
                      <SelectItem value="status" style={{ cursor: 'pointer' }}>Statut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent backdrop-blur-sm border border-destructive/20 p-6">
          <div className="flex items-start">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mr-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-destructive">Erreur de chargement</h3>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={loadAccounts}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setError(null)}
                >
                  Ignorer
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 via-transparent to-primary/5">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
            <div className="relative bg-background rounded-full p-6 border border-primary/20 backdrop-blur-sm">
              <Wallet className="h-12 w-12 text-primary/60 mx-auto" />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            {searchTerm || activeFilter !== 'all' ? 'Aucun résultat trouvé' : 'Bienvenue sur votre espace de gestion'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {searchTerm
              ? 'Aucun compte ne correspond à votre recherche. Essayez d\'autres termes.'
              : activeFilter !== 'all'
                ? 'Aucun compte ne correspond à ce filtre.'
                : 'Créez votre premier compte et commencez à gérer vos paiements en toute simplicité.'}
          </p>
          <Button
            className="mt-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Créer un compte
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((account) => {
              const statusColors = getStatusColor(account.status);
              const typeStyle = getAccountTypeStyle(account.accountMode);
              // Récupérer les données du compte depuis l'état
              const accountBalance = accountBalances[account.id] || 0;
              const transactionsCount = accountTransactions[account.id] || 0;
              const growth = accountGrowth[account.id] || 0;

              // Statistiques du compte basées sur les données réelles
              const accountStats = {
                balance: accountBalance,
                transactions: transactionsCount,
                growth: growth,
                activity: account.frozen ? 0 : Math.min(100, Math.max(0, 50 + (growth / 2))) // Ajuster l'activité en fonction de la croissance
              };
              const activityLevel = getActivityLevel(accountStats.activity);
              const initials = getInitials(account.accountName || 'Compte');
              const isHovered = hoveredCard === account.id;

              return (
                <div
                  key={account.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredCard(account.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Carte principale */}
                  <div className={`
                    relative overflow-hidden rounded-2xl
                    bg-white dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    shadow-sm hover:shadow-lg
                    transition-all duration-300
                    hover:scale-[1.02]
                    hover:border-primary/30
                    ${isHovered ? 'shadow-md' : ''}
                  `}>

                    {/* Barre supérieure colorée */}
                    <div className="absolute top-0 left-0 right-0 h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${statusColors.accent}, ${typeStyle.accent})`,
                      }}
                    />

                    <CardHeader className="pb-3 pt-6">
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar et info principale */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar simple */}
                          <div className="relative">
                            <div className={`
                              h-12 w-12 rounded-xl
                              ${account.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}
                              flex items-center justify-center
                              border-2 border-white dark:border-gray-800
                              shadow-sm
                            `}>
                              <span className={`text-lg font-bold ${account.status === 'ACTIVE'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                {initials}
                              </span>
                            </div>
                            {/* <div className={`
                              absolute -bottom-1 -right-1 h-15 w-15 rounded-full
                              ${account.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}
                              border-2 border-white dark:border-gray-800
                              flex items-center justify-center
                            `}>
                              {account.status === 'ACTIVE' ? (
                                <CheckCircle className="h-2.5 w-2.5 text-white" />
                              ) : (
                                <XCircle className="h-2.5 w-2.5 text-white" />
                              )}
                            </div> */}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {account.accountName || 'Sans nom'}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`
                                  text-xs px-2 py-0.5
                                  ${account.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                  }
                                `}
                              >
                                {account.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {account.email || 'Non spécifié'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu d'actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              style={{ cursor: 'pointer' }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => handleViewDetails(e as any, account)}
                              className="cursor-pointer"
                              style={{ cursor: 'pointer' }}
                            >
                              <Eye className="mr-3 h-4 w-4" />
                              <span>Voir les détails</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleStatusChange(e as any, account.id, account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                              className="cursor-pointer"
                              style={{ cursor: 'pointer' }}
                            >
                              {account.status === 'ACTIVE' ? (
                                <>
                                  <PauseCircle className="mr-3 h-4 w-4 text-amber-600" />
                                  <span>Suspendre</span>
                                </>
                              ) : (
                                <>
                                  <Play className="mr-3 h-4 w-4 text-emerald-600" />
                                  <span>Activer</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={(e) => handleDeleteAccount(e as any, account.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Trash2 className="mr-3 h-4 w-4" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      {/* Stats simplifiées */}
                      <div className="space-y-4">
                        {/* Solde */}
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Solde</span>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(accountStats.balance)}
                          </p>
                        </div>

                        {/* Transactions et Croissance */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Transactions</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {accountStats.transactions}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className={`h-3.5 w-3.5 ${accountStats.growth >= 0 ? 'text-emerald-500' : 'text-red-500'
                                }`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Croissance</span>
                            </div>
                            <p className={`text-lg font-semibold ${accountStats.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                              {accountStats.growth >= 0 ? '+' : ''}{accountStats.growth}%
                            </p>
                          </div>
                        </div>

                        {/* Informations supplémentaires */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {account.country?.nameFr || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {account.createdAt ? format(new Date(account.createdAt), 'dd/MM/yy') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 pb-5">
                      <div className="flex items-center justify-between w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          onClick={(e) => handleViewDetails(e, account)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Détails</span>
                        </Button>

                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-9 w-9 rounded-lg ${account.status === 'ACTIVE'
                                    ? 'hover:bg-amber-500/10 hover:text-amber-600'
                                    : 'hover:bg-emerald-500/10 hover:text-emerald-600'
                                  }`}
                                onClick={(e) => handleStatusChange(e, account.id, account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                style={{ cursor: 'pointer' }}
                              >
                                {account.status === 'ACTIVE' ? (
                                  <PauseCircle className="h-4.5 w-4.5" />
                                ) : (
                                  <Play className="h-4.5 w-4.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {account.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(e, account);
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </Button> */}
                            </TooltipTrigger>
                            <TooltipContent>Voir détails</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg hover:bg-red-500/10 hover:text-red-600"
                                onClick={(e) => handleDeleteAccount(e, account.id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardFooter>

                    {/* Badge Type de compte */}
                    <div className="absolute top-3 right-3">
                      <div className={`
                        px-2 py-1 rounded-md text-xs font-medium
                        ${account.accountMode === 'BUSINESS'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }
                      `}>
                        {account.accountMode === 'BUSINESS' ? 'Business' : 'Personnel'}
                      </div>
                    </div>

                    {/* Badge Premium simplifié */}
                    {accountStats.balance > 20000 && (
                      <div className="absolute top-3 right-3">
                        <div className="
                          px-2 py-1 rounded-md
                          bg-gradient-to-r from-amber-400 to-amber-500
                          text-white text-xs font-medium
                          shadow-sm
                          flex items-center gap-1
                        ">
                          <Star className="h-3 w-3" />
                          <span>PREMIUM</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredAccounts.length > itemsPerPage && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm border border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> à{' '}
                  <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, filteredAccounts.length)}</span>{' '}
                  sur <span className="font-semibold text-foreground">{filteredAccounts.length}</span> comptes
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="gap-1 h-9 px-3 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={`h-9 w-9 rounded-xl ${currentPage === pageNum ? 'bg-gradient-to-r from-primary to-primary/80' : ''}`}
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="gap-1 h-9 px-3 rounded-xl"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateAccountDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
}