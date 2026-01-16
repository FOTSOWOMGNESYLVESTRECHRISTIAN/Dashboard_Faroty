// Types de base

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GetPaymentsParams {
  appId: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalAmount: number;
  currency: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  // Ajoutez d'autres propriétés nécessaires
}

export interface CreateAccountData {
  accountName: string;
  accountMode: 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE';
  email: string;
  country: string;
  currency?: string;
  callbackUrl?: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  currency: string;
  active: boolean;
  // Ajoutez d'autres propriétés nécessaires
}

export interface Account {
  id: string;
  accountName: string;
  accountMode: 'PERSONAL' | 'BUSINESS' | 'SANDBOX' | 'LIVE';
  email: string;
  country: string;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  callbackUrl?: string;
  // Ajoutez d'autres propriétés nécessaires
}

// Types de base
export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  technicalName: string;
  logoUrl: string | null;
  depositFeeRate: number;
  withdrawalFeeRate: number;
  maxTransactionAmount: number;
  transactionCooldown: number;
  txTva: number;
  txPartner: number;
  withdrawMode: string | null;
  useTieredFees: boolean;
  referenceCurrency: string;
  supportsMultiCurrency: boolean;
  createdAt: string;
  updatedAt: string;
  transactionsCount: number;
  activeTransactionsCount: number;
  active: boolean;
}

interface CreatePaymentMethodRequest {
  name: string;
  slug: string;
  technicalName?: string;
  logoUrl?: string;
  depositFeeRate: number | string;
  withdrawalFeeRate: number | string;
  maxTransactionAmount: number | string;
  transactionCooldown: number | string;
  txTva: number | string;
  txPartner: number | string;
  referenceCurrency: string;
  supportsMultiCurrency: boolean;
  active?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
}

const API_BASE_URL = 'https://api-pay-prod.faroty.me/payments/api/v1';

const getAuthHeaders = (): HeadersInit => {
  // Récupération du token d'authentification depuis le localStorage
  const token = localStorage.getItem('authToken');
  
  return {
    'x-api-key': 'fk_live_Qbtr6Cv-s91sQ7rdz7ii2HcPs7rF8b8qE81w_pPzYi5oW5L8thU4kVTgOzQdYF31X8R2B5U6sHk',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Fonction utilitaire pour gérer les appels API
const apiRequest = async <T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
    mode: 'cors',
    credentials: 'include',
    ...(data && { body: JSON.stringify(data) })
  };

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur API (${method} ${endpoint}):`, error);
    throw error;
  }
};

// Méthodes de paiement
export const createPaymentMethod = async (data: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
  const payload = {
    name: data.name.trim(),
    slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    technicalName: (data.technicalName || data.slug).trim().toLowerCase().replace(/\s+/g, '-'),
    logoUrl: data.logoUrl?.trim() || null,
    depositFeeRate: Number(data.depositFeeRate) || 0,
    withdrawalFeeRate: Number(data.withdrawalFeeRate) || 0,
    maxTransactionAmount: Number(data.maxTransactionAmount) || 0,
    transactionCooldown: Number(data.transactionCooldown) || 0,
    txTva: Number(data.txTva) || 0,
    txPartner: Number(data.txPartner) || 0,
    referenceCurrency: data.referenceCurrency || 'XOF',
    supportsMultiCurrency: Boolean(data.supportsMultiCurrency),
    active: data.active !== undefined ? Boolean(data.active) : true
  };

  console.log('Envoi des données à l\'API:', JSON.stringify(payload, null, 2));
  const response = await apiRequest<ApiResponse<PaymentMethod>>('/payment-methods', 'POST', payload);
  return response.data;
};

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const response = await apiRequest<ApiResponse<{ content: PaymentMethod[] }>>('/payment-methods');
    return response.data?.content || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error);
    throw error;
  }
};

export const updatePaymentMethod = async (id: string, data: Partial<CreatePaymentMethodRequest>): Promise<PaymentMethod> => {
  try {
    const response = await apiRequest<ApiResponse<PaymentMethod>>(
      `/payment-methods/${id}`, 
      'PUT', 
      data
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la méthode de paiement ${id}:`, error);
    throw error;
  }
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/payment-methods/${id}`, 'DELETE');
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de la méthode de paiement ${id}:`, error);
    
    let errorMessage = 'Erreur inconnue lors de la suppression de la méthode de paiement';

    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error ||
        errorData.detail || errorData.title ||
        JSON.stringify(errorData) ||
        `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

export const getPaymentMethodById = async (id: string): Promise<PaymentMethod> => {
  try {
    const response = await apiRequest<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la récupération de la méthode de paiement');
    }

    return response.data;
  } catch (error: any) {
    console.error(`Erreur lors de la récupération de la méthode de paiement ${id}:`, error);
    
    let errorMessage = 'Erreur inconnue lors de la récupération de la méthode de paiement';

    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error ||
        errorData.detail || errorData.title ||
        JSON.stringify(errorData) ||
        `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

