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

// [Tous les autres types et interfaces ici...]

const API_BASE_URL = 'https://api-pay-prod.faroty.me/payments/api/v1';

// [Toutes les fonctions utilitaires ici...]

// Exportation de toutes les fonctions et constantes
export {
  // Payment Methods
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  updatePaymentMethodStatus,
  
  // Countries
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  
  // Accounts
  getAccounts,
  createAccount,
  updateAccountStatus,
  
  // Transactions
  getTransactions,
  getTransactionById,
  
  // Application Payments
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

export default {
  // Payment Methods
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  updatePaymentMethodStatus,
  
  // Countries
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  
  // Accounts
  getAccounts,
  createAccount,
  updateAccountStatus,
  
  // Transactions
  getTransactions,
  getTransactionById,
  
  // Application Payments
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
