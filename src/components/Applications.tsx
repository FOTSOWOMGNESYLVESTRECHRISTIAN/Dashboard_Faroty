// src/pages/admin/Application.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash, Filter, Download, Search, Check, Clock, Infinity, MoreVertical, PauseCircle, CheckCircle, Loader2, Eye } from "lucide-react";
import { Application } from "../services/applicationService";
import { MouseEvent } from "react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  applicationService,
  Application,
  ApplicationPayload,
} from "../services/applicationService";

type StringField = Exclude<keyof ApplicationPayload, "configuration">;

const buildEmptyForm = (): ApplicationPayload => ({
  name: "",
  description: "",
  version: "",
  type: "web",
  platform: "web",
  iconUrl: "",
  websiteUrl: "",
  supportEmail: "",
  documentationUrl: "",
  configuration: null,
});

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const getInitials = (value?: string | null) =>
  (value || "APP")
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

const statusColorMap: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
};

type StatusFilterType = "all" | "active" | "inactive" | "maintenance";

const statusLabelsMap: Record<StatusFilterType, string> = {
  all: "Toutes",
  active: "Actives",
  inactive: "Inactives",
  maintenance: "Maintenance",
};

const formatStatus = (status?: string | null) => {
  if (!status) return "Inconnu";
  return status.replace(/_/g, " ").toLowerCase();
};

interface ApplicationsProps {
  onViewDetails?: (app: Application) => void;
}

