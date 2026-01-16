// src/components/PaymentMethods.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  MoreVertical,
  Edit,
  Trash2,
  X,
  Search,
  Plus,
  Loader2,
  Eye,
  ArrowLeft,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  XCircle,
  CreditCard,
  DollarSign,
  Globe,
  Shield,
  Zap,
  Lock,
  CheckCircle,
  Percent,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
import { Textarea } from "./ui/textarea";
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
import { Switch } from "./ui/switch";

interface PaymentMethodsProps {
  onMethodSelect?: (method: PaymentMethod) => void;
  onViewDetails?: (method: PaymentMethod) => void;
  showActions?: boolean;
  className?: string;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ 
  onMethodSelect, 
  onViewDetails, 
  showActions = true, 
  className = '' 
}) => {
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

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      // Réinitialiser à la première page lors d'un nouveau chargement
      setCurrentPage(1);
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
    // Réinitialiser à la première page lors d'une recherche
    setCurrentPage(1);
  }, [searchTerm, methods]);

  // Calculer les méthodes à afficher pour la page actuelle
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMethods = filteredMethods.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMethods.length / itemsPerPage);

  // Fonctions de pagination
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si moins de maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Logique pour afficher les pages autour de la page actuelle
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

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

  // Rendu du formulaire de méthode de paiement
  const renderPaymentMethodDialog = () => {
    const handleClose = () => {
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
    };

    return (
      <Dialog open={showAddForm} onOpenChange={(open: boolean) => !open && handleClose()}>
        <DialogContent className="w-[750px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-gray-200 shadow-2xl p-0 bg-white">
          {/* En-tête avec gradient */}
          <div className="relative bg-blue-100 text-gray-900 border-b-2 border-gray-200 rounded-t-2xl px-8 pt-6 pb-8">
            <div className="absolute top-4 right-4">
              <button 
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors p-2 hover:bg-gray-100 rounded-full"
                
              >
                {/* <X className="h-6 w-6" /> */}
              </button>
            </div>
            
            <DialogHeader className="mb-4">
              <div className="flex items-center space-x-4 gap-4">
                <div className="bg-purple-600 hover:bg-purple-700 p-4 rounded-xl text-white shadow-xl">
                  {editingMethod ? (
                    <Edit className="h-7 w-7" />
                  ) : (
                    <Plus className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {editingMethod ? `Modifier "${editingMethod.name}"` : 'Nouvelle méthode de paiement'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-sm mt-2">
                    {editingMethod 
                      ? 'Mettez à jour les détails de cette méthode de paiement.'
                      : 'Configurez une nouvelle méthode de paiement pour votre plateforme.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          {/* Contenu du formulaire */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 bg-white">
            <div className="space-y-8 -mt-4">
              {/* Section Informations de base */}
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-100 transition-colors">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-gray-100 gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Informations de base
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded mr-2 border border-blue-200">Requis</span>
                      Nom de la méthode
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ex: Orange Money"
                        required
                        className="h-12 pl-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                      Identifiant technique
                    </Label>
                    <div className="relative">
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="orange-money"
                        required
                        pattern="[a-z0-9-]+"
                        className="h-12 pl-10 text-sm font-mono border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 pl-1">Utilisé pour les intégrations techniques</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="logoUrl" className="text-sm font-medium text-gray-700">
                      Logo URL
                    </Label>
                    <div className="relative">
                      <Input
                        id="logoUrl"
                        name="logoUrl"
                        type="url"
                        value={formData.logoUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/logo.png"
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg pr-12 transition-all"
                      />
                      {formData.logoUrl && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border-2 border-gray-200 overflow-hidden shadow-sm">
                            <img 
                              src={formData.logoUrl} 
                              alt="Logo preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="referenceCurrency" className="text-sm font-medium text-gray-700">
                      Devise principale
                    </Label>
                    <div className="relative">
                      <select
                        id="referenceCurrency"
                        name="referenceCurrency"
                        value={formData.referenceCurrency}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-8 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white appearance-none transition-all"
                        required
                        style={{cursor: 'pointer'}}
                      >
                        <option value="XOF">XOF - Franc CFA</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="USD">USD - Dollar américain</option>
                      </select>
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Frais et limites */}
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-green-100 transition-colors">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-gray-100 gap-2">
                  <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                    <Percent className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Frais et limites
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="depositFeeRate" className="text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        Frais de dépôt (%)
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded ml-2 border border-blue-200">Requis</span>
                      </div>
                    </Label>
                    <div className="relative">
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
                        className="h-12 pl-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="withdrawalFeeRate" className="text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-500 mr-2" />
                        Frais de retrait (%)
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded ml-2 border border-blue-200">Requis</span>
                      </div>
                    </Label>
                    <div className="relative">
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
                        className="h-12 pl-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-3 ">
                    <Label htmlFor="maxTransactionAmount" className="text-sm font-medium text-gray-700">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-amber-500 mr-2" />
                        Limite par transaction
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="maxTransactionAmount"
                        name="maxTransactionAmount"
                        type="number"
                        min="0"
                        value={formData.maxTransactionAmount}
                        onChange={handleInputChange}
                        className="h-12 pl-16 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <div className="absolute inset-y-0 right-6 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-600 text-sm font-medium">{formData.referenceCurrency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="transactionCooldown" className="text-sm font-medium text-gray-700">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-purple-500 mr-2" />
                        Délai entre transactions
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="transactionCooldown"
                        name="transactionCooldown"
                        type="number"
                        min="0"
                        value={formData.transactionCooldown}
                        onChange={handleInputChange}
                        className="h-12 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg pl-24 transition-all pr-6"
                      />
                      <div className="absolute inset-y-0 right-6 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-600 text-sm font-medium">Secondes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Paramètres avancés */}
              <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-purple-100 transition-colors">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-gray-100 gap-2">
                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Paramètres avancés
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="txTva" className="text-sm font-medium text-gray-700">
                      Taux de TVA (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="txTva"
                        name="txTva"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.txTva}
                        onChange={handleInputChange}
                        className="h-12 pl-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="txPartner" className="text-sm font-medium text-gray-700">
                      Taux partenaire (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="txPartner"
                        name="txPartner"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.txPartner}
                        onChange={handleInputChange}
                        className="h-12 pl-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t-2 border-gray-200">
                <div className="flex space-x-4 px-6 w-full justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
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
                    }}
                    className="h-12 px-6 text-sm font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-8 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl border-2 border-blue-500 hover:border-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        {editingMethod ? 'Mise à jour...' : 'Création...'}
                      </>
                    ) : editingMethod ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Mettre à jour
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer la méthode
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Rendu principal du composant
  if (showAddForm) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen flex flex-col">
        <Button
          variant="outline"
          onClick={() => {
            setShowAddForm(false);
            setEditingMethod(null);
            if (!selectedMethod) {
              setSelectedMethod(null);
            }
          }}
          className="mb-8 rounded-lg border-2 border-gray-300 hover:bg-white shadow-md hover:border-gray-400 transition-all"
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
      <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="mb-8 rounded-lg border-2 border-gray-300 hover:bg-white shadow-md hover:border-gray-400 transition-all"
          style={{ cursor: 'pointer' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>

        <Card className="overflow-hidden border-2 border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-gray-200 pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-2 md:mb-0 gap-4">
                {selectedMethod.logoUrl && (
                  <div className="h-16 w-16 bg-white rounded-xl p-2 shadow-lg border-2 border-gray-100 flex items-center justify-center">
                    <img
                      src={getLogoUrl(selectedMethod.logoUrl)}
                      alt={`Logo ${selectedMethod.name}`}
                      className="h-full w-full object-contain rounded-xl"
                    />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">{selectedMethod.name}</CardTitle>
                  <div className="flex items-center space-x-3 mt-3 gap-4">
                    <Badge 
                      variant={selectedMethod.active ? "default" : "outline"}
                      className={`border-2 ${selectedMethod.active ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                    >
                      {selectedMethod.active ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          Actif
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                          Inactif
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline" className="bg-white text-gray-700 border-2 border-gray-300">
                      {selectedMethod.slug}
                    </Badge>
                  </div>
                </div>
                <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditMethod(selectedMethod)}
                className="bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 rounded-lg transition-all gap-2"
                style={{cursor: 'pointer'}}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border-2 border-blue-100">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-blue-50 gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg border border-blue-200">
                    <Percent className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 ">Frais</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-gray-600">Dépôt:</span>
                    <span className="font-semibold text-gray-900">{formatFeeRate(selectedMethod.depositFeeRate)}</span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-gray-600">Retrait:</span>
                    <span className="font-semibold text-gray-900">{formatFeeRate(selectedMethod.withdrawalFeeRate)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border-2 border-green-100">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-green-50 gap-4">
                  <div className="bg-green-100 p-2 rounded-lg border border-green-200">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Limites</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-gray-600">Max transaction:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(selectedMethod.maxTransactionAmount, selectedMethod.referenceCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-gray-600">Délai:</span>
                    <span className="font-semibold text-gray-900">{selectedMethod.transactionCooldown} sec</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl border-2 border-purple-100">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b-2 border-purple-50 gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg border border-purple-200">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Configuration</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-purple-50 rounded-lg border border-purple-100">
                    <span className="text-gray-600">Devise:</span>
                    <Badge variant="outline" className="font-semibold border-2 border-purple-200">
                      {selectedMethod.referenceCurrency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-6 bg-purple-50 rounded-lg border border-purple-100">
                    <span className="text-gray-600">Multi-devises:</span>
                    <Badge 
                      variant={selectedMethod.supportsMultiCurrency ? "default" : "outline"}
                      className={`border-2 ${selectedMethod.supportsMultiCurrency ? 'bg-green-100 text-green-800 border-green-200' : 'border-gray-200'}`}
                    >
                      {selectedMethod.supportsMultiCurrency ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-6 text-lg">Statistiques</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm text-gray-600">Transactions</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedMethod.transactionsCount || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm text-gray-600">Créé le</div>
                  <div className="text-lg font-semibold text-gray-900 mt-2">
                    {new Date(selectedMethod.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm text-gray-600">Dernière mise à jour</div>
                  <div className="text-lg font-semibold text-gray-900 mt-2">
                    {new Date(selectedMethod.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                  <div className="text-sm text-gray-600">TVA</div>
                  <div className="text-lg font-semibold text-gray-900 mt-2">
                    {selectedMethod.txTva}%
                  </div>
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
      <div className="flex flex-col items-center justify-center h-96 space-y-6 p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Chargement des méthodes de paiement</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 p-8">
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg border border-red-200">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
            <p className="text-red-700 mt-2">{error}</p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="mt-6 border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className={`space-y-8 p-6 ${className}`}>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-blue-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total méthodes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{methods.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actives</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {methods.filter(m => m.active).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-amber-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Moyenne frais</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {methods.length > 0 
                  ? `${(methods.reduce((acc, m) => acc + m.depositFeeRate, 0) / methods.length).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-purple-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {methods.reduce((acc, m) => acc + (m.transactionsCount || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>&nbsp;

      {/* En-tête avec barre de recherche et boutons d'action */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-6 text-white border-2 border-gray-800 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Méthodes de paiement</h2>
            <p className="text-gray-500 mt-3">
              Gérez toutes les méthodes de paiement disponibles sur votre plateforme
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-end">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" style={{ cursor: 'pointer' }} />
              <Input
                type="search"
                placeholder="Rechercher une méthode..."
                className="w-full pl-12 bg-white/10 border-2 border-white/20 text-gray-500 placeholder-white/60 focus:bg-white/15 focus:border-white/40 rounded-lg h-14"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-gray-600 border-2 border-white/20 hover:border-white/40 rounded-lg h-14 w-14"
                style={{ cursor: 'pointer' }}
              >
                {refreshing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </Button>
              
              {showActions && (
                <Button 
                  onClick={() => {
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
                    setShowAddForm(true);
                    setEditingMethod(null);
                  }}
                  className="h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl border-2 border-blue-400 hover:border-blue-500 transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Ajouter une méthode
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>&nbsp;

      {/* Liste des méthodes de paiement */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl border-2 border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{cursor: 'pointer'}}>
            {currentMethods.map((method) => (
              <Card 
                key={method.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-200 rounded-2xl group cursor-pointer hover:border-blue-200"
                onClick={() => handleViewDetails(method)}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-10 transition-opacity group-hover:opacity-20 ${
                  method.active ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                
                <CardHeader className="pb-2 relative z-10 border-b-2 border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4 gap-4">
                      {method.logoUrl ? (
                        <div className="h-16 w-16 bg-gradient-to-br from-white to-gray-50 rounded-xl p-2 shadow-md border-2 border-gray-100">
                          <img
                            src={getLogoUrl(method.logoUrl)}
                            alt={`Logo `}
                            className="h-full w-full object-contain rounded-xl"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-3 shadow-md border border-blue-100">
                          <CreditCard className="h-full w-full text-blue-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {method.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 font-mono mt-1 p-1 bg-gray-50 rounded-xl border border-gray-200 inline-block text-center">
                          {method.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 gap-4">
                      <Badge 
                        variant={method.active ? 'default' : 'secondary'}
                        className={`flex items-center text-xs px-3 py-1.5 rounded-full border-2 ${
                          method.active 
                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {method.active ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                            Actif
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></div>
                            Inactif
                          </>
                        )}
                      </Badge>
                      
                      {showActions && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              style={{cursor: 'pointer'}}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-2 border-gray-200">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(method);
                              }}
                              className="cursor-pointer rounded-lg border-b border-gray-100"
                              style={{cursor: 'pointer'}}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMethod(method);
                              }}
                              className="cursor-pointer rounded-lg border-b border-gray-100"
                              style={{cursor: 'pointer'}}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMethodStatus(method);
                              }}
                              className="cursor-pointer rounded-lg border-b border-gray-100"
                              style={{cursor: 'pointer'}}
                            >
                              {method.active ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMethod(method.id);
                              }}
                              className="text-red-600 cursor-pointer focus:text-red-600 rounded-lg"
                              style={{cursor: 'pointer'}}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 py-6 border-t border-gray-100 bg-gray-100 hover:bg-gray-200 rounded-b-lg shadow-inner">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border-2 border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Dépôt</span>
                        <Percent className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900 px-6 py-6">
                        {formatCurrency(method.depositFeeRate, method.referenceCurrency)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border-2 border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Retrait</span>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(method.withdrawalFeeRate, method.referenceCurrency)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">{method.referenceCurrency}</span>
                      </div>
                      <div className="flex items-center px-2">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">{method.transactionCooldown}s</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {method.transactionsCount || 0} transactions
                      </div>
                      <div className="text-xs text-gray-400">
                        Mis à jour {new Date(method.updatedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {filteredMethods.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t-2 border-gray-200">
              <div className="text-sm text-gray-600">
                Affichage de <span className="font-semibold">{indexOfFirstItem + 1}</span> à <span className="font-semibold">
                  {Math.min(indexOfLastItem, filteredMethods.length)}
                </span> sur <span className="font-semibold">{filteredMethods.length}</span> méthodes
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Bouton Première page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0 border-2 border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Bouton Page précédente */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="h-9 px-3 border-2 border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>

                {/* Numéros de page */}
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className={`h-9 w-9 p-0 border-2 ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                </div>

                {/* Bouton Page suivante */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="h-9 px-3 border-2 border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                {/* Bouton Dernière page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0 border-2 border-gray-300 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Sélecteur d'items par page */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Afficher :</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Retourner à la première page
                  }}
                  className="h-9 px-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="text-sm text-gray-600">par page</span>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Aucune méthode trouvée */}
      {!loading && filteredMethods.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 border-2 border-gray-300">
            <CreditCard className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucune méthode trouvée</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {searchTerm ? 'Aucune méthode ne correspond à votre recherche.' : 'Aucune méthode de paiement configurée.'}
          </p>
          <Button 
            onClick={() => {
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
              setShowAddForm(true);
              setEditingMethod(null);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-2 border-blue-400 hover:border-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter votre première méthode
          </Button>
        </div>
      )}
      
      {renderPaymentMethodDialog()}
    </div>
  );
};

export default PaymentMethods;