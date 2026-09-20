"use client";

/**
 * ParetoChart — Diagramme de Pareto 80/20
 * Barres (CA par item) + Ligne cumulée (%)
 */

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface ParetoItem {
  code: string;
  libelle: string;
  ca: number;
  poidsCa: number;
  poidsCumule: number;
  classe: "A" | "B" | "C";
}

interface ParetoChartProps {
  data: ParetoItem[];
  height?: number;
  labelKey?: "code" | "libelle";
}

const formatFCFA = (v: number) =>
  v >= 1_000_000_000
    ? `${(v / 1_000_000_000).toFixed(1)}Mds`
    : v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(0)}M`
    : `${(v / 1_000).toFixed(0)}k`;

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ParetoItem;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs space-y-1.5 max-w-[250px]">
      <p className="font-semibold text-foreground truncate">{item.libelle}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Code :</span>
        <span className="font-mono">{item.code}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">CA :</span>
        <span className="font-mono font-bold">{item.ca.toLocaleString("fr-FR")} FCFA</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Poids :</span>
        <span className="font-mono">{item.poidsCa}%</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Cumulé :</span>
        <span className="font-mono font-bold text-primary">{item.poidsCumule}%</span>
      </div>
      <div className="pt-1 border-t">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
            item.classe === "A"
              ? "bg-emerald-100 text-emerald-800"
              : item.classe === "B"
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Classe {item.classe}
        </span>
      </div>
    </div>
  );
};

export function ParetoChart({ data, height = 320, labelKey = "code" }: ParetoChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-xs" style={{ height }}>
        Aucune donnée Pareto — importez vos ventes
      </div>
    );
  }

  const chartData = data.slice(0, 20).map((d) => ({
    ...d,
    name: labelKey === "code" ? d.code : d.libelle.slice(0, 15),
    caK: d.ca / 1_000_000,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#888" }}
          angle={-45}
          textAnchor="end"
          height={60}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={formatFCFA}
          tick={{ fontSize: 10, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          label={{ value: "CA (FCFA)", angle: -90, position: "insideLeft", fontSize: 10 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "#888" }}
          axisLine={false}
          tickLine={false}
          label={{ value: "% cumulé", angle: 90, position: "insideRight", fontSize: 10 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

        {/* Seuils 80% et 95% */}
        <ReferenceLine
          yAxisId="right"
          y={80}
          stroke="#10b981"
          strokeDasharray="4 4"
          label={{ value: "80%", position: "right", fontSize: 9, fill: "#10b981" }}
        />
        <ReferenceLine
          yAxisId="right"
          y={95}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: "95%", position: "right", fontSize: 9, fill: "#f59e0b" }}
        />

        <Bar yAxisId="left" dataKey="caK" name="CA (millions)" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={
                entry.classe === "A"
                  ? "#0B3D2E"
                  : entry.classe === "B"
                  ? "#FCD116"
                  : "#94a3b8"
              }
            />
          ))}
        </Bar>

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="poidsCumule"
          name="% cumulé"
          stroke="#B3261E"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#B3261E" }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}