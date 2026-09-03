"use client";

/**
 * ForecastChart — ComposedChart prévisions CA avec intervalle de confiance
 * Utilisé dans l'onglet "Prévisions" du Workspace BI
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ForecastPoint {
  date: string;
  projectedCA: number;
  lowerBound: number;
  upperBound: number;
}

interface ForecastChartProps {
  data: ForecastPoint[];
  height?: number;
  mape?: number;
}

const formatFCFA = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(2)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}k`
    : `${v}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const proj = payload.find((p: any) => p.dataKey === "projectedCA");
  const low = payload.find((p: any) => p.dataKey === "lowerBound");
  const high = payload.find((p: any) => p.dataKey === "upperBound");

  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">{label}</p>
      {proj && (
        <div className="flex justify-between gap-4">
          <span className="text-emerald-700 font-medium">CA prévu :</span>
          <span className="font-mono font-bold">{proj.value.toLocaleString("fr-FR")} FCFA</span>
        </div>
      )}
      {low && high && (
        <div className="flex justify-between gap-4 text-muted-foreground">
          <span>Fourchette :</span>
          <span className="font-mono">
            [{low.value.toLocaleString("fr-FR")} — {high.value.toLocaleString("fr-FR")}]
          </span>
        </div>
      )}
    </div>
  );
};

export function ForecastChart({ data, height = 300, mape }: ForecastChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        Pas assez de données historiques pour générer une prévision
      </div>
    );
  }

  // Transformer pour que l'aire de confiance soit [lower, upper]
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    projectedCA: Math.round(d.projectedCA),
    ci: [Math.round(d.lowerBound), Math.round(d.upperBound)] as [number, number],
    lowerBound: Math.round(d.lowerBound),
    upperBound: Math.round(d.upperBound),
  }));

  const avgCA = data.reduce((s, d) => s + d.projectedCA, 0) / data.length;

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={formatFCFA}
            tick={{ fontSize: 9, fill: "#888" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />

          {/* Zone de confiance */}
          <Area
            type="monotone"
            dataKey="upperBound"
            name="Borne haute"
            stroke="none"
            fill="url(#gradCI)"
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            name="Borne basse"
            stroke="none"
            fill="#fff"
            legendType="none"
          />

          {/* Ligne moyenne */}
          <ReferenceLine
            y={avgCA}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: "Moy.", position: "right", fontSize: 9, fill: "#94a3b8" }}
          />

          {/* Ligne de prévision principale */}
          <Line
            type="monotone"
            dataKey="projectedCA"
            name="CA prévu"
            stroke="#0B3D2E"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#0B3D2E" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {mape !== undefined && (
        <p className="text-[10px] text-muted-foreground text-right pr-4">
          Précision du modèle : MAPE {mape.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
