import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowLeft, User, Mail, Shield, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { User as UserType } from "./Users";
import { subscriptionService } from "../services/subscriptionService";
import { applicationService } from "../services/applicationService";
import type { Subscription } from "./SubscriptionDetails";
import type { Application } from "../services/applicationService";
import { normalizePhoneNumber } from "../utils/phoneUtils";

interface UserDetailsProps {
  user: UserType;
  onBack: () => void;
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

export function UserDetails({ user, onBack }: UserDetailsProps) {
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [editedUser, setEditedUser] = useState<UserType>({ ...user });
  
  const handleEditClick = () => {
    setEditedUser({ ...user }); // Réinitialiser avec les données actuelles
    setIsModalOpen(true);
  };
  
  const handleSaveChanges = async () => {
    try {
      // Ici, vous devriez appeler votre API pour mettre à jour l'utilisateur
      // await userService.updateUser(editedUser);
      // Mettre à jour l'utilisateur dans le state parent si nécessaire
      // onUpdate(editedUser);
      setIsModalOpen(false);
      setIsEditing(false);
      alert('Modifications enregistrées avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Une erreur est survenue lors de la mise à jour');
    }
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditedUser({ ...user });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.')) {
      try {
        setIsDeleting(true);
        // Remplacez cette ligne par votre appel API pour supprimer l'utilisateur
        // await userService.deleteUser(user.id);
        alert('Compte supprimé avec succès');
        onBack(); // Revenir à la liste des utilisateurs après suppression
      } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        alert('Une erreur est survenue lors de la suppression du compte');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRefreshSubscriptions = async () => {
    try {
      setIsRefreshing(true);
      // Recharger les abonnements
      const subscriptionsResult = await subscriptionService.getAllSubscriptions(0, 1000);
      const allSubscriptions = subscriptionsResult.content;
      const userSubs = allSubscriptions.filter((sub) => 
        sub.contextName === user.id || 
        sub.contextName.toLowerCase().includes(user.id.toLowerCase()) ||
        sub.applicationId === user.id
      );
      setUserSubscriptions(userSubs.length > 0 ? userSubs : allSubscriptions.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des abonnements:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // Charger toutes les subscriptions
        const subscriptionsResult = await subscriptionService.getAllSubscriptions(0, 1000);
        const allSubscriptions = subscriptionsResult.content;
        
        // Filtrer les subscriptions où le contextId correspond au userId
        // Pour l'instant, on prend les subscriptions où le contextId correspond au userId
        // Cette logique peut être améliorée si l'API fournit une relation directe
        const userSubs = allSubscriptions.filter((sub) => {
          // Vérifier si le contextId correspond au userId (relation directe ou indirecte)
          // On peut aussi vérifier si le contextName contient l'ID de l'utilisateur
          return sub.contextName === user.id || 
                 sub.contextName.toLowerCase().includes(user.id.toLowerCase()) ||
                 sub.applicationId === user.id;
        });
        
        // Si aucune subscription trouvée avec cette méthode, afficher toutes les actives
        // pour permettre à l'utilisateur de voir les subscriptions disponibles
        const subscriptionsToShow = userSubs.length > 0 
          ? userSubs.filter(sub => sub.status === "active")
          : allSubscriptions.filter(sub => sub.status === "active").slice(0, 5); // Limiter à 5 pour l'exemple
        setUserSubscriptions(subscriptionsToShow);
        setActiveSubs(subscriptionsToShow);

        // Charger toutes les applications
        const allApps = await applicationService.getAllApplications();
        
        // Filtrer les applications qui sont liées aux subscriptions de l'utilisateur
        const appIds = new Set(subscriptionsToShow.map(sub => sub.applicationId));
        const userApps = allApps.filter(app => appIds.has(app.id));
        setUserApplications(userApps);
      } catch (error) {
        console.error("[UserDetails] Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  const heroStats = [
    {
      label: "Rôle",
      value: roleLabels[user.role],
      helper: "Privilèges attribués",
    },
    {
      label: "Statut",
      value: statusLabels[user.status],
      helper: "État du compte",
    },
    {
      label: "Applications",
      value: userApplications.length,
      helper: "Accès actifs",
    },
    {
      label: "Dernière connexion",
      value: user.lastLogin
        ? new Date(user.lastLogin).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Jamais",
      helper: "Traçabilité",
    },
  ];

  // Empêcher le défilement du fond lorsque la modale est ouverte
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} style={{cursor: 'pointer'}}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-gray-900">{user.name}</h2>
            <p className="text-gray-600">Détails de l'utilisateur</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {heroStats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-md overflow-hidden relative">
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Informations générales */}
      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-indigo-600">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Informations générales
              </CardTitle>
              <CardDescription className="text-indigo-700/80">
                Détails du profil utilisateur
              </CardDescription>
            </div>
            {/* <Button 
              variant="outline" 
              size="sm" 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleEditClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Modifier
            </Button> */}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Carte d'identité */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Identité</h3>
                  <p className="text-sm text-gray-500">Informations personnelles</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</Label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-900">{user.name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</Label>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <a href={`mailto:${user.email}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                        {user.email}
                      </a>
                    )}
                  </div>
                </div>
                {user.phoneNumber && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</Label>
                    <div className="mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400 mr-2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedUser.phoneNumber || ''}
                          onChange={(e) => setEditedUser({...editedUser, phoneNumber: e.target.value})}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          placeholder="Ajouter un numéro"
                        />
                      ) : user.phoneNumber ? (
                        <a href={`tel:${user.phoneNumber}`} className="text-sm font-medium text-gray-900">
                          {normalizePhoneNumber(user.phoneNumber) || user.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Non renseigné</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statut et rôle */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Accès & Rôle</h3>
                  <p className="text-sm text-gray-500">Permissions et statut</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</Label>
                  <div className="mt-1">
                    {isEditing ? (
                      <select
                        value={editedUser.role}
                        onChange={(e) => setEditedUser({...editedUser, role: e.target.value as 'admin' | 'user' | 'moderator'})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge 
                        variant="outline" 
                        className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 px-3 py-1 text-sm font-medium"
                      >
                        {roleLabels[user.role]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut du compte</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      user.status === 'active' ? 'bg-green-500' : 
                      user.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    {isEditing ? (
                      <select
                        value={editedUser.status}
                        onChange={(e) => setEditedUser({...editedUser, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge
                        className={`${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        } font-medium`}>
                        {statusLabels[user.status]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière activité</Label>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {user.lastLogin
                        ? `Dernière connexion le ${new Date(user.lastLogin).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Jamais connecté"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails du compte */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Compte</h3>
                  <p className="text-sm text-gray-500">Informations du compte</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</Label>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID Utilisateur</Label>
                  <div className="mt-1">
                    <code className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {user.id.substring(0, 8)}...
                    </code>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="destructive"
                    size="sm" 
                    className="w-full bg-red-500 hover:bg-red-500 text-white hover:text-white"
                    style={{cursor: 'pointer'}}
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-white">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    )}
                    {isDeleting ? 'Suppression...' : 'Supprimer le compte'}
                  </Button>
                </div>
              </div>
              {isEditing && (
                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-100 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    style={{cursor: 'pointer'}}
                    onClick={() => {
                      setEditedUser({...user});
                      setIsEditing(false);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4"
                  >
                    Annuler
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 shadow-md"
                    style={{cursor: 'pointer'}}
                    onClick={async () => {
                      try {
                        // Ici, vous devriez appeler votre API pour mettre à jour l'utilisateur
                        // await userService.updateUser(editedUser);
                        // Mettre à jour l'utilisateur dans le state parent si nécessaire
                        // onUpdate(editedUser);
                        setIsEditing(false);
                        alert('Modifications enregistrées avec succès');
                      } catch (error) {
                        console.error('Erreur lors de la mise à jour:', error);
                        alert('Une erreur est survenue lors de la mise à jour');
                      }
                    }}
                  >
                    Enregistrer les modifications
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Modifier l'utilisateur</h3>
                <button 
                  onClick={handleCancel}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-1">Mettez à jour les informations de l'utilisateur</p>
            </div>
            
            {/* Corps du formulaire */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom complet */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrez le nom complet"
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="exemple@domaine.com"
                    />
                  </div>
                </div>
                
                {/* Téléphone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={editedUser.phoneNumber || ''}
                      onChange={(e) => setEditedUser({...editedUser, phoneNumber: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
                
                {/* Rôle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={editedUser.role}
                      onChange={(e) => setEditedUser({...editedUser, role: e.target.value as 'admin' | 'user' | 'moderator'})}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Statut du compte */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Statut du compte</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        editedUser.status === 'active' ? 'bg-green-500' : 
                        editedUser.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <select
                      value={editedUser.status}
                      onChange={(e) => setEditedUser({...editedUser, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Photo de profil */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Photo de profil</label>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Changer
                    </button>
                    <button 
                      type="button"
                      className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pied de page du modal */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-500"></div>
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-600">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
                Abonnements ({userSubscriptions.length})
              </CardTitle>
              <CardDescription className="text-amber-700/80">
                Gestion des abonnements actifs de l'utilisateur
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-amber-500 hover:bg-amber-600 border-amber-500 text-white hover:text-white hover:shadow-sm"
              style={{cursor: 'pointer'}}
              onClick={handleRefreshSubscriptions}
              disabled={isRefreshing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 16h5v5"></path>
              </svg>
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent mb-3"></div>
              <p className="text-sm font-medium text-gray-500">Chargement des abonnements...</p>
              <p className="text-xs text-gray-400 mt-1">Veuillez patienter</p>
            </div>
          ) : userSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-gray-300 mb-3">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                <path d="M12 5 4.1 16.3a.7.7 0 0 0 .1.9c.3.4.8.5 1.2.2l4.5-4"></path>
                <path d="m18 15-4-4"></path>
                <path d="m15 18-3-3"></path>
              </svg>
              <h4 className="text-lg font-medium text-gray-700 mb-1">Aucun abonnement trouvé</h4>
              <p className="text-sm text-gray-500 max-w-md">Cet utilisateur n'a pas encore souscrit à des services.</p>
              <Button variant="outline" size="sm" className="mt-4 border-amber-200 text-amber-700 hover:bg-amber-50" style={{cursor: 'pointer'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Ajouter un abonnement
              </Button>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="whitespace-nowrap px-6 py-3.5 text-sm font-semibold text-amber-800">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                            <line x1="16" x2="16" y1="2" y2="6"></line>
                            <line x1="8" x2="8" y1="2" y2="6"></line>
                            <line x1="3" x2="21" y1="10" y2="10"></line>
                            <path d="M8 14h.01"></path>
                            <path d="M12 14h.01"></path>
                            <path d="M16 14h.01"></path>
                            <path d="M8 18h.01"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M16 18h.01"></path>
                          </svg>
                          Contexte
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-6 py-3.5 text-sm font-semibold text-amber-800">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          Application
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-6 py-3.5 text-sm font-semibold text-amber-800">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                            <path d="M5 3v4"></path>
                            <path d="M19 17v4"></path>
                            <path d="M3 5h4"></path>
                            <path d="M17 19h4"></path>
                          </svg>
                          Plan
                        </div>
                      </TableHead>
                      <TableHead className="whitespace-nowrap px-6 py-3.5 text-sm font-semibold text-amber-800 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                          </svg>
                          Statut
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100">
                    {userSubscriptions.map((sub) => (
                      <TableRow 
                        key={sub.id} 
                        className="bg-white hover:bg-amber-50/50 transition-colors duration-150"
                      >
                        <TableCell className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" x2="16" y1="2" y2="6"></line>
                                <line x1="8" x2="8" y1="2" y2="6"></line>
                                <line x1="3" x2="21" y1="10" y2="10"></line>
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{sub.contextName || '—'}</div>
                              <div className="text-xs text-gray-500">ID: {sub.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="font-medium text-gray-700">{sub.application || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              {sub.plans.length > 0 ? sub.plans[0].planName : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-6 py-4 text-right">
                          <Badge 
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              sub.status === "active" 
                                ? "bg-green-100 text-green-800" 
                                : sub.status === "expired" 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              sub.status === "active" 
                                ? "bg-green-500" 
                                : sub.status === "expired" 
                                  ? "bg-red-500" 
                                  : "bg-gray-500"
                            }`}></span>
                            {sub.status === "active" ? "Actif" : sub.status === "expired" ? "Expiré" : "Annulé"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Affichage de <span className="font-medium">1</span> à <span className="font-medium">{Math.min(userSubscriptions.length, 10)}</span> sur <span className="font-medium">{userSubscriptions.length}</span> abonnements
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={true} style={{cursor: 'not-allowed'}}>
                    <span className="sr-only">Page précédente</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m15 18-6-6 6-6"></path>
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={userSubscriptions.length <= 10} style={{cursor: userSubscriptions.length > 10 ? 'pointer' : 'not-allowed'}}>
                    <span className="sr-only">Page suivante</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications */}
      <Card className="border-0 shadow-md overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900">Applications ({userApplications.length})</CardTitle>
          <CardDescription className="text-gray-600">
            Applications auxquelles cet utilisateur a accès
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des applications...
            </div>
          ) : userApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune application
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userApplications.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{app.name}</div>
                    <Badge variant="outline">
                      {app.type || "Application"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {app.description || "Aucune description"}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="secondary"
                      className={`${
                        app.status === "active" ? "bg-green-600" : "bg-gray-400"
                      } text-white`}
                    >
                      {app.status === "active" ? "Actif" : "Inactif"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Version: {app.version || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

