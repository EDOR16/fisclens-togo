"use client";

/**
 * MarginBarChart — BarChart horizontal des marges par produit
 * Utilisé dans l'onglet "Rentabilité" du Workspace BI
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface ProductMarginPoint {
  name: string;
  marge: number;
  margePercent: number;
  ca: number;
}

interface MarginBarChartProps {
  data: ProductMarginPoint[];
  height?: number;
}

const COLORS = [
  "#0B3D2E",
  "#166534",
  "#16a34a",
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#bbf7d0",
  "#d1fae5",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ProductMarginPoint;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1.5 max-w-[220px]">
      <p className="font-semibold text-foreground truncate">{d.name}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">CA HT :</span>
        <span className="font-mono">{d.ca.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Marge nette :</span>
        <span className="font-mono font-bold text-emerald-700">{d.marge.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Taux :</span>
        <span
          className={`font-mono font-bold ${
            d.margePercent >= 25 ? "text-emerald-700" : "text-amber-600"
          }`}
        >
          {d.margePercent}%
        </span>
      </div>
    </div>
  );
};

export function MarginBarChart({ data, height = 280 }: MarginBarChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        Aucune donnée de marge disponible
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    name: d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name,
    fullName: d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
        barSize={16}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tickFormatter={(v) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`
          }
          tick={{ fontSize: 9, fill: "#888" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 10, fill: "#444" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Bar dataKey="marge" name="Marge nette" radius={[0, 6, 6, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
