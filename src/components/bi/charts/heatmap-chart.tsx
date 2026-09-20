"use client";

/**
 * HeatmapChart — Grille colorée région × catégorie
 * Plus lisible qu'un graphique classique pour les corrélations
 */

interface CrossTabRow {
  region: string;
  categorie: string;
  ca: number;
  quantite: number;
  poids: number;
}

interface HeatmapChartProps {
  data: CrossTabRow[];
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  if (!data.length) {
    return (
      <div className="p-8 text-center text-muted-foreground text-xs">
        Aucune donnée de corrélation
      </div>
    );
  }

  const regions = Array.from(new Set(data.map((d) => d.region))).sort();
  const categories = Array.from(new Set(data.map((d) => d.categorie))).sort();

  // Matrice de lookup
  const lookup = new Map<string, CrossTabRow>();
  for (const r of data) {
    lookup.set(`${r.region}|${r.categorie}`, r);
  }

  // Échelle de couleur : min = 0, max = CA le plus élevé
  const maxCA = Math.max(...data.map((d) => d.ca));

  const getColor = (ca: number): string => {
    if (ca === 0) return "#F5F5F5";
    const ratio = ca / maxCA;
    // Palette verte : #0B3D2E (foncé) → #E8F5E9 (clair)
    if (ratio > 0.75) return "#0B3D2E";
    if (ratio > 0.5) return "#157A46";
    if (ratio > 0.25) return "#4CAF50";
    if (ratio > 0.1) return "#A5D6A7";
    return "#E8F5E9";
  };

  const getTextColor = (ca: number): string => {
    const ratio = ca / maxCA;
    return ratio > 0.5 ? "#FFFFFF" : "#0B3D2E";
  };

  const formatShort = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}M`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
    return `${(v / 1_000).toFixed(0)}k`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b">
              Région ↓ / Catégorie →
            </th>
            {categories.map((cat) => (
              <th
                key={cat}
                className="p-2 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b whitespace-nowrap"
              >
                {cat.length > 12 ? cat.slice(0, 10) + "…" : cat}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {regions.map((region) => (
            <tr key={region}>
              <td className="p-2 font-semibold text-foreground border-b whitespace-nowrap">
                {region}
              </td>
              {categories.map((cat) => {
                const cell = lookup.get(`${region}|${cat}`);
                const ca = cell?.ca || 0;
                return (
                  <td
                    key={cat}
                    className="p-2 text-center font-mono text-[11px] font-semibold border-b transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: getColor(ca),
                      color: getTextColor(ca),
                    }}
                    title={
                      cell
                        ? `${region} × ${cat}\nCA : ${ca.toLocaleString("fr-FR")} FCFA\nQuantité : ${cell.quantite}\nPoids : ${cell.poids}%`
                        : "Aucune vente"
                    }
                  >
                    {ca > 0 ? formatShort(ca) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}