export const updatePaymentMethodStatus = async (id: string, active: boolean): Promise<PaymentMethod> => {
  try {
    // Créer un objet avec les champs requis pour la mise à jour
    const updateData = {
      active: active
    };

    // Faire un PUT complet au lieu d'un PATCH partiel
    const response = await apiRequest<ApiResponse<PaymentMethod>>(
      `/payment-methods/${id}`,
      'PUT',
      updateData
    );

    if (!response) {
      throw new Error('Aucune réponse du serveur');
    }

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour du statut de la méthode de paiement');
    }

    return response.data;
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour du statut de la méthode de paiement ${id}:`, error);

    let errorMessage = 'Erreur inconnue lors de la mise à jour du statut';

    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error ||
        errorData.detail || errorData.title ||
        JSON.stringify(errorData) ||
        `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

// Countries
export interface UpdateCountryRequest {
  nameFr?: string;
  nameEn?: string;
  currencyId?: string;
  maxPaymentAmount?: number;
  paymentValidationTime?: number;
  minTransactionFeeRate?: number;
  isUserPaysFees?: boolean;
  maxWithdrawalAmount?: number;
  withdrawalValidationThreshold?: number;
  isAutoValidateWithdrawals?: boolean;
  withdrawalValidationTime?: number;
  withdrawalCooldown?: number;
  active?: boolean;
}

export interface CreateCountryRequest {
  code: string;
  nameFr: string;
  nameEn: string;
  currencyId?: string;
  maxPaymentAmount?: number;
  paymentValidationTime?: number;
  minTransactionFeeRate?: number;
  isUserPaysFees?: boolean;
  maxWithdrawalAmount?: number;
  withdrawalValidationThreshold?: number;
  isAutoValidateWithdrawals?: boolean;
  withdrawalValidationTime?: number;
  withdrawalCooldown?: number;
  active?: boolean;
}

export const getCountries = async (): Promise<Country[]> => {
  try {
    const response = await apiRequest<ApiResponse<Country[] | { content: Country[] }>>('/countries');
    
    // Gestion des différents formats de réponse
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray((response.data as any).content)) {
      return (response.data as any).content;
    } else if (response.data && (response.data as any).data) {
      return Array.isArray((response.data as any).data) ? (response.data as any).data : [(response.data as any).data];
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des pays:', error);
    return []; // Retourne un tableau vide en cas d'erreur pour éviter les plantages de l'interface utilisateur
  }
};


export const createCountry = async (data: CreateCountryRequest): Promise<Country> => {
  try {
    const response = await apiRequest<ApiResponse<Country>>(
      '/countries',
      'POST',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la création du pays');
    }

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la création du pays:', error);
    throw new Error(error.response?.data?.message || error.message || 'Échec de la création du pays');
  }
};

export const updateCountry = async (id: string, data: Partial<CreateCountryRequest>): Promise<Country> => {
  try {
    const response = await apiRequest<ApiResponse<Country>>(
      `/countries/${id}`,
      'PUT',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour du pays');
    }

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du pays:', error);
    throw new Error(error.response?.data?.message || error.message || 'Échec de la mise à jour du pays');
  }
};

export const deleteCountry = async (id: string): Promise<void> => {
  try {
    const response = await apiRequest<ApiResponse<void>>(
      `/countries/${id}`,
      'DELETE'
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression du pays');
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression du pays:', error);
    throw new Error(error.response?.data?.message || error.message || 'Échec de la suppression du pays');
  }
};

// Comptes
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const response = await apiRequest<ApiResponse<{
      content: Account[];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
      last: boolean;
      first: boolean;
      hasNext: boolean;
      hasPrevious: boolean;
    }>>('/accounts');

    // Gestion des différents formats de réponse
    if (response.data && 'content' in response.data) {
      return response.data.content;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('Erreur lors de la récupération des comptes:', error);
    
    let errorMessage = 'Erreur inconnue lors de la récupération des comptes';
    
    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || 
        errorData.error || 
        errorData.detail || 
        `Erreur ${error.response.status}: ${error.response.statusText || 'Erreur inconnue'}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export interface UpdateAccountStatusData {
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'DELETED';
  reason?: string;
}

export const updateAccountStatus = async (accountId: string, status: string): Promise<Account> => {
  try {
    const payload = {
      status: status as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'DELETED'
    };

    const response = await apiRequest<ApiResponse<Account>>(
      `/accounts/${accountId}`,
      'PUT',
      payload
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour du statut du compte');
    }

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du statut du compte:', error);
    throw new Error(error.response?.data?.message || error.message || 'Échec de la mise à jour du statut du compte');
  }
}

export const createAccount = async (accountData: CreateAccountData): Promise<Account> => {
  try {
    const payload = {
      accountName: accountData.accountName,
      accountMode: accountData.accountMode,
      email: accountData.email,
      country: accountData.country,
      currency: accountData.currency || 'XOF',
      callbackUrl: accountData.callbackUrl || ''
    };

    const response = await apiRequest<ApiResponse<Account>>(
      '/accounts',
      'POST',
      payload
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la création du compte');
    }

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la création du compte:', error);
    
    // Format error message from validation errors if present
    if (error.response?.data?.validationErrors) {
      const validations = error.response.data.validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Erreur de validation: ${validations}`);
    }
    throw new Error(error.response?.data?.message || error.message || 'Échec de la création du compte');
  }
};

