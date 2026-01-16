import * as XLSX from "xlsx";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

// Interface pour les plans d'abonnement
type AbonnementPlan = {
  planId: string;
  planName: string;
  interval: 'month' | 'year';
  price: number;
  currency: string;
  features: Array<{
    featureId: string;
    featureName: string;
    limit: number | null;
    used?: number;
  }>;
};

type AbonnementItem = {
  id: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string | Date;
  endDate: string | Date;
  originalPrice: number;
  finalPrice: number;
  currency: string;
  promotionPrice: number | null;
  promotionCode: string | null;
  contextName: string;
  numberOfPeople: number;
  application: string;
  applicationId?: string;
  contextId?: string;
  contextType?: string;
  isFreeSubscription?: boolean;
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'DAILY';
  autoRenew?: boolean;
  cancelledAt?: number | null;
  cancelReason?: string | null;
  plans: Array<{
    planId: string;
    planName: string;
    interval: 'month' | 'year';
    price: number;
    currency: string;
    features: Array<{
      featureId: string;
      featureName: string;
      limit: number | null;
      used?: number;
    }>;
  }>;
  people: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Search,
  Download,
  Filter,
  Eye,
  Tag,
  Users,
  Layers,
  CreditCard as CreditCardIcon,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AbonnementDetails, Abonnement } from "./AbonnementDetails";
import { abonnementService } from "../services/abonnementService";
import type { PaginatedResponse } from "../services/abonnementService";
import { toast } from "sonner";

const statusColors = {
  active: "bg-green-600",
  expired: "bg-red-500",
  cancelled: "bg-gray-400",
};

const statusLabels = {
  active: "Actif",
  expired: "Expiré",
  cancelled: "Annulé",
};

// Les données sont maintenant récupérées depuis l'API via abonnementService

interface AbonnementsProps {
  onViewDetails?: (abonnement: Abonnement) => void;
}

