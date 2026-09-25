"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, TrendingUp, Calendar } from "lucide-react";
import { formatFcfaSmart } from "@/lib/format-money";
import { ForecastChart } from "@/components/bi/charts/forecast-chart";

export default function TresoreriePrevisionPage() {
  const [data, setData] = useState<any>(null);
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
        const res = await fetch("/api/v1/bi/dashboard/forecast", {
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
        setData(json.data);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les prévisions de trésorerie.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const projections = data?.treasuryForecast?.projections || [];
  const lastProjection = projections[projections.length - 1];
  const breakEven = data?.treasuryForecast?.breakEvenDate;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Prévisionnel de Trésorerie & BFR
        </h2>
        <p className="text-sm text-muted-foreground">Projection glissante sur 90 jours des encaissements / décaissements</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">Trésorerie Projetée (90j)</CardDescription>
            <CardTitle className="text-2xl font-mono text-emerald-700">
              {formatFcfaSmart(lastProjection?.projectedBalance || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">Point d'Équilibre</CardDescription>
            <CardTitle className="text-xl font-mono flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {breakEven || "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase">Précision MAPE</CardDescription>
            <CardTitle className="text-xl font-mono">{data?.caForecast?.mape || 0}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Projection Trésorerie 90 Jours
          </CardTitle>
          <CardDescription>Intervalle de confiance basé sur l'historique réel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chargement...</div>
          ) : error ? (
            <div className="h-[300px] flex items-center justify-center text-destructive text-sm">{error}</div>
          ) : projections.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Données insuffisantes pour projection</div>
          ) : (
            <ForecastChart
              data={projections.map((p: any) => ({
                date: p.date,
                projectedCA: p.projectedBalance || p.value,
                lowerBound: p.lowerBound,
                upperBound: p.upperBound,
              }))}
              height={300}
              mape={data?.caForecast?.mape}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}