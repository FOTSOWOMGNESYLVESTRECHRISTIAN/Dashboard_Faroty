// src/components/WalletDetails.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import {
  ArrowLeft, AlertCircle, Loader2, Wallet as WalletIcon,
  RefreshCw, User, Globe, CreditCard, Clock, Activity,
  Percent, AlertTriangle, Info, Users, FileText, Shield,
  BarChart2, Settings, CreditCard as CreditCardIcon, Coins,
  PlusCircle, Download, Upload, Send
} from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { formatCurrency, formatDate as formatDateUtil, getStatusBadgeVariant, getAccounts, getCountries } from "../services/paymentService";
import { userService } from "../services/userService";
import { Wallet as WalletType, Account, WalletOwner, Currency, Country, Balance } from "../types/payment";

// Alias pour le type Wallet pour éviter les conflits
type AccountWallet = WalletType & {
  walletOwners: WalletOwner[];
  transactionsCount: number;
  webhooksCount: number;
  suspiciousActivitiesCount: number;
  currency: Currency & { active: boolean };
  account: Account;
};

interface WalletDetailsProps {
  walletId: string;
  onBack: () => void;
}

// État pour gérer la modale d'opération
interface OperationModalState {
  isOpen: boolean;
  type: 'deposit' | 'withdraw' | 'send' | null;
  amount: string;
  recipientId?: string;
  description: string;
  isProcessing: boolean;
}

