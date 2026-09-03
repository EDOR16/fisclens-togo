"use client";

/**
 * CategoryPieChart — PieChart répartition CA par catégorie de produit
 * Utilisé dans l'onglet "Rentabilité" du Workspace BI
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryPoint {
  category: string;
  ca: number;
  margePercent: number;
}

interface CategoryPieChartProps {
  data: CategoryPoint[];
  height?: number;
}

const PALETTE = [
  "#0B3D2E",
  "#166534",
  "#15803d",
  "#16a34a",
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#444" textAnchor="middle" dominantBaseline="central" fontSize={10}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryPoint;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-foreground">{d.category}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">CA :</span>
        <span className="font-mono">{d.ca.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Marge :</span>
        <span className={`font-mono font-bold ${d.margePercent >= 25 ? "text-emerald-700" : "text-amber-600"}`}>
          {d.margePercent}%
        </span>
      </div>
    </div>
  );
};

export function CategoryPieChart({ data, height = 260 }: CategoryPieChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        Aucune donnée catégorie disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="ca"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={48}
          labelLine={false}
          label={renderCustomLabel}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 10 }}
          formatter={(v: string) => (v.length > 20 ? v.slice(0, 18) + "…" : v)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
