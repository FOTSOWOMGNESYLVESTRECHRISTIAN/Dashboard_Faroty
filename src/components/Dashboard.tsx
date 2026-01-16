import React, { useState, useEffect, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Users as UsersIcon,
  CreditCard,
  Settings as SettingsIcon,
  LayoutDashboard,
  AppWindow,
  ListOrdered,
  Wallet as WalletIcon,
  Landmark,
  FileText,
  Clock,
  Shield,
  Smartphone,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Receipt,
  Globe,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { DashboardStats } from "./DashboardStats";
import { Applications } from "./Applications";
import { Abonnements } from "./Abonnements";
import { Settings } from "./Settings";
import { ApplicationDetails } from "./ApplicationDetails";
import type { Application as AppDetailsApplication } from "./ApplicationDetails";
import { Application as ServiceApplication } from "../services/applicationService";
import { AbonnementDetails, Abonnement } from "./AbonnementDetails";
import { Users as UsersComponent } from "./Users";
import type { User } from "./Users";
import { UserDetails } from "./UserDetails";
import { Payment } from "./Payment";
import { TransactionDetails } from "./TransactionDetails";
import { Transactions } from "./Transactions";
import PaymentMethods from "./PaymentMethods";
import { Wallets } from "./Wallets";
import { Accounts } from "./Accounts";
import { AccountDetails } from "./AccountDetails";
import { WalletDetails } from "./WalletDetails";
import { Countries } from "./Countries";
import CountryDetails from "./CountryDetails";

import { PaymentMethod, Wallet, Account, Wallet as WalletType, Currency, Country } from "../types/payment";
import { getAccounts } from "../services/paymentService";
import { TrialPolicies } from "./TrialPolicies";
import DashboardApplicationDetails from "./DashboardApplicationDetails";
import { applicationService } from "../services/applicationService";
import logo from "@/assets/1200x630wa-removebg-preview.png";
import type { Application as ApiApplication } from "../services/applicationService";
import { PAGE_LABELS } from "../utils/apiEndpoints";

type AccountWallet = WalletType & {
  walletOwners: any[];
  transactionsCount: number;
  webhooksCount: number;
  suspiciousActivitiesCount: number;
  currency: Currency & { active: boolean };
};

interface DashboardProps {
  onLogout: () => void;
  user?: Record<string, any> | null;
}

type Page = 'stats' | 'applications' | 'application-details' | 'abonnements' | 'abonnement-details' | 'transactions' | 'wallets' | 'wallet-details' | 'accounts' | 'account-details' | 'payment-methods' | 'users' | 'settings' | 'trialPolicies' | 'transaction-details' | 'countries' | 'country-details';

// Mapping entre les pages et les noms d'URL
const pageToRoute: Record<Page, string> = {
  stats: "statistiques",
  applications: "applications",
  'application-details': "details-application",
  abonnements: "abonnements",
  'abonnement-details': "details-abonnement",
  transactions: "transactions",
  wallets: "portefeuilles",
  'wallet-details': "details-portefeuille",
  accounts: "comptes",
  'account-details': "details-compte",
  'payment-methods': "methodes-paiement",
  users: "utilisateurs",
  settings: "parametres",
  trialPolicies: "periodes-essai",
  'transaction-details': "details-transaction",
  countries: "pays",
  'country-details': "pays",
};

const pageTitles: Record<Page, string> = {
  stats: 'Tableau de bord',
  applications: 'Applications',
  'application-details': "Détails de l'application",
  abonnements: 'Abonnements',
  'abonnement-details': "Détails de l'abonnement",
  transactions: 'Transactions',
  wallets: 'Portefeuilles',
  'wallet-details': 'Détails du portefeuille',
  accounts: 'Comptes',
  'account-details': "Détails du compte",
  'payment-methods': 'Méthodes de paiement',
  users: 'Utilisateurs',
  settings: 'Paramètres',
  trialPolicies: "Périodes d'essai",
  'transaction-details': "Détails de la transaction",
  countries: 'Pays',
  'country-details': "Détails du pays",
};

// Mapping inverse pour récupérer la page depuis l'URL
const routeToPage: Record<string, Page> = Object.entries(pageToRoute).reduce(
  (acc, [page, route]) => {
    acc[route] = page as Page;
    return acc;
  },
  {} as Record<string, Page>
);

// Fonction pour obtenir la page depuis l'URL
const getPageFromUrl = (): Page => {
  const path = window.location.pathname.replace(/^\//, "");
  const parts = path.split("/");
  const route = parts[0] || "statistiques";

  if (route === "pays" && parts.length > 1) {
    return "country-details";
  }

  return routeToPage[route] || "stats";
};

// Fonction pour obtenir les paramètres de détail depuis l'URL
const getDetailFromUrl = (): { page: Page; detailId?: string; detailName?: string } | null => {
  const path = window.location.pathname.replace(/^\//, "");
  const parts = path.split("/").filter(Boolean);

  if (parts.length < 2) return null;

  const route = parts[0];
  let page: Page;

  // Gestion des pages spéciales avec des chemins personnalisés
  if (route === "pays" && parts.length > 1) {
    page = "country-details";
  } else if (route === "comptes" && parts.length > 1) {
    page = "account-details";
  } else {
    page = routeToPage[route];
  }

  if (!page) return null;

  return {
    page,
    detailId: parts[1],
    detailName: parts[1],
  };
};

// Fonction pour mettre à jour l'URL
const updateUrl = (page: Page, detailId?: string) => {
  // Utiliser 'comptes' comme chemin de base pour les détails de compte
  const basePath = page === 'account-details' ? 'comptes' : pageToRoute[page];
  let newUrl = `/${basePath}`;

  if (detailId) {
    newUrl += `/${detailId}`;
  }

  // Ne mettre à jour l'URL que si elle est différente de l'URL actuelle
  if (window.location.pathname !== newUrl) {
    console.log(`Updating URL to: ${newUrl} (page: ${page}, detailId: ${detailId})`);
    window.history.pushState({ page, detailId }, "", newUrl);
  }
};

interface MenuItemType {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size: number }>;
  hasDropdown?: boolean;
  dropdownItems?: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ size: number }>;
  }>;
}

