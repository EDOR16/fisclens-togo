"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, FileText, CheckCircle2, ShieldCheck,
  Save, RefreshCw, Landmark, Phone, MapPin, Hash, Sparkles
} from "lucide-react";

type TenantProfile = {
  id: string;
  name: string;
  regime: "REEL_NORMAL" | "RSI" | "TPU";
  nif: string | null;
  rccm: string | null;
  cnssNumber: string | null;
  centreFiscal: string | null;
  formeJuridique: string | null;
  secteurActivite: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  plan: string;
  exerciceOuvert: boolean;
};

const CENTRES_FISCAUX_TOGO = [
  "DPME Lomé (Direction des Petites et Moyennes Entreprises)",
  "DGE Lomé (Direction des Grandes Entreprises)",
  "DPI Golfe 1 (Bè - Grand Marché)",
  "DPI Golfe 2 (Hédzranawoé - Tokoin)",
  "DPI Golfe 3 & 4 (Amoutivé - Hanoukopé)",
  "DPI Golfe 5 & 7 (Aflao Gakli - Sagbado)",
  "DPI Agoè-Nyivé (Agoè Centre - Legbassito)",
  "Division Régionale Maritime (Tsévié)",
  "Division Régionale des Plateaux (Atakpamé - Kpalimé)",
  "Division Régionale Centrale (Sokodé)",
  "Division Régionale de la Kara (Kara)",
  "Division Régionale des Savanes (Dapaong)",
];

const FORMES_JURIDIQUES = [
  { value: "SARL", label: "Société à Responsabilité Limitée (SARL / SARL U)" },
  { value: "SAS", label: "Société par Actions Simplifiée (SAS / SASU)" },
  { value: "SA", label: "Société Anonyme (SA)" },
  { value: "EI", label: "Entreprise Individuelle (Établissement - CFE)" },
  { value: "SNC", label: "Société en Nom Collectif (SNC)" },
  { value: "GIE", label: "Groupement d'Intérêt Économique (GIE)" },
  { value: "CABINET", label: "Société d'Expertise Comptable / Avocats" },
];

const SECTEURS_ACTIVITE = [
  "Commerce général & Distribution",
  "Prestations de services & Conseil",
  "BTP & Génie Civil",
  "Technologies, Informatique & Télécoms",
  "Industrie manufacturière & Transformation",
  "Agroalimentaire & Agriculture",
  "Santé & Pharmacie",
  "Transport & Logistique",
  "Hôtellerie, Restauration & Tourisme",
  "Énergie & Énergies Renouvelables",
];

