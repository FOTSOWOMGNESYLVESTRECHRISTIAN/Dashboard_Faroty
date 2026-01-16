import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, User, Building2, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Account } from "../types/payment";
import { getAccounts } from "../services/paymentService";
import { formatDate, getStatusBadgeVariant } from "../services/paymentService";
import { ActionMenu } from './ui/ActionMenu';
import { message, Modal } from 'antd';
import { AccountDetails } from "./AccountDetails";

// Fonctions simulées pour les appels API
const updateAccountStatus = async (accountId: string, status: 'active' | 'suspended' | 'cancelled' | 'deleted'): Promise<{ success: boolean }> => {
  // Implémentation simulée
  console.log(`Mise à jour du statut du compte ${accountId} à ${status}`);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

const deleteAccount = async (accountId: string): Promise<{ success: boolean }> => {
  // Implémentation simulée
  console.log(`Suppression du compte ${accountId}`);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

interface ApplicationDetailAccountsProps {
  applicationId: string;
  onViewDetails?: (account: Account) => void;
}

export function ApplicationDetailAccounts({
  applicationId,
  onViewDetails
}: ApplicationDetailAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [accountsData, setAccountsData] = useState<Account[]>([]);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const allAccounts = await getAccounts();
      // Ajout d'un statut par défaut si non défini
      const accountsWithStatus = allAccounts.map(account => ({
        ...account,
        status: account.status || 'active' as const
      }));
      setAccounts(accountsWithStatus);
      setFilteredAccounts(accountsWithStatus);
    } catch (err) {
      console.error("Erreur lors du chargement des comptes:", err);
      setError("Impossible de charger les comptes. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (accountId: string, newStatus: 'suspended' | 'cancelled') => {
    try {
      setProcessing(prev => ({ ...prev, [accountId]: true }));
      await updateAccountStatus(accountId, newStatus);
      message.success(`Statut du compte mis à jour avec succès`);
      await loadAccounts();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      message.error("Erreur lors de la mise à jour du statut du compte");
    } finally {
      setProcessing(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer définitivement ce compte ? Cette action est irréversible.',
      okText: 'Oui, supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setProcessing(prev => ({ ...prev, [accountId]: true }));
          await deleteAccount(accountId);
          message.success('Compte supprimé avec succès');
          await loadAccounts();
        } catch (error) {
          console.error("Erreur lors de la suppression du compte:", error);
          message.error("Erreur lors de la suppression du compte");
        } finally {
          setProcessing(prev => ({ ...prev, [accountId]: false }));
        }
      },
    });
  };

  const handleActivateAccount = async (accountId: string) => {
    try {
      setProcessing(prev => ({ ...prev, [accountId]: true }));
      await updateAccountStatus(accountId, 'active');
      message.success('Compte activé avec succès');
      await loadAccounts();
    } catch (error) {
      console.error("Erreur lors de l'activation du compte:", error);
      message.error("Erreur lors de l'activation du compte");
    } finally {
      setProcessing(prev => ({ ...prev, [accountId]: false }));
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [applicationId]);

  useEffect(() => {
    // Filtrer les comptes en fonction du terme de recherche
    if (searchTerm.trim() === "") {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account =>
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.country?.nameFr?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, accounts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des comptes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              La fonctionnalité de filtrage des comptes par application n'est pas encore disponible. Tous les comptes sont affichés pour le moment.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un compte..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Aucun compte trouvé</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "Aucun résultat pour votre recherche."
              : "Aucun compte n'a été trouvé dans le système."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <CardHeader className="pb-2 bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {account.accountMode === 'BUSINESS' ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                      {account.accountName}
                      {account.accountSubName && (
                        <span className="text-muted-foreground font-normal">
                          ({account.accountSubName})
                        </span>
                      )}
                    </CardTitle>
                    {/* <CardDescription className="mt-1">
                      ID: {account.id} • {account.country?.nameFr || 'Pays non spécifié'}
                    </CardDescription> */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(account.status)}>
                      {account.status}
                    </Badge>
                    <ActionMenu
                      status={account.status}
                      onSuspend={() => handleStatusChange(account.id, 'suspended')}
                      onCancel={() => handleStatusChange(account.id, 'cancelled')}
                      onDelete={() => handleDeleteAccount(account.id)}
                      onActivate={() => handleActivateAccount(account.id)}
                      itemType="account"
                      disabled={processing[account.id]}
                      
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Informations</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Mode:</span>{' '}
                        <span className="font-medium capitalize">
                          {account.accountMode ? account.accountMode.toLowerCase() : 'non spécifié'}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Pays:</span>{' '}
                        <span className="font-medium">{account.country?.nameFr || 'Non spécifié'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Créé le:</span>{' '}
                        <span className="font-medium">{formatDate(account.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Statistiques</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Portefeuilles:</span>{' '}
                        <span className="font-medium">{account.walletsCount || 0}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Méthodes de paiement:</span>{' '}
                        <span className="font-medium">{account.accountPaymentMethodsCount || 0}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Webhooks:</span>{' '}
                        <span className="font-medium">{account.webhooksCount || 0}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => {
                        if (expandedAccountId === account.id) {
                          setExpandedAccountId(null);
                        } else {
                          setExpandedAccountId(account.id);
                        }
                      }}
                      style={{cursor: 'pointer'}}
                    >
                      {expandedAccountId === account.id ? (
                        <>Fermer les détails <ChevronRight className="ml-2 h-4 w-4 rotate-90" /></>
                      ) : (
                        <>Voir les détails <ChevronRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Zone de détails inline */}
                {expandedAccountId === account.id && (
                  <div className="mt-6 border-t pt-6 bg-slate-50 rounded-b-lg -mx-6 -mb-6 px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <AccountDetails
                      accountId={account.id}
                      onBack={() => setExpandedAccountId(null)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