export function Dashboard({ onLogout, user }: DashboardProps) {
  // Initialiser la page depuis l'URL
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromUrl());
  const [selectedApplication, setSelectedApplication] = useState<AppDetailsApplication | null>(null);
  const [selectedAbonnement, setSelectedAbonnement] = useState<Abonnement | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedWalletDetails, setSelectedWalletDetails] = useState<Wallet | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);


  const handleViewTransactionDetails = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setCurrentPage('transaction-details');
    updateUrl('transaction-details', transactionId);
  };

  // Fonction pour charger les détails d'un utilisateur
  const loadUserDetails = async (userId: string) => {
    try {
      setLoadingUser(true);
      console.log(`Chargement des détails de l'utilisateur avec l'ID: ${userId}`);
      // Exemple de chargement simulé - à remplacer par un appel API réel
      // const userDetails = await userService.getUserById(userId);
      // setSelectedUser(userDetails);
      
      // Pour l'instant, on simule un chargement
      const userDetails: User = {
        id: userId,
        name: 'Utilisateur de test',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        profilePictureUrl: null,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        countryName: 'France',
        languageName: 'Français',
        subscriptions: [],
        applications: []
      };
      setSelectedUser(userDetails);
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'utilisateur:', error);
      setSelectedUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // Gestionnaire pour afficher les détails d'une méthode de paiement
  const handleViewPaymentMethodDetails = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setCurrentPage('payment-methods');
    updateUrl('payment-methods');
  };

  // Gestionnaire pour afficher les détails d'un portefeuille
  const handleViewWalletDetails = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setCurrentPage('wallet-details');
    updateUrl('wallet-details', wallet.id);
  };

  // Gestionnaire pour afficher les détails d'un compte
  const handleViewAccountDetails = (account: Account) => {
    console.log('[handleViewAccountDetails] Account ID:', account.id);
    console.log('[handleViewAccountDetails] Account object:', account);

    // Mettre à jour l'état avec le compte sélectionné
    setSelectedAccount(account);

    // Mettre à jour l'URL avant de changer de page
    updateUrl('account-details', account.id);

    // Changer de page
    setCurrentPage('account-details');

    // Forcer un re-render pour s'assurer que la navigation est effectuée
    setTimeout(() => {
      window.dispatchEvent(new Event('popstate'));
    }, 0);

    // Log pour le débogage
    console.log('[handleViewAccountDetails] Navigation vers account-details déclenchée');
  };

  // Fonction pour charger les détails d'un compte par son ID
  const loadAccountDetails = async (accountId: string) => {
    console.log('[loadAccountDetails] Chargement des détails du compte:', accountId);

    // Vérifier si l'ID est valide
    if (!accountId) {
      console.error('[loadAccountDetails] ID de compte invalide:', accountId);
      setCurrentPage('accounts');
      updateUrl('accounts');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[loadAccountDetails] Appel à getAccounts pour trouver le compte avec l\'ID:', accountId);

      // Récupérer tous les comptes
      const accounts = await getAccounts();
      console.log('[loadAccountDetails] Réponse de getAccounts:', accounts);

      // Trouver le compte avec l'ID correspondant
      const account = accounts.find(acc => acc.id === accountId);
      console.log('[loadAccountDetails] Compte trouvé:', account);

      if (!account) {
        throw new Error('Aucun compte trouvé avec l\'ID fourni');
      }

      // Mettre à jour l'état avec le compte récupéré
      setSelectedAccount(account);

      // Mettre à jour l'URL et la page courante
      updateUrl('account-details', accountId);
      setCurrentPage('account-details');

      console.log('[loadAccountDetails] Détails du compte chargés avec succès');

    } catch (error) {
      console.error('[loadAccountDetails] Erreur lors du chargement des détails du compte:', error);

      // Afficher un message d'erreur à l'utilisateur
      toast.error('Impossible de charger les détails du compte. Veuillez réessayer.');

      // Revenir à la liste des comptes en cas d'erreur
      setCurrentPage('accounts');
      updateUrl('accounts');

    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour gérer le chargement initial et la navigation
  useEffect(() => {
    console.log('[useEffect] Initialisation de la gestion de la navigation');

    const handlePopState = (event: PopStateEvent) => {
      console.log('[handlePopState] Événement popstate déclenché', event.state);

      // Obtenir les détails de l'URL actuelle
      const detail = getDetailFromUrl();
      console.log('[handlePopState] Détails de l\'URL:', detail);

      // Vérifier si nous devons afficher les détails d'un compte
      if (detail?.page === 'account-details' && detail.detailId) {
        console.log('[handlePopState] Chargement des détails du compte:', detail.detailId);
        loadAccountDetails(detail.detailId);
      } else {
        // Sinon, mettre à jour la page courante
        const newPage = getPageFromUrl();
        console.log('[handlePopState] Changement de page vers:', newPage);
        setCurrentPage(newPage);
      }
    };

    // Gérer le chargement initial
    if (!isInitialized) {
      console.log('[useEffect] Premier chargement de la page');
      const detail = getDetailFromUrl();
      console.log('[useEffect] Détails initiaux de l\'URL:', detail);

      if (detail?.page === 'account-details' && detail.detailId) {
        console.log('[useEffect] Chargement initial des détails du compte:', detail.detailId);
        loadAccountDetails(detail.detailId);
      } else {
        const initialPage = getPageFromUrl();
        console.log('[useEffect] Page initiale:', initialPage);
        setCurrentPage(initialPage);
      }

      setIsInitialized(true);
    }

    // Écouter les changements d'URL
    console.log('[useEffect] Ajout de l\'écouteur d\'événements popstate');
    window.addEventListener('popstate', handlePopState);

    // Nettoyage de l'effet
    return () => {
      console.log('[useEffect] Nettoyage - Suppression de l\'écouteur d\'événements popstate');
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInitialized]);

  // Gestionnaire pour afficher les détails d'un pays
  const handleViewCountryDetails = (country: Country) => {
    setSelectedCountry(country);
    setCurrentPage('country-details');
    updateUrl('country-details', country.id);
  };

  // Gestionnaire pour afficher les détails d'une application
  const handleViewApplicationDetails = (app: ServiceApplication) => {
    // Convertir l'application du service en format attendu par ApplicationDetails
    const appDetails: AppDetailsApplication = {
      id: app.id,
      name: app.name,
      category: app.type || 'Application',
      version: app.version || '1.0.0',
      status: (app.status as 'active' | 'inactive' | 'maintenance') || 'active',
      abonnements: app.abonnements || 0,
      lastUpdate: app.updatedAt || new Date().toISOString(),
      description: app.description || "",
      plans: [],
      features: [],
      logo: app.logo || undefined, // Ajout du logo si disponible
    };
    setSelectedApplication(appDetails);
    setCurrentPage('application-details');
    updateUrl('application-details', app.id);

    // Mettre à jour le titre de la page
    document.title = `Détails de l'application - ${app.name} | Tableau de bord`;
  };

  const handleBackToApplications = useCallback(() => {
    setSelectedApplication(null);
    setCurrentPage('applications');
    updateUrl('applications');
  }, []);

  // Fonction pour charger les détails d'une application depuis l'API
  const loadApplicationFromUrl = async (appId: string) => {
    try {
      setIsLoading(true);
      // Récupérer toutes les applications
      const apps = await applicationService.getAllApplications();
      const app = apps.find(a => a.id === appId);

      if (app) {
        const appDetails: AppDetailsApplication = {
          id: app.id,
          name: app.name,
          category: app.type || 'Application',
          version: app.version || '1.0.0',
          status: (app.status as 'active' | 'inactive' | 'maintenance') || 'active',
          abonnements: app.abonnements || 0,
          lastUpdate: app.updatedAt || new Date().toISOString(),
          description: app.description || "",
          plans: [],
          features: [],
          logo: app.logo || undefined
        };
        setSelectedApplication(appDetails);
        setCurrentPage('application-details');
      } else {
        console.error('Application non trouvée avec l\'ID:', appId);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour adapter une application du service au format attendu par ApplicationDetails
  const adaptApplicationForDetails = (app: ServiceApplication): AppDetailsApplication => {
    const allowedStatuses: ('active' | 'inactive' | 'maintenance')[] = ["active", "inactive", "maintenance"];
    const normalizedStatus = (app.status ?? "").toLowerCase() as 'active' | 'inactive' | 'maintenance';
    const status = allowedStatuses.includes(normalizedStatus) ? normalizedStatus : 'active';

    return {
      id: app.id,
      name: app.name,
      category: app.type || 'Application',
      version: app.version || '1.0.0',
      status,
      abonnements: app.abonnements || 0,
      lastUpdate: app.updatedAt || new Date().toISOString(),
      description: app.description || "",
      plans: [],
      features: [],
      logo: app.logo || undefined
    };
  };

  const menuItems: MenuItemType[] = [
    {
      id: 'stats',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: AppWindow,
    },
    {
      id: "abonnements",
      label: "Abonnements",
      icon: UsersIcon,
    },
    {
      id: "payment",
      label: "Paiements",
      icon: CreditCard,
      hasDropdown: true,
      dropdownItems: [
        { id: "transactions", label: "Transactions", icon: Receipt },
        { id: "wallets", label: "Portefeuilles", icon: WalletIcon },
        { id: "accounts", label: "Comptes", icon: Landmark },
        { id: "payment-methods", label: "Méthodes de paiement", icon: FileText },
        { id: "countries", label: "Pays", icon: Globe },
      ],
    },
    // {
    //   id: "trialPolicies",
    //   label: "Périodes d'essai",
    //   icon: Clock,
    // },
    {
      id: "administration",
      label: "Administration",
      icon: Shield,
      hasDropdown: true,
      dropdownItems: [
        { id: "users", label: "Utilisateurs", icon: UserIcon },
        { id: "settings", label: "Paramètres", icon: SettingsIcon },
      ],
    },
  ];

  // Gestionnaire pour afficher les détails d'un abonnement
  const handleViewAbonnementDetails = (abonnement: Abonnement) => {
    setSelectedAbonnement(abonnement);
    setCurrentPage('abonnement-details');
    updateUrl('abonnement-details', abonnement.id);
  };

  const handleBackToAbonnements = () => {
    setSelectedAbonnement(null);
    setCurrentPage("abonnements");
    updateUrl("abonnements");
  };


  const renderContent = () => {
    switch (currentPage) {
      case "applications":
        return (
          <Applications
            onViewDetails={(app) => handleViewApplicationDetails(app)}
          />
        );

      case "application-details":
        return selectedApplication ? (
          <DashboardApplicationDetails
            appData={selectedApplication}
            onBack={handleBackToApplications}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Application non trouvée</p>
          </div>
        );

      case "abonnements":
        return (
          <Abonnements
            onViewDetails={(abonnement) => {
              setSelectedAbonnement(abonnement);
              setCurrentPage('abonnement-details');
              updateUrl('abonnement-details', abonnement.id);
            }}
          />
        );

      case "transactions":
        return (
          <Transactions
            onViewDetails={(transactionId) => {
              // Implémentez la logique pour afficher les détails d'une transaction
              console.log('View transaction details:', transactionId);
            }}
          />
        );

      case "wallets":
        return (
          <Wallets
            onViewDetails={handleViewWalletDetails}
          />
        );

      case "wallet-details":
        const walletDetail = getDetailFromUrl();
        const walletId = selectedWallet?.id || walletDetail?.detailId;

        if (!walletId) {
          return (
            <div className="flex items-center justify-center h-64">
              <p>Portefeuille non trouvé</p>
              <Button
                variant="outline"
                className="ml-4"
                onClick={() => {
                  setCurrentPage('wallets');
                  updateUrl('wallets');
                }}
                style={{ cursor: 'pointer' }}
              >
                Retour à la liste
              </Button>
            </div>
          );
        }

        return (
          <WalletDetails
            walletId={walletId}
            onBack={() => {
              setCurrentPage('wallets');
              updateUrl('wallets');
            }}
          />
        );

      case "accounts":
        return (
          <Accounts
            onViewDetails={(account) => {
              handleViewAccountDetails(account);
            }}
          />
        );

      case "payment-methods":
        return (
          <PaymentMethods
            onViewDetails={(methodId) => {
              // Implémentez la logique pour afficher les détails d'une méthode de paiement
              console.log('View payment method details:', methodId);
            }}
          />
        );

      case "country-details":
        const countryDetail = getDetailFromUrl();
        return selectedCountry || countryDetail?.detailId ? (
          <CountryDetails country={selectedCountry} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Pays non trouvé</p>
          </div>
        );

      case "countries":
        return <Countries onViewCountryDetails={handleViewCountryDetails} />;
      case "app-details":
        return selectedApplication ? (
          <DashboardApplicationDetails
            onBack={() => {
              setCurrentPage('applications');
              updateUrl('applications');
            }}
            appData={{
              id: selectedApplication.id,
              name: selectedApplication.name,
              status: selectedApplication.status,
              logo: selectedApplication.logo,
              description: selectedApplication.description,
              category: selectedApplication.category,
              type: 'web', // Valeur par défaut
              platform: 'web', // Valeur par défaut
              version: selectedApplication.version,
              lastUpdate: selectedApplication.lastUpdate,
              features: selectedApplication.features || [],
              plans: (selectedApplication.plans || []).map(plan => ({
                ...plan,
                interval: (plan.interval === 'month' || plan.interval === 'year') ? plan.interval : 'month',
                features: (plan.features || []).map((f: any) => ({
                  id: f.id || f.featureId,
                  name: f.feature?.name || 'Fonctionnalité',
                  featureId: f.featureId,
                  limit: f.quotaLimit || null
                }))
              })),
              owner: user?.name || 'Admin',
              stats: {
                totalUsers: 0,
                activeUsers: 0,
                monthlyRevenue: 0,
                totalTransactions: 0,
                successRate: 100,
                avgSession: '00:00'
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Application non trouvée</p>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => {
                setCurrentPage('applications');
                updateUrl('applications');
              }}
              style={{ cursor: 'pointer' }}
            >
              Retour à la liste
            </Button>
          </div>
        );
      case "account-details":
        console.log('[Dashboard] Rendu de la page account-details');
        console.log('[Dashboard] selectedAccount:', selectedAccount);

        // Afficher un indicateur de chargement si nécessaire
        if (isLoading) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Chargement des détails du compte...</p>
              </div>
            </div>
          );
        }

        // Vérifier si un compte est sélectionné
        if (!selectedAccount) {
          console.error('[Dashboard] Aucun compte sélectionné pour afficher les détails');

          // Essayer de récupérer l'ID du compte depuis l'URL
          const detail = getDetailFromUrl();
          if (detail?.page === 'account-details' && detail.detailId) {
            console.log('[Dashboard] Tentative de chargement du compte depuis l\'URL:', detail.detailId);
            loadAccountDetails(detail.detailId);

            // Afficher un indicateur de chargement pendant le chargement
            return (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Chargement des détails du compte...</p>
                </div>
              </div>
            );
          }

          // Afficher un message d'erreur si aucun compte n'est trouvé
          return (
            <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Compte non trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Impossible de charger les détails du compte demandé.</p>
              <Button
                variant="default"
                onClick={() => {
                  setCurrentPage('accounts');
                  updateUrl('accounts');
                }}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste des comptes
              </Button>
            </div>
          );
        }

        // Afficher les détails du compte
        console.log('[Dashboard] Affichage des détails du compte:', selectedAccount.id);
        return (
          <AccountDetails
            accountId={selectedAccount.id}
            onBack={() => {
              console.log('[Dashboard] Retour à la liste des comptes depuis AccountDetails');
              setCurrentPage('accounts');
              updateUrl('accounts');
            }}
          />
        );
      case "wallet-details":
        return selectedWalletDetails ? (
          <WalletDetails
            wallet={selectedWalletDetails}
            onBack={() => {
              setCurrentPage('wallets');
              updateUrl('wallets');
            }}
            onRefresh={async () => {
              // Implémenter la logique de rafraîchissement si nécessaire
              console.log('Rafraîchissement des données du portefeuille');
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Portefeuille non trouvé</p>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => {
                setCurrentPage('wallets');
                updateUrl('wallets');
              }}
              style={{ cursor: 'pointer' }}
            >
              Retour à la liste
            </Button>
          </div>
        );
      case "users":
        return (
          <UsersComponent
            onViewDetails={(user) => {
              setSelectedUser(user);
              setCurrentPage('user-details');
              updateUrl('user-details', user.id);
            }}
          />
        );
      
      case "settings":
        return <Settings />;
        
      case "abonnement-details":
        return selectedAbonnement ? (
          <AbonnementDetails
            abonnement={selectedAbonnement}
            onBack={() => {
              setCurrentPage('abonnements');
              updateUrl('abonnements');
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Abonnement non trouvé</p>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => {
                setCurrentPage('abonnements');
                updateUrl('abonnements');
              }}
              style={{ cursor: 'pointer' }}
            >
              Retour à la liste
            </Button>
          </div>
        );
        
      case "user-details":
        if (loadingUser) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mb-4"></div>
                <p>Chargement des détails de l'utilisateur...</p>
              </div>
            </div>
          );
        }
        
        return selectedUser ? (
          <UserDetails
            user={selectedUser}
            onBack={() => {
              setCurrentPage('users');
              updateUrl('users');
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p>Utilisateur non trouvé</p>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => {
                setCurrentPage('users');
                updateUrl('users');
              }}
              style={{ cursor: 'pointer' }}
            >
              Retour à la liste
            </Button>
          </div>
        );
        
      default:
        return <DashboardStats />;
    }
  };

  // Gestion des changements d'URL et chargement des détails
  useEffect(() => {
    const handlePopState = () => {
      const detailInfo = getDetailFromUrl();
      const page = getPageFromUrl();

      setCurrentPage(page);

      // Réinitialiser les détails sélectionnés
      setSelectedApplication(null);
      setSelectedAbonnement(null);
      setSelectedUser(null);
      setSelectedPaymentMethod(null);
      setSelectedWallet(null);

      // Charger les détails si nécessaire
      if (detailInfo) {
        if (detailInfo.page === 'application-details' && detailInfo.detailId) {
          // Charger les détails de l'application depuis l'URL
          loadApplicationFromUrl(detailInfo.detailId);
        } else if (detailInfo.page === 'abonnements' && detailInfo.detailName) {
          // Implémenter le chargement des détails d'abonnement si nécessaire
        } else if (detailInfo.page === 'user-details' && detailInfo.detailId) {
          // Charger les détails de l'utilisateur depuis l'URL
          loadUserDetails(detailInfo.detailId);
        } else if (detailInfo.page === 'users' && detailInfo.detailName) {
        // Implémenter le chargement des détails utilisateur si nécessaire
      }
    }
  };
    // Gestion initiale
    handlePopState();

    // Écouter les changements d'URL (navigation avant/arrière)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fonction pour changer de page et mettre à jour l'URL
  const handlePageChange = (pageId: string) => {
    // Si on change de page, réinitialiser les détails du portefeuille
    if (pageId !== 'wallet-details') {
      setSelectedWalletDetails(null);
    }

    // Mettre à jour la page courante
    setCurrentPage(pageId as Page);
    updateUrl(pageId as Page);

    // Réinitialiser les sélections de détails quand on change de page
    if (!["transactions", "wallets", "accounts", "payment-methods"].includes(pageId)) {
      setSelectedPaymentMethod(null);
      setSelectedWallet(null);
      setSelectedAccount(null);
    }
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev: Record<string, boolean>) => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleMenuItemClick = (pageId: string) => {
    // Si on change de page, réinitialiser les détails du portefeuille
    if (pageId !== 'wallet-details') {
      setSelectedWalletDetails(null);
    }

    // Mettre à jour la page courante
    setCurrentPage(pageId as Page);
    updateUrl(pageId as Page);

    // Réinitialiser les sélections de détails quand on change de page
    if (!["transactions", "wallets", "accounts", "payment-methods"].includes(pageId)) {
      setSelectedPaymentMethod(null);
      setSelectedWallet(null);
      setSelectedAccount(null);
    }

    // Si on clique sur Applications, charger la liste des applications
    if (pageId === 'applications') {
      // Réinitialiser la sélection d'application
      setSelectedApplication(null);
    }
  };

  const displayName = user
    ? user.name || [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "Admin"
    : "Admin";
  const displayEmail = user ? user.email || user.contact || "admin@example.com" : "admin@example.com";
  const avatarFallback =
    displayName
      .split(" ")
      .map((part: string) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <SidebarProvider style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar className="border-r flex-shrink-0">
          <SidebarHeader>
            <div className="flex items-center gap-4 px-2 py-3">
              <img src={logo} alt="Logo" className="w-16 h-12 object-contain" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold">FAROTY</span>
                <span className="text-xs text-muted-foreground">
                  Panel de contrôle
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wider overflow-hidden overflow-x-hidden overflow-y-hidden whitespace-nowrap text-ellipsis">
                Menu Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {menuItems.map((item) => {
                    const dropdownItems = item.dropdownItems || [];
                    const hasSubItems = item.hasDropdown && dropdownItems.length > 0;
                    const isOpen = openMenus[item.id] || false;
                    const isActive = currentPage === item.id ||
                      (dropdownItems.some((sub: any) => sub.id === currentPage) ?? false);

                    return (
                      <SidebarMenuItem key={item.id} className="relative">
                        <div className="w-full">
                          <SidebarMenuButton
                            onClick={() => hasSubItems ? toggleMenu(item.id) : handleMenuItemClick(item.id)}
                            className={`w-full justify-between px-2 py-2 rounded-md transition-all duration-200 cursor-pointer ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 hover:cursor-pointer'
                              }`} style={{ cursor: 'pointer' }}
                          >
                            <div className="flex items-center gap-2">
                              {item.icon && <item.icon size={16} />}
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            {hasSubItems && (
                              <ChevronDown
                                className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                  }`}
                                style={{ cursor: 'pointer' }} />
                            )}
                          </SidebarMenuButton>

                          {/* Sous-menus alignés à gauche sous l'item parent */}
                          {hasSubItems && isOpen && (
                            <div className="mt-1 ml-4 space-y-0.5">
                              {item.dropdownItems?.map((subItem) => {
                                const isSubActive = currentPage === subItem.id;

                                return (
                                  <SidebarMenuButton
                                    key={subItem.id}
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleMenuItemClick(subItem.id);
                                    }}
                                    className={`w-full justify-start px-4 py-1.5 text-xs rounded-md transition-colors duration-150 cursor-pointer ${isSubActive
                                      ? 'bg-gray-200 text-gray-600 font-medium'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30 hover:cursor-pointer hover:text-gray-600 hover:bg-gray-600'
                                      }`} style={{ cursor: 'pointer' }}
                                  >
                                    <div className="flex items-center gap-2">
                                      {subItem.icon && <subItem.icon size={12} />}
                                      <span>{subItem.label}</span>
                                    </div>
                                  </SidebarMenuButton>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground" style={{ cursor: 'pointer' }}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={displayName} />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{displayEmail}</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handlePageChange("settings")} style={{ cursor: 'pointer' }}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} style={{ cursor: 'pointer' }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-0">
          <header className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b bg-background px-4 ">
            <SidebarTrigger style={{ cursor: 'pointer' }} />
            <Separator orientation="vertical" className="h-6" />

            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg">{pageTitles[currentPage]}</h1>
                {selectedApplication && (currentPage === 'app-details' || currentPage === 'applications') && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-primary">{selectedApplication.name}</span>
                  </>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={onLogout} className="w-fit text-xs text-muted-foreground bg-red-500 hover:bg-red-600 px-3 py-1 text-white hover:text-white" style={{ cursor: 'pointer' }}>
                <LogOut className="mr-1 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-y-auto p-6 overflow-x-hidden">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}