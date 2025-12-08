// src/components/PaymentMethodDetails.tsx
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent } from "./ui/tabs";
import { ArrowLeft, Check, Loader2, X, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { PaymentMethod } from "../types/payment";
import { updatePaymentMethodStatus, formatDate } from "../services/paymentService";
import { toast } from "sonner";

interface PaymentMethodDetailsProps {
  method: PaymentMethod;
  onBack: () => void;
}

export function PaymentMethodDetails({ method: initialMethod, onBack }: PaymentMethodDetailsProps) {
  const [method, setMethod] = useState(initialMethod);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: boolean) => {
    if (!method) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel au service pour mettre à jour le statut
      const updatedMethod = await updatePaymentMethodStatus(method.id, newStatus);
      
      // Mettre à jour l'état local avec la méthode mise à jour
      setMethod(updatedMethod);
      
      // Afficher un message de succès
      toast.success(`Méthode de paiement ${newStatus ? 'activée' : 'désactivée'} avec succès`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut. Veuillez réessayer.');
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  };

  if (!method) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des détails...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="pl-0"
        onClick={onBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{method.name}</CardTitle>
              <CardDescription className="mt-1">
                {method.technicalName}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={method.active ? "default" : "secondary"}>
                {method.active ? "Actif" : "Inactif"}
              </Badge>
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={method.active}
                  onCheckedChange={handleStatusChange}
                  disabled={isLoading}
                />
                <Label htmlFor="status">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : method.active ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Devise de référence
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.referenceCurrency}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Frais de dépôt
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.depositFeeRate}%
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Frais de retrait
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.withdrawalFeeRate}%
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Transactions actives
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.activeTransactionsCount}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Montant max. par transaction
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.maxTransactionAmount.toLocaleString()} {method.referenceCurrency}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Délai de traitement
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {method.transactionCooldown} minutes
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Informations supplémentaires
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Supporte plusieurs devises
                    </h4>
                    <p className="mt-1">
                      {method.supportsMultiCurrency ? "Oui" : "Non"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      TVA
                    </h4>
                    <p className="mt-1">{method.txTva}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Partenaire
                    </h4>
                    <p className="mt-1">{method.txPartner}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Date de création
                    </h4>
                    <p className="mt-1">
                      {formatDate(method.createdAt)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Identifiant technique
                    </h4>
                    <p className="mt-1 font-mono text-sm">{method.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Slug
                    </h4>
                    <p className="mt-1">{method.slug}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline" onClick={onBack}>
            Retour à la liste
          </Button>
          <div className="space-x-2">
            <Button variant="outline" disabled>
              Modifier
            </Button>
            <Button disabled>Enregistrer les modifications</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}