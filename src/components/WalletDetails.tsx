// src/components/WalletDetails.tsx
import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, AlertCircle, Loader2, Wallet as WalletIcon, RefreshCw, User, Globe, CreditCard, Clock, Activity, Percent, AlertTriangle, Info, Users, FileText } from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from 'sonner';
import paymentService, { formatCurrency, formatDate as formatDateUtil, getStatusBadgeVariant } from "../services/paymentService";
import { Wallet as WalletType, Account, WalletOwner, Currency, Country, Balance } from "../types/payment";

// Alias pour la fonction getWalletsByAccount
const { getWalletsByAccount } = paymentService;

// Alias pour le type Wallet pour éviter les conflits
type AccountWallet = WalletType & {
  walletOwners: WalletOwner[];
  transactionsCount: number;
  webhooksCount: number;
  suspiciousActivitiesCount: number;
  // S'assurer que la propriété currency est compatible
  currency: Currency & { active: boolean };
};

interface WalletDetailsProps {
  wallet: AccountWallet;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function WalletDetails({ wallet, onBack, onRefresh }: WalletDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountWallet[]>([]);

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

  const getStatusBadgeVariant = (status: boolean) => {
    return status ? 'success' : 'destructive';
  };

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await getWalletsByAccount(wallet.account.id);
      
      // Les données sont déjà formatées dans getWalletsByAccount
      setAccounts(response as AccountWallet[]);
    } catch (err) {
      console.error('Erreur lors du chargement des comptes:', err);
      toast.error('Impossible de charger les comptes associés');
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const refreshWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onRefresh();
      await loadAccounts(); // Recharger les comptes après le rafraîchissement
      toast.success('Portefeuille actualisé avec succès');
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError('Impossible de rafraîchir les données du portefeuille');
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les comptes au montage du composant
  useEffect(() => {
    loadAccounts();
  }, [wallet.account.id]);

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={onBack} className="mb-4" style={{cursor: 'pointer'}}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste
      </Button>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <WalletIcon className="h-6 w-6 text-primary" />
                  {wallet.account.accountName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {wallet.account.accountSubName}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={refreshWallet} disabled={isLoading} style={{cursor: 'pointer'}}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Badge variant={wallet.frozen ? "destructive" : "success"}>
                  {wallet.frozen ? `Gelé${wallet.frozenReason ? ` (${wallet.frozenReason})` : ''}` : 'Actif'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span className="font-mono text-xs">ID: {`${wallet.id.substring(0, 8)}...${wallet.id.substring(wallet.id.length - 4)}`}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span className="font-mono text-xs">
                  Propriétaire: {`${wallet.account.userId.substring(0, 6)}...${wallet.account.userId.substring(wallet.account.userId.length - 4)}`}
                </span>
              </div>
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                <span>Pays: {wallet.account.country.nameFr} ({wallet.account.country.code})</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Informations générales
              </h3>
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type de portefeuille:</span>
                  <span className="text-sm font-medium">
                    {getWalletTypeLabel(wallet.walletType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Identifiant légal:</span>
                  <span className="text-sm font-mono">{wallet.legalIdentifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Référence:</span>
                  <div className="text-sm">
                    <div className="font-medium">{wallet.refName}</div>
                    <div className="text-xs text-muted-foreground">{wallet.refId}</div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date de création:</span>
                  <span className="text-sm font-medium">
                    {formatDate(wallet.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernière mise à jour:</span>
                  <span className="text-sm font-medium">
                    {formatDate(wallet.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Informations sur le compte */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Compte associé
                </h4>
                <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mode:</span>
                    <Badge variant={wallet.account.accountMode === 'LIVE' ? 'default' : 'outline'}>
                      {getAccountModeLabel(wallet.account.accountMode)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">ID Compte:</span>
                    <span className="text-xs font-mono">
                      {`${wallet.account.id.substring(0, 6)}...${wallet.account.id.substring(wallet.account.id.length - 4)}`}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">Clé publique</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded mt-1">
                      {`${wallet.account.publicKey.substring(0, 12)}...${wallet.account.publicKey.substring(wallet.account.publicKey.length - 8)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soldes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-primary" />
                Soldes
              </h3>
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                <div className="bg-background p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Solde total</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(wallet.balance.totalBalance, wallet.currency.code)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Disponible</div>
                    <div className="font-medium">
                      {formatCurrency(wallet.balance.balance, wallet.currency.code)}
                    </div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Gelé</div>
                    <div className="font-medium">
                      {formatCurrency(wallet.balance.frozenBalance, wallet.currency.code)}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">En attente:</span>
                    <span>{formatCurrency(wallet.balance.pendingBalance, wallet.currency.code)}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Devise:</span>
                    <span className="font-medium">
                      {wallet.currency.nameFr} ({wallet.currency.code})
                    </span>
                  </div>
                </div>
              </div>

              {/* Statut et propriétaires */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Propriétaires
                </h4>
                <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                  {wallet.walletOwners.length > 0 ? (
                    wallet.walletOwners.map(owner => (
                      <div key={owner.id} className="flex justify-between items-center p-2 bg-background rounded">
                        <div>
                          <div className="text-sm font-medium">
                            {owner.type === 'LEGAL_OWNER' ? 'Propriétaire légal' : 'Propriétaire'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {`${owner.userId.substring(0, 6)}...${owner.userId.substring(owner.userId.length - 4)}`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(owner.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Aucun propriétaire enregistré</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Frais et limites */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Frais et limites
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-3">Frais appliqués</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dépôt:</span>
                    <span className="text-sm font-medium">{wallet.depositFeeRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Retrait:</span>
                    <span className="text-sm font-medium">{wallet.withdrawalFeeRate}%</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-3">Limites</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction max:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(wallet.maxTransactionAmount, wallet.currency.code)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pays:</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{wallet.account.country.nameFr}</div>
                      <div className="text-xs text-muted-foreground">
                        Max: {formatCurrency(wallet.account.country.maxPaymentAmount, wallet.currency.code)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comptes associés */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Comptes associés
            </h3>
            {isLoadingAccounts ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : accounts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <div key={account.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{account.account.accountName}</h4>
                        <p className="text-sm text-muted-foreground">{account.account.accountSubName || 'Sans description'}</p>
                      </div>
                      <Badge variant={account.frozen ? "destructive" : "outline"}>
                        {account.frozen ? 'Gelé' : 'Actif'}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Solde:</span>
                        <span className="font-medium">
                          {formatCurrency(account.balance.balance, account.currency.code)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{getWalletTypeLabel(account.walletType)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transactions:</span>
                        <span>{account.transactionsCount}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        ID: {`${account.id.substring(0, 6)}...${account.id.substring(account.id.length - 4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Créé le: {formatDate(account.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Aucun compte associé trouvé</p>
              </div>
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
                <Button variant="outline" size="sm" onClick={refreshWallet} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
    </div>
  );
}