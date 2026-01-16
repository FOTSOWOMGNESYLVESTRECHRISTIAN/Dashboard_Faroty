import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Zap,
  Target,
  Activity,
  ArrowUpDown,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Transaction } from '../types/payment';
import { getTransactions, formatCurrency, formatDate } from "../services/paymentService";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";

// Map status to colors
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'succeeded':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: 'text-emerald-500',
        accent: 'bg-emerald-500'
      };
    case 'failed':
    case 'cancelled':
    case 'declined':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-500',
        accent: 'bg-red-500'
      };
    case 'pending':
    case 'processing':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: 'text-amber-500',
        accent: 'bg-amber-500'
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'text-gray-500',
        accent: 'bg-gray-500'
      };
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'succeeded':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'failed':
    case 'cancelled':
    case 'declined':
      return <XCircle className="h-3.5 w-3.5" />;
    case 'pending':
    case 'processing':
      return <Clock className="h-3.5 w-3.5" />;
    default:
      return null;
  }
};

const getAmountColor = (amount: number) => {
  if (amount > 0) return 'text-emerald-600';
  if (amount < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getAmountIcon = (amount: number) => {
  if (amount > 0) return <ArrowDownRight className="h-4 w-4 text-emerald-500" />;
  if (amount < 0) return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  return null;
};

interface TransactionsProps {
  onViewDetails?: (transactionId: string) => void;
}

export function Transactions({ onViewDetails }: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Mock statistics
  const stats = {
    total: 12542,
    success: 10890,
    failed: 765,
    pending: 887,
    revenue: 4528000,
    avgAmount: 361.5
  };

  const loadTransactions = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      const response = await getTransactions(pageNum, 10);

      if (!response) {
        throw new Error('Aucune réponse du serveur');
      }

      if (response.status === 500) {
        throw new Error('Erreur interne du serveur. Veuillez réessayer plus tard.');
      }

      if (Array.isArray(response.data)) {
        setTransactions(response.data);
        setTotalPages(1);
        setTotalElements(response.data.length);
      } else if (response.data && response.data.content) {
        setTransactions(response.data.content);
        setPage(response.data.number || 0);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      } else {
        // Aucune donnée valide reçue, initialiser avec des tableaux vides
        setTransactions([]);
        setPage(0);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      
      // Réinitialiser les données en cas d'erreur
      setTransactions([]);
      setPage(0);
      setTotalPages(0);
      setTotalElements(0);
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Une erreur est survenue lors du chargement des transactions';
      
      toast.error(errorMessage, {
        description: 'Veuillez réessayer ou contacter le support si le problème persiste.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterStatus !== 'all' && t.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (filterType !== 'all' && t.type !== filterType) {
      return false;
    }
    return (
      (t.id && t.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.status && t.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return Math.abs(b.amount) - Math.abs(a.amount);
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Fonctions d'export
  const exportToExcel = (transactions: Transaction[], filename: string, columns?: string[]) => {
    toast.success('Export en cours...');
    // Implémentation de l'export Excel
    console.log('Exporting to Excel:', { transactions, filename, columns });
    // Ajoutez ici votre logique d'export Excel
  };

  const exportTransactionsToCSV = (transactions: Transaction[]) => {
    toast.success('Export CSV en cours...');
    // Implémentation de l'export CSV
    console.log('Exporting to CSV:', transactions);
    // Ajoutez ici votre logique d'export CSV
  };

  return (
    <div className="space-y-6 h-full flex flex-col p-6 rounded-2xl shadow-sm bg-white">
      {/* Header */}
      <div className="space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 hover:shadow-xl transition-all duration-500">
          {[
            { 
              label: 'Total Transactions', 
              value: stats.total.toLocaleString(), 
              icon: BarChart3, 
              color: 'from-blue-500 via-blue-400 to-cyan-500',
              glowColor: 'rgba(59, 130, 246, 0.3)',
              trend: '+12%',
              trendIcon: TrendingUp
            },
            { 
              label: 'Taux de réussite', 
              value: `${((stats.success / stats.total) * 100).toFixed(1)}%`, 
              icon: Target, 
              color: 'from-emerald-500 via-emerald-400 to-green-500',
              glowColor: 'rgba(16, 185, 129, 0.3)',
              trend: '+2.3%',
              trendIcon: TrendingUp
            },
            { 
              label: 'Chiffre d\'affaires', 
              value: formatCurrency(stats.revenue, 'XOF'), 
              icon: DollarSign, 
              color: 'from-purple-500 via-purple-400 to-pink-500',
              glowColor: 'rgba(168, 85, 247, 0.3)',
              trend: '+15%',
              trendIcon: TrendingUp
            },
            { 
              label: 'Montant moyen', 
              value: formatCurrency(stats.avgAmount, 'XOF'), 
              icon: CreditCard, 
              color: 'from-amber-500 via-amber-400 to-yellow-500',
              glowColor: 'rgba(245, 158, 11, 0.3)',
              trend: '+5%',
              trendIcon: TrendingUp
            },
          ].map((stat, index) => {
            const baseColor = stat.color.split('-')[1];
            
            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Effet de lueur externe */}
                <div 
                  className={`absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700`}
                  style={{
                    background: `linear-gradient(45deg, ${stat.glowColor}, transparent 70%)`,
                  }}
                />
                
                {/* Effet de bordure animée */}
                <div className="relative">
                  {/* Bordure animée */}
                  <div className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-30 animate-pulse-slow`} />
                  
                  {/* Carte principale */}
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/90 via-background/80 to-background/70 backdrop-blur-xl border-2 border-${baseColor}-500/30 p-6 transition-all duration-500 
                    group-hover:scale-[1.03] group-hover:border-${baseColor}-500/50 
                    group-hover:shadow-2xl group-hover:shadow-${baseColor}-500/10`}
                    style={{
                      boxShadow: `0 20px 60px -10px ${stat.glowColor}`,
                    }}
                  >
                    {/* Fond animé */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${stat.glowColor} 0%, transparent 50%)`,
                      }}
                    />
                    
                    {/* Effet de particules */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute h-1 w-1 bg-${baseColor}-500/30 rounded-full animate-float`}
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${20 + i * 15}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + i * 1}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Contenu */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          {/* Label avec effet de brillance */}
                          <div className="relative">
                            <p className="text-sm font-medium text-muted-foreground/90 tracking-wide uppercase">
                              {stat.label}
                            </p>
                            <div className={`absolute -left-1 top-0 h-full w-[2px] bg-gradient-to-b ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                          </div>
                          
                          {/* Valeur avec effet 3D */}
                          <div className="relative">
                            <p 
                              className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent drop-shadow-lg`}
                              style={{
                                textShadow: `0 2px 4px ${stat.glowColor}`,
                              }}
                            >
                              {stat.value}
                            </p>
                            {/* Effet de profondeur */}
                            <div 
                              className={`absolute -inset-x-2 -inset-y-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-500`}
                            />
                          </div>
                          
                          {/* Trend avec animation */}
                          <div className="flex items-center gap-2 pt-2">
                            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color}/10 border border-${baseColor}-500/20`}>
                              <stat.trendIcon className={`h-3.5 w-3.5 text-${baseColor}-500`} />
                            </div>
                            <span className={`text-sm font-semibold text-${baseColor}-500 bg-gradient-to-r from-${baseColor}-500/10 to-transparent px-3 py-1 rounded-full`}>
                              {stat.trend}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">ce mois</span>
                          </div>
                        </div>
                        
                        {/* Icône avec effet de rotation et lueur */}
                        <div className="relative">
                          {/* Lueur derrière l'icône */}
                          <div 
                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500 group-hover:scale-125`}
                          />
                          
                          {/* Cercle de l'icône */}
                          <div 
                            className={`relative h-14 w-14 rounded-full bg-gradient-to-br ${stat.color}/20 backdrop-blur-sm border-2 border-${baseColor}-500/30 flex items-center justify-center 
                            transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:border-${baseColor}-500/50`}
                            style={{
                              boxShadow: `inset 0 4px 20px ${stat.glowColor}, 0 8px 20px -4px ${stat.glowColor}`,
                            }}
                          >
                            {/* Effet de brillance interne */}
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100`} />
                            
                            <stat.icon 
                              className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                              style={{
                                filter: `drop-shadow(0 2px 4px ${stat.glowColor})`,
                              }}
                            />
                          </div>
                          
                          {/* Points orbitaux */}
                          <div className="absolute -inset-2">
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className={`absolute h-1.5 w-1.5 rounded-full bg-${baseColor}-500 animate-orbit`}
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  animationDelay: `${i * 0.5}s`,
                                  animationDuration: '4s',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Effet de lumière au survol */}
                    <div 
                      className="absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{
                        background: `radial-gradient(circle, ${stat.glowColor} 0%, transparent 70%)`,
                      }}
                    />
                    
                    {/* Bordure inférieure animée */}
                    <div 
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="relative group">
        {/* Effets de lueur extérieure */}
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-primary/15 via-transparent to-emerald-500/10 blur-xl opacity-0 group-hover:opacity-50 transition-all duration-500" />
        
        {/* Conteneur principal */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-xl border border-border/40 hover:border-primary/30 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
          
          {/* Effets de fond animés */}
          <div className="absolute inset-0">
              {/* Grille supprimée */}
            
            {/* Points décoratifs */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute h-1 w-1 rounded-full bg-primary/20 animate-pulse`}
                style={{
                  left: `${10 + i * 10}%`,
                  top: `${20 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          
          {/* Bordures animées */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="p-6 space-y-6 relative z-10">
            {/* En-tête avec actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-blue-500 border border-primary/20 backdrop-blur-sm flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary/80" />
                    </div>
                    {/* Effet de lueur sur l'icône */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-transparent blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
                      <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                        Transactions
                      </span>
                      <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-yellow-500 text-white border border-yellow-600">
                        LIVE
                      </span>
                    </h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span>Historique complet des paiements et activités financières</span>
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Boutons d'actions */}
              <div className="flex items-center gap-3">
                {/* Menu d'export */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="gap-2 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary hover:text-primary group/export relative overflow-hidden"
                      style={{cursor: 'pointer'}}
                    >
                      <div className="relative z-10 flex items-center gap-2">
                        <Download className="h-4 w-4 group-hover/export:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Exporter</span>
                      </div>
                      {/* Effet de survol */}
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover/export:opacity-100 transition-opacity duration-300 -translate-x-full group-hover/export:translate-x-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white border-border/50 shadow-xl">
                    <DropdownMenuLabel className="font-semibold text-foreground/80">
                      Options d'export
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="group/item cursor-pointer"
                      onClick={() => exportToExcel(filteredTransactions, 'transactions_complete.xlsx')}
                      style={{cursor: 'pointer'}}
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="font-medium">Excel Complet</span>
                          <p className="text-xs text-muted-foreground">Toutes les colonnes</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-emerald-600 transition-colors" />
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="group/item cursor-pointer"
                      onClick={() => exportToExcel(filteredTransactions, 'transactions_simplified.xlsx', ['date', 'description', 'amount', 'status'])}
                      style={{cursor: 'pointer'}}
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="font-medium">Excel Simplifié</span>
                          <p className="text-xs text-muted-foreground">Colonnes essentielles</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-blue-600 transition-colors" />
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="group/item cursor-pointer"
                      onClick={() => exportTransactionsToCSV(filteredTransactions)}
                      style={{cursor: 'pointer'}}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <div>
                          <span className="font-medium">Format CSV</span>
                          <p className="text-xs text-muted-foreground">Compatible universel</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-purple-600 transition-colors" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 group/refresh"
                      onClick={() => loadTransactions(page)} 
                      disabled={loading}
                      style={{cursor: 'pointer'}}
                    >
                      <RefreshCw className={`h-4 w-4 group-hover/refresh:rotate-180 transition-all duration-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3" />
                      Actualiser les données
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Barre de recherche améliorée */}
            <div className="relative group/search">
              {/* Effets de fond de recherche */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover/search:opacity-30 blur-sm transition-opacity duration-500" />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/20 opacity-0 group-focus-within/search:opacity-30 blur-md transition-opacity duration-300" />
              
              <div className="relative">
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60 group-focus-within/search:text-primary transition-colors z-20" />
                
                {/* Effet de lueur sur l'icône */}
                <div className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-primary/10 blur-sm opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-300" />
                
                <Input
                  placeholder="Rechercher par ID, description, montant ou statut..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-14 rounded-xl border-2 border-primary/10 bg-white/5 backdrop-blur-sm 
                           focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:bg-white/10
                           transition-all duration-300 text-base
                           shadow-inner shadow-black/5"
                />
                
                {/* Indicateur de résultats */}
                {searchTerm && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      {filteredTransactions.length} résultat(s)
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtres et tri améliorés */}
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              {/* Filtres par statut */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Tabs 
                    value={filterStatus} 
                    onValueChange={setFilterStatus} 
                    className="w-full"
                  >
                    <TabsList className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <TabsTrigger 
                        value="all" 
                        className={`relative px-4 py-2 rounded-lg transition-all duration-300
                          ${filterStatus === 'all' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
                          style={{cursor: 'pointer'}}
                      >
                        <div className="flex items-center gap-2">
                          <span>Tous</span>
                          <Badge variant="outline" className="h-5 px-2 text-xs bg-blue-50 text-blue-600 border-blue-200">
                            {transactions.length}
                          </Badge>
                        </div>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="success" 
                        className={`relative px-4 py-2 rounded-lg transition-all duration-300
                          ${filterStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-600 hover:bg-gray-50'}`}
                          style={{cursor: 'pointer'}}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Réussi</span>
                        </div>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="pending" 
                        className={`relative px-4 py-2 rounded-lg transition-all duration-300
                          ${filterStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500' : 'text-gray-600 hover:bg-gray-50'}`}
                          style={{cursor: 'pointer'}}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>En attente</span>
                        </div>
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="failed" 
                        className={`relative px-4 py-2 rounded-lg transition-all duration-300
                          ${filterStatus === 'failed' ? 'bg-red-50 text-red-600 border-b-2 border-red-500' : 'text-gray-600 hover:bg-gray-50'}`}
                          style={{cursor: 'pointer'}}
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Échoué</span>
                        </div>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              
              {/* Tri et options */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <ArrowUpDown className="h-4 w-4 text-primary/80" />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px] bg-gradient-to-b from-background/50 to-background/30 backdrop-blur-sm border border-border/30 focus:border-primary/30" style={{cursor: 'pointer'}}>
                      <div className="flex items-center gap-2">
                        <span>Trier par :</span>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white border-border/50 shadow-xl" style={{cursor: 'pointer'}}>
                      <SelectItem value="date" className="cursor-pointer hover:bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>Date récente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="amount" className="cursor-pointer hover:bg-primary/5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                          <span>Montant élevé</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="status" className="cursor-pointer hover:bg-primary/5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                          <span>Statut</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bouton d'export rapide */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 group/quick-export"
                      onClick={() => exportToExcel(filteredTransactions, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)}
                      disabled={filteredTransactions.length === 0}
                      style={{cursor: 'pointer'}}
                    >
                      <FileSpreadsheet className="h-4 w-4 group-hover/quick-export:scale-110 transition-transform" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Export rapide Excel
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-0 relative">
          {loading ? (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary border-r-primary/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Chargement des transactions</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Récupération de vos données financières...
                  </p>
                </div>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 via-transparent to-primary/5">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
                <div className="relative bg-background rounded-xl p-4 border border-primary/20 backdrop-blur-sm">
                  <CreditCard className="h-10 w-10 text-primary/60 mx-auto" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                {searchTerm || filterStatus !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm 
                  ? 'Aucune transaction ne correspond à votre recherche.' 
                  : filterStatus !== 'all'
                  ? 'Aucune transaction ne correspond à ce filtre.'
                  : 'Les transactions apparaitront ici.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="relative">
                <TableHeader className="bg-gradient-to-r from-background via-background to-background/50 backdrop-blur-sm">
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="pl-6 py-4 text-sm font-semibold text-muted-foreground">Transaction</TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-muted-foreground">Description</TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-muted-foreground">Montant</TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-muted-foreground">Statut</TableHead>
                    <TableHead className="pr-6 py-4 text-sm font-semibold text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx, index) => {
                    const statusColors = getStatusColor(tx.status);
                    const amountColor = getAmountColor(tx.amount);
                    const amountIcon = getAmountIcon(tx.amount);
                    
                    return (
                      <TableRow 
                        key={tx.id} 
                        className={`group border-border/20 hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/2 hover:to-transparent transition-all duration-300 ${
                          index % 2 === 0 ? 'bg-background/50' : 'bg-background/30'
                        }`}
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${statusColors.bg} flex items-center justify-center`}>
                              {getStatusIcon(tx.status)}
                            </div>
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {tx.id.substring(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.type || 'Paiement'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{formatDate(tx.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">
                              {tx.description || "Paiement"}
                            </p>
                            {tx.reference && (
                              <p className="text-xs text-muted-foreground truncate">
                                Ref: {tx.reference}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {amountIcon}
                            <span className={`text-base font-bold ${amountColor}`}>
                              {formatCurrency(tx.amount, tx.currency)}
                            </span>
                            {Math.abs(tx.amount) > 10000 && (
                              <Sparkles className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                            variant="outline" 
                            className={`${statusColors.bg} ${statusColors.text} border ${statusColors.border} backdrop-blur-sm px-3 py-1`}
                          >
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(tx.status)}
                              <span className="text-xs font-medium">{tx.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-300 group/btn"
                              onClick={() => onViewDetails?.(tx.id)}
                            >
                              <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              <span className="hidden sm:inline">Détails</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-foreground/5">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 backdrop-blur-lg bg-white/95 border-border/50">
                                <DropdownMenuItem onClick={() => onViewDetails?.(tx.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger reçu
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Répéter
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Enhanced Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="p-6 border-t border-border/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Affichage de <span className="font-semibold text-foreground">{page * 10 + 1}</span> à{' '}
                <span className="font-semibold text-foreground">{Math.min((page + 1) * 10, totalElements)}</span>{' '}
                sur <span className="font-semibold text-foreground">{totalElements}</span> transactions
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0 || loading}
                  className="gap-1 h-9 px-3 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page <= 2) {
                      pageNum = i;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    if (pageNum >= 0 && pageNum < totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className={`h-9 w-9 rounded-xl ${page === pageNum ? 'bg-gradient-to-r from-primary to-primary/80' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="gap-1 h-9 px-3 rounded-xl"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}