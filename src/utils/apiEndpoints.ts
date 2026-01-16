// src/utils/apiEndpoints.ts

declare const process: any;

// Configuration de la base URL
const getBaseUrl = (): string => {
  let env: any = undefined;

  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    env = (import.meta as any).env;
  } else if (typeof process !== "undefined" && (process as any).env) {
    env = (process as any).env;
  }

  const envBase = env?.VITE_API_BASE_URL || env?.REACT_APP_API_BASE_URL || "";
  const normalizedBase =
    typeof envBase === "string" ? envBase.trim().replace(/\/+$/g, "") : "";

  const isDev =
    Boolean(env?.DEV) ||
    env?.NODE_ENV === "development" ||
    env?.VITE_DEV === "true";

  const DEFAULT_BASE = "https://api-prod.faroty.me";

  const runtimeHost =
    typeof window !== "undefined" && window?.location ? window.location.hostname : "";
  const isLocalRuntime =
    runtimeHost === "localhost" ||
    runtimeHost === "127.0.0.1" ||
    runtimeHost.startsWith("192.168.") ||
    runtimeHost.endsWith(".local");

  if (isLocalRuntime) {
    return "";
  }

  // En développement sans base explicite, on retourne une chaîne vide pour
  // permettre l'utilisation du proxy Vite (`/api`, `/auth`, etc.).
  if (isDev && normalizedBase === "") {
    return "";
  }

  return normalizedBase || DEFAULT_BASE;
};

export const BASE_URL = getBaseUrl();

const joinBase = (path: string): string => {
  if (!path) return BASE_URL;
  if (path.startsWith("http")) return path;
  const base = BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  const normalizedBase = base.endsWith("/")
    ? base.replace(/\/+$/g, "")
    : base;
  return `${normalizedBase}${normalizedPath}`;
};

const paths = {
  auth: {
    login: "/auth/api/auth/login",
    verifyOtp: "/auth/api/auth/verify-otp",
    sessions: "auth/api/sessions/my-sessions",
    deleteSession: "auth/api/sessions",
    refresh: "auth/api/auth/refresh-token",
    logout: "auth/api/auth/logout",
  },
  contacts: {
    add: "auth/api/contacts/add",
    verify: "auth/api/contacts/verify",
    update: {
      initiate: "auth/api/contact-update/initiate",
      validate: "auth/api/contact-update/validate-otp",
      complete: "auth/api/contact-update/complete",
      status: "auth/api/contact-update/status",
      active: "auth/api/contact-update/active-requests",
      canInitiate: "auth/api/contact-update/can-initiate",
      resend: "auth/api/contact-update/resend-otp",
      cancel: "auth/api/contact-update/cancel",
    },
  },
  users: {
    base: "auth/api/users",
    profile: "auth/api/users/profile",
  },
  kyc: {
    base: "auth/api/kyc",
    hasVerification: "auth/api/kyc/has-verification",
    isVerified: "auth/api/kyc/is-verified",
    submit: "auth/api/kyc",
    submitLegacy: "auth/api/kyc/submit",
  },
  media: {
    base: "auth/api/media",
    importOne: "auth/api/media/import",
    types: "auth/api/media/types",
    upload: "auth/api/media/upload",
  },
  guest: {
    store: "auth/api/guest/store",
  },
  abonnement: {
    applications: "/souscription/api/v1/applications",
    // L'endpoint "list-applications" historique pointait vers un mauvais chemin ; on force la valeur correcte
    getAllApplications: "/souscription/api/v1/applications",
    features: "/souscription/api/v1/features",
    plans: "/souscription/api/v1/plans",
    planFeatures: "/souscription/api/v1/plan-features",
    abonnements: "/souscription/api/v1/subscriptions",
    subscriptionUsers: "/souscription/api/v1/subscription-users",
    SUBSCRIPTION_USERS_BY_USER: (userId: string) => `/souscription/api/v1/subscription-users/user/${userId}`,
    subscriptionContext: "/souscription/api/v1/subscriptions/context",
    quotaConsume: "/souscription/api/v1/quota/consume",
    quotaCheck: "/souscription/api/v1/quota/check",
    promotions: "/souscription/api/v1/promotions",
    trialPolicies: "/souscription/api/v1/trial-policies",
  },
  payments: {
    accounts: "/payments/api/v1/accounts",
    wallets: "/payments/api/v1/wallets",
    paymentMethods: "/payments/api/v1/payment-methods",
    countries: "/payments/api/v1/countries",
    exchangeRates: "/payments/api/v1/exchange-rates",
    transactionFees: "/payments/api/v1/transaction-fees/calculate",
    transactionFeesSimple: "/payments/api/v1/transaction-fees/calculate-simple",
    sessions: "/payments/api/v1/payment-sessions",
    initialize: "/payments/api/v1/payments/initialization/initialize",
    validate: "/payments/api/v1/payments/initialization/validate",
    orange: {
      create: "/payments/api/v1/payments/orange/create",
      status: "/payments/api/v1/payments/orange/status",
      authenticate: "/payments/api/v1/payments/orange/authenticate",
    },
    momo: {
      create: "/payments/api/v1/payments/momo/create",
      verify: "/payments/api/v1/payments/momo/verify-account/msisdn",
    },
    withdrawals: {
      initialize: "/payments/api/v1/withdrawals/initialize",
      validate: "/payments/api/v1/withdrawals/validate",
      status: "/payments/api/v1/withdrawals",
    },
    transactions: {
      base: "/payments/api/v1/transactions",
      history: "/payments/api/v1/transactions/history",
    },
  },
  apiKeys: {
    clients: "auth/api/v1/clients",
    keys: "auth/api/v1/apikeys",
  },
};