export function WalletDetails({ walletId, onBack }: WalletDetailsProps) {
  // Tous les états doivent être déclarés au début du composant
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<AccountWallet[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Déclaration UNIQUE de operationModal - CORRIGÉ ICI
  const [operationModal, setOperationModal] = useState<OperationModalState>({
    isOpen: false,
    type: null,
    amount: '',
    description: '',
    recipientId: '',
    isProcessing: false
  });

  // Charger les détails du portefeuille
  // Charger les détails du portefeuille
  const loadWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les comptes et les pays en parallèle
      const [accountsData, countriesData] = await Promise.all([
        getAccounts(),
        getCountries()
      ]);

      const accountData = accountsData.find(account => account.id === walletId);

      if (!accountData) {
        throw new Error('Portefeuille non trouvé');
      }

      // Trouver les détails du pays
      // Note: accountData.country est un code string (ex: "CM")
      const countryCode = typeof accountData.country === 'string' ? accountData.country : (accountData.country as any)?.code;
      const countryDetails = countriesData.find(c => c.code === countryCode) || {
        id: 'cm',
        code: countryCode || 'CM',
        nameFr: 'Cameroun',
        nameEn: 'Cameroon',
        currency: 'XAF',
        active: true,
        maxPaymentAmount: 0,
        paymentValidationTime: 0,
        minTransactionFeeRate: 0,
        isUserPaysFees: false,
        maxWithdrawalAmount: 0,
        withdrawalValidationThreshold: 0,
        isAutoValidateWithdrawals: false,
        withdrawalValidationTime: 0,
        withdrawalCooldown: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accountsCount: 0,
        paymentMethodsCount: 0
      } as unknown as Country;

      // Construction de l'objet Wallet selon le type AccountWallet
      const walletObj: any = {
        ...accountData,
        id: accountData.id,
        legalIdentifier: accountData.accountName,
        walletType: accountData.accountMode,
        walletOwners: [],
        transactionsCount: 0,
        webhooksCount: 0,
        suspiciousActivitiesCount: 0,
        frozen: accountData.status !== 'ACTIVE',

        // Structure imbriquée requise par l'interface
        account: {
          ...accountData,
          country: countryDetails
        },

        // Structure de balance
        balance: {
          id: 'bal_' + accountData.id,
          balance: (accountData as any).totalBalance || 0,
          totalBalance: (accountData as any).totalBalance || 0,
          frozenBalance: 0,
          pendingBalance: 0,
          createdAt: accountData.createdAt,
          updatedAt: accountData.updatedAt
        },

        // Structure de devise
        currency: {
          code: accountData.currency || 'XOF',
          nameFr: accountData.currency === 'EUR' ? 'Euro' : 'Franc CFA',
          symbol: accountData.currency === 'EUR' ? '€' : 'FCFA',
          active: true
        }
      };

      setWallet(walletObj);
    } catch (err) {
      console.error('Erreur lors du chargement du portefeuille:', err);
      setError('Impossible de charger les détails du portefeuille');
      toast.error('Erreur lors du chargement du portefeuille');
    } finally {
      setLoading(false);
    }
  };

  // Charger les comptes associés au portefeuille
  const loadAccounts = async () => {
    if (!wallet?.account?.id) return;

    try {
      setIsLoadingAccounts(true);
      // TODO: Implémenter getWalletsByAccount ou utiliser une autre méthode
      // const accountsData = await getWalletsByAccount(wallet.account.id);
      // setAccounts(accountsData as AccountWallet[]);
      setAccounts([]); // Temporaire pour éviter l'erreur
    } catch (err) {
      console.error('Erreur lors du chargement des comptes:', err);
      toast.error('Erreur lors du chargement des comptes associés');
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Charger les noms des utilisateurs
  const loadUserNames = async () => {
    if (!wallet?.walletOwners?.length) return;

    try {
      // Récupérer d'abord tous les utilisateurs
      const allUsers = await userService.getAllUsers();
      // Créer un objet avec les noms des utilisateurs
      const names: Record<string, string> = {};

      wallet.walletOwners.forEach(owner => {
        const user = allUsers.find(u => u.id === owner.userId);
        if (user) {
          names[owner.userId] = `${user.firstName} ${user.lastName}`;
        }
      });

      setUserNames(names);
    } catch (err) {
      console.error('Erreur lors du chargement des noms des utilisateurs:', err);
    }
  };

  // Charger les détails du portefeuille au montage
  useEffect(() => {
    loadWallet();
  }, [walletId]);

  // Charger les comptes et noms utilisateurs lorsque le portefeuille est chargé
  useEffect(() => {
    if (wallet) {
      loadAccounts();
      loadUserNames();
    }
  }, [wallet?.account?.id, wallet?.walletOwners]);

  // Fonction pour ouvrir la modale d'opération
  const openOperationModal = (type: 'deposit' | 'withdraw' | 'send') => {
    setOperationModal({
      ...operationModal,
      isOpen: true,
      type,
      amount: '',
      description: '',
      recipientId: ''
    });
  };

  // Fonction pour fermer la modale
  const closeOperationModal = () => {
    setOperationModal({
      ...operationModal,
      isOpen: false,
      type: null,
      isProcessing: false
    });
  };

  // Gestion du changement des champs du formulaire
  const handleOperationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOperationModal({
      ...operationModal,
      [name]: value
    });
  };

  // Soumission du formulaire d'opération
  const handleOperationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!operationModal.amount || isNaN(Number(operationModal.amount)) || Number(operationModal.amount) <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    if (operationModal.type === 'send' && !operationModal.recipientId) {
      toast.error('Veuillez sélectionner un destinataire');
      return;
    }

    try {
      setOperationModal(prev => ({ ...prev, isProcessing: true }));

      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Ici, vous devrez appeler votre API réelle pour effectuer l'opération
      // Par exemple :
      // await paymentService.processTransaction({
      //   walletId: wallet?.id,
      //   type: operationModal.type,
      //   amount: Number(operationModal.amount),
      //   description: operationModal.description,
      //   recipientId: operationModal.recipientId
      // });

      toast.success(`Opération de ${getOperationLabel(operationModal.type)} effectuée avec succès`);
      closeOperationModal();
      refreshWallet(); // Rafraîchir les données du portefeuille
    } catch (err) {
      const error = err as Error;
      console.error('Erreur lors de l\'opération:', error);
      toast.error(`Erreur lors de l'opération: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setOperationModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Obtenir le libellé de l'opération
  const getOperationLabel = (type: string | null) => {
    switch (type) {
      case 'deposit': return 'dépôt';
      case 'withdraw': return 'retrait';
      case 'send': return 'envoi';
      default: return 'opération';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString);
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'BUSINESS': return 'Entreprise';
      case 'PERSONAL': return 'Personnel';
      default: return type;
    }
  };

  const getAccountModeLabel = (mode: string) => {
    switch (mode) {
      case 'SANDBOX': return 'Mode Test';
      case 'LIVE': return 'Mode Production';
      default: return mode;
    }
  };

  const refreshWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadWalletDetails();
      await loadAccounts();
      toast.success('Portefeuille actualisé avec succès');
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError('Impossible de rafraîchir les données du portefeuille');
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement du portefeuille...</span>
      </div>
    );
  }

  // Afficher un message d'erreur
  if (error || !wallet) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-6">{error || 'Impossible de charger les détails du portefeuille'}</p>
        <Button onClick={onBack} variant="outline" style={{ cursor: 'pointer' }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl"
    >
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="group transition-all duration-300 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 font-medium rounded-lg"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Retour aux portefeuilles
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWallet}
            disabled={loading}
            className="transition-all duration-300 bg-purple-500 hover:bg-purple-600 hover:text-purple-700 border-purple-200 text-purple-600 font-medium rounded-lg"
            style={{ cursor: 'pointer' }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              style={{ cursor: 'pointer' }}
              onClick={() => openOperationModal('deposit')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle opération
            </Button>

            {/* <Button 
              variant="outline" 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
              style={{ cursor: 'pointer' }}
              onClick={() => openOperationModal('deposit')}
            >
              <Download className="h-4 w-4 mr-2" />
              Déposer
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
              style={{ cursor: 'pointer' }}
              onClick={() => openOperationModal('withdraw')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Retirer
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
              style={{ cursor: 'pointer' }}
              onClick={() => openOperationModal('send')}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button> */}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-100 shadow-md transition-all duration-300 hover:shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                    <WalletIcon className="h-6 w-6 text-muted-foreground drop-shadow-sm" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-muted-foreground drop-shadow-sm">
                      {wallet.account.accountName}
                    </CardTitle>
                    {wallet.account.accountSubName && (
                      <CardDescription className="text-indigo-100/90 font-medium drop-shadow-sm">
                        {wallet.account.accountSubName}
                      </CardDescription>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full font-medium backdrop-blur-sm border
                      ${wallet.frozen
                        ? 'bg-red-100/80 text-red-700 border-red-300 hover:bg-red-200/80'
                        : 'bg-green-600 text-green-700 border-green-300 hover:bg-green-600'
                      }
                    `}
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${wallet.frozen ? 'bg-red-500' : 'bg-green-500'
                        }`}
                    />
                    <span className="text-sm">
                      {wallet.frozen
                        ? `Inactif${wallet.frozenReason ? ` (${wallet.frozenReason})` : ''}`
                        : 'Actif'}
                    </span>
                  </Badge>


                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-blue-500 hover:bg-blue-600 border-white/20 text-white"
                  >
                    <Shield className="h-3.5 w-3.5 text-indigo-200" />
                    <span className="text-sm">{getWalletTypeLabel(wallet.walletType)}</span>
                  </Badge>

                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-yellow-500 hover:bg-yellow-600 border-white/20 text-white"
                  >
                    <Globe className="h-3.5 w-3.5 text-indigo-200" />
                    <span className="text-sm">{wallet.account.country.nameFr} ({wallet.account.country.code})</span>
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-900 font-medium">Solde total</p>
                  <p className="text-3xl font-bold text-muted-foreground drop-shadow-sm">
                    {formatCurrency(wallet.balance.totalBalance, wallet.currency.code)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openOperationModal('deposit')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Déposer
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openOperationModal('withdraw')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Retirer
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 border-white/20 text-white hover:text-white/90 rounded-lg transition-all duration-200"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openOperationModal('send')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>

            <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (wallet.balance.balance / wallet.balance.totalBalance) * 100)}%`
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6"
              >
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/30">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
              <TabsTrigger value="overview" className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <BarChart2 className="h-4 w-4" />
                Aperçu
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <CreditCardIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <Settings className="h-4 w-4" />
                Paramètres
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Informations générales */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                      <Info className="h-5 w-5 text-primary" />
                      Informations générales
                    </h3>
                    <Badge variant="outline" className="px-2 py-0.5 text-xs text-white bg-purple-600 hover:bg-purple-700 border-white/20">
                      {wallet.account.accountMode === 'LIVE' ? 'Production' : 'Test'}
                    </Badge>
                  </div>

                  <div className="space-y-3 p-4 bg-muted/20 dark:bg-muted/10 rounded-lg border">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Type de portefeuille</span>
                      <span className="text-sm font-medium">
                        {getWalletTypeLabel(wallet.walletType)}
                      </span>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Identifiant légal</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {wallet.legalIdentifier || 'Non défini'}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="sr-only">Copier</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Référence</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{wallet.refName || 'Aucune référence'}</div>
                          {wallet.refId && (
                            <div className="text-xs text-muted-foreground font-mono">{wallet.refId}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-muted-foreground">Date de création</span>
                        <span className="font-medium">
                          {formatDate(wallet.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-muted-foreground">Dernière mise à jour</span>
                        <span className="font-medium">
                          {formatDate(wallet.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Propriétaires */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2 text-foreground">
                      <Users className="h-5 w-5 text-primary" />
                      Propriétaires
                    </h4>
                    <div className="space-y-2">
                      {wallet.walletOwners.length > 0 ? (
                        wallet.walletOwners.map((owner, index) => (
                          <motion.div
                            key={owner.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center p-3 bg-background rounded-lg border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 p-4">
                              <div className="p-2 rounded-full bg-primary/10">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {userNames[owner.userId] || 'Chargement...'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {owner.type === 'LEGAL_OWNER' ? 'Propriétaire légal' : 'Propriétaire'}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(owner.createdAt)}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center p-4 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                          Aucun propriétaire enregistré
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Soldes et activités */}
                <div className="space-y-6">
                  {/* Carte de solde détaillé */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                      <Coins className="h-5 w-5 text-primary" />
                      Détails du solde
                    </h3>

                    <div className="grid gap-3">
                      {/* Carte de solde total */}
                      <motion.div
                        initial={{ scale: 0.98, opacity: 0.9 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Solde total</p>
                            <p className="text-2xl font-bold mt-1">
                              {formatCurrency(wallet.balance.totalBalance, wallet.currency.code)}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <WalletIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Disponible</span>
                            <span className="font-medium">
                              {formatCurrency(wallet.balance.balance, wallet.currency.code)}
                            </span>
                          </div>

                          <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary/80 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(100, (wallet.balance.balance / wallet.balance.totalBalance) * 100)}%`
                              }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </motion.div>

                      {/* Cartes de statut */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          whileHover={{ y: -2 }}
                          className="p-4 bg-background rounded-lg border hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Gelé</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(wallet.balance.frozenBalance, wallet.currency.code)}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                              <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ y: -2 }}
                          className="p-4 bg-background rounded-lg border hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">En attente</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(wallet.balance.pendingBalance, wallet.currency.code)}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Frais et limites */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
                      <Percent className="h-5 w-5 text-primary" />
                      Frais et limites
                    </h3>

                    <div className="grid gap-3 md:grid-cols-2">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-4 bg-background rounded-lg border hover:shadow-sm transition-all"
                      >
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Percent className="h-4 w-4 text-primary" />
                          Frais appliqués
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Dépôt</span>
                            <span className="text-sm font-medium">
                              {wallet.depositFeeRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Retrait</span>
                            <span className="text-sm font-medium">
                              {wallet.withdrawalFeeRate}%
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-4 bg-background rounded-lg border hover:shadow-sm transition-all"
                      >
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-foreground bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Limites
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Transaction max</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(wallet.maxTransactionAmount, wallet.currency.code)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Pays</span>
                            <div className="text-right">
                              <div className="text-sm font-medium">{wallet.account.country.nameFr}</div>
                              <div className="text-xs text-muted-foreground">
                                Max: {formatCurrency(wallet.account.country.maxPaymentAmount, wallet.currency.code)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <CreditCardIcon className="h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg font-medium">Aucune transaction récente</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Les transactions effectuées avec ce portefeuille apparaîtront ici.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres du portefeuille</CardTitle>
                  <CardDescription>
                    Gérez les paramètres et les préférences de ce portefeuille.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Statut du portefeuille</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Portefeuille {wallet.frozen ? 'désactivé' : 'activé'}</p>
                        <p className="text-sm text-muted-foreground">
                          {wallet.frozen
                            ? 'Ce portefeuille est actuellement désactivé.'
                            : 'Ce portefeuille est actif et peut effectuer des transactions.'}
                        </p>
                        {wallet.frozenReason && (
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            Raison: {wallet.frozenReason}
                          </p>
                        )}
                      </div>
                      <Button variant={wallet.frozen ? 'default' : 'outline'} size="sm" style={{ cursor: 'pointer' }}>
                        {wallet.frozen ? 'Activer' : 'Désactiver'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Notifications par email</p>
                          <p className="text-sm text-muted-foreground">
                            Recevoir des notifications par email pour les transactions importantes
                          </p>
                        </div>
                        <div className="h-6 w-10 rounded-full bg-primary/10 flex items-center justify-end p-0.5">
                          <div className="h-5 w-5 rounded-full bg-primary"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Comptes associés */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                Comptes associés
              </h3>
              <Button variant="outline" size="sm" onClick={loadAccounts} disabled={isLoadingAccounts} style={{ cursor: 'pointer' }}>
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {isLoadingAccounts ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-9 w-full mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : accounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {account.account.accountName}
                            </CardTitle>
                            {account.account.accountSubName && (
                              <CardDescription className="text-sm">
                                {account.account.accountSubName}
                              </CardDescription>
                            )}
                          </div>
                          <Badge
                            variant={account.frozen ? "destructive" : "secondary"}
                            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs"
                          >
                            <div className={`h-2 w-2 rounded-full ${account.frozen ? 'bg-destructive' : 'bg-emerald-500'}`} />
                            {account.frozen ? 'Inactif' : 'Actif'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Solde disponible</span>
                            <span className="font-medium text-sm">
                              {formatCurrency(account.balance.balance, account.currency.code)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Type</span>
                            <span className="text-sm">
                              {getWalletTypeLabel(account.walletType)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Créé le</span>
                            <span className="text-sm">
                              {formatDate(account.createdAt)}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="group-hover:translate-x-1 transition-transform">
                            Voir les détails
                          </span>
                          <ArrowLeft className="ml-2 h-3.5 w-3.5 -rotate-180 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 border-2 border-dashed rounded-lg bg-muted/20"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                  <WalletIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium mb-1">Aucun compte associé</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Aucun autre compte n'est associé à ce portefeuille pour le moment.
                </p>
              </motion.div>
            )}
          </div>

          {/* Activité */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activité
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Transactions</div>
                <div className="text-2xl font-bold">{wallet.transactionsCount}</div>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Webhooks</div>
                <div className="text-2xl font-bold">{wallet.webhooksCount}</div>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="text-sm text-muted-foreground">Activités suspectes</div>
                <div className="text-2xl font-bold">{wallet.suspiciousActivitiesCount}</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Dernière activité</div>
                  <div className="font-medium">{formatDate(wallet.updatedAt)}</div>
                </div>
                <Button variant="outline" size="sm" onClick={refreshWallet} disabled={loading} style={{ cursor: 'pointer' }}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Avertissements */}
          {wallet.frozen && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">Portefeuille gelé</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Ce portefeuille a été gelé {wallet.frozenReason ? `pour la raison suivante : ${wallet.frozenReason}` : 'sans raison spécifiée'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale d'opération */}
      <Dialog open={operationModal.isOpen} onOpenChange={closeOperationModal}>
        <DialogContent className="w-full max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleOperationSubmit} className="space-y-6 p-1">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-base text-center">
                {operationModal.type === 'deposit' && 'Effectuer un dépôt'}
                {operationModal.type === 'withdraw' && 'Effectuer un retrait'}
                {operationModal.type === 'send' && 'Envoyer de l\'argent'}
              </DialogTitle>
              <DialogDescription className="text-xs text-center">
                {operationModal.type === 'deposit' && 'Ajoutez des fonds à votre portefeuille.'}
                {operationModal.type === 'withdraw' && 'Retirez des fonds de votre portefeuille.'}
                {operationModal.type === 'send' && 'Envoyez de l\'argent à un autre utilisateur.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Champ montant */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Montant ({wallet.currency.code})</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={operationModal.amount}
                  onChange={handleOperationChange}
                  placeholder="0.00"
                  required
                  className="h-10 text-base font-normal focus:placeholder:text-primary/50 focus:placeholder:font-normal 
                  border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary 
                  focus:border-primary focus:shadow-outline focus:shadow-primary/20 focus:placeholder:text-primary/50 
                  focus:placeholder:font-normal"
                />
              </div>

              {/* Champ destinataire (uniquement pour l'envoi) */}
              {operationModal.type === 'send' && (
                <div className="space-y-0.5 text-xs">
                  <Label htmlFor="recipient" className="text-xs">Destinataire</Label>
                  <Select
                    name="recipientId"
                    value={operationModal.recipientId}
                    onValueChange={(value) =>
                      setOperationModal({ ...operationModal, recipientId: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-7 text-xs font-normal focus:placeholder:text-primary/50 focus:placeholder:font-normal border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:shadow-outline focus:shadow-primary/20 focus:placeholder:text-primary/50 focus:placeholder:font-normal"
                      style={{ cursor: 'pointer' }}
                    >
                      <SelectValue placeholder="Sélectionnez un destinataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(acc => acc.id !== wallet.id)
                        .map(account => (
                          <SelectItem key={account.id} value={account.id} className="text-sm">
                            {account.account.accountName} - {account.currency.code}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Champ description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={operationModal.description}
                  onChange={handleOperationChange}
                  placeholder="Ajoutez une description pour cette opération"
                  rows={3}
                  className="text-base min-h-[100px] max-h-[140px] resize-none overflow-y-auto border 
                  border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary 
                  focus:border-primary focus:shadow-outline focus:shadow-primary/20 focus:placeholder:text-primary/50 focus:placeholder:font-normal focus:placeholder:text-primary/50 focus:placeholder:font-normal"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <div className="flex w-full justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={closeOperationModal}
                  disabled={operationModal.isProcessing}
                  className="h-10 px-6 text-sm"
                  style={{ cursor: 'pointer' }}
                >
                  Annuler
                </Button>&nbsp;
                <Button
                  type="submit"
                  size="default"
                  disabled={operationModal.isProcessing}
                  className="bg-primary hover:bg-primary/80 h-10 px-6 text-sm text-white"
                  style={{ cursor: 'pointer' }}
                >
                  {operationModal.isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      {operationModal.type === 'deposit' && 'Déposer'}
                      {operationModal.type === 'withdraw' && 'Retirer'}
                      {operationModal.type === 'send' && 'Envoyer'}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}