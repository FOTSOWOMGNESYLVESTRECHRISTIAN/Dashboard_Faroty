import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, User, Building2, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Account } from "../types/payment";
import { getAccounts } from "../services/paymentService";
import { formatDate, getStatusBadgeVariant } from "../services/paymentService";

interface AccountsProps {
  onViewDetails?: (account: Account) => void;
}

export function Accounts({ onViewDetails }: AccountsProps = {}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAccounts();
      setAccounts(data);
      setInitialLoad(false);
    } catch (err) {
      console.error("Erreur lors du chargement des comptes:", err);
      if (initialLoad) {
        // Ne pas afficher d'erreur au premier chargement, on laisse le chargement s'afficher
        setError(null);
      } else {
        setError("Impossible de charger les comptes. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = accounts.filter(account => 
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.country.nameFr.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={loadAccounts}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Réessayer'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {searchTerm ? "Aucun résultat pour votre recherche." : "Aucun compte disponible pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/50">
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
                    <CardDescription className="mt-1">
                      ID: {account.id} • {account.country.nameFr}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(!account.frozen)}>
                    {account.frozen ? "Gelé" : "Actif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Informations</h4>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Mode:</span>{' '}
                        <span className="font-medium capitalize">{account.accountMode.toLowerCase()}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Pays:</span>{' '}
                        <span className="font-medium">{account.country.nameFr}</span>
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
                        <span className="font-medium">{account.walletsCount}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Méthodes de paiement:</span>{' '}
                        <span className="font-medium">{account.accountPaymentMethodsCount}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Webhooks:</span>{' '}
                        <span className="font-medium">{account.webhooksCount}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => {
                        const handleViewDetails = (account: Account) => {
                          if (onViewDetails) {
                            onViewDetails(account);
                          } else {
                            // Utilisation de window.location comme solution de secours
                            window.location.href = `/accounts/${account.id}`;
                          }
                        };
                        handleViewDetails(account);
                      }}
                    >
                      Voir les détails <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