// Types pour une meilleure typage
export interface Endpoints {
  AUTH: AuthEndpoints;
  USERS: UserEndpoints;
  KYC: KYCEndpoints;
  MEDIA: MediaEndpoints;
  GUEST: GuestEndpoints;
  ABONNEMENT: AbonnementEndpoints;
  PAYMENTS: PaymentEndpoints;
  API_KEYS: ApiKeyEndpoints;
}

export interface AuthEndpoints {
  LOGIN: string;
  VERIFY_OTP: string;
  SESSIONS: string;
  DELETE_SESSION: (id: string) => string;
  REFRESH_TOKEN: string;
  LOGOUT: string;
}

export interface UserEndpoints {
  BASE: string;
  PROFILE: string;
  BY_ID: (id: string) => string;
  CONTACTS: {
    ADD: string;
    VERIFY: string;
  };
  CONTACT_UPDATE: {
    INITIATE: string;
    VALIDATE_OTP: string;
    COMPLETE: string;
    STATUS: (reference: string) => string;
    ACTIVE_REQUESTS: string;
    CAN_INITIATE: string;
    RESEND_OTP: string;
    CANCEL: string;
  };
}

export interface KYCEndpoints {
  BASE: string;
  HAS_VERIFICATION: string;
  IS_VERIFIED: string;
  VERIFY: (id: string) => string;
  SUBMIT: string;
  STATUS: (id: string) => string;
}

export interface MediaEndpoints {
  IMPORT: string;
  TYPES: string;
  UPLOAD: string;
  BY_ID: (id: string) => string;
}

export interface GuestEndpoints {
  STORE: string;
}

export interface AbonnementEndpoints {
  APPLICATIONS: string;
  FEATURES: string;
  FEATURES_BY_APPLICATION: (appId: string) => string;
  PLANS: string;
  PLANS_BY_APPLICATION: (appId: string) => string;
  PLAN_FEATURES: string;
  PLAN_FEATURES_BY_PLAN: (planId: string) => string;
  ABONNEMENTS: string;
  subscriptionUsers: string;
  SUBSCRIPTION_USERS_BY_USER: (userId: string) => string;
  SUBSCRIPTION_USERS_BY_SUBSCRIPTION: (subscriptionId: string) => string;
  DELETE_SUBSCRIPTION_USER: (id: string) => string;
  subscriptionContext: string;
  GET_OR_CREATE_ABONNEMENT: (contextId: string, contextType: string) => string;
  PROMOTIONS: string;
  TRIAL_POLICIES: string;
  TRIAL_POLICY_BY_APPLICATION: (applicationId: string) => string;
  QUOTA: {
    CONSUME: string;
    CHECK: string;
    USAGE: (contextId: string, contextType: string) => string;
  };
}

