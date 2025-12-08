import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, AlertCircle, Loader2, User, Building2, RefreshCw, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from 'sonner';
import { Account } from '../types/payment';
import { getAccountById } from '../services/paymentService';

interface AccountDetailsProps {
  accountId: string;
  onBack: () => void;
}

export function AccountDetails({ accountId, onBack }: AccountDetailsProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAccountById(accountId);
      setAccount(data);
    } catch (err) {
      console.error('Erreur lors du chargement du compte:', err);
      setError('Impossible de charger les détails du compte');
      toast.error('Erreur lors du chargement du compte');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement du compte...</span>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error || 'Compte introuvable'}</p>
            <div className="mt-4 space-x-2">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button variant="outline" size="sm" onClick={loadAccount} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div className="flex items-center space-x-2">
          <Badge variant={account.frozen ? "destructive" : "default"}>
            {account.frozen ? "Gelé" : "Actif"}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadAccount} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            {account.accountMode === 'BUSINESS' ? (
              <Building2 className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
            <div>
              <CardTitle>{account.accountName}</CardTitle>
              <CardDescription>ID: {account.id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type de compte</span>
                  <span className="text-sm font-medium">
                    {account.accountMode === 'BUSINESS' ? 'Professionnel' : 'Personnel'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pays</span>
                  <span className="text-sm font-medium">
                    {account.country?.nameFr || 'Non spécifié'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date de création</span>
                  <span className="text-sm font-medium">
                    {format(new Date(account.createdAt), 'PPpp', { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-sm font-medium">
                    {format(new Date(account.updatedAt), 'PPpp', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <WalletIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Portefeuilles</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{account.walletsCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Méthodes de paiement</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">{account.accountPaymentMethodsCount || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {account.frozenReason && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Compte gelé</span> - {account.frozenReason}
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