export function Abonnements({ onViewDetails }: AbonnementsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [abonnements, setAbonnements] = useState<AbonnementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Fonction pour formater le prix
  const formatPrice = (price: number, currency: string = 'XOF'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const totalFinalPrice = useMemo(() => {
    return (abonnements as unknown as AbonnementItem[]).reduce(
      (sum, abonnement) => sum + (abonnement.finalPrice || 0),
      0
    );
  }, [abonnements]);

  const cancelledCount = useMemo(() => {
    return (abonnements as unknown as AbonnementItem[]).filter(
      (a) => a.status === 'cancelled'
    ).length;
  }, [abonnements]);

  const loadAbonnements = useCallback(async (pageNum: number = 0) => {
    console.log("Chargement des abonnements, page:", pageNum);
    setIsLoading(true);
    try {
      console.log("Appel à abonnementService.getAllAbonnements...");
      const result = await abonnementService.getAllAbonnements(pageNum, size);
      console.log("Résultat reçu:", result);

      // Vérifier si result.content existe et est un tableau
      const content = Array.isArray(result?.content) ? result.content : [];
      console.log("Contenu des abonnements:", content);

      // S'assurer que les données sont correctement typées
      const typedContent = content as AbonnementItem[];

      setAbonnements(typedContent);
      setPage(result?.page || 0);
      setTotalPages(result?.totalPages || 1);
      setTotalElements(result?.totalElements || 0);

      // Vérifier si les données sont valides
      console.log('Données chargées:', {
        count: typedContent.length,
        firstItem: typedContent[0],
        hasContextName: typedContent[0]?.contextName !== undefined,
        hasApplication: typedContent[0]?.application !== undefined
      });

      if (content.length === 0) {
        console.warn("Aucun abonnement trouvé dans la réponse");
        toast.info("Aucun abonnement trouvé");
      }
    } catch (error: any) {
      console.error("[Abonnements] Erreur lors du chargement des abonnements:", error);

      // Afficher plus de détails sur l'erreur
      const errorMessage = error?.message || "Erreur inconnue";
      const errorStatus = error?.response?.status;
      const errorData = error?.response?.data;

      console.error("Détails de l'erreur:", {
        message: errorMessage,
        status: errorStatus,
        data: errorData,
        stack: error?.stack
      });

      // Gestion des erreurs spécifiques
      if (errorStatus === 403) {
        toast.error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
      } else if (errorStatus === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
      } else if (errorStatus >= 500) {
        toast.error("Erreur serveur. Veuillez réessayer plus tard.");
      } else {
        toast.error(`Erreur lors du chargement des abonnements: ${errorMessage}`);
      }

      // Réinitialiser les données en cas d'erreur
      setAbonnements([]);
      setPage(0);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [size]);

  useEffect(() => {
    loadAbonnements(page);
  }, [page, loadAbonnements]);

  // Compter le nombre de personnes par contexte
  const getPeopleCountByContext = useMemo(() => {
    const contextCounts: Record<string, number> = {};
    (abonnements as unknown as AbonnementItem[]).forEach((abonnement) => {
      if (!contextCounts[abonnement.contextName]) {
        contextCounts[abonnement.contextName] = 0;
      }
      // Pour l'instant, on compte 1 personne par abonnement avec le même contexte
      // Cette logique peut être améliorée si l'API fournit le nombre réel de personnes
      contextCounts[abonnement.contextName] += 1;
    });
    return contextCounts;
  }, [abonnements]);

  // Définition complète du type AbonnementItem
  type AbonnementItem = {
    id: string;
    status: keyof typeof statusLabels;
    startDate: string | Date;
    endDate: string | Date;
    originalPrice: number;
    finalPrice: number;
    currency: string;
    promotionPrice: number | null;
    promotionCode: string | null;
    contextName: string;
    numberOfPeople: number;
    application: string;
    plans: Array<{
      planId: string;
      planName: string;
      interval: string;
      price: number;
      currency: string;
      features: Array<{
        featureId: string;
        featureName: string;
        limit: number | null;
        used?: number;
      }>;
    }>;
    people: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  };

  // Filtrer les abonnements en fonction de la recherche et du statut
  const filteredAbonnements = useMemo<AbonnementItem[]>(() => {
    console.log('Filtrage des abonnements avec:', { searchTerm, filterStatus, count: abonnements.length });
    const result = (abonnements as unknown as AbonnementItem[]).filter((abonnement) => {
      // Filtre par terme de recherche
      const matchesSearch = 
        abonnement.contextName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (abonnement.application && abonnement.application.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtre par statut - si 'all', on prend tout, sinon on filtre par le statut sélectionné
      const matchesStatus = filterStatus === 'all' || abonnement.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    
    console.log('Résultat du filtrage:', result);
    return result;
  }, [abonnements, searchTerm, filterStatus]);

  const activeCount = useMemo(() => {
    return (abonnements as unknown as AbonnementItem[]).filter((a) => a.status === 'active').length;
  }, [abonnements]);

  const totalRevenue = useMemo(() => {
    return (abonnements as unknown as AbonnementItem[]).reduce(
      (sum, abonnement) => sum + (abonnement.finalPrice || 0),
      0
    );
  }, [abonnements]);

  const handleViewDetails = (abonnement: AbonnementItem) => {
    if (onViewDetails) {
      // Création d'un objet avec toutes les propriétés requises par Abonnement
      const abonnementDetails: Abonnement = {
        id: abonnement.id,
        status: abonnement.status,
        startDate: typeof abonnement.startDate === 'string' ? abonnement.startDate : abonnement.startDate.toISOString(),
        endDate: typeof abonnement.endDate === 'string' ? abonnement.endDate : abonnement.endDate.toISOString(),
        originalPrice: abonnement.originalPrice,
        finalPrice: abonnement.finalPrice,
        currency: abonnement.currency,
        promotionPrice: abonnement.promotionPrice,
        promotionCode: abonnement.promotionCode,
        contextName: abonnement.contextName,
        application: abonnement.application,
        applicationId: abonnement.applicationId || '', // Utilisation de applicationId s'il existe, sinon chaîne vide
        numberOfPeople: abonnement.numberOfPeople,
        plans: abonnement.plans.map(plan => ({
          ...plan,
          interval: plan.interval as 'month' | 'year'
        })),
        people: abonnement.people || [],
        // Ajout des propriétés optionnelles
        planName: abonnement.plans[0]?.planName, // Prend le premier plan si disponible
        planId: abonnement.plans[0]?.planId      // Prend le premier plan si disponible
      };
      onViewDetails(abonnementDetails);
    }
  };

  const handleExport = () => {
    try {
      // Préparer les données pour l'export
      const dataToExport = filteredAbonnements.map(abonnement => ({
        "Contexte": abonnement.contextName,
        "Personnes": getPeopleCountByContext[abonnement.contextName] || abonnement.numberOfPeople || 0,
        "Application": abonnement.application,
        "Plans": abonnement.plans.map(p => p.planName).join(", "),
        "Statut": statusLabels[abonnement.status as keyof typeof statusLabels] || abonnement.status,
        "Date début": abonnement.startDate ? new Date(abonnement.startDate).toLocaleDateString("fr-FR") : "-",
        "Date fin": abonnement.endDate ? new Date(abonnement.endDate).toLocaleDateString("fr-FR") : "-",
        "Prix original": abonnement.originalPrice,
        "Prix promo": abonnement.promotionPrice || 0,
        "Prix final": abonnement.finalPrice,
        "Devise": abonnement.currency
      }));

      // Créer une feuille de calcul
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Ajuster la largeur des colonnes (optionnel mais recommandé)
      const wscols = [
        { wch: 20 }, // Contexte
        { wch: 10 }, // Personnes
        { wch: 20 }, // Application
        { wch: 30 }, // Plans
        { wch: 10 }, // Statut
        { wch: 15 }, // Date début
        { wch: 15 }, // Date fin
        { wch: 15 }, // Prix original
        { wch: 15 }, // Prix promo
        { wch: 15 }, // Prix final
        { wch: 10 }, // Devise
      ];
      ws['!cols'] = wscols;

      // Créer un classeur et ajouter la feuille
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Abonnements");

      // Générer le fichier et déclencher le téléchargement
      const fileName = `abonnements_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Export réussi !");
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      toast.error("Une erreur est survenue lors de l'export.");
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4 flex items-center justify-between flex-shrink-0 min-h-[80px] bg-accent rounded-2xl p-6 hover:bg-accent/50 transition-colors duration-200 ease-in-out cursor-pointer hover:text-white hover:border-yellow-600 hover:border-2 hover:shadow-lg hover:scale-105">
        <div className="flex-1 min-w-0">
          <h2 className="text-gray-900 font-semibold text-3xl">Gestion des Abonnements</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gérez et suivez tous les abonnements avec une vision unifiée des statuts, des plans et des revenus.
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 flex-shrink-0 ml-4 h-[40px] hover:text-white hover:border-yellow-600 hover:bg-yellow-600 transition-colors duration-200 ease-in-out hover:border-2 hover:shadow-lg hover:scale-105"
          style={{ cursor: 'pointer' }}
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Conteneur principal avec défilement */}
      <div className="flex flex-col space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid gap-6 md:grid-cols-3 flex-shrink-0 py-4">
          <Card className="border-0 shadow-md overflow-hidden relative h-[140px]">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardContent className="pt-6 h-full">
              <div className="space-y-3 h-full flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900 font-semibold">{filteredAbonnements.length}</span>
                  </div>
                  <p className="text-sm text-gray-600">Tous contextes confondus</p>
                </div>
                <p className="text-sm text-gray-700 font-medium flex-shrink-0">Total Abonnements</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative h-[140px]">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardContent className="pt-6 h-full">
              <div className="space-y-3 h-full flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900 font-semibold">{activeCount}</span>
                  </div>
                  <p className="text-sm text-gray-600">Actifs en ce moment</p>
                </div>
                <p className="text-sm text-gray-700 font-medium flex-shrink-0">Abonnements Actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative h-[140px]">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardContent className="pt-6 h-full">
              <div className="space-y-3 h-full flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-gray-900 font-semibold">
                      {formatPrice(totalRevenue, abonnements[0]?.currency || 'XOF')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Revenu mensuel récurrent</p>
                </div>
                <p className="text-sm text-gray-700 font-medium flex-shrink-0">Revenu Mensuel</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte principale */}
        <Card className="border-0 shadow-md relative flex flex-col">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardHeader className="flex-shrink-0 min-h-[80px]">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-gray-900 font-semibold text-lg">Liste des Abonnements</CardTitle>
                <CardDescription className="text-gray-600 text-sm mt-1">
                  {totalElements} abonnement(s) au total • {filteredAbonnements.length} affiché(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex flex-wrap gap-4 mb-4 flex-shrink-0 h-[44px]">
              <div className="relative flex-1 min-w-[220px] h-[44px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  placeholder="Rechercher par contexte ou application..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-[44px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px] h-[44px]" style={{ cursor: 'pointer' }}>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ cursor: 'pointer' }}>Tous les statuts</SelectItem>
                  <SelectItem value="active" style={{ cursor: 'pointer' }}>Actif</SelectItem>
                  <SelectItem value="expired" style={{ cursor: 'pointer' }}>Expiré</SelectItem>
                  <SelectItem value="cancelled" style={{ cursor: 'pointer' }}>Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground min-h-[200px] flex items-center justify-center">
                    Chargement des abonnements...
                  </div>
                ) : filteredAbonnements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground min-h-[200px] flex items-center justify-center">
                    Aucun abonnement trouvé
                  </div>
                ) : (
                  <Table className="table-fixed w-full min-w-[1400px]">
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="whitespace-nowrap w-[180px]">Contexte</TableHead>
                        <TableHead className="whitespace-nowrap w-[120px]">Personnes</TableHead>
                        <TableHead className="whitespace-nowrap w-[140px]">Application</TableHead>
                        <TableHead className="whitespace-nowrap w-[140px]">Plans</TableHead>
                        <TableHead className="whitespace-nowrap w-[100px]">Statut</TableHead>
                        <TableHead className="whitespace-nowrap w-[120px]">Date début</TableHead>
                        <TableHead className="whitespace-nowrap w-[120px]">Date fin</TableHead>
                        <TableHead className="text-right whitespace-nowrap w-[120px]">Prix original</TableHead>
                        <TableHead className="text-right whitespace-nowrap w-[130px]">Prix promo</TableHead>
                        <TableHead className="text-right whitespace-nowrap w-[120px]">Prix final</TableHead>
                        <TableHead className="text-right whitespace-nowrap w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAbonnements.map((abonnement) => (
                        <TableRow key={abonnement.id}>
                          <TableCell className="font-semibold text-gray-900 w-[180px] overflow-hidden text-ellipsis">
                            <span className="block truncate">{abonnement.contextName}</span>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            {(() => {
                              const count = getPeopleCountByContext[abonnement.contextName] || abonnement.numberOfPeople || 0;
                              return count > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span>{count}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="font-medium w-[140px] overflow-hidden text-ellipsis">
                            <span className="block truncate">{abonnement.application}</span>
                          </TableCell>
                          <TableCell className="w-[140px]">
                            <div className="flex flex-wrap gap-1 max-w-full">
                              {abonnement.plans?.map((plan, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs truncate max-w-full"
                                >
                                  <span className="truncate block">{plan.planName}</span>
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="w-[100px]">
                            <Badge
                              variant="secondary"
                              className={`${statusColors[abonnement.status as keyof typeof statusColors] || 'bg-gray-500'} text-white whitespace-nowrap`}
                            >
                              {statusLabels[abonnement.status as keyof typeof statusLabels] || 'Inconnu'}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[120px] whitespace-nowrap">
                            {abonnement.startDate ? new Date(abonnement.startDate).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }) : '-'}
                          </TableCell>
                          <TableCell className="w-[120px] whitespace-nowrap">
                            {abonnement.endDate ? new Date(abonnement.endDate).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground w-[120px] whitespace-nowrap">
                            {formatPrice(abonnement.originalPrice, abonnement.currency)}
                          </TableCell>
                          <TableCell className="text-right w-[130px]">
                            {abonnement.promotionPrice !== null ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-semibold text-orange-600 whitespace-nowrap">
                                  {formatPrice(abonnement.promotionPrice, abonnement.currency)}
                                </span>
                                {abonnement.promotionCode && (
                                  <Badge variant="default" className="bg-orange-500 text-xs whitespace-nowrap">
                                    <Tag className="mr-1 h-3 w-3 inline" />
                                    <span className="truncate">{abonnement.promotionCode}</span>
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold w-[120px] whitespace-nowrap">
                            {formatPrice(abonnement.finalPrice, abonnement.currency)}
                          </TableCell>
                          <TableCell className="text-right w-[100px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(abonnement)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                              style={{ cursor: 'pointer' }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t flex-shrink-0 mt-auto">
              {!isLoading && totalPages > 1 ? (
                <>
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    Page {page + 1} sur {totalPages} • {totalElements} souscription(s)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || isLoading}
                      className="h-9"
                      style={{ cursor: 'pointer' }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1 || isLoading}
                      className="h-9"
                      style={{ cursor: 'pointer' }}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {totalElements} souscription(s)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}