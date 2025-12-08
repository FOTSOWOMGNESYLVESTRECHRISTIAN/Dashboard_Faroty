import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, Smartphone, TrendingUp, DollarSign, CalendarPlus, ScanLine, ChartBar, Banknote } from "lucide-react";
import { Button } from "./ui/button";

const monthlyData = [
  { name: "Jan", applications: 12, subscriptions: 45 },
  { name: "Fév", applications: 19, subscriptions: 52 },
  { name: "Mar", applications: 15, subscriptions: 48 },
  { name: "Avr", applications: 22, subscriptions: 61 },
  { name: "Mai", applications: 28, subscriptions: 73 },
  { name: "Juin", applications: 34, subscriptions: 89 },
];

const categoryData = [
  { name: "Productivité", value: 35 },
  { name: "Jeux", value: 25 },
  { name: "Social", value: 20 },
  { name: "Éducation", value: 15 },
  { name: "Autres", value: 5 },
];

const COLORS = ["#68a6a6", "#d8df15", "#b55b12", "#4b30a5", "#c92c2c"];

type PeriodType = "7jours" | "14jours" | "mois" | "2mois";


export function DashboardStats() {
  const [chartPeriod, setChartPeriod] = useState<PeriodType>("mois");

  const periodButtons: { label: string; value: PeriodType }[] = [
    { label: "7 jours", value: "7jours" },
    { label: "14 jours", value: "14jours" },
    { label: "Ce mois", value: "mois" },
    { label: "2 mois", value: "2mois" },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-yellow-500 pb-4">
        <div className="space=y-1">
          <h1 className="text-gray-900 text-xl font-semibold">Statistiques du Dashboard</h1>
        </div>
        <p className="text-gray-400 text-sm">Vue d'ensemble de vos applications et subscriptions</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">130</span>
                  <span className="text-sm text-gray-500">+20%</span>
                </div>
                <p className="text-xs text-gray-400">par rapport au mois dernier</p>
              </div>
              <p className="text-gray-900 text-lg font-semibold">Total Applications</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">368</span>
                  <span className="text-sm text-gray-500">+15%</span>
                </div>
                <p className="text-xs text-gray-400">par rapport au mois dernier</p>
              </div>
              <p className="text-gray-900 text-lg font-semibold">Subscriptions Actives</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">+24%</span>
                  <span className="text-sm text-gray-500">↑</span>
                </div>
                <p className="text-xs text-gray-400">Croissance mensuelle</p>
              </div>
              <p className="text-gray-900 text-lg font-semibold">Taux de Croissance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-gray-900">$12,450</span>
                  <span className="text-sm text-gray-500">+18%</span>
                </div>
                <p className="text-xs text-gray-400">par rapport au mois dernier</p>
              </div>
              <p className="text-gray-900 text-lg font-semibold">Revenu Mensuel</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-gray-900 text-lg fond-semibold">Applications & Subscriptions</CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Évolution mensuelle des 6 derniers mois
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {periodButtons.map((btn) => (
                  <Button
                    key={btn.value}
                    variant={chartPeriod === btn.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartPeriod(btn.value)}
                    className={
                      chartPeriod === btn.value
                        ? "bg-[#1e3a5f] hover:bg-[#152d4a] text-white h-8 text-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 h-8 text-xs"
                    }
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="applications" fill="#318754" name="Applications" radius={[4, 4, 0, 0]} />
                <Bar dataKey="subscriptions" fill="#98a42a" name="Subscriptions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg fond-semibold">Répartition par Catégorie</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Distribution des applications par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md overflow-hidden relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg fond-semibold">Tendance des Subscriptions</CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Croissance des subscriptions sur 6 mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="subscriptions"
                stroke="#8b68a6"
                strokeWidth={2}
                name="Subscriptions"
                dot={{ fill: "#8b68a6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actions Rapides */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
        <CardHeader>
          <CardTitle className="text-gray-900">Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="default"
              className="h-20 bg-[#1e3a5f] hover:bg-[#152d4a] text-white flex-col gap-2"
            >
              <CalendarPlus className="h-5 w-5" />
              <span className="text-sm">Voir les applications</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 flex-col gap-2"
            >
              <ScanLine className="h-5 w-5" />
              <span className="text-sm">Voir les subscriptions</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 flex-col gap-2"
            >
              <ChartBar className="h-5 w-5" />
              <span className="text-sm">Gerer les utilisateurs</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 flex-col gap-2"
            >
              <Banknote className="h-5 w-5" />
              <span className="text-sm">Suivre les paiements</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