export default function ParametresEntreprisePage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulaire éditable
  const [form, setForm] = useState({
    name: "",
    regime: "REEL_NORMAL" as "REEL_NORMAL" | "RSI" | "TPU",
    nif: "",
    rccm: "",
    cnssNumber: "",
    centreFiscal: "DPME Lomé (Direction des Petites et Moyennes Entreprises)",
    formeJuridique: "SARL",
    secteurActivite: "Commerce général & Distribution",
    phone: "",
    address: "",
    city: "Lomé",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/tenant/profile");
      if (!res.ok) throw new Error("Impossible de charger la fiche entreprise");
      const data = await res.json();
      setProfile(data.tenant);
      setForm({
        name: data.tenant.name || "",
        regime: data.tenant.regime || "REEL_NORMAL",
        nif: data.tenant.nif || "",
        rccm: data.tenant.rccm || "",
        cnssNumber: data.tenant.cnssNumber || "",
        centreFiscal: data.tenant.centreFiscal || "DPME Lomé (Direction des Petites et Moyennes Entreprises)",
        formeJuridique: data.tenant.formeJuridique || "SARL",
        secteurActivite: data.tenant.secteurActivite || "Commerce général & Distribution",
        phone: data.tenant.phone || "",
        address: data.tenant.address || "",
        city: data.tenant.city || "Lomé",
      });
    } catch (err) {
      toast.error("Erreur lors de la récupération des données de l'entreprise");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/v1/tenant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur de mise à jour");

      toast.success("Fiche d'immatriculation fiscale mise à jour !");
      setProfile(data.tenant);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="flex items-center gap-3 font-mono text-sm text-[#33604C]">
          <RefreshCw className="h-5 w-5 animate-spin text-[#157A46]" />
          Chargement de la Fiche CFE / OTR...
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-8 p-6"
      style={{
        background: "#F5F0E4",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E6DEC8 31px, #E6DEC8 32px)",
        minHeight: "100%",
      }}
    >
      {/* ── En-tête chapitre ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2
            className="chapter-heading text-2xl mb-1"
            style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
          >
            Fiche d'Immatriculation Fiscale CFE & OTR
          </h2>
          <p className="font-mono text-xs text-[#33604C] tracking-widest uppercase mt-3">
            Carte Unique de Création d'Entreprise · République Togolaise
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46" }}>
            CONFORME CFE / OTR
          </div>
        </div>
      </div>

      {/* ── Aperçu "CARTE UNIQUE DE CRÉATION D'ENTREPRISE" (Style Institutionnel Togolais) ── */}
      <div
        className="receipt p-6 md:p-8 rounded-xl relative overflow-hidden"
        style={{
          border: "2px solid #0B3D2E",
          background: "linear-gradient(135deg, #FBF7EC 0%, #F5EEDB 100%)",
          boxShadow: "0 10px 25px -5px rgba(11, 61, 46, 0.15)",
        }}
      >
        {/* Bandeau supérieur officiel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#0B3D2E] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#0B3D2E] text-[#FBF7EC] flex items-center justify-center font-bold text-xl shadow-md">
              TG
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#33604C] block font-bold">
                RÉPUBLIQUE TOGOLAISE · GUICHET UNIQUE CFE
              </span>
              <h3 className="font-mono text-lg font-extrabold text-[#0B3D2E]">
                {form.name || "DÉNOMINATION SOCIALE"}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs border-[#157A46] text-[#157A46] bg-green-50/50">
              {form.regime === "REEL_NORMAL" ? "RÉEL NORMAL (IS 27% · TVA 18%)" : form.regime === "RSI" ? "RÉGIME SIMPLIFIÉ (RSI)" : "SYNTHÉTIQUE (TPU)"}
            </Badge>
          </div>
        </div>

        {/* 3 Blocs Identifiants Majeurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 font-mono">
          <div className="p-4 rounded-lg bg-white/80 border border-[#E2D9C2] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#33604C] font-semibold mb-1">
              <Hash className="h-4 w-4 text-[#B3261E]" />
              NIF (IDENTIFIANT FISCAL OTR)
            </div>
            <div className="text-xl font-bold tracking-wider text-[#0B3D2E]">
              {form.nif || "NON RENSEIGNÉ"}
            </div>
            <span className="text-[10px] text-[#33604C] block mt-1">Numéro unique 10 chiffres</span>
          </div>

          <div className="p-4 rounded-lg bg-white/80 border border-[#E2D9C2] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#33604C] font-semibold mb-1">
              <Building2 className="h-4 w-4 text-[#157A46]" />
              RCCM (REGISTRE DU COMMERCE)
            </div>
            <div className="text-base font-bold text-[#0B3D2E] truncate">
              {form.rccm || "NON RENSEIGNÉ"}
            </div>
            <span className="text-[10px] text-[#33604C] block mt-1">Greffe Tribunal de Lomé / Régions</span>
          </div>

          <div className="p-4 rounded-lg bg-white/80 border border-[#E2D9C2] shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#33604C] font-semibold mb-1">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              N° EMPLOYEUR CNSS / AMU
            </div>
            <div className="text-base font-bold text-[#0B3D2E]">
              {form.cnssNumber || "NON RENSEIGNÉ"}
            </div>
            <span className="text-[10px] text-[#33604C] block mt-1">Sécurité Sociale & AMU (5%)</span>
          </div>
        </div>

        {/* Détails complémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono pt-4 border-t border-dashed border-[#0B3D2E]/20 text-[#33604C]">
          <div>
            <span className="text-[10px] uppercase block font-semibold">Forme Juridique :</span>
            <span className="font-bold text-[#0B3D2E]">{form.formeJuridique}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block font-semibold">Division Fiscale OTR :</span>
            <span className="font-bold text-[#0B3D2E] truncate block">{form.centreFiscal?.split("(")[0]}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block font-semibold">Secteur d'Activité :</span>
            <span className="font-bold text-[#0B3D2E] truncate block">{form.secteurActivite}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block font-semibold">Ville & Téléphone :</span>
            <span className="font-bold text-[#0B3D2E]">{form.city} · {form.phone || "—"}</span>
          </div>
        </div>
      </div>

      {/* ── Formulaire d'Édition des Données CFE / OTR ── */}
      <form onSubmit={handleSave} className="space-y-6">
        <div
          className="receipt p-6 md:p-8 rounded-xl font-mono text-xs space-y-6"
          style={{ borderTop: "3px solid #157A46" }}
        >
          <div className="flex items-center gap-2 border-b border-[#E2D9C2] pb-3">
            <Landmark className="h-5 w-5 text-[#157A46]" />
            <h3 className="font-bold text-sm text-[#0B3D2E] uppercase tracking-wider">
              Mise à jour des informations légales & de déclaration
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom / Dénomination */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Dénomination Sociale / Nom Commercial *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
                placeholder="Ex: TOGO LOGISTICS SARL"
              />
            </div>

            {/* Forme Juridique */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Forme Juridique (Statut CFE) *
              </label>
              <select
                value={form.formeJuridique}
                onChange={(e) => setForm({ ...form, formeJuridique: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
              >
                {FORMES_JURIDIQUES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* NIF OTR */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                NIF — Numéro d'Identification Fiscale (OTR)
              </label>
              <input
                type="text"
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] font-mono outline-none focus:border-[#157A46]"
                placeholder="Ex: 1001234567 (10 chiffres)"
              />
              <span className="text-[10px] text-[#33604C] mt-1 block">Attribué par l'OTR sur la Carte Unique CFE</span>
            </div>

            {/* RCCM */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Numéro RCCM (Registre du Commerce)
              </label>
              <input
                type="text"
                value={form.rccm}
                onChange={(e) => setForm({ ...form, rccm: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] font-mono outline-none focus:border-[#157A46]"
                placeholder="Ex: TG-LFW-01-2024-B12-00456"
              />
            </div>

            {/* Numéro CNSS */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Numéro Employeur CNSS / AMU
              </label>
              <input
                type="text"
                value={form.cnssNumber}
                onChange={(e) => setForm({ ...form, cnssNumber: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] font-mono outline-none focus:border-[#157A46]"
                placeholder="Ex: 12345-CNSS"
              />
            </div>

            {/* Régime Fiscal */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Régime d'Imposition Fiscal *
              </label>
              <select
                value={form.regime}
                onChange={(e) => setForm({ ...form, regime: e.target.value as any })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
              >
                <option value="REEL_NORMAL">Réel Normal — IS 27%, TVA 18%, Liasse SYSCOHADA complète</option>
                <option value="RSI">Régime Simplifié d'Imposition (RSI) — CA moyen</option>
                <option value="TPU">Taxe Professionnelle Unique (TPU / Synthétique)</option>
              </select>
            </div>

            {/* Centre des Impôts OTR de rattachement */}
            <div className="md:col-span-2">
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Division / Centre des Impôts de Rattachement (OTR) *
              </label>
              <select
                value={form.centreFiscal}
                onChange={(e) => setForm({ ...form, centreFiscal: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
              >
                {CENTRES_FISCAUX_TOGO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="text-[10px] text-[#33604C] mt-1 block">Détermine le destinataire de vos déclarations e-Tax et acomptes provisionnels</span>
            </div>

            {/* Secteur d'activité */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Secteur d'Activité Principal
              </label>
              <select
                value={form.secteurActivite}
                onChange={(e) => setForm({ ...form, secteurActivite: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
              >
                {SECTEURS_ACTIVITE.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Téléphone T-Money / Flooz */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Téléphone Professionnel (Mobile Money)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
                placeholder="Ex: +228 90 XX XX XX / 99 XX XX XX"
              />
            </div>

            {/* Ville & Adresse */}
            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Ville / Commune
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
                placeholder="Ex: Lomé (Commune Golfe 3)"
              />
            </div>

            <div>
              <label className="block text-[#33604C] font-bold uppercase tracking-wider mb-1">
                Adresse Géographique / Quartier
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-md border border-[#E2D9C2] bg-white px-3 py-2 text-sm text-[#0B3D2E] outline-none focus:border-[#157A46]"
                placeholder="Ex: Boulevard du 13 Janvier, Nyékonakpoè"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E2D9C2]">
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 font-mono text-xs font-bold bg-[#0B3D2E] text-[#FBF7EC] hover:bg-[#157A46] px-6 py-2.5 rounded-full shadow-md"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer la Fiche d'Immatriculation Fiscale
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
