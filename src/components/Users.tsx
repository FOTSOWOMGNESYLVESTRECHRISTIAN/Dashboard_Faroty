import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, UserX, UserCheck, RefreshCw, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { UserDetails } from "./UserDetails";
import { toast } from "sonner";
import { userService } from "../services/userService";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: "admin" | "user" | "moderator";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  lastLogin: string | null;
  countryName: string | null;
  languageName: string | null;
  subscriptions: string[];
  applications: string[];
}

const statusColors = {
  active: "bg-green-600",
  inactive: "bg-gray-400",
  suspended: "bg-red-500",
};

const statusLabels = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

const roleLabels = {
  admin: "Administrateur",
  user: "Utilisateur",
  moderator: "Modérateur",
};

interface UsersProps {
  onViewDetails?: (user: User) => void;
}

export function Users({ onViewDetails }: UsersProps) {
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  
  // États pour la gestion des données
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les boîtes de dialogue
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  
  // État pour l'utilisateur sélectionné
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // État pour le formulaire
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user" as "admin" | "user" | "moderator",
    status: "active" as "active" | "inactive" | "suspended",
  });

  // Chargement initial des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[Users] Chargement des utilisateurs...');
        
        const data = await userService.getAllUsers();
        console.log(`[Users] ${data.length} utilisateurs chargés`);
        
        setUsers(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
        console.error('[Users] Erreur lors du chargement des utilisateurs:', error);
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        setUsers([]); // Réinitialiser la liste en cas d'erreur
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    try {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchLower));

      const matchesStatus =
        filterStatus === "all" || user.status === filterStatus;

      const matchesRole = filterRole === "all" || user.role === filterRole;

      return matchesSearch && matchesStatus && matchesRole;
    } catch (error) {
      console.error('Erreur lors du filtrage des utilisateurs:', error, user);
      return false; // Exclure les utilisateurs qui causent des erreurs
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "user",
      status: "active",
    });
  };

  const handleAddUser = () => {
    const newUser: User = {
      id: (users.length + 1).toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: null,
      subscriptions: [],
      applications: [],
      phoneNumber: null,
      profilePictureUrl: null,
      countryName: null,
      languageName: null
    };
    setUsers([...users, newUser]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("Utilisateur ajouté avec succès!");
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    
    setUsers(
      users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              status: formData.status,
            }
          : user
      )
    );
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
    toast.success("Utilisateur modifié avec succès!");
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.filter((user) => user.id !== selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
    toast.success("Utilisateur supprimé avec succès!");
  };

  const handleDisableUser = () => {
    if (!selectedUser) return;
    
    setUsers(
      users.map((user) =>
        user.id === selectedUser.id
          ? { ...user, status: user.status === "active" ? "inactive" : "active" }
          : user
      )
    );
    setIsDisableDialogOpen(false);
    setSelectedUser(null);
    toast.success(
      selectedUser.status === "active"
        ? "Utilisateur désactivé avec succès!"
        : "Utilisateur activé avec succès!"
    );
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    if (onViewDetails) {
      onViewDetails(user);
    }
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openDisableDialog = (user: User) => {
    setSelectedUser(user);
    setIsDisableDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Fonction pour recharger les utilisateurs
  const reloadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Users] Rechargement des utilisateurs...');
      
      const data = await userService.getAllUsers();
      console.log(`[Users] ${data.length} utilisateurs rechargés`);
      
      setUsers(data);
      toast.success('Liste des utilisateurs mise à jour');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('[Users] Erreur lors du rechargement des utilisateurs:', error);
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4 flex items-center justify-between flex-shrink-0 rounded-2xl p-6 
      bg-accent shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:bg-accent/50">
        <div>
          <h2 className="text-gray-900 font-semibold text-3xl">Gestion des Utilisateurs</h2>
          <p className="text-gray-600">
            {initialLoading 
              ? 'Chargement en cours...' 
              : `Gérez les ${users.length} utilisateurs de l'application`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={reloadUsers} 
            variant="outline" 
            disabled={loading}
            style={{cursor: 'pointer'}}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            onClick={openAddDialog} 
            className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
            disabled={loading}
            style={{cursor: 'pointer'}}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Utilisateur
          </Button>
        </div>
      </div>

      <Card className="border-2 shadow-md overflow-hidden relative flex-1 flex flex-col rounded-2xl p-6 bg-white">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-gray-900 font-semibold text-2xl">Liste des Utilisateurs</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-4 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]" style={{cursor: 'pointer'}}>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{cursor: 'pointer'}}>Tous les statuts</SelectItem>
                <SelectItem value="active" style={{cursor: 'pointer'}}>Actif</SelectItem>
                <SelectItem value="inactive" style={{cursor: 'pointer'}}>Inactif</SelectItem>
                <SelectItem value="suspended" style={{cursor: 'pointer'}}>Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]" style={{cursor: 'pointer'}}>
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{cursor: 'pointer'}}>Tous les rôles</SelectItem>
                <SelectItem value="admin" style={{cursor: 'pointer'}}>Administrateur</SelectItem>
                <SelectItem value="moderator" style={{cursor: 'pointer'}}>Modérateur</SelectItem>
                <SelectItem value="user" style={{cursor: 'pointer'}}>Utilisateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden flex-1 min-h-0">
            <div className="h-full overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[150px]">Nom</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">Email / Téléphone</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[120px]">Rôle</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Statut</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[110px]">Date création</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[110px]">Dernière connexion</TableHead>
                    <TableHead className="text-right whitespace-nowrap min-w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="rounded-full bg-red-100 p-3">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          </div>
                          <p className="text-red-600 font-medium">{error}</p>
                          <Button 
                            variant="outline" 
                            onClick={reloadUsers}
                            disabled={loading}
                            style={{cursor: 'pointer'}}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Réessayer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Search className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                          {searchTerm || filterStatus !== 'all' || filterRole !== 'all' ? (
                            <p className="text-sm text-muted-foreground">
                              Essayez de modifier vos filtres de recherche
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap font-medium">{user.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.email !== "Non renseigné" ? user.email : user.phoneNumber || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`${statusColors[user.status]} text-white`}
                        >
                          {statusLabels[user.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "Jamais"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" style={{cursor: 'pointer'}}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openViewDialog(user)} style={{cursor: 'pointer'}}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)} style={{cursor: 'pointer'}}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDisableDialog(user)} style={{cursor: 'pointer'}}>
                              {user.status === "active" ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(user)}
                              style={{cursor: 'pointer'}}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajouter un utilisateur */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez les informations du nouvel utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Nom</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: jean.dupont@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user" | "moderator") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="add-role" style={{cursor: 'pointer'}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user" style={{cursor: 'pointer'}}>Utilisateur</SelectItem>
                  <SelectItem value="moderator" style={{cursor: 'pointer'}}>Modérateur</SelectItem>
                  <SelectItem value="admin" style={{cursor: 'pointer'}}>Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "suspended") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="add-status" style={{cursor: 'pointer'}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" style={{cursor: 'pointer'}}>Actif</SelectItem>
                  <SelectItem value="inactive" style={{cursor: 'pointer'}}>Inactif</SelectItem>
                  <SelectItem value="suspended" style={{cursor: 'pointer'}}>Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} style={{cursor: 'pointer'}}>
              Annuler
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
              disabled={!formData.name || !formData.email}
              style={{cursor: 'pointer'}}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier un utilisateur */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "user" | "moderator") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="moderator">Modérateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "suspended") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} style={{cursor: 'pointer'}}>
              Annuler
            </Button>
            <Button
              onClick={handleEditUser}
              className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
              disabled={!formData.name || !formData.email}
              style={{cursor: 'pointer'}}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Supprimer */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur "{selectedUser?.name}" sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Désactiver/Activer */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === "active" ? "Désactiver l'utilisateur ?" : "Activer l'utilisateur ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === "active"
                ? `L'utilisateur "${selectedUser?.name}" sera désactivé et ne pourra plus se connecter.`
                : `L'utilisateur "${selectedUser?.name}" sera activé et pourra se connecter.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableUser}
              className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
            >
              {selectedUser?.status === "active" ? "Désactiver" : "Activer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

