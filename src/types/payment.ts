// Interfaces pour les méthodes de paiement
export interface CreatePaymentMethodRequest {
  name: string;
  technicalName: string;
  slug: string;
  logoUrl: string;
  depositFeeRate: number;
  withdrawalFeeRate: number;
  maxTransactionAmount: number;
  transactionCooldown: number;
  txTva: number;
  txPartner: number;
  referenceCurrency: string;
  supportsMultiCurrency: boolean;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  technicalName: string;
  logoUrl: string;
  depositFeeRate: number;
  withdrawalFeeRate: number;
  maxTransactionAmount: number;
  transactionCooldown: number;
  txTva: number;
  txPartner: number;
  referenceCurrency: string;
  supportsMultiCurrency: boolean;
  transactionsCount: number;
  activeTransactionsCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: {
    content: PaymentMethod[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  pagination: any;
  metadata: any;
}

// Interfaces pour les portefeuilles
export interface Currency {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  symbol: string;
}

export interface WalletBalance {
  id: string;
  balance: number;
  frozenBalance: number;
  pendingBalance: number;
  totalBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletOwner {
  id: string;
  userId: string;
  walletId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  legalIdentifier: string;
  walletType: 'PERSONAL' | 'BUSINESS';
  depositFeeRate: number;
  maxTransactionAmount: number;
  withdrawalFeeRate: number;
  frozenReason: string | null;
  refId: string;
  refName: string | null;
  status: 'active' | 'suspended' | 'cancelled' | 'deleted';
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  account: {
    id: string;
    accountName: string;
    accountSubName: string;
    accountMode: string;
    country: {
      code: string;
      nameFr: string;
      nameEn: string;
    };
  };
  balance: WalletBalance;
  walletOwners: WalletOwner[];
  transactionsCount: number;
  webhooksCount: number;
  suspiciousActivitiesCount: number;
  frozen: boolean;
}

export interface WalletsResponse {
  data: Wallet[];
  total: number;
  page: number;
  limit: number;
}

// Interfaces pour les comptes
// Interfaces pour les transactions
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface BillingAddress {
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Country {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  currency?: Currency; // Added to support AccountDetails
  maxPaymentAmount: number;
  paymentValidationTime: number;
  minTransactionFeeRate: number;
  isUserPaysFees: boolean;
  maxWithdrawalAmount: number;
  withdrawalValidationThreshold: number;
  isAutoValidateWithdrawals: boolean;
  withdrawalValidationTime: number;
  withdrawalCooldown: number;
  createdAt: string;
  updatedAt: string;
  accountsCount: number;
  paymentMethodsCount: number;
  active: boolean;
}

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  accountSubName: string;
  accountMode: string;
  publicKey: string;
  expiresAt: string | null;
  frozenReason: string | null;
  depositFeeRate: number;
  withdrawalFeeRate: number;
  status: 'active' | 'suspended' | 'cancelled' | 'deleted' | 'ACTIVE' | 'SUSPENDED'; // Added uppercase support
  createdAt: string;
  updatedAt: string;
  country: Country;
  walletsCount: number;
  accountPaymentMethodsCount: number;
  webhooksCount: number;
  frozen: boolean;

  // Added fields to support AccountDetails
  email?: string;
  phoneNumber?: string;
  totalBalance?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalFees?: number;
  recentTransactions?: Transaction[];
  billingName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddress?: BillingAddress;
}

export interface AccountsResponse {
  data: {
    content: Account[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

// Interface pour les réponses d'API génériques
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

// Interfaces pour les paiements
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  paymentMethodDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  userId: string;
  applicationId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
  };
  subscriptionId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
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

export interface PaymentListResponse {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  appId: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
