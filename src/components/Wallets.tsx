import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Wallet as WalletIcon, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { Wallet } from "../types/payment";
import { getWallets } from "../services/paymentService";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "../services/paymentService";

interface WalletsProps {
  onViewDetails?: (wallet: Wallet) => void;
}

export function Wallets({ onViewDetails }: WalletsProps = {}) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWallets();
      setWallets(data);
      setInitialLoad(false);
    } catch (err) {
      console.error("Erreur lors du chargement des portefeuilles:", err);
      if (initialLoad) {
        // Ne pas afficher d'erreur au premier chargement, on laisse le chargement s'afficher
        setError(null);
      } else {
        setError("Impossible de charger les portefeuilles. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const filteredWallets = wallets.filter(wallet => 
    wallet.legalIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.account.accountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des portefeuilles...</span>
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
          style={{cursor: 'pointer'}}
          onClick={() => window.location.reload()}
        >
          Réessayer
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
            placeholder="Rechercher un portefeuille..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredWallets.length === 0 ? (
        <div className="text-center py-12">
          <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Aucun portefeuille trouvé</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? "Aucun résultat pour votre recherche." : "Aucun portefeuille disponible pour le moment."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWallets.map((wallet) => (
            <Card key={wallet.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-primary" />
                      {wallet.account.accountName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {wallet.legalIdentifier}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(!wallet.frozen)}>
                    {wallet.frozen ? "Gelé" : "Actif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Solde:</span>
                    <span className="font-medium">
                      {formatCurrency(wallet.balance.balance, wallet.currency.code)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Devise:</span>
                    <span className="font-medium">
                      {wallet.currency.code} ({wallet.currency.nameFr})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">
                      {wallet.walletType.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Créé le:</span>
                    <span className="text-sm">
                      {formatDate(wallet.createdAt)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  style={{cursor: 'pointer'}}
                  onClick={() => onViewDetails?.(wallet)}
                >
                  Voir les détails <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
