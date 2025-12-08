// Interfaces pour les méthodes de paiement
export interface CreatePaymentMethodRequest {
  name: string;
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
  data: {
    content: PaymentMethod[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
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
export interface Country {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
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
  createdAt: string;
  updatedAt: string;
  country: Country;
  walletsCount: number;
  accountPaymentMethodsCount: number;
  webhooksCount: number;
  frozen: boolean;
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
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}
