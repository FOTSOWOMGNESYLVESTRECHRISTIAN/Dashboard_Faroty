// src/components/PaymentMethods.tsx
import { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  MoreVertical,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Plus,
  Loader2,
  Eye,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Clock,
  DollarSign,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { CreatePaymentMethodRequest, PaymentMethod } from "../types/payment";
import {
  getPaymentMethods,
  formatCurrency,
  formatFeeRate,
  getLogoUrl,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
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
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // État pour le formulaire
  const [formData, setFormData] = useState<CreatePaymentMethodRequest>({
    name: "",
    slug: "",
    technicalName: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Générer automatiquement le slug à partir du nom
    if (name === 'name' && !formData.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        slug,
        technicalName: prev.technicalName || slug
      }));
    }
  };

  const handleViewDetails = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (onViewDetails) {
      onViewDetails(method);
    }
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setFormData({
      name: method.name,
      slug: method.slug,
      technicalName: method.technicalName,
      logoUrl: method.logoUrl,
      depositFeeRate: method.depositFeeRate,
      withdrawalFeeRate: method.withdrawalFeeRate,
      maxTransactionAmount: method.maxTransactionAmount,
      transactionCooldown: method.transactionCooldown,
      txTva: method.txTva,
      txPartner: method.txPartner,
      referenceCurrency: method.referenceCurrency,
      supportsMultiCurrency: method.supportsMultiCurrency,
      active: method.active
    });
    setEditingMethod(method);
    setShowAddForm(true);
  };

  const handleUpdatePaymentMethod = async () => {
    if (!editingMethod) return;

    try {
      setIsSubmitting(true);

      const updatedMethod = await updatePaymentMethod(editingMethod.id, formData);

      // Mettre à jour la liste des méthodes
      setMethods(prev =>
        prev.map(m => m.id === updatedMethod.id ? updatedMethod : m)
      );

      toast.success("Méthode de paiement mise à jour avec succès");
      setShowAddForm(false);
      setEditingMethod(null);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de la méthode de paiement:", error);
      toast.error(error.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?")) {
      return;
    }

    try {
      await deletePaymentMethod(methodId);

      // Mettre à jour la liste des méthodes
      setMethods(prev => prev.filter(m => m.id !== methodId));

      toast.success("Méthode de paiement supprimée avec succès");
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la méthode de paiement:", error);
      toast.error(error.message || "Une erreur est survenue lors de la suppression");
    }
  };

  const toggleMethodStatus = async (method: PaymentMethod, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Empêcher le déclenchement du clic sur la carte

    try {
      const newStatus = !method.active;

      // Créer un objet avec uniquement les champs nécessaires pour la mise à jour
      const updateData = {
        name: method.name,
        slug: method.slug,
        technicalName: method.technicalName,
        logoUrl: method.logoUrl,
        depositFeeRate: method.depositFeeRate,
        withdrawalFeeRate: method.withdrawalFeeRate,
        maxTransactionAmount: method.maxTransactionAmount,
        transactionCooldown: method.transactionCooldown,
        txTva: method.txTva,
        txPartner: method.txPartner,
        referenceCurrency: method.referenceCurrency,
        supportsMultiCurrency: method.supportsMultiCurrency,
        active: newStatus
      };

      // Mettre à jour la méthode via l'API
      const updatedMethod = await updatePaymentMethod(method.id, updateData);

      // Mettre à jour la méthode dans la liste locale immédiatement pour un retour visuel rapide
      setMethods(prevMethods =>
        prevMethods.map(m =>
          m.id === method.id
            ? { ...m, active: newStatus, updatedAt: new Date().toISOString() }
            : m
        )
      );

      // Si la méthode est sélectionnée, la mettre à jour aussi
      if (selectedMethod?.id === method.id) {
        setSelectedMethod(prev => ({
          ...prev!,
          active: newStatus,
          updatedAt: new Date().toISOString()
        }));
      }

      // Rafraîchir les données depuis le serveur pour s'assurer de la cohérence
      fetchPaymentMethods();

      toast.success(`Méthode de paiement ${newStatus ? 'activée' : 'désactivée'} avec succès`);
    } catch (error: any) {
      console.error("Erreur lors du changement de statut de la méthode de paiement:", error);

      // Annuler visuellement le changement en cas d'erreur
      setMethods(prevMethods =>
        prevMethods.map(m =>
          m.id === method.id
            ? { ...m, active: method.active } // Rétablir l'ancienne valeur
            : m
        )
      );

      toast.error(error.message || "Une erreur est survenue lors de la mise à jour du statut");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Le nom de la méthode est requis");
      return false;
    }
    if (!formData.slug.trim()) {
      toast.error("Le slug est requis");
      return false;
    }
    if (formData.depositFeeRate < 0 || formData.depositFeeRate > 100) {
      toast.error("Le taux de dépôt doit être compris entre 0 et 100");
      return false;
    }
    if (formData.withdrawalFeeRate < 0 || formData.withdrawalFeeRate > 100) {
      toast.error("Le taux de retrait doit être compris entre 0 et 100");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Si nous sommes en mode édition, appeler updatePaymentMethod au lieu de createPaymentMethod
    if (editingMethod) {
      await handleUpdatePaymentMethod();
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données pour l'API
      const payload: CreatePaymentMethodRequest = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        technicalName: (formData.technicalName || formData.slug).trim().toLowerCase().replace(/\s+/g, '-'),
        logoUrl: formData.logoUrl.trim() || '',
        depositFeeRate: Number(formData.depositFeeRate) || 0,
        withdrawalFeeRate: Number(formData.withdrawalFeeRate) || 0,
        maxTransactionAmount: Number(formData.maxTransactionAmount) || 0,
        transactionCooldown: Number(formData.transactionCooldown) || 0,
        txTva: Number(formData.txTva) || 0,
        txPartner: Number(formData.txPartner) || 0,
        referenceCurrency: formData.referenceCurrency || 'XOF',
        supportsMultiCurrency: Boolean(formData.supportsMultiCurrency),
        active: formData.active !== undefined ? Boolean(formData.active) : true
      };

      console.log('Soumission des données du formulaire:', JSON.stringify(payload, null, 2));

      // Appel à l'API
      await createPaymentMethod(payload);

      // Afficher un message de succès
      toast.success("Méthode de paiement ajoutée avec succès");

      // Recharger la liste des méthodes de paiement
      await fetchPaymentMethods();

      // Fermer le formulaire
      setShowAddForm(false);

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        slug: "",
        technicalName: "",
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
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la méthode de paiement:", error);

      // Afficher un message d'erreur détaillé
      let errorMessage = "Une erreur est survenue lors de l'ajout de la méthode de paiement";

      if (error.message) {
        // Si le message d'erreur est une chaîne JSON, essayer de le parser
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.message || errorData.error || errorMessage;

          // Si des erreurs de validation sont disponibles, les afficher
          if (errorData.errors) {
            const validationErrors = Object.values(errorData.errors).flat().join('\n');
            errorMessage = `Erreurs de validation :\n${validationErrors}`;
          }
        } catch (e) {
          // Si le message n'est pas du JSON, l'utiliser tel quel
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render logic moved to the main return
  const renderPaymentMethodDialog = () => (
    <Dialog open={showAddForm} onOpenChange={(open: boolean) => {
      if (!open) {
        setShowAddForm(false);
        setEditingMethod(null);
        setFormData({
          name: "",
          slug: "",
          technicalName: "",
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
      }
    }}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-amber-500 hover:bg-amber-600 rounded-lg pb-6 border-gray-100 sticky top-0 z-30 px-6 pt-6 shadow-lg border-b">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {editingMethod ? `Modifier ${editingMethod.name}` : 'Ajouter une méthode de paiement'}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Configurez les détails et les frais de la méthode de paiement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-1">
          <div className="grid gap-6 py-6 font-medium">
            {/* Section Informations de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-1">
                Informations de base
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-gray-700">
                    Nom de la méthode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Mobile Money"
                    required
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="font-semibold text-gray-700">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="ex: orange-money"
                    required
                    pattern="[a-z0-9-]+"
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transition-all font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl" className="font-semibold text-gray-700">
                    URL du logo
                  </Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceCurrency" className="font-semibold text-gray-700">
                    Devise de référence <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="referenceCurrency"
                    name="referenceCurrency"
                    value={formData.referenceCurrency}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="XOF">XOF - Franc CFA</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dollar américain</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Frais et limites */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-1 pt-2">
                Frais et limites
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositFeeRate" className="font-semibold text-gray-700">
                      Frais dépôt (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="depositFeeRate"
                      name="depositFeeRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.depositFeeRate}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFeeRate" className="font-semibold text-gray-700">
                      Frais retrait (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="withdrawalFeeRate"
                      name="withdrawalFeeRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.withdrawalFeeRate}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTransactionAmount" className="font-semibold text-gray-700">
                    Montant Max
                  </Label>
                  <div className="relative">
                    <Input
                      id="maxTransactionAmount"
                      name="maxTransactionAmount"
                      type="number"
                      min="0"
                      value={formData.maxTransactionAmount}
                      onChange={handleInputChange}
                      className="pr-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs font-bold">{formData.referenceCurrency}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionCooldown" className="font-semibold text-gray-700">
                    Délai (sec)
                  </Label>
                  <div className="relative">
                    <Input
                      id="transactionCooldown"
                      name="transactionCooldown"
                      type="number"
                      min="0"
                      value={formData.transactionCooldown}
                      onChange={handleInputChange}
                      className="pr-16 border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs font-bold">secondes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Paramètres avancés */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-1 pt-2">
                Avancé
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="txTva" className="font-semibold text-gray-700">
                      TVA (%)
                    </Label>
                    <Input
                      id="txTva"
                      name="txTva"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.txTva}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txPartner" className="font-semibold text-gray-700">
                      Partenaire (%)
                    </Label>
                    <Input
                      id="txPartner"
                      name="txPartner"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.txPartner}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 transaction-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="supportsMultiCurrency"
                      name="supportsMultiCurrency"
                      checked={formData.supportsMultiCurrency}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="supportsMultiCurrency" className="font-normal text-gray-700 cursor-pointer">
                      Supporte plusieurs devises
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="active" className="font-normal text-gray-700 cursor-pointer">
                      Méthode active
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-gray-100 mt-2 sticky bottom-0 bg-white pb-6 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingMethod(null);
              }}
              disabled={isSubmitting}
              className="hover:bg-gray-50 border-gray-200"
              style={{ cursor: 'pointer' }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 border-none hover:shadow-lg transition-all cursor-pointer text-white"
              style={{ cursor: 'pointer' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  );

  // Si on est en mode édition, on affiche le formulaire
  if (showAddForm) {
    return (
      <div className="p-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowAddForm(false);
            setEditingMethod(null);
            if (!selectedMethod) {
              // Si on était en train de créer une nouvelle méthode, on revient à la liste
              setSelectedMethod(null);
            }
          }}
          className="mb-4"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {selectedMethod ? 'Retour aux détails' : 'Retour à la liste'}
        </Button>
        {renderPaymentMethodDialog()}
      </div>
    );
  }

  // Si une méthode est sélectionnée, on affiche ses détails
  if (selectedMethod) {
    return (
      <div className="p-4">
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="mb-4"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedMethod.name}</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditMethod(selectedMethod)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              <span>Modifier</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedMethod.logoUrl && (
                <div className="h-20 w-20">
                  <img
                    src={getLogoUrl(selectedMethod.logoUrl)}
                    alt={`Logo ${selectedMethod.name}`}
                    className="h-20 w-20 object-contain rounded-full"
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
    <div className="space-y-8">
      {/* En-tête amélioré */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Méthodes de paiement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les méthodes de paiement disponibles sur la plateforme
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 hover:shadow-md"
            style={{cursor:'pointer'}}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une méthode
          </Button>
        </div>
        
        {/* Barre de recherche améliorée */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une méthode de paiement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-input bg-background hover:border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all duration-200 rounded-lg h-10"
          />
        </div>
      </div>

      {filteredMethods.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Aucune méthode trouvée</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              {searchTerm 
                ? `Aucun résultat pour "${searchTerm}". Essayez un autre terme.` 
                : "Commencez par ajouter votre première méthode de paiement."}
            </p>
            <div className="mt-6 flex gap-3">
              {searchTerm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="border-muted-foreground/30 hover:bg-muted/20"
                >
                  Réinitialiser la recherche
                </Button>
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une méthode
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <Card
              key={method.id}
              className="group border border-border/50 hover:border-purple-200 hover:shadow-md transition-all duration-300 overflow-hidden"
              onClick={() => handleMethodSelect(method)}
            >
              <div className="relative">
                {/* Badge d'état */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge 
                    variant={method.active ? "default" : "secondary"}
                    className={`px-2 py-1 text-xs font-medium ${
                      method.active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {method.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3 pt-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {method.logoUrl ? (
                        <img 
                          src={method.logoUrl} 
                          alt={method.name} 
                          className="h-10 w-10 rounded-md object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {method.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {method.technicalName}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(method);
                          }}
                          className="flex items-center text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMethod(method);
                          }}
                          className="flex items-center text-amber-600 hover:bg-amber-50"
                          className="cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            toggleMethodStatus(method, e);
                          }}
                          className="cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          {method.active ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              <span>Désactiver</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              <span>Activer</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteMethod(method.id);
                          }}
                          className="text-red-600 cursor-pointer focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          style={{ cursor: 'pointer' }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Logo et informations principales */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Devise</div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{method.referenceCurrency || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Frais de dépôt</div>
                      <div className="font-medium">
                        {method.depositFeeRate ? `${method.depositFeeRate}%` : '0%'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Frais de retrait</div>
                      <div className="font-medium">
                        {method.withdrawalFeeRate ? `${method.withdrawalFeeRate}%` : '0%'}
                      </div>
                    </div>
                  </div>

                  {/* Détails supplémentaires */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Montant max</div>
                      <div className="font-medium">
                        {method.maxTransactionAmount 
                          ? formatCurrency(method.maxTransactionAmount, method.referenceCurrency || 'XOF')
                          : 'Illimité'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Délai de traitement</div>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {method.transactionCooldown ? `${method.transactionCooldown} min` : 'Immédiat'}
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action principal */}
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(method);
                      }}
                    >
                      <span>Voir les détails</span>
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>

                  {/* Logo (déplacé en bas) */}
                  {method.logoUrl && !method.logoUrl.startsWith('/var/') && (
                    <div className="flex justify-center pt-2">
                      <div className="h-16 w-16 p-2 bg-muted/30 rounded-lg">
                        <img
                          src={getLogoUrl(method.logoUrl)}
                          alt={`Logo ${method.name}`}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {renderPaymentMethodDialog()}
    </div>
  );
}
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-1">
        <div className="text-muted-foreground">Montant max</div>
        <div className="font-medium">
          {method.maxTransactionAmount 
            ? formatCurrency(method.maxTransactionAmount, method.referenceCurrency || 'XOF')
            : 'Illimité'}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-muted-foreground">Délai de traitement</div>
        <div className="font-medium flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {method.transactionCooldown ? `${method.transactionCooldown} min` : 'Immédiat'}
        </div>
      </div>
    </div>

    {/* Bouton d'action principal */}
    <div className="pt-2">
      <Button 
        variant="outline" 
        className="w-full justify-between group"
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(method);
        }}
      >
        <span>Voir les détails</span>
        <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    </div>

    {/* Logo (déplacé en bas) */}
    {method.logoUrl && !method.logoUrl.startsWith('/var/') && (
      <div className="flex justify-center pt-2">
        <div className="h-16 w-16 p-2 bg-muted/30 rounded-lg">
          <img
            src={getLogoUrl(method.logoUrl)}
            alt={`Logo ${method.name}`}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {renderPaymentMethodDialog()}
      </div>
    );
  }

export default PaymentMethods;