export interface PaymentEndpoints {
  ACCOUNTS: string;
  WALLETS: string;
  PAYMENT_METHODS: string;
  COUNTRIES: string;
  EXCHANGE_RATES: string;
  TRANSACTION_FEES: {
    CALCULATE: string;
    CALCULATE_SIMPLE: string;
  };
  PAYMENT_SESSIONS: string;
  PAYMENTS: {
    INITIALIZE: string;
    VALIDATE: (token: string) => string;
    ORANGE: {
      CREATE: string;
      STATUS: (ref: string) => string;
      AUTHENTICATE: string;
    };
    MOMO: {
      CREATE: string;
      VERIFY_ACCOUNT: (msisdn: string) => string;
    };
  };
  WITHDRAWALS: {
    INITIALIZE: string;
    VALIDATE: string;
    STATUS: (id: string) => string;
  };
  TRANSACTIONS: {
    BASE: string;
    BY_ID: (id: string) => string;
    HISTORY: string;
  };
}

export interface ApiKeyEndpoints {
  CLIENTS: string;
  API_KEYS: string;
  VALIDATE: (key: string) => string;
  REGENERATE: (id: string) => string;
}

// Implémentation des endpoints
export const API_ENDPOINTS: Endpoints = {
  // Authentication
  AUTH: {
    LOGIN: joinBase(paths.auth.login),
    VERIFY_OTP: joinBase(paths.auth.verifyOtp),
    SESSIONS: joinBase(paths.auth.sessions),
    DELETE_SESSION: (id: string) =>
      joinBase(`${paths.auth.deleteSession}/${id}`),
    REFRESH_TOKEN: joinBase(paths.auth.refresh),
    LOGOUT: joinBase(paths.auth.logout),
  },

  // Users Management
  USERS: {
    BASE: joinBase(paths.users.base),
    PROFILE: joinBase(paths.users.profile),
    BY_ID: (id: string) => joinBase(`${paths.users.base}/${id}`),
    CONTACTS: {
      ADD: joinBase(paths.contacts.add),
      VERIFY: joinBase(paths.contacts.verify),
    },
    CONTACT_UPDATE: {
      INITIATE: joinBase(paths.contacts.update.initiate),
      VALIDATE_OTP: joinBase(paths.contacts.update.validate),
      COMPLETE: joinBase(paths.contacts.update.complete),
      STATUS: (reference: string) =>
        joinBase(`${paths.contacts.update.status}/${reference}`),
      ACTIVE_REQUESTS: joinBase(paths.contacts.update.active),
      CAN_INITIATE: joinBase(paths.contacts.update.canInitiate),
      RESEND_OTP: joinBase(paths.contacts.update.resend),
      CANCEL: joinBase(paths.contacts.update.cancel),
    },
  },

  // KYC Management
  KYC: {
    BASE: joinBase(paths.kyc.base),
    HAS_VERIFICATION: joinBase(paths.kyc.hasVerification),
    IS_VERIFIED: joinBase(paths.kyc.isVerified),
    VERIFY: (id: string) => joinBase(`${paths.kyc.base}/${id}/verify`),
    SUBMIT: joinBase(paths.kyc.submitLegacy),
    STATUS: (id: string) => joinBase(`${paths.kyc.base}/${id}/status`),
  },

  // Media Management
  MEDIA: {
    IMPORT: joinBase(paths.media.importOne),
    TYPES: joinBase(paths.media.types),
    UPLOAD: joinBase(paths.media.upload),
    BY_ID: (id: string) => joinBase(`${paths.media.base}/${id}`),
  },

  // Guest
  GUEST: {
    STORE: joinBase(paths.guest.store),
  },

  // Abonnement Services
  ABONNEMENT: {
    APPLICATIONS: joinBase(paths.abonnement.getAllApplications || paths.abonnement.applications),
    FEATURES: joinBase(paths.abonnement.features),
    FEATURES_BY_APPLICATION: (appId: string) => joinBase(`/souscription/api/v1/features/application/${appId}`),
    PLANS: joinBase(paths.abonnement.plans),
    PLANS_BY_APPLICATION: (appId: string) => joinBase(`/souscription/api/v1/plans/application/${appId}`),
    PLAN_FEATURES: joinBase(paths.abonnement.planFeatures),
    PLAN_FEATURES_BY_PLAN: (planId: string) => joinBase(`/souscription/api/v1/plan-features/plan/${planId}`),
    ABONNEMENTS: joinBase(paths.abonnement.abonnements),
    GET_OR_CREATE_ABONNEMENT: (contextId: string, contextType: string) => joinBase(
      `/souscription/api/v1/subscriptions/context/${contextId}/${contextType}/get-or-create`
    ),
    PROMOTIONS: joinBase(paths.abonnement.promotions),
    TRIAL_POLICIES: joinBase(paths.abonnement.trialPolicies),
    TRIAL_POLICY_BY_APPLICATION: (applicationId: string) => joinBase(`/souscription/api/v1/trial-policies/application/${applicationId}`),
    QUOTA: {
      CONSUME: joinBase(paths.abonnement.quotaConsume),
      CHECK: joinBase(paths.abonnement.quotaCheck),
      USAGE: (contextId: string, contextType: string) => joinBase(`/souscription/api/v1/quota/usage/${contextId}/${contextType}`),
    },
    subscriptionUsers: joinBase(paths.abonnement.subscriptionUsers),
    SUBSCRIPTION_USERS_BY_USER: (userId: string) => joinBase(paths.abonnement.SUBSCRIPTION_USERS_BY_USER(userId)),
    SUBSCRIPTION_USERS_BY_SUBSCRIPTION: (subscriptionId: string) => joinBase(`${paths.abonnement.subscriptionUsers}?subscriptionId=${subscriptionId}`),
    DELETE_SUBSCRIPTION_USER: (id: string) => joinBase(`${paths.abonnement.subscriptionUsers}/${id}`),
    subscriptionContext: joinBase(paths.abonnement.subscriptionContext)
  },

  // Payment Services
  PAYMENTS: {
    ACCOUNTS: joinBase(paths.payments.accounts),
    WALLETS: joinBase(paths.payments.wallets),
    PAYMENT_METHODS: joinBase(paths.payments.paymentMethods),
    COUNTRIES: joinBase(paths.payments.countries),
    EXCHANGE_RATES: joinBase(paths.payments.exchangeRates),
    TRANSACTION_FEES: {
      CALCULATE: joinBase(paths.payments.transactionFees),
      CALCULATE_SIMPLE: joinBase(paths.payments.transactionFeesSimple),
    },
    PAYMENT_SESSIONS: joinBase(paths.payments.sessions),
    PAYMENTS: {
      INITIALIZE: joinBase(paths.payments.initialize),
      VALIDATE: (token: string) =>
        joinBase(`${paths.payments.validate}/${token}`),
      ORANGE: {
        CREATE: joinBase(paths.payments.orange.create),
        STATUS: (ref: string) =>
          joinBase(`${paths.payments.orange.status}/${ref}`),
        AUTHENTICATE: joinBase(paths.payments.orange.authenticate),
      },
      MOMO: {
        CREATE: joinBase(paths.payments.momo.create),
        VERIFY_ACCOUNT: (msisdn: string) =>
          joinBase(`${paths.payments.momo.verify}/${msisdn}`),
      },
    },
    WITHDRAWALS: {
      INITIALIZE: joinBase(paths.payments.withdrawals.initialize),
      VALIDATE: joinBase(paths.payments.withdrawals.validate),
      STATUS: (id: string) =>
        joinBase(`${paths.payments.withdrawals.status}/${id}/status`),
    },
    TRANSACTIONS: {
      BASE: joinBase(paths.payments.transactions.base),
      BY_ID: (id: string) =>
        joinBase(`${paths.payments.transactions.base}/${id}`),
      HISTORY: joinBase(paths.payments.transactions.history),
    },
  },

  // API Keys Management
  API_KEYS: {
    CLIENTS: joinBase(paths.apiKeys.clients),
    API_KEYS: joinBase(paths.apiKeys.keys),
    VALIDATE: (key: string) => joinBase(`/api/v1/apikeys/validate/${key}`),
    REGENERATE: (id: string) =>
      joinBase(`/api/v1/apikeys/${id}/regenerate`),
  },
};