export const deleteWallet = async (walletId: string): Promise<void> => {
  try {
    const response = await apiRequest<ApiResponse<void>>(
      `/wallets/${walletId}`,
      'DELETE'
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression du portefeuille');
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du portefeuille ${walletId}:`, error);
    throw error;
  }
};

// Fonctions utilitaires
export const formatCurrency = (amount: number | null | undefined, currency: string | null | undefined = 'XOF'): string => {
  // Vérifier si le montant est null ou undefined
  if (amount === null || amount === undefined) {
    return 'N/A';
  }

  // Utiliser 'XOF' comme devise par défaut si non fournie ou invalide
  const safeCurrency = currency || 'XOF';

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Erreur de formatage de la devise:', error);
    // Retourner le montant sans formatage en cas d'erreur
    return `${amount} ${safeCurrency}`;
  }
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatFeeRate = (rate: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rate / 100);
};

export const getStatusBadgeVariant = (status: string | boolean) => {
  if (typeof status === 'boolean') {
    return status ? 'default' : 'secondary';
  }

  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'active':
      return 'default';
    case 'suspended':
    case 'inactive':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    case 'deleted':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const filterActiveItems = <T extends { active: boolean }>(items: T[]): T[] => {
  return items.filter(item => item.active);
};

export const getLogoUrl = (logoUrl: string): string => {
  if (!logoUrl || logoUrl.startsWith('/var')) {
    return 'data:image/svg+xml;base64,PH0+DQo8c3ZnIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNyZWRpdC1jYXJkIj4KICA8cmVjdCB3aWR0aD0iMjIiIGhlaWdodD0iMTQiIHg9IjEiIHk9IjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2N1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iMiIvPgogIDxwYXRoIGQ9Ik0xIDFoMjJ2NkgxVjF6Ii8+Cjwvc3ZnPg==';
  }
  return logoUrl;
};

// Nombre maximum de tentatives pour les requêtes échouées
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 seconde

// Fonction utilitaire pour attendre un certain temps
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Récupère les transactions avec gestion des erreurs améliorée et mécanisme de réessai
 * En cas d'erreur, retourne une réponse vide au lieu de lancer une exception
 */
export const getTransactions = async (
  page: number = 0, 
  size: number = 10,
  retryCount: number = 0
): Promise<ApiResponse<{
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}>> => {
  // Fonction pour retourner une réponse vide
  const getEmptyResponse = (): ApiResponse<{
    content: Transaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => ({
    success: true,
    message: 'Aucune donnée disponible',
    data: {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size,
      number: page
    },
    statusCode: 200,
    timestamp: new Date().toISOString()
  });

  try {
    // Construire l'URL avec les paramètres de requête
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    
    const endpoint = `/payments?${queryParams.toString()}`;
    
    // Faire l'appel API avec apiRequest
    const response = await apiRequest<ApiResponse<{
      content: Transaction[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>>(`/payments?${queryParams.toString()}`);

    if (!response) {
      console.warn('Aucune réponse du serveur, retour d\'une réponse vide');
      return getEmptyResponse();
    }

    // Si la réponse indique une erreur mais qu'il y a des données, on les retourne quand même
    if (!response.success && response.message !== 'No transactions found') {
      // Si on a des données malgré l'erreur, on les retourne avec un avertissement
      if (response.data?.content) {
        console.warn('Réponse avec erreur mais données disponibles:', response.message);
        return response;
      }
      console.warn('Erreur lors de la récupération des transactions:', response.message);
      return getEmptyResponse();
    }

    return response;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des transactions:', error);
    
    // Gestion des erreurs spécifiques
    if (error instanceof Error && 'status' in error) {
      const apiError = error as unknown as { status: number; statusText: string; data: any };
      
      // Erreur 404 - Aucune transaction trouvée
      if (apiError.status === 404) {
        console.log('Aucune transaction trouvée, retour d\'une réponse vide');
        return getEmptyResponse();
      }
      
      // Erreur 500 - Erreur serveur interne
      if (apiError.status === 500) {
        // Tentative de réessai pour les erreurs 500
        if (retryCount < MAX_RETRIES) {
          console.log(`Tentative de reconnexion (${retryCount + 1}/${MAX_RETRIES})...`);
          await wait(RETRY_DELAY * (retryCount + 1)); // Attente exponentielle
          return getTransactions(page, size, retryCount + 1);
        }
        console.error('Erreur 500 du serveur après plusieurs tentatives, retour d\'une réponse vide');
        return getEmptyResponse();
      }
      
      // Erreur 401 - Non autorisé
      if (apiError.status === 401) {
        console.error('Erreur d\'authentification, retour d\'une réponse vide');
        return getEmptyResponse();
      }
      
      // Erreur 403 - Accès refusé
      if (apiError.status === 403) {
        console.error('Accès refusé, retour d\'une réponse vide');
        return getEmptyResponse();
      }
      
      // Erreur 429 - Trop de requêtes
      if (apiError.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const retryAfter = 5; // Valeur par défaut si non spécifiée
          console.log(`Trop de requêtes, nouvelle tentative dans ${retryAfter} secondes...`);
          await wait(retryAfter * 1000);
          return getTransactions(page, size, retryCount + 1);
        }
        console.error('Trop de requêtes après plusieurs tentatives, retour d\'une réponse vide');
        return getEmptyResponse();
      }
    }
    
    // Gestion des erreurs réseau
    if (error instanceof Error && ('code' in error || error.message?.includes('timeout'))) {
      const errorCode = (error as any).code;
      if (retryCount < MAX_RETRIES) {
        console.log(`Erreur réseau (${errorCode || 'timeout'}) - Tentative de reconnexion (${retryCount + 1}/${MAX_RETRIES})...`);
        await wait(RETRY_DELAY * (retryCount + 1));
        return getTransactions(page, size, retryCount + 1);
      }
      console.error('Délai d\'attente dépassé après plusieurs tentatives, retour d\'une réponse vide');
      return getEmptyResponse();
    }
    
    // Erreur réseau - vérification de la connexion
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.error('Pas de connexion internet, retour d\'une réponse vide');
      return getEmptyResponse();
    }
    
    // Pour toutes les autres erreurs, on retourne une réponse vide
    console.error('Erreur inattendue, retour d\'une réponse vide:', error instanceof Error ? error.message : 'Erreur inconnue');
    return getEmptyResponse();
  }
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  try {
    const response = await apiRequest<ApiResponse<Transaction>>(`/payments/${id}`);

    if (!response || !response.success) {
      throw new Error(response?.message || 'Transaction non trouvée');
    }

    return response.data;
  } catch (error: any) {
    console.error(`[getTransactionById] Erreur lors de la récupération de la transaction ${id}:`, error);
    
    let errorMessage = 'Erreur inconnue lors de la récupération de la transaction';
    
    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error ||
        errorData.detail || errorData.title ||
        JSON.stringify(errorData) ||
        `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const getApplicationPayments = async (params: GetPaymentsParams): Promise<{ data: Payment[]; total: number }> => {
  try {
    // Validation des paramètres obligatoires
    if (!params.appId) {
      throw new Error('Le paramètre appId est obligatoire');
    }

    const queryParams = new URLSearchParams();
    
    // Ajouter les paramètres de requête
    queryParams.append('appId', params.appId);
    
    if (params.startDate) {
      const startDate = new Date(params.startDate).toISOString().split('T')[0];
      queryParams.append('startDate', startDate);
    }
    
    if (params.endDate) {
      const endDate = new Date(params.endDate).toISOString().split('T')[0];
      queryParams.append('endDate', endDate);
    }
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    // Tri
    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'desc';
      queryParams.append('sort', `${params.sortBy},${sortOrder}`);
    }

    console.log('Fetching payments with params:', Object.fromEntries(queryParams.entries()));
    
    // Utiliser apiRequest pour gérer l'authentification et les en-têtes CORS
    const endpoint = `/payments?${queryParams.toString()}`;
    const response = await apiRequest<ApiResponse<{
      content: Payment[];
      totalElements: number;
      totalPages: number;
      size: number;
      number: number;
    }>>(endpoint, 'GET');
    
    // Vérifier si la réponse est valide
    if (!response || !response.success) {
      console.error('Erreur lors de la récupération des paiements:', response?.message);
      return { data: [], total: 0 };
    }

    // Vérifier si les données attendues sont présentes
    if (!response.data) {
      console.error('Réponse du serveur invalide: données manquantes');
      return { data: [], total: 0 };
    }

    // Retourner les données formatées
    return {
      data: response.data.content || [],
      total: response.data.totalElements || 0
    };
  } catch (error: any) {
    console.error('Erreur lors de la récupération des paiements:', error);
    
    let errorMessage = 'Échec de la récupération des paiements';
    
    if (error.response) {
      // Erreur de réponse HTTP avec un statut d'erreur
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error || 
                    `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      // Une erreur s'est produite lors de la configuration de la requête
      errorMessage = error.message;
    }
    
    console.error('Détails de l\'erreur:', errorMessage);
    return { data: [], total: 0 };
  }
}; // <-- ACCOLADE FERMANTE CORRIGÉE ICI

const getPaymentStats = async (appId: string): Promise<PaymentStats> => {
  try {
    const response = await apiRequest<ApiResponse<{ stats: PaymentStats }>>(
      `/payments/stats?appId=${appId}`
    );
    
    if (!response || !response.success) {
      throw new Error(response?.message || 'Aucune réponse du serveur');
    }
    
    // Vérifier si la réponse contient bien les statistiques
    if (!response.data || !response.data.stats) {
      console.warn('Format de réponse inattendu pour les statistiques:', response);
      throw new Error('Format de réponse inattendu du serveur');
    }
    
    // Retourner les statistiques avec des valeurs par défaut si nécessaire
    return {
      total: response.data.stats.total || 0,
      completed: response.data.stats.completed || 0,
      pending: response.data.stats.pending || 0,
      failed: response.data.stats.failed || 0,
      totalAmount: 0,
      currency: 'XOF',
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Error fetching payment stats:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch payment stats';
    throw new Error(errorMessage);
  }
};

const getPaymentDetails = async (paymentId: string): Promise<Payment> => {
  try {
    const response = await apiRequest<ApiResponse<Payment>>(`/payments/${paymentId}`);
    
    if (!response || !response.success) {
      throw new Error(response?.message || 'Failed to fetch payment details');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching payment details:', error);
    
    let errorMessage = 'Failed to fetch payment details';
    
    if (error.response) {
      // Erreur de réponse HTTP avec un statut d'erreur
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error || 
                    `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      errorMessage = 'No response from server. Please check your internet connection.';
    } else if (error.message) {
      // Une erreur s'est produite lors de la configuration de la requête
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const refundPayment = async (paymentId: string, amount?: number): Promise<void> => {
  try {
    const response = await apiRequest<ApiResponse<{ success: boolean; message: string }>>(
      `/payments/${paymentId}/refund`,
      'POST',
      amount ? { amount } : {}
    );

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du remboursement du paiement');
    }
  } catch (error: any) {
    console.error('Erreur lors du remboursement du paiement:', error);
    
    let errorMessage = 'Erreur inconnue lors du remboursement';
    
    if (error.response) {
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error || 
                    `Erreur ${error.response.status}: ${error.response.statusText || 'Erreur inconnue'}`;
    } else if (error.request) {
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

const exportPayments = async (params: {
  appId: string;
  startDate: string;
  endDate: string;
  status?: string;
  search?: string;
}): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('appId', params.appId);
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    // Utiliser fetch directement pour le téléchargement de fichiers binaires
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/payments/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/octet-stream',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Failed to parse error response' };
      }
      
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    if (!(blob instanceof Blob)) {
      throw new Error('Format de réponse invalide : un objet Blob était attendu');
    }
    
    if (blob.size === 0) {
      throw new Error('Le fichier exporté est vide');
    }
    
    return blob;
  } catch (error: any) {
    console.error('Erreur lors de l\'export des paiements :', error);
    
    let errorMessage = 'Échec de l\'export des paiements';
    
    if (error.response) {
      // Erreur de réponse HTTP avec un statut d'erreur
      const errorData = error.response.data || {};
      errorMessage = errorData.message || errorData.error || 
                    `Erreur ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
    } else if (error.message) {
      // Une erreur s'est produite lors de la configuration de la requête
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Create the payment service object
const paymentService = {
  // Payment Methods
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodById,
  updatePaymentMethodStatus,
  
  // Countries
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  
  // Accounts
  getAccounts,
  updateAccountStatus,
  createAccount,
  deleteWallet,
  
  // Transactions
  getTransactions,
  getTransactionById,
  
  // Payment operations
  getApplicationPayments,
  getPaymentStats,
  getPaymentDetails,
  refundPayment,
  exportPayments,
  
  // Utils
  formatCurrency,
  formatDate,
  formatFeeRate,
  getStatusBadgeVariant,
  filterActiveItems,
  getLogoUrl
};

export default paymentService;