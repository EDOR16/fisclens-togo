"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Lock, Eye } from "lucide-react";


/**
 * Page rÃ©servÃ©e ADMIN_SYS â€” paramÃ¨tres versionnÃ©s par date d'effet.
 * La vÃ©rification de rÃ´le rÃ©elle est cÃ´tÃ© API (withGuard ADMIN_SYS).
 * CÃ´tÃ© UI : RoleGuard masque le contenu pour les autres rÃ´les.
 */

type ParameterSet = {
  id: string;
  version: string;
  effectiveFrom: string;
  legalRef: string;
  status: "active" | "draft" | "archived";
  params: {
    tauxTVA: number;
    tauxIS: number;
    tauxIMF_min: number;
    tauxIMF_max: number;
    tauxCNSS_sal: number;
    tauxCNSS_pat: number;
    abattementForfaitaire: number;
    seuilTPU: number;
  };
};

const PARAMETER_SETS: ParameterSet[] = [
  {
    id: "ps-2025",
    version: "2025-v1",
    effectiveFrom: "2025-01-01",
    legalRef: "LF 2025 â€” CGI art. 26, 72, 73, 74",
    status: "active",
    params: {
      tauxTVA: 18,
      tauxIS: 27,
      tauxIMF_min: 100_000,
      tauxIMF_max: 5_000_000,
      tauxCNSS_sal: 4,
      tauxCNSS_pat: 17.5,
      abattementForfaitaire: 28,
      seuilTPU: 60_000_000,
    },
  },
  {
    id: "ps-2024",
    version: "2024-v1",
    effectiveFrom: "2024-01-01",
    legalRef: "LF 2024 â€” CGI art. 26, 72, 73, 74",
    status: "archived",
    params: {
      tauxTVA: 18,
      tauxIS: 27,
      tauxIMF_min: 100_000,
      tauxIMF_max: 5_000_000,
      tauxCNSS_sal: 4,
      tauxCNSS_pat: 17.5,
      abattementForfaitaire: 28,
      seuilTPU: 60_000_000,
    },
  },
];

const STATUS_BADGE: Record<string, React.ReactNode> = {
  active:   <Badge variant="success">Actif</Badge>,
  draft:    <Badge variant="warning">Brouillon</Badge>,
  archived: <Badge variant="outline">ArchivÃ©</Badge>,
};

export default function ParametresFiscauxPage() {
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

  const handleNewVersion = () => {
    toast.info("Ouvrir formulaire de crÃ©ation de nouvelle version...");
  };

  const handleViewVersion = (version: string) => {
    setViewingVersion(viewingVersion === version ? null : version);
    toast.info(`Affichage dÃ©taillÃ© de la version ${version}`);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ParamÃ¨tres fiscaux versionnÃ©s</h2>
          <p className="text-sm text-muted-foreground">
            Chaque modification crÃ©e une nouvelle version datÃ©e â€” les anciennes sont conservÃ©es en audit.
          </p>
        </div>
        <Button onClick={handleNewVersion}>
          <Lock className="h-4 w-4" />
          Nouvelle version
        </Button>
      </div>

      <div className="rounded-md border bg-amber-50 border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          <strong>ðŸ”’ AccÃ¨s ADMIN_SYS uniquement.</strong>{" "}
          Toute modification est journalisÃ©e dans l&apos;audit log de maniÃ¨re immuable.
          La crÃ©ation d&apos;une nouvelle version ne supprime jamais l&apos;ancienne.
        </p>
      </div>

      <div className="space-y-4">
        {PARAMETER_SETS.map((ps) => (
          <Card key={ps.id} className={ps.status === "active" ? "border-primary/40" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base font-mono">{ps.version}</CardTitle>
                  {STATUS_BADGE[ps.status]}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Effet : {formatDate(ps.effectiveFrom)}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleViewVersion(ps.version)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">{ps.legalRef}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">TVA</p>
                  <p className="font-semibold">{ps.params.tauxTVA}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">IS</p>
                  <p className="font-semibold">{ps.params.tauxIS}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">CNSS salariÃ©</p>
                  <p className="font-semibold">{ps.params.tauxCNSS_sal}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Abattement IRPP</p>
                  <p className="font-semibold">{ps.params.abattementForfaitaire}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">CNSS patronal</p>
                  <p className="font-semibold">{ps.params.tauxCNSS_pat}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">IMF min</p>
                  <p className="font-semibold">{ps.params.tauxIMF_min.toLocaleString("fr")} FCFA</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">IMF max</p>
                  <p className="font-semibold">{ps.params.tauxIMF_max.toLocaleString("fr")} FCFA</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Seuil TPU</p>
                  <p className="font-semibold">{ps.params.seuilTPU.toLocaleString("fr")} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
