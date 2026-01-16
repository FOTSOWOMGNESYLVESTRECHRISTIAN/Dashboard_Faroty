import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Search, 
  Wallet as WalletIcon, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  Plus,
  Filter,
  TrendingUp,
  Users,
  Shield,
  Globe,
  CreditCard,
  ArrowUpRight,
  MoreVertical,
  Eye,
  PauseCircle,
  Play,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  User,
  MapPin,
  Clock,
  Activity,
  Target,
  Award,
  Sparkles,
  Zap
} from "lucide-react";
import { getAccounts, createAccount, formatCurrency, formatDate, updateAccountStatus, deleteWallet } from "../services/paymentService";
import { Wallet } from "../types/payment";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface WalletsProps {
  onViewDetails?: (wallet: Wallet) => void;
}

export function Wallets({ onViewDetails: onViewDetailsProp }: WalletsProps = {}) {
  const navigate = useNavigate();
  
  // Gère la navigation vers les détails du portefeuille
  const handleViewDetails = (wallet: Wallet) => {
    if (onViewDetailsProp) {
      onViewDetailsProp(wallet);
    } else {
      // Redirection vers la page de détails du portefeuille
      navigate(`/wallets/${wallet.id}`);
    }
  };
  const [wallets, setWallets] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Create Wallet State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedWalletType, setSelectedWalletType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [currencyCode, setCurrencyCode] = useState<string>("XAF");
  const [legalIdentifier, setLegalIdentifier] = useState<string>("");

  // Calculate statistics
  const stats = {
    total: wallets.length,
    personal: wallets.filter(w => w.walletType === 'PERSONAL').length,
    business: wallets.filter(w => w.walletType === 'BUSINESS').length,
    totalBalance: wallets.reduce((sum, w) => sum + ((w as any).balance || 0), 0),
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Charger les comptes (utiliser comme portefeuilles pour le moment)
      const accountsData = await getAccounts();
      // Convertir les comptes en portefeuilles
      const walletsData = accountsData.map(account => ({
        ...account,
        legalIdentifier: account.accountName,
        walletType: account.accountMode,
        currency: { code: account.currency || 'XOF' },
        account: {
          accountName: account.accountName,
          accountMode: account.accountMode
        },
        status: account.status || 'ACTIVE'
      }));
      setWallets(walletsData);
      setAccounts(accountsData);
      setInitialLoad(false);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      if (initialLoad) {
        setError(null);
      } else {
        setError("Impossible de charger les données. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWallet = async () => {
    if (!selectedAccountId) {
      toast.error("Veuillez sélectionner un compte");
      return;
    }
    if (!legalIdentifier) {
      toast.error("Veuillez saisir un identifiant légal");
      return;
    }

    try {
      setIsCreating(true);
      const refId = crypto.randomUUID();
      await createAccount({
        accountName: legalIdentifier,
        accountMode: selectedWalletType,
        email: `${legalIdentifier.toLowerCase().replace(/\s+/g, '.')}@wallet.local`,
        country: 'CM',
        currency: currencyCode,
        callbackUrl: ''
      } as Account);
      toast.success("Portefeuille créé avec succès");
      setIsCreateOpen(false);
      loadData();
      // Reset form
      setSelectedAccountId("");
      setSelectedWalletType("PERSONAL");
      setCurrencyCode("XAF");
      setLegalIdentifier("");
    } catch (err: any) {
      console.error("Erreur création:", err);
      toast.error(err.message || "Erreur lors de la création du portefeuille");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredWallets = wallets.filter(wallet => {
    if (!wallet) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const hasLegalIdentifier = wallet.legalIdentifier && wallet.legalIdentifier.toLowerCase().includes(searchLower);
    const hasCurrencyCode = wallet.currency?.code && wallet.currency.code.toLowerCase().includes(searchLower);
    const hasAccountName = wallet.account?.accountName && wallet.account.accountName.toLowerCase().includes(searchLower);
    
    return (hasLegalIdentifier || hasCurrencyCode || hasAccountName) &&
           (activeFilter === 'all' || wallet.walletType?.toLowerCase() === activeFilter.toLowerCase());
  });

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case 'PERSONAL':
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 via-blue-400/10 to-blue-300/5',
          text: 'text-blue-600',
          border: 'border-blue-300/40',
          accent: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        };
      case 'BUSINESS':
        return {
          bg: 'bg-gradient-to-r from-purple-500/20 via-purple-400/10 to-purple-300/5',
          text: 'text-purple-600',
          border: 'border-purple-300/40',
          accent: 'bg-purple-500',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/20 via-gray-400/10 to-gray-300/5',
          text: 'text-gray-600',
          border: 'border-gray-300/40',
          accent: 'bg-gray-500',
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        };
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'XAF':
        return 'FCFA';
      case 'EUR':
        return '€';
      case 'USD':
        return '$';
      default:
        return currency;
    }
  };

  const getStatusBadge = (frozen: boolean) => {
    return frozen 
      ? <Badge variant="destructive" className="gap-1 px-2 py-1"><PauseCircle className="h-3 w-3" /> Suspendu</Badge>
      : <Badge variant="success" className="gap-1 px-2 py-1 bg-green-100"><Play className="h-3 w-3" /> Actif</Badge>;
  };

  if (loading && initialLoad) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary border-r-primary/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <WalletIcon className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground animate-pulse">Chargement des portefeuilles</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Préparation de votre espace financier...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent backdrop-blur-sm border border-destructive/20 p-8">
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
                onClick={loadData}
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
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-8">
  {/* Header avec titre */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Aperçu des Portefeuilles
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Statistiques en temps réel de vos portefeuilles
      </p>
    </div>
    <div className="flex items-center gap-2">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-xs font-medium text-emerald-600">Mis à jour à l'instant</span>
    </div>
  </div>

  {/* Stats Cards améliorées */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    {[
      { 
        label: 'Total des portefeuilles', 
        value: stats.total, 
        icon: WalletIcon, 
        color: 'from-primary via-primary/90 to-primary/70',
        glowColor: 'rgba(59, 130, 246, 0.3)',
        trend: '+12% ce mois',
        description: 'Tous les portefeuilles actifs'
      },
      { 
        label: 'Portefeuilles personnels', 
        value: stats.personal, 
        icon: User, 
        color: 'from-blue-500 via-blue-400 to-cyan-500',
        glowColor: 'rgba(59, 130, 246, 0.3)',
        trend: '+8% ce mois',
        description: 'Comptes individuels'
      },
      { 
        label: 'Portefeuilles business', 
        value: stats.business, 
        icon: Building2, 
        color: 'from-purple-500 via-purple-400 to-pink-500',
        glowColor: 'rgba(168, 85, 247, 0.3)',
        trend: '+15% ce mois',
        description: 'Comptes professionnels'
      },
      { 
        label: 'Balance totale', 
        value: formatCurrency(stats.totalBalance, 'XAF'), 
        icon: DollarSign, 
        color: 'from-emerald-500 via-emerald-400 to-green-500',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        trend: '+7% ce mois',
        description: 'Solde global'
      },
    ].map((stat, index) => {
      const baseColor = stat.color.split('-')[1];
      
      return (
        <div
          key={index}
          className="relative group cursor-pointer"
        >
          {/* Effet de lueur externe */}
          <div 
            className="absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: `linear-gradient(45deg, ${stat.glowColor}, transparent 70%)`,
            }}
          />
          
          {/* Effet de bordure animée */}
          <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-50 blur-sm transition-opacity duration-300 animate-pulse-slow"
               style={{ background: stat.color }} />
          
          {/* Carte principale */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/90 via-background/80 to-background/70 backdrop-blur-xl border border-${baseColor}-500/30 p-6 transition-all duration-300 
            group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-${baseColor}-500/20
            group-hover:border-${baseColor}-500/50`}
            style={{
              boxShadow: `0 10px 40px -10px ${stat.glowColor}`,
            }}
          >
            {/* Fond animé */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 80% 20%, ${stat.glowColor} 0%, transparent 50%)`,
              }}
            />
            
            {/* Effet de particules */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute h-1 w-1 rounded-full bg-${baseColor}-500/20 animate-float`}
                  style={{
                    left: `${20 + i * 40}%`,
                    top: `${30 + i * 20}%`,
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
                  {/* Label */}
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.color}/10 border border-${baseColor}-500/20 flex items-center justify-center`}>
                      <stat.icon className={`h-4 w-4 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                  
                  {/* Valeur principale avec effet 3D */}
                  <div className="relative">
                    <p 
                      className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent drop-shadow-lg`}
                      style={{
                        textShadow: `0 2px 8px ${stat.glowColor}`,
                      }}
                    >
                      {stat.value}
                    </p>
                    {/* Effet de profondeur */}
                    <div 
                      className={`absolute -inset-x-2 -inset-y-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-500`}
                    />
                  </div>
                  
                  {/* Description et tendance */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground/80">
                      {stat.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-12 rounded-full bg-gradient-to-r from-background/50 to-background/30 overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${stat.color} animate-progress`}
                          style={{ width: '75%' }}
                        />
                      </div>
                      <span className={`text-xs font-medium text-${baseColor}-600 bg-gradient-to-r from-${baseColor}-500/10 to-transparent px-2 py-0.5 rounded-full`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Icône avec effet de rotation */}
                <div className="relative">
                  {/* Lueur derrière l'icône */}
                  <div 
                    className={`absolute -inset-2 rounded-full bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500`}
                  />
                  
                  {/* Cercle de l'icône */}
                  <div 
                    className={`relative h-14 w-14 rounded-full bg-gradient-to-br ${stat.color}/20 backdrop-blur-sm border-2 border-${baseColor}-500/30 flex items-center justify-center 
                    transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`}
                    style={{
                      boxShadow: `inset 0 4px 20px ${stat.glowColor}`,
                    }}
                  >
                    {/* Effet de brillance interne */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <stat.icon 
                      className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      style={{
                        filter: `drop-shadow(0 2px 4px ${stat.glowColor})`,
                      }}
                    />
                  </div>
                  
                  {/* Points orbitaux */}
                  <div className="absolute -inset-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute h-1.5 w-1.5 rounded-full bg-${baseColor}-500/50 animate-orbit`}
                        style={{
                          left: '50%',
                          top: '50%',
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '3s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Effet de lumière au survol */}
            <div 
              className="absolute -top-8 -right-8 h-16 w-16 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-700"
              style={{
                background: `radial-gradient(circle, ${stat.glowColor} 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
            
            {/* Bordure inférieure animée */}
            <div 
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
            />
          </div>
        </div>
      );
    })}
  </div>

  {/* Légende et info-bulle */}
  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/30">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>Croissance positive</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <span>En progression</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Sparkles className="h-3 w-3 text-primary/60" />
      <span>Données mises à jour en temps réel</span>
    </div>
  </div>
</div>

      {/* Search and Filters */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm border border-border/50 p-6 mb-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Gestion des Portefeuilles
            </h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos portefeuilles et surveillez vos soldes en temps réel
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="gap-2 bg-primary hover:bg-primary/90 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                style={{cursor: 'pointer'}}
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Nouveau portefeuille</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95%] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Créer un nouveau portefeuille
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Ajoutez un portefeuille à un compte existant pour gérer vos finances.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="account" className="text-sm font-medium text-foreground">Compte</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-full" style={{cursor: 'pointer'}}>
                      <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                            {account.accountMode === 'BUSINESS' ? (
                              <Building2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-purple-500" />
                            )}
                            <span>{account.accountName}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {account.accountMode === 'BUSINESS' ? 'Business' : 'Personnel'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-sm font-medium text-foreground">Type de portefeuille</Label>
                  <Select
                    value={selectedWalletType}
                    onValueChange={(val: "PERSONAL" | "BUSINESS") => setSelectedWalletType(val)}
                  >
                    <SelectTrigger className="w-full" style={{cursor: 'pointer'}}>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">
                        <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                          <User className="h-4 w-4 text-blue-500" />
                          Personnel
                        </div>
                      </SelectItem>
                      <SelectItem value="BUSINESS">
                        <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                          <Building2 className="h-4 w-4 text-purple-500" />
                          Business
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="currency" className="text-sm font-medium">Devise</Label>
                  <Select
                    value={currencyCode}
                    onValueChange={setCurrencyCode}
                  >
                    <SelectTrigger className="w-full" style={{cursor: 'pointer'}}>
                      <SelectValue placeholder="Sélectionner la devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XAF">
                        <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                          <Globe className="h-4 w-4 text-emerald-500" />
                          XAF (CFA)
                        </div>
                      </SelectItem>
                      <SelectItem value="EUR">
                        <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          EUR (Euro)
                        </div>
                      </SelectItem>
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2" style={{cursor: 'pointer'}}>
                          <DollarSign className="h-4 w-4 text-green-500" />
                          USD (Dollar)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="legalIdentifier" className="text-sm font-medium">Identifiant Légal</Label>
                  <Input
                    id="legalIdentifier"
                    placeholder="Ex: CNI ou Numéro Fiscal"
                    value={legalIdentifier}
                    onChange={(e) => setLegalIdentifier(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} style={{cursor: 'pointer'}}>
                  Annuler
                </Button>
                <Button onClick={handleCreateWallet} disabled={isCreating} className="gap-2" style={{cursor: 'pointer'}}>
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer le portefeuille
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-lg blur-xl opacity-50 -z-10" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/80 pointer-events-none" />
              <Input
                placeholder="Rechercher un portefeuille par nom, devise ou identifiant..."
                className="pl-10 pr-4 h-12 w-full rounded-xl border border-border/30 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)} className="w-full">
                <TabsList className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <TabsTrigger 
                    value="all" 
                    className={`relative px-4 py-2 rounded-lg transition-all duration-300
                      ${activeFilter === 'all' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="flex items-center gap-2">
                      <span>Tous</span>
                      <Badge variant="outline" className="h-5 px-2 text-xs bg-blue-50 text-blue-600 border-blue-200">
                        {wallets.length}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="personal" 
                    className={`relative px-4 py-2 rounded-lg transition-all duration-300
                      ${activeFilter === 'personal' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>Personnel</span>
                      <Badge variant="outline" className="h-5 px-2 text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
                        {stats.personal}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="business" 
                    className={`relative px-4 py-2 rounded-lg transition-all duration-300
                      ${activeFilter === 'business' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Business</span>
                      <Badge variant="outline" className="h-5 px-2 text-xs bg-purple-50 text-purple-600 border-purple-200">
                        {stats.business}
                      </Badge>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>&nbsp;

      {/* Wallets Grid */}
      <div className="mt-8">
      {filteredWallets.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 via-transparent to-primary/5">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
            <div className="relative bg-background rounded-full p-6 border border-primary/20 backdrop-blur-sm">
              <WalletIcon className="h-12 w-12 text-primary/60 mx-auto" />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            {searchTerm || activeFilter !== 'all' ? 'Aucun résultat trouvé' : 'Bienvenue sur votre espace financier'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {searchTerm 
              ? 'Aucun portefeuille ne correspond à votre recherche. Essayez d\'autres termes.' 
              : activeFilter !== 'all'
              ? 'Aucun portefeuille ne correspond à ce filtre.'
              : 'Créez votre premier portefeuille et commencez à gérer vos finances en toute simplicité.'}
          </p>
          <Button 
            className="mt-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            onClick={() => setIsCreateOpen(true)}
            style={{cursor: 'pointer'}}
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> 
            Créer un portefeuille
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWallets
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((wallet) => {
                const typeColors = getWalletTypeColor(wallet.walletType);
                const currencyIcon = getCurrencyIcon(wallet.currency.code);
                const isHovered = selectedWallet === wallet.id;

                return (
                  <div
                    key={wallet.id}
                    className="relative group"
                    onMouseEnter={() => setSelectedWallet(wallet.id)}
                    onMouseLeave={() => setSelectedWallet(null)}
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute -inset-0.5 rounded-2xl ${typeColors.bg} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                    
                    {/* Main Card */}
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${typeColors.gradient} backdrop-blur-sm border border-border/30 hover:border-primary/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}>
                      
                      {/* Header with gradient */}
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${typeColors.accent === 'bg-blue-500' ? 'from-blue-500 via-cyan-500 to-blue-500' : 
                        typeColors.accent === 'bg-purple-500' ? 'from-purple-500 via-pink-500 to-purple-500' : 
                        'from-primary via-primary/80 to-primary'}`} />
                      
                      <CardHeader className="pb-4 pt-6">
                        <div className="flex items-start justify-between gap-3">
                          {/* Wallet Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-3.5 w-3.5" />
                              <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {wallet.account.accountName}
                              </h3>
                              {getStatusBadge(wallet.frozen)}
                            </div>
                            {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-3.5 w-3.5" />
                              <span className="truncate">{wallet.legalIdentifier || 'Aucun identifiant'}</span>
                            </div> */}
                          </div>
                          
                          {/* Quick actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-foreground/5 backdrop-blur-sm"
                                style={{cursor: 'pointer'}}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 backdrop-blur-lg bg-white border-border/50">
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(wallet)} 
                                style={{cursor: 'pointer'}}
                                className="focus:bg-primary/10"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem style={{cursor: 'pointer'}}>
                                <Activity className="mr-2 h-4 w-4" />
                                Activité
                              </DropdownMenuItem> */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={async () => {
                                  const handleStatusChange = async (walletId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
                                    try {
                                      await updateAccountStatus(walletId, newStatus);
                                      setWallets(prevWallets =>
                                        prevWallets.map(wallet =>
                                          wallet.id === walletId 
                                            ? { ...wallet, status: newStatus } 
                                            : wallet
                                        )
                                      );
                                      toast.success(`Portefeuille ${newStatus === 'ACTIVE' ? 'activé' : 'suspendu'} avec succès`);
                                    } catch (err) {
                                      console.error("Erreur lors de la mise à jour du statut:", err);
                                      toast.error("Erreur lors de la mise à jour du statut du portefeuille");
                                    }
                                  };
                                  const newStatus = wallet.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                  await handleStatusChange(wallet.id, newStatus);
                                }}
                                style={{cursor: 'pointer'}}
                              >
                                {wallet.status === 'SUSPENDED' ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4 text-emerald-600" />
                                    Activer
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="mr-2 h-4 w-4 text-amber-500" />
                                    Suspendre
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer ce portefeuille ?")) {
                                    deleteWallet(wallet.id)
                                      .then(() => {
                                        toast.success("Portefeuille supprimé");
                                        setWallets(prev => prev.filter(w => w.id !== wallet.id));
                                      })
                                      .catch(() => toast.error("Erreur lors de la suppression"));
                                  }
                                }}
                                style={{cursor: 'pointer'}}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pb-6">
                        {/* Balance Card */}
                        <div className="relative overflow-hidden p-4 bg-white hover:bg-white rounded-xl border border-border/30">
                          <div className="absolute inset-0 bg-gray-100 hover:bg-gray-100 opacity-2 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          <div className="relative z-10">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Solde disponible</p>
                            <div className="flex items-end justify-between">
                              <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {formatCurrency(wallet.balance || 0, wallet.currency?.code || 'XOF')}
                              </p>
                              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white backdrop-blur-sm border border-primary text-primary">
                                <span className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                  {currencyIcon}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Mis à jour à {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-gray-100 backdrop-blur-sm rounded-lg border border-border/20">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1.5 p-2">
                              <Globe className="h-4 w-4" />
                              <span className="text-xs font-medium">Devise</span>
                            </div>
                            <p className="text-sm font-semibold">
                              {wallet.currency.code}
                              <span className="font-normal text-muted-foreground ml-1">({wallet.currency.nameFr})</span>
                            </p>
                          </div>

                          <div className="p-4 bg-gray-100 backdrop-blur-sm rounded-lg border border-border/20">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1.5 p-2">
                              {wallet.walletType === 'PERSONAL' ? (
                                <User className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Building2 className="h-4 w-4 text-purple-500" />
                              )}
                              <span className="text-xs font-medium">Type</span>
                            </div>
                            <Badge variant="outline" className={typeColors.badge}>
                              {wallet.walletType === 'PERSONAL' ? 'Personnel' : 'Business'}
                            </Badge>
                          </div>
                        </div>

                        {/* Creation Date */}
                        <div className="p-4 bg-gray-100 backdrop-blur-sm rounded-lg border border-border/20">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1.5 p-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-medium">Créé le</span>
                          </div>
                          <div className="flex items-center text-sm font-medium">
                            {formatDate(wallet.createdAt)}
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Separator className="my-4" />
                        <Button
                          variant="outline"
                          className="w-full gap-2 bg-blue-100 hover:bg-blue-200 hover:text-primary hover:border-primary/30 transition-all duration-300 group/btn relative overflow-hidden"
                          onClick={() => handleViewDetails(wallet)}
                          style={{cursor: 'pointer'}}
                        >
                          <div className="relative z-10 flex items-center justify-center w-full gap-2">
                            <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            <span className="ml-2 font-medium">Voir les détails</span>
                            <ArrowUpRight className="ml-2 h-4 w-4 transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                          </div>
                          <span className="absolute inset-0 bg-blue-100 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 -translate-x-full group-hover/btn:translate-x-0"></span>
                        </Button>
                      </CardContent>
                    </div>

                    {/* Premium badge for high balance */}
                    {(wallet.balance || 0) > 50000 && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="relative">
                          <div className="bg-amber-500 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                            <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                            PREMIUM
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          
          {/* Pagination */}
          {filteredWallets.length > itemsPerPage && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-sm border border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, filteredWallets.length)}</span>{' '}
                  sur <span className="font-semibold text-foreground">{filteredWallets.length}</span> portefeuilles
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="gap-1 h-9 px-3 rounded-xl"
                    style={{cursor: 'pointer'}}
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(filteredWallets.length / itemsPerPage) }, (_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        className={`h-9 w-9 rounded-xl ${currentPage === i + 1 ? 'bg-gradient-to-r from-primary to-primary/80' : ''}`}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{cursor: 'pointer'}}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredWallets.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredWallets.length / itemsPerPage)}
                    className="gap-1 h-9 px-3 rounded-xl"
                    style={{cursor: 'pointer'}}
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
      </div>
    </div>
  );
}