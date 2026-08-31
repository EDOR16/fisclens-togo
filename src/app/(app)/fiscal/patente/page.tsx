"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { AlertCircle, Download, FileCheck, Building2, RefreshCw, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PatentePage() {
  const [valeurLocative, setValeurLocative] = useState(0);
  const [chiffreAffaires, setChiffreAffaires] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      // Charger les données de CA et loyers depuis les états financiers / balance
      const [efRes, balRes] = await Promise.all([
        fetch("/api/v1/accounting/etats-financiers"),
        fetch("/api/v1/accounting/balance"),
      ]);

      if (efRes.ok) {
        const ef = await efRes.json();
        setChiffreAffaires(ef.compteResultat?.totalProduits || 0);
      }

      if (balRes.ok) {
        const bal = await balRes.json();
        // Compte 622 (Locations et charges locatives)
        const loyerLine = bal.lines?.find((l: any) => l.code.startsWith("622"));
        if (loyerLine) {
          setValeurLocative(loyerLine.debitMouvements || 0);
        }
      }
    } catch (err) {
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Estimation indicative de la contribution des patentes (droit proportionnel sur valeur locative + droit fixe sur CA)
  const droitProportionnel = Math.round(valeurLocative * 0.15); // estimation indicative
  const droitFixe = chiffreAffaires > 50_000_000 ? 150_000 : chiffreAffaires > 10_000_000 ? 75_000 : 35_000;
  const totalPatenteEstimee = droitProportionnel + droitFixe;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Taxe Professionnelle / Contribution des Patentes
            </h2>
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 text-xs">
              Assiette issue des écritures réelles
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Contribution des patentes assise sur la valeur locative (comptes 622) et le CA (comptes 70)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Téléchargement formulaire patente OTR...")}>
            <Download className="h-4 w-4 mr-1.5" /> Formulaire OTR
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-amber-900">
            <p className="font-semibold">Règles fiscales de la Patente — OTR Togo</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              La contribution des patentes se compose d&apos;un <strong>droit fixe</strong> (selon la nature de l&apos;activité et le chiffre d&apos;affaires) et d&apos;un <strong>droit proportionnel</strong> sur la valeur locative des locaux professionnels. Déclaration et paiement annuels avant le <strong>31 mars</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Éléments de base déclarative — Issus de la comptabilité</CardTitle>
          <CardDescription>Données agrégées depuis vos comptes de loyers (622) et de ventes (70)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Valeur locative annuelle (Comptes 622)</p>
              <p className="text-2xl font-bold font-mono mt-1 text-primary">{formatAmount(valeurLocative)} FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Base du droit proportionnel</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Chiffre d&apos;affaires (Comptes 70)</p>
              <p className="text-2xl font-bold font-mono mt-1">{formatAmount(chiffreAffaires)} FCFA</p>
              <p className="text-xs text-muted-foreground mt-1">Base d&apos;imposition du droit fixe</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Estimation indicative Patente</span>
              <span className="font-mono text-primary font-bold text-base">{formatAmount(totalPatenteEstimee)} FCFA</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dont droit fixe estimé : {formatAmount(droitFixe)} FCFA + Droit proportionnel estimé : {formatAmount(droitProportionnel)} FCFA.
              Le montant définitif est arrêté selon la commune d&apos;implantation du siège ou de l&apos;établissement (Lomé vs Régions).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
