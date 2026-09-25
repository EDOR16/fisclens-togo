"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Receipt,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Dossier {
  id: string;
  name: string;
  regime: string;
  nif: string;
  rccm: string;
  formeJuridique: string;
  centreFiscal: string;
  city: string;
  phone: string;
  address: string;
  exerciceOuvert: boolean;
  plan: string;
  userCount: number;
  ecritureCount: number;
  unresolvedAnomalies: number;
  pendingAlerts: number;
  lastActivity: string | null;
  createdAt: string;
}

interface PortfolioStats {
  totalDossiers: number;
  reelNormalCount: number;
  rsiCount: number;
  tpuCount: number;
  totalEcritures: number;
  totalAnomalies: number;
}

const REGIME_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  REEL_NORMAL: {
    label: "Réel Normal",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    desc: "TVA 18% mensuelle + Bilan SYSCOHADA & Liasse OTR",
  },
  RSI: {
    label: "RSI",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    desc: "Régime Synthétique d'Imposition (PME intermédiaires)",
  },
  TPU: {
    label: "TPU",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    desc: "Taxe Professionnelle Unique (TPE / Artisans)",
  },
};

export default function CabinetPortefeuillePage() {
  const router = useRouter();
  const { user, currentTenantId, switchTenant, refreshSession } = useAuth();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalDossiers: 0,
    reelNormalCount: 0,
    rsiCount: 0,
    tpuCount: 0,
    totalEcritures: 0,
    totalAnomalies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegime, setSelectedRegime] = useState<string>("ALL");
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Modal d'ajout de nouveau dossier
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDossier, setNewDossier] = useState({
    name: "",
    regime: "REEL_NORMAL",
    formeJuridique: "SARL",
    nif: "",
    rccm: "",
    centreFiscal: "DPME Lomé",
    city: "Lomé",
    phone: "",
  });

  const fetchPortefeuille = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedRegime !== "ALL") params.set("regime", selectedRegime);

      const res = await api.get<{
        dossiers: Dossier[];
        stats: PortfolioStats;
      }>(`/api/v1/cabinet/portefeuille?${params.toString()}`);

      setDossiers(res.dossiers || []);
      setStats(res.stats || {
        totalDossiers: 0,
        reelNormalCount: 0,
        rsiCount: 0,
        tpuCount: 0,
        totalEcritures: 0,
        totalAnomalies: 0,
      });
    } catch (err: any) {
      console.error("Erreur chargement portefeuille:", err);
      toast.error("Impossible de charger le portefeuille client");
    } finally {
      setLoading(false);
    }
  }, [search, selectedRegime]);

  useEffect(() => {
    fetchPortefeuille();
  }, [fetchPortefeuille]);

  // Basculer vers un dossier
  const handleSelectDossier = async (dossierId: string, destination?: string) => {
    if (dossierId === currentTenantId && destination) {
      router.push(destination as any);
      return;
    }

    setSwitchingId(dossierId);
    try {
      switchTenant(dossierId);
      const target = dossiers.find((d) => d.id === dossierId);
      toast.success(`Dossier actif : ${target?.name || "Client"}`);
      await refreshSession();

      if (destination) {
        router.push(destination as any);
      } else {
        router.push("/dashboard" as any);
      }
    } catch (e) {
      toast.error("Échec de la bascule de dossier");
    } finally {
      setSwitchingId(null);
    }
  };

  // Création d'un nouveau dossier client
  const handleCreateDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDossier.name.trim()) {
      toast.error("Veuillez renseigner le nom de l'entreprise");
      return;
    }

    setIsCreating(true);
    try {
      const res = await api.post<{ success: boolean; tenant: { id: string; name: string } }>(
        "/api/v1/cabinet/portefeuille",
        newDossier
      );

      toast.success(`Dossier "${res.tenant.name}" initialisé avec succès !`);
      setIsModalOpen(false);
      setNewDossier({
        name: "",
        regime: "REEL_NORMAL",
        formeJuridique: "SARL",
        nif: "",
        rccm: "",
        centreFiscal: "DPME Lomé",
        city: "Lomé",
        phone: "",
      });

      await refreshSession();
      await fetchPortefeuille();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création du dossier");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header du Portefeuille */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#157A46]/10 text-[#157A46] border border-[#157A46]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Espace Cabinet & Expertise Comptable
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              Multi-Dossiers Illimité
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B3D2E] dark:text-[#FBF7EC] font-serif">
            Portefeuille Clients
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Supervisez vos entreprises clientes et basculez d&apos;un dossier à l&apos;autre en un clic sans déconnexion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPortefeuille}
            disabled={loading}
            className="font-mono text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0B3D2E] hover:bg-[#157A46] text-[#FBF7EC] font-mono text-xs shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau Dossier Client
          </Button>
        </div>
      </div>

      {/* 2. Indicateurs Clés Consolidés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
              <span>Dossiers Clients</span>
              <Building2 className="h-4 w-4 text-[#157A46]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-[#0B3D2E] dark:text-[#FBF7EC]">
              {stats.totalDossiers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sous mandat d&apos;expertise
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
              <span>Réel Normal (OTR)</span>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {stats.reelNormalCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              TVA 18% & Liasse SYSCOHADA
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
              <span>RSI & TPU</span>
              <Layers className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
              {stats.rsiCount + stats.tpuCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Régimes synthétiques & forfaitaires
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-mono font-medium text-muted-foreground flex items-center justify-between">
              <span>Écritures & Audit</span>
              <BookOpen className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold font-mono text-[#0B3D2E] dark:text-[#FBF7EC]">
              {stats.totalEcritures.toLocaleString("fr-FR")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mt-1">
              {stats.totalAnomalies > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.totalAnomalies} anomalie{stats.totalAnomalies > 1 ? "s" : ""} à auditer
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Audit régulier
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom de client, NIF, ville ou centre fiscal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-background border border-[#E6DEC8] dark:border-[rgba(251,247,236,.2)] rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            className="text-xs bg-background border border-[#E6DEC8] dark:border-[rgba(251,247,236,.2)] rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Tous les régimes</option>
            <option value="REEL_NORMAL">Réel Normal (TVA 18%)</option>
            <option value="RSI">RSI (Synthétique)</option>
            <option value="TPU">TPU (Forfait)</option>
          </select>
        </div>
      </div>

      {/* 4. Grille des Dossiers Clients */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#157A46]" />
          <p className="text-sm font-mono text-muted-foreground">
            Chargement des dossiers du portefeuille...
          </p>
        </div>
      ) : dossiers.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#E6DEC8] dark:border-[rgba(251,247,236,.15)] rounded-xl p-8 space-y-4">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="font-serif text-lg font-bold text-[#0B3D2E] dark:text-[#FBF7EC]">
              Aucun dossier client trouvé
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              {search || selectedRegime !== "ALL"
                ? "Aucune entreprise ne correspond à vos critères de recherche."
                : "Votre cabinet n'a pas encore de dossier rattaché. Créez votre premier dossier client ou demandez à votre client de vous inviter."}
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="bg-[#0B3D2E] hover:bg-[#157A46] text-[#FBF7EC] font-mono text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Créer un premier dossier
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dossiers.map((dossier) => {
            const isCurrent = dossier.id === currentTenantId;
            const regimeInfo = REGIME_CONFIG[dossier.regime] || {
              label: dossier.regime,
              badgeClass: "bg-gray-100 text-gray-800",
              desc: "",
            };

            return (
              <Card
                key={dossier.id}
                className={`flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                  isCurrent
                    ? "border-2 border-[#157A46] bg-[#157A46]/[0.02]"
                    : "border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)]"
                }`}
              >
                <div>
                  {/* Haut de carte */}
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {dossier.formeJuridique}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${regimeInfo.badgeClass}`}
                          >
                            {regimeInfo.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#0B3D2E] dark:text-[#FBF7EC] truncate">
                          {dossier.name}
                        </h3>
                      </div>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#157A46] text-[#FBF7EC] shadow-sm">
                          <Check className="h-3 w-3" /> Actif
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>

                  {/* Corps de carte */}
                  <CardContent className="px-5 pb-4 space-y-3 text-xs font-mono">
                    <div className="space-y-1.5 text-muted-foreground text-[11px] bg-muted/20 p-2.5 rounded-md border border-[#E6DEC8]/50 dark:border-white/5">
                      <div className="flex justify-between">
                        <span>NIF Togo :</span>
                        <span className="font-semibold text-foreground">{dossier.nif}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Centre fiscal :</span>
                        <span className="text-foreground">{dossier.centreFiscal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Localisation :</span>
                        <span className="text-foreground">{dossier.city}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-background border border-[#E6DEC8] dark:border-[rgba(251,247,236,.1)] p-2 rounded text-center">
                        <span className="text-[10px] text-muted-foreground block">
                          Écritures
                        </span>
                        <span className="text-sm font-bold text-[#0B3D2E] dark:text-[#FBF7EC]">
                          {dossier.ecritureCount}
                        </span>
                      </div>

                      <div className="bg-background border border-[#E6DEC8] dark:border-[rgba(251,247,236,.1)] p-2 rounded text-center">
                        <span className="text-[10px] text-muted-foreground block">
                          Audit / Anomalies
                        </span>
                        {dossier.unresolvedAnomalies > 0 ? (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {dossier.unresolvedAnomalies} en attente
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            0 alerte
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Bas de carte & Actions */}
                <div className="px-5 pb-5 pt-2 border-t border-[#E6DEC8]/60 dark:border-white/5 space-y-2">
                  <Button
                    onClick={() => handleSelectDossier(dossier.id)}
                    disabled={switchingId === dossier.id}
                    className={`w-full font-mono text-xs ${
                      isCurrent
                        ? "bg-[#157A46] hover:bg-[#0B3D2E] text-white"
                        : "bg-[#0B3D2E] hover:bg-[#157A46] text-[#FBF7EC]"
                    }`}
                  >
                    {switchingId === dossier.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isCurrent ? "Traiter ce dossier (Actif)" : "Ouvrir ce dossier"}
                  </Button>

                  {/* Raccourcis directs */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleSelectDossier(dossier.id, "/comptabilite/grand-livre")}
                      className="p-1.5 text-center rounded border border-[#E6DEC8] dark:border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate"
                      title="Accéder directement au Grand Livre"
                    >
                      Comptabilité
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDossier(dossier.id, "/fiscal/declarations")}
                      className="p-1.5 text-center rounded border border-[#E6DEC8] dark:border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate"
                      title="Accéder aux déclarations OTR"
                    >
                      Fiscal OTR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDossier(dossier.id, "/workspace-bi")}
                      className="p-1.5 text-center rounded border border-[#E6DEC8] dark:border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate"
                      title="Accéder au Workspace BI"
                    >
                      Analyse BI
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Modal Création de Dossier Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-background rounded-xl border border-[#E6DEC8] dark:border-[rgba(251,247,236,.2)] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold font-serif text-[#0B3D2E] dark:text-[#FBF7EC]">
                Nouveau Dossier Client
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Le plan comptable officiel SYSCOHADA et le calendrier fiscal OTR seront générés automatiquement.
              </p>
            </div>

            <form onSubmit={handleCreateDossier} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">
                  Raison sociale / Nom commercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Ets AMEGA & Fils, Société KODZO SARL"
                  value={newDossier.name}
                  onChange={(e) => setNewDossier({ ...newDossier, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Régime Fiscal Togo *
                  </label>
                  <select
                    value={newDossier.regime}
                    onChange={(e) => setNewDossier({ ...newDossier, regime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="REEL_NORMAL">Réel Normal (TVA 18%)</option>
                    <option value="RSI">RSI (Synthétique)</option>
                    <option value="TPU">TPU (Forfait/Artisans)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Forme Juridique
                  </label>
                  <select
                    value={newDossier.formeJuridique}
                    onChange={(e) => setNewDossier({ ...newDossier, formeJuridique: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="SARL">SARL / SARL U</option>
                    <option value="SAS">SAS / SAS U</option>
                    <option value="SA">SA</option>
                    <option value="ETS">ETS / Entreprise Individuelle</option>
                    <option value="GIE">GIE / Coopérative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    NIF Togo (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="1000..."
                    value={newDossier.nif}
                    onChange={(e) => setNewDossier({ ...newDossier, nif: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Centre Fiscal de rattachement
                  </label>
                  <select
                    value={newDossier.centreFiscal}
                    onChange={(e) => setNewDossier({ ...newDossier, centreFiscal: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="DPME Lomé">DPME Lomé (PME)</option>
                    <option value="DGE">DGE (Grandes Entreprises)</option>
                    <option value="DPI Golfe">DPI Golfe</option>
                    <option value="DPI Agoè-Nyivé">DPI Agoè-Nyivé</option>
                    <option value="DPI Maritime">DPI Maritime</option>
                    <option value="DPI Plateaux">DPI Plateaux (Atakpamé/Kpalimé)</option>
                    <option value="DPI Centrale">DPI Centrale (Sokodé)</option>
                    <option value="DPI Kara">DPI Kara</option>
                    <option value="DPI Savanes">DPI Savanes (Dapaong)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Lomé"
                    value={newDossier.city}
                    onChange={(e) => setNewDossier({ ...newDossier, city: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 font-medium">
                    Téléphone client
                  </label>
                  <input
                    type="text"
                    placeholder="+228 90 00 00 00"
                    value={newDossier.phone}
                    onChange={(e) => setNewDossier({ ...newDossier, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-[#E6DEC8] dark:border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DEC8] dark:border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="font-mono text-xs"
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating}
                  className="bg-[#0B3D2E] hover:bg-[#157A46] text-[#FBF7EC] font-mono text-xs shadow-md"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Initialisation SYSCOHADA...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Créer le dossier
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
