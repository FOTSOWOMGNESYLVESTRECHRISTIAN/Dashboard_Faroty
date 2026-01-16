import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { API_BASE_URL } from "../utils/apiClient";
import {
  endpointCatalog,
  pageEndpointMap,
  PAGE_LABELS,
  type DashboardPageKey,
  type EndpointCatalogEntry,
} from "../utils/apiEndpoints";

interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  bio: string;
}

interface NotificationSettings {
  productUpdates: boolean;
  marketing: boolean;
  security: boolean;
  weeklySummary: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
}

export function Settings() {
  const [profile, setProfile] = useState<ProfileSettings>({
    firstName: "Alex",
    lastName: "Durand",
    email: "alex.durand@example.com",
    company: "TechNova",
    bio: "Responsable produit pour la suite d'applications TechNova.",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    productUpdates: true,
    marketing: false,
    security: true,
    weeklySummary: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: "Il y a 42 jours",
    sessions: [
      {
        id: "session-1",
        device: "Chrome sur Windows",
        location: "Paris, France",
        lastActive: "Il y a 3 minutes",
        current: true,
      },
      {
        id: "session-2",
        device: "Safari sur iPhone",
        location: "Lyon, France",
        lastActive: "Il y a 2 jours",
        current: false,
      },
    ],
  });
  const [endpointFilter, setEndpointFilter] = useState("");
  const filteredEndpoints = useMemo(() => {
    if (!endpointFilter) return endpointCatalog;
    const term = endpointFilter.toLowerCase();
    return endpointCatalog.filter((endpoint) => {
      const pageLabels = endpoint.pages.map((page) =>
        PAGE_LABELS[page].toLowerCase(),
      );
      return (
        endpoint.label.toLowerCase().includes(term) ||
        endpoint.method.toLowerCase().includes(term) ||
        endpoint.path.toLowerCase().includes(term) ||
        endpoint.folder.toLowerCase().includes(term) ||
        pageLabels.some((label) => label.includes(term))
      );
    });
  }, [endpointFilter]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4">
        <h2 className="text-gray-900">Paramètres du compte</h2>
        <p className="text-gray-600">
          Gérez vos informations personnelles, vos préférences de notifications et la sécurité de votre compte.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" style={{cursor: 'pointer'}}>Profil</TabsTrigger>
          <TabsTrigger value="notifications" style={{cursor: 'pointer'}}>Notifications</TabsTrigger>
          <TabsTrigger value="security" style={{cursor: 'pointer'}}>Sécurité</TabsTrigger>
          <TabsTrigger value="api" style={{cursor: 'pointer'}}>API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Informations générales</CardTitle>
              <CardDescription className="text-gray-600">
                Utilisez un e-mail professionnel pour assurer une meilleure communication avec votre équipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(event) =>
                      setProfile((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, company: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  rows={4}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, bio: event.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white" style={{cursor: 'pointer'}}>Enregistrer les modifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Notifications par e-mail</CardTitle>
              <CardDescription className="text-gray-600">
                Choisissez les notifications que vous souhaitez recevoir dans votre boîte de réception.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    Nouveautés produit
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Soyez informé des nouvelles fonctionnalités et améliorations.
                  </p>
                </div>
                <Switch
                  checked={notifications.productUpdates}
                  onCheckedChange={(value) =>
                    setNotifications((prev) => ({ ...prev, productUpdates: value }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    Offres marketing
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Promotions et conseils pour optimiser vos campagnes.
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(value) =>
                    setNotifications((prev) => ({ ...prev, marketing: value }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    Alertes de sécurité
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Recevez une alerte lorsqu'une action sensible est détectée.
                  </p>
                </div>
                <Switch
                  checked={notifications.security}
                  onCheckedChange={(value) =>
                    setNotifications((prev) => ({ ...prev, security: value }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    Résumé hebdomadaire
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Recevez un résumé de vos indicateurs clés chaque lundi.
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklySummary}
                  onCheckedChange={(value) =>
                    setNotifications((prev) => ({ ...prev, weeklySummary: value }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button className="bg-blue-100 hover:bg-blue-200" type="button" variant="outline" style={{cursor: 'pointer'}}>Réinitialiser</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Protection du compte</CardTitle>
              <CardDescription className="text-gray-600">
                Activez des protections supplémentaires pour sécuriser votre espace d'administration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-4 bg-gray-100">
                <div>
                  <h4 className="text-sm font-medium leading-none">
                    Authentification à deux facteurs
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Ajoutez une couche de sécurité supplémentaire lors de la connexion.
                  </p>
                </div>
                <Switch
                  checked={security.twoFactorEnabled}
                  onCheckedChange={(value) =>
                    setSecurity((prev) => ({ ...prev, twoFactorEnabled: value }))
                  }
                />
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium leading-none">
                  Mot de passe
                </h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  Dernier changement : {security.lastPasswordChange}
                </p>
                <Button type="button" className="mt-4 bg-primary hover:bg-primary text-white hover:text-white" variant="outline" style={{cursor: 'pointer'}}>
                  Mettre à jour le mot de passe
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-medium leading-none">Sessions actives</h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  Déconnectez les sessions que vous ne reconnaissez pas.
                </p>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {security.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{session.device}</p>
                        <p className="text-muted-foreground text-xs">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-4">
                        {session.current ? (
                          <Badge variant="secondary">Session actuelle</Badge>
                        ) : (
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white hover:text-white"
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSecurity((prev) => ({
                                ...prev,
                                sessions: prev.sessions.filter((s) => s.id !== session.id),
                              }))
                            }
                            style={{cursor: 'pointer'}}
                          >
                            Déconnecter
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Connexion à l'API FAROTY</CardTitle>
              <CardDescription className="text-gray-600">
                Base URL injectée via les variables d'environnement et prête pour les appels `fetch`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Base URL</Label>
                <div className="flex gap-3">
                  <Input readOnly value={API_BASE_URL} className="font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigator.clipboard?.writeText(API_BASE_URL)}
                    style={{cursor: 'pointer'}}
                  >
                    Copier
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Personnalisez cette valeur via <code>VITE_API_BASE_URL</code>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Couverture API par page</CardTitle>
              <CardDescription className="text-gray-600">
                Chaque vue du dashboard est reli&eacute;e aux endpoints publi&eacute;s dans <code>apiEndpoints.ts</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {pageCoverageSummaries.map(({ page, label, total, sample }) => (
                  <div
                    key={page}
                    className="rounded-2xl border border-primary/15 p-4 shadow-sm bg-white/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {total} endpoint{total > 1 ? "s" : ""} connect&eacute;{total > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {total}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sample.map((endpoint) => (
                        <Badge
                          key={`${page}-${endpoint.id}`}
                          variant="outline"
                          className="rounded-full font-mono text-[11px] p-4"
                        >
                          {endpoint.method} {endpoint.path.replace(/^https?:\/\/[^/]+/i, "")}
                        </Badge>
                      ))}
                      {total > sample.length && (
                        <span className="text-xs text-muted-foreground">
                          +{total - sample.length} supplémentaire{total - sample.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden relative">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <CardHeader>
              <CardTitle className="text-gray-900">Catalogue des endpoints</CardTitle>
              <CardDescription className="text-gray-600">
                Toutes les routes disponibles transitent par <code>apiEndpoints.ts</code>, ce qui garantit une seule source fiable pour le client API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Filtrer par nom, méthode ou chemin..."
                value={endpointFilter}
                onChange={(event) => setEndpointFilter(event.target.value)}
                className="rounded-full border-primary/20"
              />
              <div className="max-h-[360px] overflow-auto rounded-2xl border border-primary/15 p-4">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-purple-100 backdrop-blur">
                    <tr>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-muted-foreground">
                        Méthode
                      </th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-muted-foreground">
                        Nom
                      </th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-muted-foreground">
                        Chemin
                      </th>
                      <th className="p-4 text-left text-xs uppercase tracking-widest text-muted-foreground">
                        Pages
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpoints.slice(0, 30).map((endpoint) => (
                      <tr key={endpoint.id} className="border-t">
                        <td className="p-4">
                          <Badge variant="outline" className="rounded-full px-3 py-1 bg-blue-100">
                            {endpoint.method}
                          </Badge>
                        </td>
                        <td className="p-4 font-semibold text-gray-900">{endpoint.label}</td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">{endpoint.path}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {endpoint.pages.length > 0
                            ? endpoint.pages.map((page) => PAGE_LABELS[page]).join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredEndpoints.length} endpoint(s) expos&eacute;s via <code>apiEndpoints.ts</code>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const pageCoverageSummaries = (
  Object.entries(pageEndpointMap) as [DashboardPageKey, EndpointCatalogEntry[]][]
).map(([page, endpoints]) => ({
  page,
  label: PAGE_LABELS[page],
  total: endpoints.length,
  sample: endpoints.slice(0, 3),
}));

