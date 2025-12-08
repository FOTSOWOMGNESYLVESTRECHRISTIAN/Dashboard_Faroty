import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { ArrowLeft, Users, Check, X, AlertCircle, Calendar, Tag, Loader2 } from "lucide-react";
import { applicationService } from "../services/applicationService";

interface AbonnementPlan {
  planId: string;
  planName: string;
  interval: "month" | "year";
  price: number;
  currency: string;
  features: Array<{
    featureId: string;
    featureName: string;
    limit: number | null;
    used?: number;
  }>;
}

interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Abonnement {
  id: string;
  contextName: string;
  numberOfPeople: number;
  people: Person[];
  application: string;
  applicationId: string;
  plans: AbonnementPlan[];
  promotionCode: string | null;
  promotionPrice: number | null;
  originalPrice: number;
  finalPrice: number;
  currency: string;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
}

interface AbonnementDetailsProps {
  abonnement: Abonnement;
  onBack: () => void;
}

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

export function AbonnementDetails({ abonnement, onBack }: AbonnementDetailsProps) {
  const [appFeatures, setAppFeatures] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  useEffect(() => {
    const loadAppFeatures = async () => {
      if (!abonnement.applicationId) return;
      
      try {
        setLoadingFeatures(true);
        const features = await applicationService.getFeaturesByApplication(abonnement.applicationId);
        setAppFeatures(features);
      } catch (error) {
        console.error("[AbonnementDetails] Error loading features:", error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    loadAppFeatures();
  }, [abonnement.applicationId]);

  const formatPrice = (price: number, currency: string) => {
    // Remplacer EUR par XFA
    const displayCurrency = currency === "EUR" ? "XFA" : currency;
    return `${price.toFixed(2)} ${displayCurrency}`;
  };

  const isQuotaExhausted = (limit: number | null, used?: number) => {
    if (limit === null) return false;
    if (used === undefined) return false;
    return used >= limit;
  };

  const getQuotaStatus = (limit: number | null, used?: number) => {
    if (limit === null) return { label: "Illimité", exhausted: false };
    if (used === undefined) return { label: `Limite: ${limit}`, exhausted: false };
    const remaining = limit - used;
    return {
      label: `${used} / ${limit} utilisés`,
      remaining,
      exhausted: remaining <= 0,
    };
  };

  const heroStats = [
    {
      label: "Statut",
      value: statusLabels[abonnement.status],
      accent: statusColors[abonnement.status],
      helper: "État actuel",
    },
    {
      label: "Application",
      value: abonnement.application,
      helper: "Produits concernés",
    },
    {
      label: "Début",
      value: new Date(abonnement.startDate).toLocaleDateString("fr-FR"),
      helper: "Date effective",
    },
    {
      label: "Fin",
      value: new Date(abonnement.endDate).toLocaleDateString("fr-FR"),
      helper: "Renouvellement",
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-gray-900">{abonnement.contextName}</h2>
            <p className="text-gray-600">Détails de l'abonnement</p>
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
      <Card className="border-0 shadow-md overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Contexte</Label>
              <div className="mt-1 font-medium">{abonnement.contextName}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Application</Label>
              <div className="mt-1 font-medium">{abonnement.application}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Statut</Label>
              <div className="mt-1">
                <Badge
                  variant="secondary"
                  className={`${statusColors[abonnement.status]} text-white`}
                >
                  {statusLabels[abonnement.status]}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Nombre de personnes abonnées</Label>
              <div className="mt-1 flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {abonnement.people.length > 0 
                    ? abonnement.people.length 
                    : abonnement.numberOfPeople > 0 
                      ? abonnement.numberOfPeople 
                      : "—"}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Date de début</Label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(abonnement.startDate).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Date de fin</Label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(abonnement.endDate).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          </div>
          <Separator />
          
          {/* Prix */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Prix original</Label>
              <div className="text-2xl font-bold">
                {formatPrice(abonnement.originalPrice, abonnement.currency)}
              </div>
            </div>
            {abonnement.promotionPrice !== null && (
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  Prix promotion
                  <Badge variant="default" className="bg-orange-500 text-xs">
                    <div className="text-2xl font-bold text-green-600">
                      {abonnement.promotionPrice ? (
                        <>
                          {formatPrice(abonnement.promotionPrice, abonnement.currency)}
                          <span className="ml-2 text-xs font-normal text-gray-500 line-through">
                            {formatPrice(abonnement.originalPrice, abonnement.currency)}
                          </span>
                        </>
                      ) : (
                        formatPrice(abonnement.originalPrice, abonnement.currency)
                      )}
                    </div>
                  </Badge>
                </Label>
                <div className="mt-1 text-lg font-semibold text-green-600">
                  {formatPrice(abonnement.finalPrice, abonnement.currency)}
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm text-muted-foreground">Prix final</Label>
              <div className="mt-1 text-lg font-semibold text-green-600">
                {formatPrice(abonnement.finalPrice, abonnement.currency)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnes qui ont souscrit */}
      <Card className="border-0 shadow-md overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900">Personnes abonnées</CardTitle>
          <CardDescription className="text-gray-600">
            {abonnement.people.length > 0 ? (
              `${abonnement.people.length} personne(s) ayant souscrit à cet abonnement`
            ) : abonnement.numberOfPeople > 0 ? (
              `${abonnement.numberOfPeople} personne(s) dans ce contexte`
            ) : (
              "Aucune information disponible"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {abonnement.people.length > 0 ? (
            <div className="space-y-2">
              {abonnement.people.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-sm text-muted-foreground">{person.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {abonnement.numberOfPeople > 0 ? (
                <div className="text-sm text-gray-500">
                  {abonnement.numberOfPeople} personne{abonnement.numberOfPeople > 1 ? 's' : ''} (détails non disponibles)
                </div>
              ) : (
                "Aucune information sur les personnes abonnées"
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fonctionnalités de l'application */}
      {abonnement.applicationId && (
        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardHeader>
            <CardTitle className="text-gray-900">Fonctionnalités de l'application</CardTitle>
            <CardDescription className="text-gray-600">
              <div className="text-sm text-gray-500">
                Les fonctionnalités seront disponibles une fois qu'un plan sera associé à cet abonnement.
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFeatures ? (
              <div className="text-center py-8 text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des fonctionnalités...
              </div>
            ) : appFeatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune fonctionnalité disponible
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {appFeatures.map((feature: any, index: number) => (
                  <div
                    key={feature.id || index}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-card"
                  >
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{feature.name || feature.key || "Fonctionnalité"}</div>
                      {feature.description && (
                        <div className="text-xs text-muted-foreground mt-1">{feature.description}</div>
                      )}
                      {feature.type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {feature.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans souscrits */}
      <Card className="border-0 shadow-md overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900">Plans souscrits ({abonnement.plans.length})</CardTitle>
          <CardDescription className="text-gray-600">
            Plans et fonctionnalités avec quotas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {abonnement.plans.map((plan, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{plan.planName}</h2>
                  <div className="mt-2 flex items-center text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-5 h-5 mr-2" />
                    <div className="text-sm font-medium">
                      {abonnement.plans.length} plan{abonnement.plans.length > 1 ? 's' : ''} actif{abonnement.plans.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 px-4 py-3 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  <div className="text-sm font-medium text-indigo-500 dark:text-indigo-400">
                    / {plan.interval === "month" ? "mois" : "an"}
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 my-2"></div>
              <div className="mt-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Fonctionnalités de l'application
                  </h3>
                </div>
                <div className="grid gap-4">
                  {plan.features.map((feature, featureIndex) => {
                    const quotaStatus = getQuotaStatus(feature.limit, feature.used);
                    const exhausted = isQuotaExhausted(feature.limit, feature.used);
                    const percentage = feature.limit ? Math.round((feature.used || 0) / feature.limit * 100) : 0;
                    
                    return (
                      <div 
                        key={featureIndex}
                        className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        {/* Badge d'état */}
                        <div className="text-sm text-gray-500">
                          Aucun plan actif pour cet abonnement.
                        </div>
                        {/* En-tête de la carte */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {feature.featureName}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {quotaStatus.label}
                              {quotaStatus.remaining !== undefined && quotaStatus.remaining > 0 && (
                                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                  ({quotaStatus.remaining} restant{quotaStatus.remaining > 1 ? 's' : ''})
                                </span>
                              )}
                            </p>
                          </div>
                          
                          {/* Badge d'état */}
                          <div className="ml-4">
                            {exhausted ? (
                              <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium">
                                Quota épuisé
                              </Badge>
                            ) : (
                              <Badge className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
                                Actif
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Barre de progression */}
                        {feature.limit !== null && feature.used !== undefined && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <span className="font-medium">Utilisation</span>
                              <span className="font-semibold">{percentage}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  exhausted 
                                    ? 'bg-gradient-to-r from-red-400 to-red-500' 
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{feature.used || 0} utilisé{feature.used !== 1 ? 's' : ''}</span>
                              <span>{feature.limit} au total</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
