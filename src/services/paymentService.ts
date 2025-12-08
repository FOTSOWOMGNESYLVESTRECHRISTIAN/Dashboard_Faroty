import { 
  PaymentMethod, 
  Wallet, 
  Account,
  PaymentMethodsResponse,
  WalletsResponse,
  AccountsResponse,
  ApiResponse,
  CreatePaymentMethodRequest
} from '../types/payment';

const API_BASE_URL = 'https://api-pay.faroty.me/payments/api/v1';

// Fonction utilitaire pour les appels API
const fetchWithAuth = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(options.headers || {});
  
  // Ajout des en-têtes nécessaires
  headers.append('x-api-key', 'fk_test_y3JBI-GsXyFjcORKHzbJnuFtBCMtMO2-lqts_cxjukrXHlAAIjvE8Q64LFyk0ElKMWBC_ZXs1BQ');
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'include'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Erreur lors de la requête vers ${endpoint}:`, error);
    throw error;
  }
};

// Méthodes de paiement
export const createPaymentMethod = async (data: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
  try {
    const response = await fetchWithAuth<ApiResponse<PaymentMethod>>('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la création de la méthode de paiement');
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la méthode de paiement:', error);
    throw error;
  }
};

// Méthodes de paiement
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const data = await fetchWithAuth<PaymentMethodsResponse>('/payment-methods');
    return data.data?.content || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error);
    throw error;
  }
};

export const getPaymentMethodById = async (id: string): Promise<PaymentMethod> => {
  try {
    const data = await fetchWithAuth<{ data: PaymentMethod }>(`/payment-methods/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la méthode de paiement ${id}:`, error);
    throw error;
  }
};

export const updatePaymentMethodStatus = async (id: string, active: boolean): Promise<PaymentMethod> => {
  try {
    const data = await fetchWithAuth<{ data: PaymentMethod }>(
      `/payment-methods/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ active })
      }
    );
    return data.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut de la méthode de paiement ${id}:`, error);
    throw error;
  }
};

// Portefeuilles
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const data = await fetchWithAuth<WalletsResponse>('/wallets');
    return data.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des portefeuilles:', error);
    throw error;
  }
};

export const getWalletsByAccount = async (accountId: string): Promise<any[]> => {
  try {
    // Utiliser le même endpoint que getWallets mais avec un filtre côté client
    // car l'API ne fournit pas d'endpoint direct pour filtrer par compte
    const allWallets = await getWallets();
    const filteredWallets = allWallets.filter(wallet => wallet.account.id === accountId);
    
    // Formater les données pour correspondre au type attendu
    return filteredWallets.map(wallet => ({
      ...wallet,
      walletOwners: [], // Initialiser avec un tableau vide si non fourni
      transactionsCount: 0, // Valeur par défaut
      webhooksCount: 0, // Valeur par défaut
      suspiciousActivitiesCount: 0, // Valeur par défaut
      currency: {
        ...wallet.currency,
        active: true // Valeur par défaut
      }
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des portefeuilles pour le compte ${accountId}:`, error);
    throw error;
  }
};

export const getWalletById = async (id: string): Promise<Wallet> => {
  try {
    const data = await fetchWithAuth<{ data: Wallet }>(`/wallets/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du portefeuille ${id}:`, error);
    throw error;
  }
};

// Comptes
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await fetchWithAuth<AccountsResponse>('/accounts');
    return data.data?.content || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error);
    throw error;
  }
};

export const getAccountById = async (id: string): Promise<Account> => {
  try {
    const data = await fetchWithAuth<{ data: Account }>(`/accounts/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du compte ${id}:`, error);
    throw error;
  }
};

// Fonctions utilitaires
export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
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

export const getStatusBadgeVariant = (status: boolean) => {
  return status ? 'success' : 'destructive';
};

export const formatFeeRate = (rate: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rate / 100);
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

// Export par défaut pour la compatibilité avec les imports nommés
export default {
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethodStatus,
  getWallets,
  getWalletsByAccount,
  getWalletById,
  getAccounts,
  getAccountById,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant,
  formatFeeRate,
  filterActiveItems,
  getLogoUrl
};
