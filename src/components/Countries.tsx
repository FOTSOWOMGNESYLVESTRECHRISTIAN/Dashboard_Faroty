import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Plus, Globe, Search, Flag, Earth, Users, CreditCard, CheckCircle, XCircle, ArrowRight, Filter, ChevronLeft, ChevronRight, Info, Edit, Trash2, Activity, Percent, Calendar, BarChart } from 'lucide-react';
import { getCountries, createCountry, CreateCountryRequest } from '../services/paymentService';
import { Country } from '../types/payment';
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface CountriesProps {
  onViewCountryDetails?: (country: Country) => void;
}

export function Countries({ onViewCountryDetails }: CountriesProps) {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    
    // État pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // État pour les filtres
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [accountsFilter, setAccountsFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CreateCountryRequest>({
        code: '',
        nameFr: '',
        nameEn: '',
        minTransactionFeeRate: 0,
    });

    const fetchCountries = async () => {
        setLoading(true);
        try {
            const data = await getCountries();
            setCountries(data);
            setCurrentPage(1); // Réinitialiser à la première page après un nouveau chargement
        } catch (error) {
            console.error("Failed to fetch countries", error);
            toast.error("Impossible de charger la liste des pays");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCountries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.nameFr) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsSubmitting(true);
        try {
            await createCountry({
                ...formData,
                code: formData.code.toUpperCase()
            });
            toast.success("🎉 Pays ajouté avec succès !");
            setIsDialogOpen(false);
            setFormData({ code: '', nameFr: '', nameEn: '', minTransactionFeeRate: 0 });
            fetchCountries();
        } catch (error: any) {
            console.error("Error creating country", error);
            toast.error(error.message || "Erreur lors de la création du pays");
        } finally {
            setIsSubmitting(false);
        }
    };

    const navigate = useNavigate();

    const handleCountryClick = (country: Country) => {
        if (onViewCountryDetails) {
            onViewCountryDetails(country);
        } else {
            setSelectedCountry(country);
            setIsDetailsDialogOpen(true);
        }
    };

    // Filtrer les pays selon les différents critères
    const filteredCountries = countries.filter(country => {
        // Filtre de recherche
        const matchesSearch = searchTerm === '' || 
            country.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            country.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtre par statut
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && country.active) ||
            (statusFilter === 'inactive' && !country.active);
        
        // Filtre par nombre de comptes
        let matchesAccounts = true;
        const accountsCount = country.accountsCount || 0;
        switch (accountsFilter) {
            case 'none':
                matchesAccounts = accountsCount === 0;
                break;
            case 'low':
                matchesAccounts = accountsCount > 0 && accountsCount <= 10;
                break;
            case 'medium':
                matchesAccounts = accountsCount > 10 && accountsCount <= 50;
                break;
            case 'high':
                matchesAccounts = accountsCount > 50;
                break;
            default:
                matchesAccounts = true;
        }
        
        return matchesSearch && matchesStatus && matchesAccounts;
    });

    // Calcul de la pagination
    const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCountries = filteredCountries.slice(startIndex, endIndex);

    // Stats pour le dashboard
    const totalCountries = countries.length;
    const activeCountries = countries.filter(c => c.active).length;
    const totalAccounts = countries.reduce((sum, c) => sum + (c.accountsCount || 0), 0);
    const totalPaymentMethods = countries.reduce((sum, c) => sum + (c.paymentMethodsCount || 0), 0);

    // Gestionnaires de pagination
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setAccountsFilter('all');
        setCurrentPage(1);
    };

    // Réinitialiser la page quand on recherche ou filtre
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, accountsFilter]);

    // Formater la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Non disponible';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            {/* En-tête avec stats */}
            <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white border-2 border-gray-800 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-500 p-4 rounded-xl shadow-lg">
                                <Earth className="h-12 w-12" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold text-gray-900">Gestion des Pays</h1>
                                <p className="text-gray-500 mt-2">Configurez et gérez les pays disponibles pour votre plateforme internationale</p>
                            </div>

                            <div className="flex-shrink-0 ml-auto">
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="bg-primary hover:bg-primary text-white shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-green-400 hover:border-green-500 h-14 px-8"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Plus className="mr-3 h-5 w-5" />
                                    Nouveau Pays
                                </Button>
                            </div>
                        </div>
                        
                        {/* Stats en ligne */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 text-xl fond-semibold">Pays totaux</p>
                                        <p className="text-2xl font-bold mt-1 text-gray-500">{totalCountries}</p>
                                    </div>
                                    <div className="bg-blue-500 p-2 rounded-lg">
                                        <Globe className="h-5 w-5 text-blue-300" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 fond-semibold text-xl">Pays actifs</p>
                                        <p className="text-2xl font-bold mt-1 text-gray-500">{activeCountries}</p>
                                    </div>
                                    <div className="bg-green-600 p-2 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-300" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 fond-demibold text-xl">Comptes totaux</p>
                                        <p className="text-2xl font-bold mt-1 text-gray-500">{totalAccounts}</p>
                                    </div>
                                    <div className="bg-purple-600 p-2 rounded-lg">
                                        <Users className="h-5 w-5 text-purple-300" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 fond-demibold text-xl">Méthodes</p>
                                        <p className="text-2xl font-bold mt-1 text-gray-500">{totalPaymentMethods}</p>
                                    </div>
                                    <div className="bg-amber-500 p-2 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-amber-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>&nbsp;

            {/* Barre de recherche et filtres */}
            <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border-2 border-gray-300 shadow-lg">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Rechercher un pays par nom ou code..."
                            className="pl-12 h-12 text-sm border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* <Button 
                            variant="outline" 
                            onClick={() => setShowFilters(!showFilters)}
                            className="border-2 border-gray-300 hover:border-blue-400 rounded-xl"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filtres {showFilters ? '▲' : '▼'}
                        </Button> */}
                        
                        {(searchTerm || statusFilter !== 'all' || accountsFilter !== 'all') && (
                            <Button 
                                variant="ghost" 
                                onClick={resetFilters}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                Réinitialiser
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Filtres avancés */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Statut
                            </Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="border-2 border-gray-300 rounded-xl">
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="active">Actif uniquement</SelectItem>
                                    <SelectItem value="inactive">Inactif uniquement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Nombre de comptes
                            </Label>
                            <Select value={accountsFilter} onValueChange={setAccountsFilter}>
                                <SelectTrigger className="border-2 border-gray-300 rounded-xl">
                                    <SelectValue placeholder="Tous les comptes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les comptes</SelectItem>
                                    <SelectItem value="none">Aucun compte</SelectItem>
                                    <SelectItem value="low">1-10 comptes</SelectItem>
                                    <SelectItem value="medium">11-50 comptes</SelectItem>
                                    <SelectItem value="high">Plus de 50 comptes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Éléments par page
                            </Label>
                            <Select 
                                value={itemsPerPage.toString()} 
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="border-2 border-gray-300 rounded-xl">
                                    <SelectValue placeholder={itemsPerPage.toString()} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 par page</SelectItem>
                                    <SelectItem value="10">10 par page</SelectItem>
                                    <SelectItem value="25">25 par page</SelectItem>
                                    <SelectItem value="50">50 par page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>&nbsp;

            {/* Carte principale */}
            <Card className="border-2 border-gray-300 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-300 pb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500 hover:bg-blue-600 p-4 rounded-xl shadow-lg transition-colors duration-200">
                                <Flag className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold text-gray-900">Liste des Pays</CardTitle>
                                <CardDescription className="text-gray-600 mt-2">
                                    {searchTerm || statusFilter !== 'all' || accountsFilter !== 'all' ? (
                                        <span className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {filteredCountries.length} résultat{filteredCountries.length > 1 ? 's' : ''}
                                            </span>
                                            {searchTerm && <span>pour "{searchTerm}"</span>}
                                            {statusFilter !== 'all' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {statusFilter === 'active' ? 'Actifs' : 'Inactifs'}
                                                </Badge>
                                            )}
                                            {accountsFilter !== 'all' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {accountsFilter === 'none' ? 'Aucun compte' : 
                                                     accountsFilter === 'low' ? '1-10 comptes' :
                                                     accountsFilter === 'medium' ? '11-50 comptes' : 
                                                     'Plus de 50 comptes'}
                                                </Badge>
                                            )}
                                        </span>
                                    ) : (
                                        <span>Gérez tous les pays disponibles sur votre plateforme internationale</span>
                                    )}
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-4 ml-auto">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="border-2 border-gray-300 hover:border-blue-400 rounded-xl"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filtres {searchTerm || statusFilter !== 'all' || accountsFilter !== 'all' ? 
                                        `${filteredCountries.length} résultat(s)` : 
                                        `${countries.length} pays`} {showFilters ? '▲' : '▼'}
                                </Button>

                                {/* <Badge variant="outline" className="border-2 border-gray-300 px-4 py-2">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {searchTerm || statusFilter !== 'all' || accountsFilter !== 'all' ? 
                                        `${filteredCountries.length} résultat(s)` : 
                                        `${countries.length} pays`}
                                </Badge> */}
                                
                                <Button variant="outline" onClick={fetchCountries} className="border-2 border-gray-300 hover:border-blue-400 rounded-xl" style={{cursor: 'pointer'}}>
                                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Actualiser
                                </Button>
                            </div>
                        </div>
                        
                        {filteredCountries.length > 0 && (
                            <div className="bg-white/80 backdrop-blur-sm px-4 py-4 rounded-lg border-2 border-gray-200 shadow-sm">
                                <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="font-medium">Conseil :</span> Cliquez sur un pays pour voir les détails
                                </p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-gray-200"></div>
                                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-lg font-medium text-gray-900">Chargement des pays...</p>
                            <p className="text-sm text-gray-500">Veuillez patienter quelques instants</p>
                        </div>
                    ) : filteredCountries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                    <Globe className="h-12 w-12 text-blue-500" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {searchTerm || statusFilter !== 'all' || accountsFilter !== 'all' ? "Aucun pays trouvé" : "Bienvenue dans la gestion des pays"}
                            </h3>
                            <p className="text-gray-600 max-w-md mb-8">
                                {searchTerm || statusFilter !== 'all' || accountsFilter !== 'all'
                                    ? "Aucun pays ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                                    : "Commencez par ajouter votre premier pays pour configurer votre présence internationale."}
                            </p>
                            <Button
                                onClick={() => setIsDialogOpen(true)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8"
                            >
                                <Plus className="mr-3 h-5 w-5" />
                                Ajouter le premier pays
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-b-2xl">
                            <div className="overflow-x-auto">
                                <Table className="min-w-full border-collapse">
                                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <TableRow className="border-b-2 border-gray-300 hover:bg-transparent">
                                            <TableHead className="px-8 py-5 text-left">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Flag className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Code ISO</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-8 py-5 text-left">
                                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom Français</span>
                                            </TableHead>
                                            <TableHead className="px-8 py-5 text-left hidden lg:table-cell">
                                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom Anglais</span>
                                            </TableHead>
                                            <TableHead className="px-8 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Users className="h-4 w-4 text-purple-500" />
                                                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Comptes</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-8 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-amber-500" />
                                                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Méthodes</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-8 py-5 text-center">
                                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-200">
                                        {paginatedCountries.map((country) => (
                                            <TableRow 
                                                key={country.id} 
                                                className="bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 cursor-pointer group border-b border-gray-100 last:border-0"
                                                onClick={() => handleCountryClick(country)}
                                            >
                                                <TableCell className="px-8 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm border-2 border-white group-hover:border-blue-200 transition-colors">
                                                                <span className="font-mono font-bold text-lg text-blue-700">
                                                                    {country.code}
                                                                </span>
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                                                <Earth className="h-3 w-3 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-5 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {country.nameFr}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            ID: {country.id.slice(0, 8)}...
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-5 whitespace-nowrap hidden lg:table-cell">
                                                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                        {country.nameEn}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-5 whitespace-nowrap text-center">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-full border-2 border-purple-100">
                                                        <Users className="h-4 w-4 text-purple-600" />
                                                        <span className="font-bold text-purple-700">{country.accountsCount || 0}</span>
                                                        <span className="text-xs text-purple-600">comptes</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-5 whitespace-nowrap text-center">
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border-2 border-amber-100">
                                                        <CreditCard className="h-4 w-4 text-amber-600" />
                                                        <span className="font-bold text-amber-700">{country.paymentMethodsCount || 0}</span>
                                                        <span className="text-xs text-amber-600">méthodes</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-5 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-3">
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
                                                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Pagination/Footer */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300 px-8 py-4">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-gray-600">
                                        Affichage de <span className="font-bold text-gray-900">{startIndex + 1}</span> à <span className="font-bold text-gray-900">{Math.min(endIndex, filteredCountries.length)}</span> sur <span className="font-bold text-gray-900">{filteredCountries.length}</span> pays
                                        <span className="ml-2 text-xs text-gray-500">(Page {currentPage} sur {totalPages})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="border-2 border-gray-300 rounded-lg disabled:opacity-50"
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="text-xs ml-1">Précédent</span>
                                        </Button>
                                        
                                        {/* Affichage des numéros de page */}
                                        <div className="flex items-center gap-1 mx-2">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                // Logique pour afficher les pages autour de la page courante
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                if (pageNum < 1 || pageNum > totalPages) return null;
                                                
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`min-w-10 h-10 border-2 ${
                                                            currentPage === pageNum 
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                                                                : 'border-gray-300'
                                                        } rounded-lg`}
                                                        onClick={() => goToPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="border-2 border-gray-300 rounded-lg disabled:opacity-50"
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                        >
                                            <span className="text-xs mr-1">Suivant</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog d'ajout de pays */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl border-2 border-gray-300 shadow-2xl p-0 bg-white overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        {/* En-tête du dialog */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-gray-300 px-8 pt-6 pb-8">
                            <DialogHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                                        <Plus className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-gray-900">Nouveau Pays</DialogTitle>
                                        <DialogDescription className="text-gray-600 mt-1">
                                            Configurez un nouveau pays pour étendre votre portée internationale
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>
                        
                        {/* Contenu du formulaire */}
                        <div className="px-8 py-6 space-y-6">
                            {/* Section Code ISO */}
                            <div className="space-y-4">
                                <Label htmlFor="code" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Code ISO (2 lettres)
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="code"
                                        placeholder="Ex: FR, SN, US"
                                        maxLength={2}
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        className="h-12 pl-12 text-center text-lg font-mono uppercase border-2 border-gray-300 focus:border-green-500 rounded-xl"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Flag className="h-4 w-4 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                        {formData.code.length}/2
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 px-1">Entrez le code pays ISO à 2 lettres (ex: FR pour France)</p>
                            </div>

                            {/* Section Noms */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label htmlFor="nameFr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Nom (Français)
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="nameFr"
                                            placeholder="Ex: France, Sénégal"
                                            value={formData.nameFr}
                                            onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                                            required
                                            className="h-12 border-2 border-gray-300 focus:border-red-500 rounded-xl"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">FR</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label htmlFor="nameEn" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        Nom (Anglais)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="nameEn"
                                            placeholder="Ex: France, Senegal"
                                            value={formData.nameEn}
                                            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                            required
                                            className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">EN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section frais minimum */}
                            <div className="space-y-4">
                                <Label htmlFor="minTransactionFeeRate" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    Frais minimum de transaction (%)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="minTransactionFeeRate"
                                        type="number"
                                        placeholder="Ex: 1.5"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.minTransactionFeeRate}
                                        onChange={(e) => setFormData({ ...formData, minTransactionFeeRate: parseFloat(e.target.value) || 0 })}
                                        className="h-12 pl-12 border-2 border-gray-300 focus:border-amber-500 rounded-xl"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-amber-600" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 px-1">Frais minimum applicable aux transactions dans ce pays (optionnel)</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <DialogFooter className="px-8 py-6 border-t-2 border-gray-300">
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsDialogOpen(false)}
                                    className="h-12 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200"
                                    style={{ cursor: 'pointer' }}
                                >
                                    Annuler
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl border-2 border-green-400 hover:border-green-500 rounded-xl transition-all duration-200 disabled:opacity-50"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-3 h-5 w-5" />
                                            Créer le pays
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog de détails du pays */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-2xl border-2 border-gray-300 shadow-2xl p-0 bg-white overflow-hidden max-h-[90vh] overflow-y-auto">
                    {selectedCountry && (
                        <>
                            {/* En-tête du dialog */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-300 px-8 pt-6 pb-8">
                                <DialogHeader>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg border-4 border-white">
                                                    <span className="font-mono font-bold text-2xl text-blue-700">
                                                        {selectedCountry.code}
                                                    </span>
                                                </div>
                                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                                    <Earth className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <DialogTitle className="text-2xl font-bold text-gray-900">
                                                    {selectedCountry.nameFr}
                                                </DialogTitle>
                                                <DialogDescription className="text-gray-600 mt-1">
                                                    {selectedCountry.nameEn}
                                                </DialogDescription>
                                            </div>
                                        </div>
                                        <Badge 
                                            variant={selectedCountry.active ? "default" : "secondary"} 
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                                                selectedCountry.active 
                                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' 
                                                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200'
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                selectedCountry.active ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></span>
                                            {selectedCountry.active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                </DialogHeader>
                            </div>
                            
                            {/* Contenu du dialog */}
                            <div className="px-8 py-6 space-y-6">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="overview" className="flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            Vue d'ensemble
                                        </TabsTrigger>
                                        <TabsTrigger value="stats" className="flex items-center gap-2">
                                            <BarChart className="h-4 w-4" />
                                            Statistiques
                                        </TabsTrigger>
                                        <TabsTrigger value="settings" className="flex items-center gap-2">
                                            <Edit className="h-4 w-4" />
                                            Paramètres
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="overview" className="space-y-6 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <Flag className="h-5 w-5 text-blue-500" />
                                                    Informations de base
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Code ISO :</span>
                                                        <span className="font-mono font-bold text-blue-700">{selectedCountry.code}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Nom français :</span>
                                                        <span className="font-medium">{selectedCountry.nameFr}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Nom anglais :</span>
                                                        <span className="font-medium">{selectedCountry.nameEn}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">ID du pays :</span>
                                                        <span className="font-mono text-xs text-gray-500">{selectedCountry.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-purple-500" />
                                                    Dates
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Date de création :</span>
                                                        <span className="font-medium">{formatDate(selectedCountry.createdAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-sm text-gray-600">Dernière mise à jour :</span>
                                                        <span className="font-medium">{formatDate(selectedCountry.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="stats" className="space-y-6 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-purple-700">Comptes utilisateurs</p>
                                                        <p className="text-3xl font-bold text-purple-900 mt-2">{selectedCountry.accountsCount || 0}</p>
                                                    </div>
                                                    <div className="bg-purple-500 p-3 rounded-lg">
                                                        <Users className="h-6 w-6 text-purple-100" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-purple-600">
                                                    Nombre total de comptes créés dans ce pays
                                                </div>
                                            </div>
                                            
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-amber-700">Méthodes de paiement</p>
                                                        <p className="text-3xl font-bold text-amber-900 mt-2">{selectedCountry.paymentMethodsCount || 0}</p>
                                                    </div>
                                                    <div className="bg-amber-500 p-3 rounded-lg">
                                                        <CreditCard className="h-6 w-6 text-amber-100" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-amber-600">
                                                    Méthodes de paiement disponibles
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-100">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuration des frais</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <Percent className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Frais minimum de transaction</p>
                                                            <p className="text-sm text-gray-600">Taux applicable aux transactions</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-700">
                                                        {selectedCountry.minTransactionFeeRate || 0}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="settings" className="space-y-6 pt-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du pays</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Statut du pays</p>
                                                        <p className="text-sm text-gray-600">Activer ou désactiver ce pays</p>
                                                    </div>
                                                    <Switch 
                                                        checked={selectedCountry.active}
                                                        onCheckedChange={() => {
                                                            // Ici vous pourriez appeler une API pour mettre à jour le statut
                                                            toast.info("Fonctionnalité de modification en développement");
                                                        }}
                                                    />
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Actions rapides</p>
                                                        <p className="text-sm text-gray-600">Gérer ce pays</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <Edit className="h-4 w-4" />
                                                            Modifier
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="font-medium mb-2">Informations techniques :</p>
                                            <p>ID: {selectedCountry.id}</p>
                                            <p>Créé le: {formatDate(selectedCountry.createdAt)}</p>
                                            <p>Mis à jour le: {formatDate(selectedCountry.updatedAt)}</p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                            
                            {/* Actions */}
                            <DialogFooter className="px-8 py-6 border-t-2 border-gray-300">
                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsDetailsDialogOpen(false)}
                                        className="h-12 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-all duration-200"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Fermer
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            className="h-12 px-6 border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="default"
                                            className="h-12 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border-2 border-blue-400 hover:border-blue-500 rounded-xl transition-all duration-200"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                setIsDetailsDialogOpen(false);
                                                // Ici, vous pourriez naviguer vers une page de statistiques détaillées
                                                toast.info("Navigation vers les statistiques détaillées");
                                            }}
                                        >
                                            <BarChart className="mr-2 h-4 w-4" />
                                            Voir plus de stats
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}