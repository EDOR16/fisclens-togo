"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Users, Building, Receipt, ChevronRight } from "lucide-react";

const SIMULATORS = [
  {
    href: "/fiscal/irpp",
    icon: Users,
    title: "Simulateur IRPP & Paie",
    description:
      "Calculez le salaire brut → net avec CNSS (4%), AMU (5%), abattement 28%, barème IRPP progressif et réduction charges de famille.",
    badge: "CGI art. 26 & 74",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    href: "/fiscal/is",
    icon: Building,
    title: "Simulateur IS / IMF",
    description:
      "Déterminez votre résultat fiscal, comparez IS 27% vs IMF 1% (plancher 20 000 FCFA) et planifiez vos 4 acomptes provisionnels.",
    badge: "CGI art. 113 & 120",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    href: "/fiscal/tva",
    icon: Receipt,
    title: "Simulateur TVA",
    description:
      "Calculez la TVA collectée (18%), la TVA déductible, le prorata de déduction et le net à reverser à l'OTR via un bordereau CA3.",
    badge: "CGI art. 195",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
];

export default function SimulateurPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Simulateurs Fiscaux
          </h2>
          <Badge variant="outline" className="border-primary/40 text-primary text-xs">
            CGI Togo — OTR 2025
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Outils de simulation instantanée basés sur le Code Général des Impôts (CGI) et les textes de l&apos;OTR en vigueur au Togo.
          Tous les calculs sont effectués en FCFA entiers, conformément aux règles d&apos;arrondi du CGI.
        </p>
      </div>

      {/* Grille des simulateurs */}
      <div className="grid md:grid-cols-3 gap-5">
        {SIMULATORS.map((sim) => {
          const Icon = sim.icon;
          return (
            <Link key={sim.href} href={sim.href as any}>
              <Card className={`h-full border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${sim.bg}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${sim.color}`} />
                    <Badge variant="outline" className={`text-xs ${sim.color} border-current/30`}>
                      {sim.badge}
                    </Badge>
                  </div>
                  <CardTitle className={`text-base mt-2 ${sim.color}`}>{sim.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm leading-relaxed">{sim.description}</CardDescription>
                  <div className={`flex items-center text-xs font-medium gap-1 ${sim.color}`}>
                    Ouvrir le simulateur <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Note légale */}
      <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Références légales appliquées</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Code Général des Impôts (CGI) — République Togolaise, édition OTR 2025</li>
          <li>Loi n°2022-022 du 27 décembre 2022 (barème IRPP)</li>
          <li>Décret CNSS / AMU — cotisations sociales Togo en vigueur</li>
          <li>Livre des Procédures Fiscales (LPF) — délais et obligations déclaratives</li>
        </ul>
        <p className="pt-1 text-amber-700">
          ⚠ Ces simulateurs sont fournis à titre indicatif. Pour une déclaration officielle, vérifiez auprès de l&apos;OTR.
        </p>
      </div>
    </div>
  );
}
