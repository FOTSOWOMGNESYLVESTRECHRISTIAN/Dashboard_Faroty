// app/countries/[id]/page.tsx ou pages/countrieDetails.tsx selon ta structure
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Globe, 
  Users, 
  CreditCard, 
  Percent, 
  Calendar, 
  BarChart, 
  Edit, 
  Trash2, 
  Flag, 
  Info, 
  Activity,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { getCountries, updateCountry, deleteCountry } from '@/services/paymentService';
import { Country } from '@/types/payment';
import { Loader2 } from 'lucide-react';

// Composant pour afficher le chargement
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Chargement des détails du pays...</span>
  </div>
);

// Composant pour afficher les erreurs
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="text-center p-4">
    <div className="text-red-500 mb-4">{message}</div>
    <Button onClick={onRetry} variant="outline">
      Réessayer
    </Button>
  </div>
);

export default function CountryDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Mémoïser la fonction de récupération des détails
  const fetchCountryDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const countries = await getCountries();
      const countryData = countries.find(country => country.id === id);
      
      if (!countryData) {
        throw new Error('Pays non trouvé');
      }
      
      setCountry(countryData);
    } catch (error) {
      console.error("Failed to fetch country details", error);
      setError("Impossible de charger les détails du pays. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Effet pour charger les données au montage et quand l'ID change
  useEffect(() => {
    fetchCountryDetails();
  }, [fetchCountryDetails]);

  // Gestionnaire de réessai
  const handleRetry = useCallback(() => {
    fetchCountryDetails();
  }, [fetchCountryDetails]);

  // Afficher l'état de chargement
  if (loading) {
    return <LoadingState />;
  }

  // Afficher l'erreur si nécessaire
  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  // Si pas de pays chargé (et pas d'erreur), rediriger
  if (!country) {
    navigate('/countries');
    return null;
  }

  const handleStatusToggle = async () => {
    if (!country) return;
    
    setUpdating(true);
    try {
      const updatedCountry = await updateCountry(country.id, {
        active: !country.active
      });
      setCountry(updatedCountry);
      toast.success(`Pays ${updatedCountry.active ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error("Failed to update country status", error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!country || !window.confirm(`Êtes-vous sûr de vouloir supprimer le pays ${country.nameFr} ?`)) {
      return;
    }

    try {
      await deleteCountry(country.id);
      toast.success("Pays supprimé avec succès");
      navigate('/countries');
    } catch (error) {
      console.error("Failed to delete country", error);
      toast.error("Erreur lors de la suppression du pays");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Chargement des détails du pays...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pays non trouvé</h2>
          <p className="text-gray-600 mb-6">Le pays que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/countries')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header avec bouton retour */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/countries')}
              className="border-2 border-gray-300 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Détails du pays</h1>
              <p className="text-gray-600">Informations complètes et gestion du pays</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Carte d'en-tête */}
        <Card className="border-2 border-gray-300 shadow-xl rounded-2xl mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg border-4 border-white">
                    <span className="font-mono font-bold text-3xl text-blue-700">
                      {country.code}
                    </span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {country.nameFr}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-lg">
                    {country.nameEn}
                  </CardDescription>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge 
                      variant={country.active ? "default" : "secondary"} 
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                        country.active 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        country.active ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {country.active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      ID: {country.id.slice(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={() => navigate(`/countries/${country.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg">
              <Info className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2 rounded-lg">
              <BarChart className="h-4 w-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 rounded-lg">
              <Activity className="h-4 w-4" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 rounded-lg">
              <Edit className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-300 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-blue-500" />
                    Informations de base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Code ISO :</span>
                      <span className="font-mono font-bold text-blue-700">{country.code}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Nom français :</span>
                      <span className="font-medium">{country.nameFr}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Nom anglais :</span>
                      <span className="font-medium">{country.nameEn}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-medium text-gray-600">Frais minimum :</span>
                      <span className="font-bold text-blue-700">{country.minTransactionFeeRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-300 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Historique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Date de création :</span>
                      <span className="font-medium">{formatDate(country.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Dernière mise à jour :</span>
                      <span className="font-medium">{formatDate(country.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm font-medium text-gray-600">Statut actuel :</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${country.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>{country.active ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-gray-300 rounded-xl">
              <CardHeader>
                <CardTitle>Résumé des activités</CardTitle>
                <CardDescription>Activités récentes liées à ce pays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune activité récente à afficher</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Statistiques */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-purple-300 rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Comptes utilisateurs</p>
                      <p className="text-4xl font-bold text-purple-900 mt-2">{country.accountsCount || 0}</p>
                      <p className="text-xs text-purple-600 mt-2">Total des comptes créés</p>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <Users className="h-8 w-8 text-purple-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-300 rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Méthodes de paiement</p>
                      <p className="text-4xl font-bold text-amber-900 mt-2">{country.paymentMethodsCount || 0}</p>
                      <p className="text-xs text-amber-600 mt-2">Méthodes disponibles</p>
                    </div>
                    <div className="bg-amber-500 p-3 rounded-lg">
                      <CreditCard className="h-8 w-8 text-amber-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-300 rounded-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Taux de frais</p>
                      <p className="text-4xl font-bold text-blue-900 mt-2">{country.minTransactionFeeRate || 0}%</p>
                      <p className="text-xs text-blue-600 mt-2">Minimum de transaction</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <Percent className="h-8 w-8 text-blue-100" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-gray-300 rounded-xl">
              <CardHeader>
                <CardTitle>Évolution des statistiques</CardTitle>
                <CardDescription>Données historiques et tendances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune donnée historique disponible</p>
                  <p className="text-sm text-gray-400 mt-2">Les données historiques seront bientôt disponibles</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-2 border-gray-300 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Journal d'activité
                </CardTitle>
                <CardDescription>Toutes les activités liées à ce pays</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Pays créé</p>
                        <p className="text-sm text-gray-500">Initialisation du pays dans le système</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(country.createdAt)}</span>
                  </div>
                  
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucune autre activité à afficher</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-2 border-gray-300 rounded-xl">
              <CardHeader>
                <CardTitle>Configuration du pays</CardTitle>
                <CardDescription>Gérez les paramètres et les préférences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Statut du pays</p>
                      <p className="text-sm text-gray-600">Activer ou désactiver ce pays dans l'application</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${country.active ? 'text-green-600' : 'text-gray-600'}`}>
                        {country.active ? 'Actif' : 'Inactif'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStatusToggle}
                        disabled={updating}
                        className="min-w-[100px]"
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          country.active ? 'Désactiver' : 'Activer'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Actions administratives</p>
                      <p className="text-sm text-gray-600 mb-4">Actions nécessitant une confirmation</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50 h-12"
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer ce pays
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="h-12"
                        onClick={() => navigate(`/countries/${country.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier les informations
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-300 rounded-xl">
              <CardHeader>
                <CardTitle>Informations techniques</CardTitle>
                <CardDescription>Données système et métadonnées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">ID du pays :</span>
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {country.id}
                    </code>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Dernière synchronisation :</span>
                    <span className="text-sm">{formatDate(country.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Version des données :</span>
                    <span className="text-sm">1.0.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}