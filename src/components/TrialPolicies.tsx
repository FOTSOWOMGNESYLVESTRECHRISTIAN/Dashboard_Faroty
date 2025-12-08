import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { applicationService, TrialPolicy } from "../services/applicationService";
import { RefreshCw, Save, Trash2 } from "lucide-react";

interface TrialPolicyWithApplication extends TrialPolicy {
  applicationName?: string;
}

export function TrialPolicies() {
  const [policies, setPolicies] = useState<TrialPolicyWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingPolicies, setUpdatingPolicies] = useState<Record<string, boolean>>({});
  const [editForms, setEditForms] = useState<Record<string, {
    trialPeriodInDays: number;
    enabled: boolean;
    unlimitedAccess: boolean;
  }>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadTrialPolicies = useCallback(async (pageNum: number = 0) => {
    setIsLoading(true);
    try {
      const result = await applicationService.getAllTrialPolicies(pageNum, 10);
      
      // Utiliser directement applicationName de l'API, ou applicationId comme fallback
      const enrichedPolicies: TrialPolicyWithApplication[] = result.content.map((policy) => ({
        ...policy,
        applicationName: policy.applicationName || policy.applicationId,
      }));
      
      setPolicies(enrichedPolicies);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      
      // Initialiser les formulaires d'édition avec les valeurs actuelles
      const forms: Record<string, {
        trialPeriodInDays: number;
        enabled: boolean;
        unlimitedAccess: boolean;
      }> = {};
      enrichedPolicies.forEach((policy) => {
        forms[policy.id] = {
          trialPeriodInDays: policy.trialPeriodInDays,
          enabled: policy.enabled,
          unlimitedAccess: policy.unlimitedAccess,
        };
      });
      setEditForms((prev) => ({ ...prev, ...forms }));
    } catch (error: any) {
      console.error("[TrialPolicies] Error loading trial policies:", error);
      toast.error(error?.message || "Impossible de charger les politiques d'essai");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrialPolicies(page);
  }, [page, loadTrialPolicies]);

  const handleUpdatePolicy = async (policy: TrialPolicyWithApplication) => {
    const form = editForms[policy.id];
    if (!form) {
      toast.error("Données du formulaire introuvables");
      return;
    }

    if (form.trialPeriodInDays < 1) {
      toast.error("La période d'essai doit être d'au moins 1 jour");
      return;
    }

    setUpdatingPolicies((prev) => ({ ...prev, [policy.id]: true }));

    try {
      const payload = {
        applicationId: policy.applicationId,
        enabled: form.enabled,
        trialPeriodInDays: form.trialPeriodInDays,
        unlimitedAccess: form.unlimitedAccess,
      };
      
      await applicationService.createOrUpdateTrialPolicy(payload, policy.id);
      toast.success(`Politique d'essai mise à jour pour ${policy.applicationName || policy.applicationId}`);
      
      // Recharger les politiques
      await loadTrialPolicies(page);
    } catch (error: any) {
      console.error("[TrialPolicies] Error updating policy:", error);
      toast.error(error?.message || "Impossible de mettre à jour la politique d'essai");
    } finally {
      setUpdatingPolicies((prev => {
        const updated = { ...prev };
        delete updated[policy.id];
        return updated;
      }));
    }
  };

  const handleFormChange = (policyId: string, field: "trialPeriodInDays" | "enabled" | "unlimitedAccess", value: number | boolean) => {
    setEditForms((prev) => ({
      ...prev,
      [policyId]: {
        ...prev[policyId],
        [field]: value,
      },
    }));
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
  };

  const calculateEndDate = (
    createdAt?: number,
    trialPeriodInDays?: number,
    updatedAt?: number,
    isFormModified?: boolean
  ): string => {
    if (!trialPeriodInDays) return "—";
    
    // Si le formulaire a été modifié (pas encore sauvegardé), calculer depuis maintenant (prévision)
    // Sinon, calculer depuis la date de création ou de mise à jour si elle existe
    const startDate = isFormModified
      ? new Date() // Date actuelle pour la prévision
      : createdAt
      ? new Date(createdAt < 1e12 ? createdAt * 1000 : createdAt)
      : new Date();
    
    if (isNaN(startDate.getTime())) return "—";
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialPeriodInDays);
    return endDate.toLocaleDateString("fr-FR");
  };

  const handleDeleteClick = (policyId: string) => {
    setDeletingPolicyId(policyId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPolicyId) return;

    try {
      await applicationService.deleteTrialPolicy(deletingPolicyId);
      toast.success("Politique d'essai supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setDeletingPolicyId(null);
      await loadTrialPolicies(page);
    } catch (error: any) {
      console.error("[TrialPolicies] Error deleting policy:", error);
      toast.error(error?.message || "Impossible de supprimer la politique d'essai");
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPolicyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Périodes d'essai</h2>
          <p className="text-muted-foreground">
            Gérez les périodes d'essai des applications ({totalElements} politique(s))
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadTrialPolicies(page)}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications avec période d'essai</CardTitle>
          <CardDescription>
            Liste des applications et leurs politiques d'essai configurées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement des politiques d'essai...
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune politique d'essai configurée
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Période (jours)</TableHead>
                    <TableHead>Accès illimité</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Date de fin</TableHead>
                    <TableHead>Mise à jour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => {
                    const form = editForms[policy.id];
                    const isUpdating = updatingPolicies[policy.id];
                    
                    return (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">
                          {policy.applicationName || policy.applicationId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={form?.enabled ?? policy.enabled}
                              onCheckedChange={(checked) =>
                                handleFormChange(policy.id, "enabled", checked)
                              }
                              disabled={isUpdating}
                            />
                            <Badge variant={form?.enabled ?? policy.enabled ? "default" : "secondary"}>
                              {form?.enabled ?? policy.enabled ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={form?.trialPeriodInDays ?? policy.trialPeriodInDays}
                            onChange={(e) =>
                              handleFormChange(
                                policy.id,
                                "trialPeriodInDays",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24"
                            disabled={isUpdating || !(form?.enabled ?? policy.enabled)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={form?.unlimitedAccess ?? policy.unlimitedAccess}
                            onCheckedChange={(checked) =>
                              handleFormChange(policy.id, "unlimitedAccess", checked)
                            }
                            disabled={isUpdating || !(form?.enabled ?? policy.enabled)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(policy.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>
                              {calculateEndDate(
                                policy.createdAt,
                                form?.trialPeriodInDays ?? policy.trialPeriodInDays,
                                policy.updatedAt,
                                form && (form.trialPeriodInDays !== policy.trialPeriodInDays ||
                                  form.enabled !== policy.enabled ||
                                  form.unlimitedAccess !== policy.unlimitedAccess)
                              )}
                            </span>
                            {form && (form.trialPeriodInDays !== policy.trialPeriodInDays ||
                              form.enabled !== policy.enabled ||
                              form.unlimitedAccess !== policy.unlimitedAccess) && (
                              <span className="text-xs text-orange-600">(prévision)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(policy.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePolicy(policy)}
                              disabled={
                                isUpdating ||
                                !form ||
                                (form.trialPeriodInDays === policy.trialPeriodInDays &&
                                  form.enabled === policy.enabled &&
                                  form.unlimitedAccess === policy.unlimitedAccess)
                              }
                              className="bg-[#8b68a6] hover:bg-[#6b4685]"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {isUpdating ? "Mise à jour..." : "Mettre à jour"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(policy.id)}
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page + 1} sur {totalPages} ({totalElements} résultat(s))
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement la politique d'essai pour l'application{" "}
              <strong>
                {deletingPolicyId
                  ? policies.find((p) => p.id === deletingPolicyId)?.applicationName ||
                    policies.find((p) => p.id === deletingPolicyId)?.applicationId ||
                    "cette application"
                  : "cette application"}
              </strong>
              . Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

