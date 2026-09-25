"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, AlertTriangle, TrendingUp } from "lucide-react";
import { formatFcfaSmart } from "@/lib/format-money";
import { cn } from "@/lib/utils";
export default function ConcentrationPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("fl_token");
        const tenantId = localStorage.getItem("fl_tenant_id");
        if (!token || !tenantId) {
          setError("Session expirée ou dossier non sélectionné. Reconnectez-vous.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/v1/bi/dashboard/sales", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": tenantId,
          },
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json?.error || `Erreur ${res.status}`);
          return;
        }
        const json = await res.json();
        setZones(json.data?.zones || []);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les données de concentration.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCA = zones.reduce((s, z) => s + (z.ca || 0), 0);
  const topZone = zones[0];
  const topZonePct = totalCA > 0 ? Math.round(((topZone?.ca || 0) / totalCA) * 100) : 0;
  const isConcentrated = topZonePct > 50;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" /> Indice de Concentration & Risque Dépendance
        </h2>
        <p className="text-sm text-muted-foreground">Loi de Pareto (80/20) et dépendance géographique</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-muted-foreground">Chargement...</div>
        ) : error ? (
          <div className="col-span-3 p-8 text-center text-destructive text-sm">{error}</div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase">CA Total</CardDescription>
                <CardTitle className="text-2xl font-mono">{formatFcfaSmart(totalCA)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className={cn(isConcentrated ? "border-amber-300 bg-amber-50/30" : "border-emerald-200")}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase">Zone Dominante</CardDescription>
                <CardTitle className="text-xl font-mono flex items-center gap-2">
                  {isConcentrated && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  {topZone?.zone || "N/A"} ({topZonePct}%)
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase">Indice HHI</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {totalCA > 0 ? Math.round(zones.reduce((s, z) => s + Math.pow((z.ca / totalCA) * 100, 2), 0)) : 0}
                </CardTitle>
                <CardDescription className="text-[10px]">Herfindahl-Hirschman Index</CardDescription>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition Géographique du CA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {zones.map((z) => {
            const pct = totalCA > 0 ? Math.round((z.ca / totalCA) * 100) : 0;
            return (
              <div key={z.zone} className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span>{z.zone}</span>
                  <span className="font-mono">{formatFcfaSmart(z.ca)} ({pct}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}