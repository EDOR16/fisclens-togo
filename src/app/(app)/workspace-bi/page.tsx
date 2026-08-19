/**
 * Page Workspace BI & Data Analyse
 * Import Excel + Navigation vers les 7 dashboards
 */

"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardOverview } from "@/components/bi/dashboard-overview";
import { AlertsComponent, Alert as AlertType } from "@/components/bi/alerts-component";
import { Upload, BarChart3, TrendingUp, Users, ShoppingCart, Target, Zap, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface DashboardData {
  overview?: any;
  sales?: any;
  clients?: any;
  purchases?: any;
  profitability?: any;
  forecast?: any;
  alerts?: {
    alerts: AlertType[];
    summary: { critical: number; warning: number; info: number };
  };
}

export default function WorkspaceBIPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  // Charger les données des dashboards
  const loadDashboard = async (dashboardName: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/bi/dashboard/${dashboardName}`);
      setDashboardData((prev) => ({
        ...prev,
        [dashboardName]: (response as any).data,
      }));
    } catch (error) {
      console.error(`Erreur chargement ${dashboardName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Importer fichier Excel
  const handleFileImport = async (type: "sales" | "purchases" | "clients" | "products", file: File) => {
    setImportProgress(`Import ${type} en cours...`);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const response = await apiClient.post(`/bi/import/${type}`, {
        fileBuffer: base64,
        fileName: file.name,
      });

      setImportProgress(`✓ ${(response as any).message}`);

      // Recharger les données
      setTimeout(() => {
        loadDashboard("overview");
        setImportProgress(null);
      }, 2000);
    } catch (error) {
      setImportProgress(`✗ Erreur import: ${String(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Workspace BI & Data Analyse</h1>
        <p className="text-gray-600 mt-2">
          Analysez vos données opérationnelles, générez des prévisions et prenez des décisions éclairées
        </p>
      </div>

      {/* Zone d'import */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold">Importer des données Excel</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { type: "sales" as const, label: "Ventes", info: "ventes.xlsx" },
            { type: "purchases" as const, label: "Achats", info: "achats.xlsx" },
            { type: "clients" as const, label: "Clients", info: "clients.xlsx" },
            { type: "products" as const, label: "Produits", info: "produits.xlsx" },
          ].map(({ type, label, info }) => (
            <div key={type} className="space-y-2">
              <label className="block text-sm font-medium">{label}</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileImport(type, e.target.files[0]);
                  }
                }}
                className="text-xs file:mr-2 file:px-3 file:py-1 file:bg-blue-600 file:text-white file:rounded file:cursor-pointer"
              />
              <p className="text-xs text-gray-500">{info}</p>
            </div>
          ))}
        </div>

        {importProgress && (
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm text-blue-700">{importProgress}</p>
          </div>
        )}
      </Card>

      {/* Tabs des dashboards */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 h-auto">
          <TabsTrigger value="overview" onClick={() => loadDashboard("overview")} className="text-xs">
            <BarChart3 size={16} className="mr-1" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="sales" onClick={() => loadDashboard("sales")} className="text-xs">
            <TrendingUp size={16} className="mr-1" />
            <span className="hidden sm:inline">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="clients" onClick={() => loadDashboard("clients")} className="text-xs">
            <Users size={16} className="mr-1" />
            <span className="hidden sm:inline">Clients</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" onClick={() => loadDashboard("purchases")} className="text-xs">
            <ShoppingCart size={16} className="mr-1" />
            <span className="hidden sm:inline">Achats</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" onClick={() => loadDashboard("profitability")} className="text-xs">
            <Target size={16} className="mr-1" />
            <span className="hidden sm:inline">Rentabilité</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" onClick={() => loadDashboard("forecast")} className="text-xs">
            <Zap size={16} className="mr-1" />
            <span className="hidden sm:inline">Prévisions</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" onClick={() => loadDashboard("alerts")} className="text-xs">
            <AlertCircle size={16} className="mr-1" />
            <span className="hidden sm:inline">Alertes</span>
          </TabsTrigger>
        </TabsList>

        {isLoading && (
          <div className="p-8 text-center text-gray-500">
            Chargement des données...
          </div>
        )}

        {!isLoading && (
          <>
            <TabsContent value="overview" className="space-y-4">
              {dashboardData.overview ? (
                <DashboardOverview {...dashboardData.overview.data} />
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Cliquez pour charger les données
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              {dashboardData.sales ? (
                <div>
                  <h2 className="text-lg font-bold mb-4">Analyse des Ventes</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Top 10 Produits</h3>
                      <div className="space-y-1 text-sm">
                        {dashboardData.sales.data.topProducts.slice(0, 5).map((p: any) => (
                          <div key={p.code} className="flex justify-between">
                            <span>{p.designation}</span>
                            <span className="font-semibold text-green-600">{p.margePercent}%</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Zones Géographiques</h3>
                      <div className="space-y-1 text-sm">
                        {dashboardData.sales.data.zones.slice(0, 5).map((z: any) => (
                          <div key={z.zone} className="flex justify-between">
                            <span>{z.zone}</span>
                            <span className="font-semibold">{(z.ca / 1000000).toFixed(1)}M</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Cliquez pour charger les données
                </Card>
              )}
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              {dashboardData.clients ? (
                <div>
                  <h2 className="text-lg font-bold mb-4">Analyse des Clients</h2>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Top 10 Clients</h3>
                    <div className="space-y-1 text-sm">
                      {dashboardData.clients.data.topClients.slice(0, 10).map((c: any) => (
                        <div key={c.clientCode} className="flex justify-between">
                          <span>{c.clientName}</span>
                          <span className="font-semibold">{c.weight}% du CA</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Cliquez pour charger les données
                </Card>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              {dashboardData.purchases ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Top Fournisseurs</h3>
                  <div className="space-y-1 text-sm">
                    {dashboardData.purchases.data.topSuppliers.slice(0, 10).map((s: any) => (
                      <div key={s.supplierId} className="flex justify-between">
                        <span>{s.supplierId}</span>
                        <span className="font-semibold">{(s.totalAmount / 1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Cliquez pour charger les données
                </Card>
              )}
            </TabsContent>

            <TabsContent value="profitability" className="space-y-4">
              <Card className="p-6 text-center text-gray-500">
                Dashboard Rentabilité
              </Card>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <Card className="p-6 text-center text-gray-500">
                Dashboard Prévisions
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {dashboardData.alerts ? (
                <AlertsComponent {...(dashboardData.alerts as any)} />
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Cliquez pour charger les alertes
                </Card>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
