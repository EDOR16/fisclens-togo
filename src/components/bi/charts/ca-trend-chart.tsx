"use client";

/**
 * CaTrendChart — AreaChart de l'évolution du CA mensuel
 * Utilisé dans l'onglet "Vue d'ensemble" du Workspace BI
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CaTrendPoint {
  mois: string;
  ca: number;
  achats?: number;
}

interface CaTrendChartProps {
  data: CaTrendPoint[];
  height?: number;
}

const formatFCFA = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}k`
    : `${v}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name} :</span>
          <span className="font-mono font-bold">{entry.value.toLocaleString("fr-FR")} FCFA</span>
        </div>
      ))}
    </div>
  );
};

export function CaTrendChart({ data, height = 240 }: CaTrendChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        Aucune donnée disponible — importez vos fichiers de ventes
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0B3D2E" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0B3D2E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAchats" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatFCFA} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="ca"
          name="CA HT"
          stroke="#0B3D2E"
          strokeWidth={2.5}
          fill="url(#gradCA)"
          dot={{ r: 3, fill: "#0B3D2E" }}
          activeDot={{ r: 5 }}
        />
        {data[0]?.achats !== undefined && (
          <Area
            type="monotone"
            dataKey="achats"
            name="Achats HT"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#gradAchats)"
            dot={{ r: 3, fill: "#3B82F6" }}
            activeDot={{ r: 5 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