// Export par défaut pour la compatibilité
export default API_ENDPOINTS;

// Helper pour construire des URLs avec query params
export const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl;

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
};

// ===== UI Metadata & Documentation Support =====

export type DashboardPageKey =
  | "login"
  | "stats"
  | "applications"
  | "abonnements"
  | "users"
  | "payment"
  | "settings";

export const PAGE_LABELS: Record<DashboardPageKey, string> = {
  login: "Connexion / OTP",
  stats: "Statistiques",
  applications: "Applications",
  abonnements: "Abonnements",
  users: "Utilisateurs",
  payment: "Paiements",
  settings: "Paramètres",
};

type EndpointPath = string | ((...args: any[]) => string);

const materializePath = (path: EndpointPath, placeholders: string[] = []) =>
  typeof path === "function" ? path(...placeholders) : path;

export interface EndpointCatalogEntry {
  id: string;
  label: string;
  method: string;
  path: string;
  folder: string;
  pages: DashboardPageKey[];
}

export const endpointCatalog: EndpointCatalogEntry[] = [
  {
    id: "auth-login",
    label: "Connexion",
    method: "POST",
    path: API_ENDPOINTS.AUTH.LOGIN,
    folder: "Authentication",
    pages: ["login", "settings"],
  },
  {
    id: "auth-verify-otp",
    label: "Vérification OTP",
    method: "POST",
    path: API_ENDPOINTS.AUTH.VERIFY_OTP,
    folder: "Authentication",
    pages: ["login"],
  },
  {
    id: "auth-refresh",
    label: "Refresh Token",
    method: "POST",
    path: API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    folder: "Authentication",
    pages: ["login", "settings"],
  },
  {
    id: "auth-logout",
    label: "Déconnexion",
    method: "POST",
    path: API_ENDPOINTS.AUTH.LOGOUT,
    folder: "Authentication",
    pages: ["settings"],
  },
  {
    id: "auth-sessions",
    label: "Sessions actives",
    method: "GET",
    path: API_ENDPOINTS.AUTH.SESSIONS,
    folder: "Authentication",
    pages: ["settings", "users"],
  },
  {
    id: "auth-delete-session",
    label: "Supprimer une session",
    method: "DELETE",
    path: materializePath(API_ENDPOINTS.AUTH.DELETE_SESSION, [":sessionId"]),
    folder: "Authentication",
    pages: ["settings"],
  },
  {
    id: "apps-list",
    label: "Liste des applications",
    method: "GET",
    path: API_ENDPOINTS.ABONNEMENT.APPLICATIONS,
    folder: "Souscriptions",
    pages: ["applications", "stats"],
  },
  {
    id: "apps-create",
    label: "Créer une application",
    method: "POST",
    path: API_ENDPOINTS.ABONNEMENT.APPLICATIONS,
    folder: "Souscriptions",
    pages: ["applications"],
  },
  {
    id: "features-list",
    label: "Liste des fonctionnalités",
    method: "GET",
    path: API_ENDPOINTS.ABONNEMENT.FEATURES,
    folder: "Souscriptions",
    pages: ["applications"],
  },
  {
    id: "plans-list",
    label: "Liste des plans",
    method: "GET",
    path: API_ENDPOINTS.ABONNEMENT.PLANS,
    folder: "Souscriptions",
    pages: ["applications", "abonnements"],
  },
  {
    id: "promotions-create",
    label: "Créer une promotion",
    method: "POST",
    path: API_ENDPOINTS.ABONNEMENT.PROMOTIONS,
    folder: "Souscriptions",
    pages: ["applications", "abonnements"],
  },
  {
    id: "abonnements-list",
    label: "Abonnements",
    method: "GET",
    path: API_ENDPOINTS.ABONNEMENT.ABONNEMENTS,
    folder: "Souscriptions",
    pages: ["abonnements", "stats"],
  },
  {
    id: "abonnements-get-or-create",
    label: "Get or Create Abonnement",
    method: "GET",
    path: materializePath(API_ENDPOINTS.ABONNEMENT.GET_OR_CREATE_ABONNEMENT, [
      ":contextId",
      ":contextType",
    ]),
    folder: "Souscriptions",
    pages: ["abonnements"],
  },
  {
    id: "quota-consume",
    label: "Consommer un quota",
    method: "POST",
    path: API_ENDPOINTS.ABONNEMENT.QUOTA.CONSUME,
    folder: "Souscriptions",
    pages: ["abonnements", "stats"],
  },
  {
    id: "quota-check",
    label: "Vérifier un quota",
    method: "POST",
    path: API_ENDPOINTS.ABONNEMENT.QUOTA.CHECK,
    folder: "Souscriptions",
    pages: ["abonnements"],
  },
  {
    id: "users-list",
    label: "Liste des utilisateurs",
    method: "GET",
    path: API_ENDPOINTS.USERS.BASE,
    folder: "Authentication",
    pages: ["users", "stats"],
  },
  {
    id: "users-profile",
    label: "Profil utilisateur",
    method: "GET",
    path: API_ENDPOINTS.USERS.PROFILE,
    folder: "Authentication",
    pages: ["users", "settings"],
  },
  {
    id: "contacts-add",
    label: "Ajouter un contact",
    method: "POST",
    path: API_ENDPOINTS.USERS.CONTACTS.ADD,
    folder: "Authentication",
    pages: ["users"],
  },
  {
    id: "contact-update-initiate",
    label: "Initier mise à jour contact",
    method: "POST",
    path: API_ENDPOINTS.USERS.CONTACT_UPDATE.INITIATE,
    folder: "Authentication",
    pages: ["users"],
  },
  {
    id: "payments-wallets",
    label: "Wallets",
    method: "GET",
    path: API_ENDPOINTS.PAYMENTS.WALLETS,
    folder: "Payments",
    pages: ["payment", "stats"],
  },
  {
    id: "payments-methods",
    label: "Méthodes de paiement",
    method: "GET",
    path: API_ENDPOINTS.PAYMENTS.PAYMENT_METHODS,
    folder: "Payments",
    pages: ["payment"],
  },
  {
    id: "payments-initialize",
    label: "Initialiser un paiement",
    method: "POST",
    path: API_ENDPOINTS.PAYMENTS.PAYMENTS.INITIALIZE,
    folder: "Payments",
    pages: ["payment"],
  },
  {
    id: "payments-transactions-history",
    label: "Historique transactions",
    method: "GET",
    path: API_ENDPOINTS.PAYMENTS.TRANSACTIONS.HISTORY,
    folder: "Payments",
    pages: ["payment", "stats"],
  },
  {
    id: "api-keys-clients",
    label: "Clients API",
    method: "GET",
    path: API_ENDPOINTS.API_KEYS.CLIENTS,
    folder: "API Keys",
    pages: ["settings"],
  },
  {
    id: "api-keys-list",
    label: "Clés API",
    method: "GET",
    path: API_ENDPOINTS.API_KEYS.API_KEYS,
    folder: "API Keys",
    pages: ["settings"],
  },
];

export const pageEndpointMap: Record<DashboardPageKey, EndpointCatalogEntry[]> = Object.keys(
  PAGE_LABELS,
).reduce(
  (acc, key) => {
    acc[key as DashboardPageKey] = [];
    return acc;
  },
  {} as Record<DashboardPageKey, EndpointCatalogEntry[]>,
);

endpointCatalog.forEach((endpoint) => {
  endpoint.pages.forEach((page) => {
    pageEndpointMap[page].push(endpoint);
  });
});