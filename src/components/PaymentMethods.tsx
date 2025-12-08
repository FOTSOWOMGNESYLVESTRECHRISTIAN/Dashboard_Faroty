// src/components/PaymentMethods.tsx
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Plus, Loader2, AlertCircle, X, Save, ArrowLeft, RefreshCw } from "lucide-react";
import { PaymentMethod } from "../types/payment";
import { 
  getPaymentMethods, 
  getPaymentMethodById, 
  updatePaymentMethodStatus, 
  formatDate, 
  formatCurrency, 
  formatFeeRate,
  getStatusBadgeVariant, 
  getLogoUrl, 
  createPaymentMethod 
} from '../services/paymentService';
import { toast } from "sonner";

interface PaymentMethodsProps {
  onMethodSelect?: (method: PaymentMethod) => void;
  onViewDetails?: (method: PaymentMethod) => void;
  showActions?: boolean;
  className?: string;
}

export function PaymentMethods({ onMethodSelect, onViewDetails, showActions = true, className = '' }: PaymentMethodsProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État pour le formulaire
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    depositFeeRate: 0,
    withdrawalFeeRate: 0,
    maxTransactionAmount: 0,
    transactionCooldown: 0,
    txTva: 0,
    txPartner: 0,
    referenceCurrency: "XOF",
    supportsMultiCurrency: false,
    active: true
  });

  const fetchPaymentMethods = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching payment methods...');
      const data = await getPaymentMethods();
      console.log('Payment methods received:', data);
      
      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      setMethods(data);
      setFilteredMethods(data);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      setError(`Impossible de charger les méthodes de paiement: ${errorMessage}`);
      
      // Réinitialiser les données en cas d'erreur
      setMethods([]);
      setFilteredMethods([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMethods(methods);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = methods.filter(method => 
        method.name.toLowerCase().includes(term) || 
        (method.technicalName && method.technicalName.toLowerCase().includes(term))
      );
      setFilteredMethods(filtered);
    }
  }, [searchTerm, methods]);

  const handleRefresh = () => {
    fetchPaymentMethods(true);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    if (onMethodSelect) {
      onMethodSelect(method);
    } else {
      setSelectedMethod(method);
    }
  };

  const handleBackToList = () => {
    setSelectedMethod(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Ici, vous devrez implémenter l'appel à votre API pour créer la méthode de paiement
      await createPaymentMethod(formData);
      toast.success("Méthode de paiement ajoutée avec succès");
      // Recharger la liste des méthodes
      fetchPaymentMethods();
      // Réinitialiser le formulaire
      setShowAddForm(false);
      setFormData({
        name: "",
        slug: "",
        logoUrl: "",
        depositFeeRate: 0,
        withdrawalFeeRate: 0,
        maxTransactionAmount: 0,
        transactionCooldown: 0,
        txTva: 0,
        txPartner: 0,
        referenceCurrency: "XOF",
        supportsMultiCurrency: false,
        active: true
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la méthode de paiement:", error);
      toast.error("Erreur lors de l'ajout de la méthode de paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowAddForm(false)}
              className="h-8 w-8 text-gray-900 dark:text-gray-100 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2">Nouvelle Méthode de Paiement</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Section Informations de base */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                  Informations de base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de la méthode <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Mobile Money, Carte Bancaire, etc."
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Identifiant unique <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-700 dark:border-gray-600">
                        pay_
                      </span>
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="mobile-money"
                        className="flex-1 min-w-0 block w-full rounded-none rounded-r-md"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Utilisé comme identifiant unique dans l'API. Ne contient que des lettres minuscules, des chiffres et des tirets.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL du logo
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        type="url"
                        value={formData.logoUrl}
                        onChange={handleInputChange}
                        placeholder="https://exemple.com/logo.png"
                        className="flex-1"
                      />
                    </div>
                    {formData.logoUrl && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Aperçu :</span>
                        <div className="h-6 w-6 overflow-hidden rounded-full bg-white p-0.5">
                          <img 
                            src={formData.logoUrl} 
                            alt="Logo preview" 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="referenceCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Devise principale <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="referenceCurrency"
                      name="referenceCurrency"
                      value={formData.referenceCurrency}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="XOF">Franc CFA (XOF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">Dollar Américain (USD)</option>
                      <option value="XAF">Franc CFA (XAF)</option>
                      <option value="XOF">Franc CFA (XOF)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Section Frais et limites */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                  Frais et limites
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="depositFeeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Frais de dépôt (%)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="depositFeeRate"
                        name="depositFeeRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.depositFeeRate}
                        onChange={handleInputChange}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="withdrawalFeeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Frais de retrait (%)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="withdrawalFeeRate"
                        name="withdrawalFeeRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.withdrawalFeeRate}
                        onChange={handleInputChange}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="maxTransactionAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Montant maximum par transaction
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="maxTransactionAmount"
                        name="maxTransactionAmount"
                        type="number"
                        min="0"
                        value={formData.maxTransactionAmount}
                        onChange={handleInputChange}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{formData.referenceCurrency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="transactionCooldown" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Délai de refroidissement
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="transactionCooldown"
                        name="transactionCooldown"
                        type="number"
                        min="0"
                        value={formData.transactionCooldown}
                        onChange={handleInputChange}
                        className="pr-24"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">secondes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section Paramètres avancés */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                  Paramètres avancés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="txTva" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taux de TVA (%)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="txTva"
                        name="txTva"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.txTva}
                        onChange={handleInputChange}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="txPartner" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Commission partenaire (%)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <Input
                        id="txPartner"
                        name="txPartner"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.txPartner}
                        onChange={handleInputChange}
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 col-span-full">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="supportsMultiCurrency"
                          name="supportsMultiCurrency"
                          checked={formData.supportsMultiCurrency}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="supportsMultiCurrency" className="font-medium text-gray-700 dark:text-gray-300"> &nbsp;
                          Supporte plusieurs devises
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">  &nbsp;
                          Activez cette option si cette méthode de paiement peut traiter des transactions dans différentes devises.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="active"
                          name="active"
                          checked={formData.active}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="active" className="font-medium text-gray-700 dark:text-gray-300">  &nbsp;
                          Méthode active
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">  &nbsp;
                          Désactivez cette option pour masquer cette méthode de paiement dans l'interface utilisateur.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions du formulaire */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer la méthode
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedMethod) {
    // Utilisez le composant de détail existant ou implémentez-en un nouveau
    return (
      <div className="p-4">
        <Button 
          variant="outline" 
          onClick={handleBackToList}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{selectedMethod.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedMethod.logoUrl && (
                <div className="h-20 w-20">
                  <img
                    src={getLogoUrl(selectedMethod.logoUrl)}
                    alt={`Logo ${selectedMethod.name}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium">{selectedMethod.slug}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={selectedMethod.active ? "default" : "outline"}>
                    {selectedMethod.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Frais de dépôt</p>
                  <p className="font-medium">{formatFeeRate(selectedMethod.depositFeeRate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Frais de retrait</p>
                  <p className="font-medium">{formatFeeRate(selectedMethod.withdrawalFeeRate)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Montant max/transaction</p>
                  <p className="font-medium">
                    {formatCurrency(selectedMethod.maxTransactionAmount, selectedMethod.referenceCurrency)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Délai de refroidissement</p>
                  <p className="font-medium">{selectedMethod.transactionCooldown} secondes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des méthodes de paiement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
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
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Méthodes de paiement</h2>
          <p className="text-sm text-muted-foreground">
            Gérer les méthodes de paiement disponibles
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une méthode..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Rafraîchir"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {showActions && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {filteredMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune méthode trouvée</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm 
                ? "Aucune méthode ne correspond à votre recherche."
                : "Aucune méthode de paiement n'est disponible pour le moment."}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setSearchTerm('')}
              >
                Réinitialiser la recherche
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMethods.map((method) => (
            <Card 
              key={method.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleMethodSelect(method)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                  <Badge 
                    variant={method.active ? "default" : "outline"}
                    className={method.active 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                      : ""
                    }
                  >
                    {method.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {method.logoUrl && !method.logoUrl.startsWith('/var/') && (
                    <div className="h-20 w-20 mb-3">
                      <img
                        src={getLogoUrl(method.logoUrl)}
                        alt={`Logo ${method.name}`}
                        className="h-20 w-20 object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Frais de dépôt:</div>
                    <div className="font-medium text-right">
{formatCurrency(method.depositFeeRate, method.referenceCurrency)}
                    </div>
                    
                    <div className="text-muted-foreground">Frais de retrait:</div>
                    <div className="font-medium text-right">
{formatCurrency(method.withdrawalFeeRate, method.referenceCurrency)}
                    </div>
                    
                    <div className="text-muted-foreground">Devise:</div>
                    <div className="font-medium text-right">
                      {method.referenceCurrency}
                    </div>
                    
                    <div className="text-muted-foreground">Transactions:</div>
                    <div className="font-medium text-right">
                      {method.transactionsCount}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Mis à jour le {new Date(method.updatedAt).toLocaleDateString('fr-FR')}
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

export default PaymentMethods;