export function Applications({ onViewDetails }: ApplicationsProps) {
  // Étendre l'interface Application pour inclure les propriétés manquantes
  interface ExtendedApplication extends Application {
    hasTrialPolicy?: boolean;
    trialPolicyEnabled?: boolean;
    trialPeriodDays?: number;
    trialEndDate?: string;
    [key: string]: any; // Pour les propriétés supplémentaires
  }

  const [applications, setApplications] = useState<ExtendedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedApp, setSelectedApp] = useState<ExtendedApplication | null>(null);

  // Form
  const [formData, setFormData] = useState<ApplicationPayload>(buildEmptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [isExporting, setIsExporting] = useState(false);

  // ------------------------------
  // 1️⃣ Charger les applications
  // ------------------------------
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const data = await applicationService.getAllApplications();
        console.log("[Applications] Loaded applications:", data);
        setApplications(data);
      } catch (error: any) {
        console.error("[Applications] Error loading applications:", error);
        toast.error(error?.message || "Erreur lors du chargement des applications");
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  // ------------------------------
  // 2️⃣ Ajouter une application
  // ------------------------------
  const handleAddApplication = async () => {
    try {
      const newApp = await applicationService.addApplication(formData);
      setApplications(prev => [...prev, newApp]);

      toast.success("Application ajoutée !");
      setIsAddOpen(false);

      setFormData(buildEmptyForm());
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'ajout");
    }
  };

  // ------------------------------
  // 3️⃣ Modifier une application
  // ------------------------------
  const handleEditApplication = async () => {
    if (!selectedApp) return;

    try {
      const updated = await applicationService.updateApplication(selectedApp.id, formData);

      setApplications(prev => prev.map(app => app.id === selectedApp.id ? updated : app));

      toast.success("Application modifiée !");
      setIsEditOpen(false);

    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la modification");
    }
  };

  // ------------------------------
  // 4️⃣ Supprimer une application
  // ------------------------------
  const handleDeleteApplication = async () => {
    if (!selectedApp) return;

    try {
      setActionLoading(prev => ({ ...prev, [selectedApp.id]: true }));
      await applicationService.deleteApplication(selectedApp.id);
      setApplications(applications.filter((a) => a.id !== selectedApp.id));
      toast.success("Application supprimée avec succès");
      setIsDeleteOpen(false);
      setSelectedApp(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Erreur lors de la suppression");
    } finally {
      if (selectedApp) {
        setActionLoading(prev => ({ ...prev, [selectedApp.id]: false }));
      }
    }
  };

  const handleSuspendApplication = async (app: ExtendedApplication) => {
    try {
      setActionLoading(prev => ({ ...prev, [app.id]: true }));
      // Le service gère maintenant le nettoyage des champs immuables,
      // on peut donc passer l'objet avec les modifications souhaitées.
      const updated = await applicationService.updateApplication(app.id, {
        ...app,
        isActive: false,
        status: 'inactive'
      });
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, ...updated } : a));
      toast.success("Application suspendue avec succès");
    } catch (err) {
      console.error("Erreur lors de la suspension:", err);
      toast.error("Erreur lors de la suspension");
    } finally {
      setActionLoading(prev => ({ ...prev, [app.id]: false }));
    }
  };

  const handleExportToExcel = async () => {
    if (filteredApplications.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");
      const data = filteredApplications.map((app) => ({
        Nom: app.name,
        Description: app.description || "",
        Type: app.type || "",
        Plateforme: app.platform || "",
        Version: app.version || "",
        Statut: formatStatus(app.status),
        "Créée le": formatDate(app.createdAt),
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `applications-${timestamp}.xlsx`);
      toast.success("Export Excel réalisé");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Échec de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleInputChange = (field: StringField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredApplications = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return applications.filter((app) => {
      const matchesSearch =
        term === "" ||
        app.name?.toLowerCase().includes(term) ||
        app.description?.toLowerCase().includes(term) ||
        app.type?.toLowerCase().includes(term) ||
        app.platform?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (app.status || "inactive").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // ------------------------------
  // Pagination calculs
  // ------------------------------
  const indexLast = currentPage * itemsPerPage;
  const indexFirst = indexLast - itemsPerPage;
  const currentItems = filteredApplications.slice(indexFirst, indexLast);
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-3">
      <div className="border-b border-yellow-500 pb-4 bg-accent p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:bg-accent/50 opacity-90 hover:opacity-100 cursor-pointer hover:scale-105">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl text-gray-600">Centre de gestion</h1>
            <p className="uppercase tracking-[0.35em] text-3xl text-black font-semibold">Gestion des Applications</p>
            <p className="text-gray-600 text-base max-w-2xl mt-1">
              Administrez vos applications, gérez les versions et surveillez leur état de fonctionnement en un seul endroit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end mb-4 mt-4">
          <Button
            className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg 
                      px-6 py-3 font-medium flex items-center transition-all
                      duration-200 hover:scale-105 active:scale-95 cursor-pointer 
                      hover:shadow-xl hover:shadow-green-700
                      border-2 border-white-500 hover:border-white-600 hover:backdrop-blur-sm"
            onClick={() => {
              setFormData(buildEmptyForm());
              setIsAddOpen(true);
            }}
            style={{ cursor: 'pointer' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une application
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl p-6 transition-all duration-300 ease-in-out hover:bg-white/50">
        <div className="px-6 py-1.5">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="relative flex-1 min-w-[320px] max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher une application..."
                className="pl-10 rounded-full bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-white/40 text-black hover:bg-white/10 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtres
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {[
                    { value: "all", label: "Tous" },
                    { value: "active", label: "Actives" },
                    { value: "inactive", label: "Inactives" },
                    { value: "maintenance", label: "Maintenance" },
                  ].map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setStatusFilter(option.value as StatusFilterType)}
                    >
                      {statusFilter === option.value && (
                        <Check className="mr-2 h-4 w-4 text-emerald-600" />
                      )}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="rounded-full border-white/40 text-black hover:bg-white/10"
                onClick={handleExportToExcel}
                disabled={isExporting}
                style={{ cursor: isExporting ? 'not-allowed' : 'pointer' }}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Export..." : "Exporter"}
              </Button>
            </div>
          </div>
          <div className="h-8 flex items-center">
            {statusFilter !== "all" && (
              <Badge className="rounded-full bg-slate-900 text-white px-4 py-2">
                Filtre: {statusLabelsMap[statusFilter]}
                <button
                  className="ml-2 text-xs uppercase tracking-wide"
                  onClick={() => setStatusFilter("all")}
                >
                  Réinitialiser
                </button>
              </Badge>
            )}
            {statusFilter === "all" && <div className="h-8"></div>}
          </div>
        </div>

        <div className="p-6">
          {/* Grille d'applications */}
          {loading ? (
            <div className="p-4 text-center font-medium text-slate-500">
              Chargement...
            </div>
          ) : currentItems.length === 0 ? (
            <div className="p-4 text-center font-medium text-slate-500">
              Aucune application trouvée
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-2 border-b border-slate-200 mb-6">
              {currentItems.map((app) => (
                <div
                  key={app.id}
                  className="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 bg-white 
                    border-2 border-blue-400 hover:border-blue-600 
                    hover:shadow-lg hover:shadow-blue-100
                    hover:scale-[1.02] transform-gpu
                    hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
                  onClick={() => onViewDetails?.(app)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Actions Menu - Always visible and with z-index */}
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          disabled={actionLoading[app.id]}
                          className="h-8 w-8 bg-white/50 hover:bg-white shadow-sm"
                          style={{ cursor: 'pointer' }}
                        >
                          {actionLoading[app.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails?.(app);
                          }}
                          className="cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Voir détail</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            // Populate form data for editing
                            setFormData({
                              name: app.name,
                              description: app.description || "",
                              version: app.version || "",
                              type: app.type || "",
                              platform: app.platform || "",
                              iconUrl: app.iconUrl || "",
                              websiteUrl: app.websiteUrl || "",
                              supportEmail: app.supportEmail || "",
                              documentationUrl: app.documentationUrl || "",
                              configuration: app.configuration || null,
                              isActive: app.isActive,
                              status: app.status
                            });
                            setIsEditOpen(true);
                          }}
                          className="cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Modifier</span>
                        </DropdownMenuItem>

                        {app.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleSuspendApplication(app);
                            }}
                            className="text-amber-600 cursor-pointer"
                            style={{ cursor: 'pointer' }}
                          >
                            <PauseCircle className="mr-2 h-4 w-4" />
                            <span>Suspendre</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                // Le service gère le nettoyage, simplification du code
                                const updated = await applicationService.updateApplication(app.id, {
                                  ...app,
                                  isActive: true,
                                  status: 'active'
                                });
                                setApplications(prev => prev.map(a => a.id === app.id ? { ...a, ...updated } : a));
                                toast.success("Application activée avec succès");
                              } catch (err) {
                                console.error("Erreur lors de l'activation:", err);
                                toast.error("Erreur lors de l'activation");
                              }
                            }}
                            className="text-green-600 cursor-pointer"
                            style={{ cursor: 'pointer' }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Activer</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={async (e: React.MouseEvent<HTMLDivElement>) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setIsDeleteOpen(true);
                          }}
                          className="text-red-600 cursor-pointer"
                          style={{ cursor: 'pointer' }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                          onClick={async (e: MouseEvent) => {
                            e.stopPropagation();
                            try {
                              const endDate = new Date();
                              endDate.setDate(endDate.getDate() + 30); // 30 jours d'essai

                              // Utiliser le service de politique d'essai
                              await applicationService.createOrUpdateTrialPolicy({
                                applicationId: app.id,
                                enabled: true,
                                trialPeriodInDays: 30,
                                unlimitedAccess: false
                              });

                              // Mettre à jour l'état local
                              setApplications(prev => prev.map(a =>
                                a.id === app.id
                                  ? {
                                    ...a,
                                    hasTrialPolicy: true,
                                    trialPolicyEnabled: true,
                                    trialPeriodDays: 30,
                                    trialEndDate: endDate.toISOString()
                                  }
                                  : a
                              ));

                              toast.success("Période d'essai de 30 jours ajoutée");
                            } catch (err) {
                              console.error("Erreur lors de l'ajout de la période d'essai:", err);
                              toast.error("Erreur lors de l'ajout de la période d'essai");
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <Infinity className="mr-2 h-4 w-4" />
                          <span>Ajouter une période d'essai</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Cercle avec les initiales */}
                  <div className="relative mb-3 group-hover:scale-105 transition-transform duration-300">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 
                      border-2 border-blue-200 group-hover:border-blue-400
                      flex items-center justify-center text-blue-600 text-2xl font-bold mb-2 
                      transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:shadow-blue-200">
                      {getInitials(app.name)}
                    </div>

                    {/* Badge d'état */}
                    {app.hasTrialPolicy && app.trialPolicyEnabled && (
                      <div className="absolute -top-1 -right-1 p-1.5 bg-white rounded-full shadow-md group-hover:scale-110 transition-transform">
                        <div className="h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></div>
                      </div>
                    )}
                  </div>


                  {/* Nom de l'application */}
                  <div className="text-center w-full">
                    <h3 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                      {app.name}
                    </h3>
                    {app.version && (
                      <p className="text-xs text-slate-500 group-hover:text-blue-400 transition-colors duration-200">
                        v{app.version}
                      </p>
                    )
                    }
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="text-left px-6 py-3 text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 p-2 border-b border-slate-200 mb-6 mt-6">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} correspondant{filteredApplications.length > 1 ? 's' : ''} à vos critères.
            </div>
          )
          }
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-4 bg-white/80 gap-3">
          <span className="text-sm text-slate-500">
            {loading ? "Chargement..." : `${filteredApplications.length} élément(s)`}
          </span>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={currentPage === 1}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              style={{cursor: 'pointer'}}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              style={{cursor: 'pointer'}}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div >
      {/* ADD DIALOG */}
      < Dialog open={isAddOpen} onOpenChange={setIsAddOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une application</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={formData.name}
                  onChange={e => handleInputChange("name", e.target.value)}
                  placeholder="Crowdfunding"
                />
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={e => handleInputChange("version", e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={formData.type}
                  onChange={e => handleInputChange("type", e.target.value)}
                  placeholder="web"
                />
              </div>
              <div>
                <Label>Plateforme</Label>
                <Input
                  value={formData.platform}
                  onChange={e => handleInputChange("platform", e.target.value)}
                  placeholder="web"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => handleInputChange("description", e.target.value)}
                placeholder="Application de levée de fonds"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Icon URL</Label>
                <Input
                  value={formData.iconUrl}
                  onChange={e => handleInputChange("iconUrl", e.target.value)}
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div>
                <Label>Site web</Label>
                <Input
                  value={formData.websiteUrl}
                  onChange={e => handleInputChange("websiteUrl", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email support</Label>
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={e => handleInputChange("supportEmail", e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <Label>Documentation</Label>
                <Input
                  value={formData.documentationUrl}
                  onChange={e => handleInputChange("documentationUrl", e.target.value)}
                  placeholder="https://example.com/docs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddApplication} style={{cursor: 'pointer'}}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* EDIT DIALOG */}
      < Dialog open={isEditOpen} onOpenChange={setIsEditOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'application</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={formData.name}
                  onChange={e => handleInputChange("name", e.target.value)}
                />
              </div>

              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={e => handleInputChange("version", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={formData.type}
                  onChange={e => handleInputChange("type", e.target.value)}
                />
              </div>

              <div>
                <Label>Plateforme</Label>
                <Input
                  value={formData.platform}
                  onChange={e => handleInputChange("platform", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Icon URL</Label>
                <Input
                  value={formData.iconUrl}
                  onChange={e => handleInputChange("iconUrl", e.target.value)}
                />
              </div>

              <div>
                <Label>Site web</Label>
                <Input
                  value={formData.websiteUrl}
                  onChange={e => handleInputChange("websiteUrl", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email support</Label>
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={e => handleInputChange("supportEmail", e.target.value)}
                />
              </div>

              <div>
                <Label>Documentation</Label>
                <Input
                  value={formData.documentationUrl}
                  onChange={e => handleInputChange("documentationUrl", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleEditApplication}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* DELETE DIALOG */}
      < Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'application</DialogTitle>
          </DialogHeader>

          <p className="text-gray-600">
            Voulez-vous vraiment supprimer <span className="font-semibold">{selectedApp?.name}</span> ?
          </p>

          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteApplication}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

    </div >
  );
}

export default Applications;