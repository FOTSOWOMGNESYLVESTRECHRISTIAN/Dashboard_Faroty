'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from 'lucide-react';
import { getPaymentMethods } from "@/services/paymentService";
import { PaymentMethod } from "@/types/payment";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', err);
      setError('Impossible de charger les méthodes de paiement. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const formatFeeRate = (rate: number): string => {
    return `${rate}%`;
  };

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'}>
      {active ? 'Actif' : 'Inactif'}
    </Badge>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des méthodes de paiement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur !</strong>
        <span className="block sm:inline"> {error}</span>
        <div className="mt-2">
          <Button variant="outline" onClick={fetchPaymentMethods}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Méthodes de paiement</h1>
        <Button onClick={fetchPaymentMethods} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                {method.logoUrl ? (
                  <img 
                    src={method.logoUrl.startsWith('http') ? method.logoUrl : `/api/media/${method.logoUrl.split('/').pop()}`} 
                    alt={method.name}
                    className="h-8 w-8 mr-2 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium text-gray-500">{method.slug}</span>
                  </div>
                )}
                {method.name}
              </CardTitle>
              <div className="flex items-center">
                {getStatusBadge(method.active)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Frais de dépôt</p>
                  <p className="font-medium">{formatFeeRate(method.depositFeeRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frais de retrait</p>
                  <p className="font-medium">{formatFeeRate(method.withdrawalFeeRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Montant max</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: method.referenceCurrency || 'XOF' 
                    }).format(method.maxTransactionAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Délai de traitement</p>
                  <p className="font-medium">{method.transactionCooldown} jour(s)</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Devise de référence</p>
                <p className="font-medium">{method.referenceCurrency}</p>
              </div>
              
              {method.txTva > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">TVA</p>
                  <p className="font-medium">{method.txTva}%</p>
                </div>
              )}
              
              {method.txPartner > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Partenaire</p>
                  <p className="font-medium">{method.txPartner}%</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Transactions actives</p>
                  <p className="font-medium">{method.activeTransactionsCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total transactions</p>
                  <p className="font-medium">{method.transactionsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
