"use client";

/**
 * SaisonnaliteChart — Courbe temporelle des ventes mensuelles
 * Détecte les pics et creux saisonniers
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

interface MoisStat {
  mois: string;
  label: string;
  ca: number;
  quantite: number;
  nbVentes: number;
}

interface SaisonnaliteChartProps {
  data: MoisStat[];
  moyenne?: number;
  height?: number;
}

const formatFCFA = (v: number) =>
  v >= 1_000_000_000
    ? `${(v / 1_000_000_000).toFixed(1)}Mds`
    : v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(0)}M`
    : `${(v / 1_000).toFixed(0)}k`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as MoisStat;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">{item.label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">CA :</span>
        <span className="font-mono font-bold">{item.ca.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Quantité vendue :</span>
        <span className="font-mono">{item.quantite}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Nb ventes :</span>
        <span className="font-mono">{item.nbVentes}</span>
      </div>
    </div>
  );
};

export function SaisonnaliteChart({ data, moyenne, height = 300 }: SaisonnaliteChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-xs" style={{ height }}>
        Aucune donnée de saisonnalité
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    caM: d.ca / 1_000_000,
  }));

  const moyenneM = moyenne ? moyenne / 1_000_000 : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <defs>
          <linearGradient id="grad-saison" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0B3D2E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0B3D2E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatFCFA}
          tick={{ fontSize: 10, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

        {moyenneM !== undefined && (
          <ReferenceLine
            y={moyenneM}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            label={{
              value: `Moyenne ${formatFCFA(moyenne || 0)}`,
              position: "right",
              fontSize: 9,
              fill: "#f59e0b",
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="caM"
          name="CA mensuel"
          stroke="#0B3D2E"
          strokeWidth={2.5}
          fill="url(#grad-saison)"
          dot={{ r: 3, fill: "#0B3D2E" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}