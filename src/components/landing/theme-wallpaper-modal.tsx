"use client";

import React, { useState } from "react";
import { useAppTheme, ThemeMode, WallpaperPreset } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Moon,
  Sun,
  Sparkles,
  Grid,
  Zap,
  Check,
  X,
  Compass,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeWallpaperModal() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    theme,
    wallpaper,
    wallpaperEnabled,
    setTheme,
    setWallpaper,
    setWallpaperEnabled,
  } = useAppTheme();

  const themes: Array<{ id: ThemeMode; label: string; icon: any; color: string; desc: string }> = [
    {
      id: "dark",
      label: "Sombre Cyber",
      icon: Moon,
      color: "bg-slate-950 border-brand-500 text-brand-400",
      desc: "Noir profond & contrastes émeraude",
    },
    {
      id: "light",
      label: "Luxe Clair",
      icon: Sun,
      color: "bg-white border-amber-400 text-amber-600",
      desc: "Blanc pur & touches dorées",
    },
    {
      id: "theme-midnight",
      label: "Nuit Océan",
      icon: Compass,
      color: "bg-[#0b132b] border-cyan-400 text-cyan-400",
      desc: "Bleu nuit & accents cobalt",
    },
    {
      id: "theme-emerald",
      label: "Émeraude Togo",
      icon: Zap,
      color: "bg-[#042416] border-emerald-400 text-emerald-400",
      desc: "Vert profond aux couleurs nationales",
    },
  ];

  const wallpapers: Array<{ id: WallpaperPreset; label: string; icon: any; desc: string }> = [
    {
      id: "aurora",
      label: "Aurore Fiscale",
      icon: Sparkles,
      desc: "Lueurs diffuses animées",
    },
    {
      id: "grid",
      label: "Matrice SYSCOHADA",
      icon: Grid,
      desc: "Grille cybernétique animée",
    },
    {
      id: "particles",
      label: "Constellation",
      icon: Zap,
      desc: "Particules reliées en temps réel",
    },
    {
      id: "minimal",
      label: "Lueur Douce",
      icon: Moon,
      desc: "Ambiance discrète sans mouvement",
    },
  ];

  return (
    <>
      {/* Bouton déclencheur élégant */}
      <button
        onClick={() => setIsOpen(true)}
        className="glass-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-foreground hover:border-brand-400 transition-all duration-300 hover:shadow-lg group shadow-sm"
        aria-label="Personnaliser le thème et le fond d'écran"
      >
        <Palette className="h-3.5 w-3.5 text-brand-500 group-hover:rotate-45 transition-transform duration-300" />
        <span className="hidden sm:inline">Thème</span>
      </button>

      {/* Modal / Dialog Flottant */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl glass-card border border-white/20 dark:border-white/10 p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-500">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Thème & Apparence</h3>
                  <p className="text-xs text-muted-foreground">Personnalisez les couleurs et le fond (optionnel)</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Section 1 : Palette de Thème */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Mode & Palette de Couleurs
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {themes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200",
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30"
                          : "border-border hover:border-brand-500/50 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg border", t.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold">{t.label}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-brand-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2 : Fond d'Écran Dynamique (Optionnel) */}
            <div className="space-y-3 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    2. Effet de Fond d&apos;Écran
                    <span className="text-[10px] font-normal lowercase text-muted-foreground">(Optionnel)</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {wallpaperEnabled
                      ? "Effet visuel d'arrière-plan actif"
                      : "Désactivé par défaut (fond sobre et épuré)"}
                  </p>
                </div>

                {/* Switch Activé / Désactivé */}
                <button
                  onClick={() => setWallpaperEnabled(!wallpaperEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    wallpaperEnabled ? "bg-brand-500" : "bg-muted"
                  )}
                  role="switch"
                  aria-checked={wallpaperEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      wallpaperEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Si activé, affiche la sélection du style */}
              {wallpaperEnabled && (
                <div className="grid grid-cols-2 gap-2.5 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {wallpapers.map((w) => {
                    const Icon = w.icon;
                    const isSelected = wallpaper === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => setWallpaper(w.id)}
                        className={cn(
                          "relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200",
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                            : "border-border hover:border-amber-500/50 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-bold">{w.label}</span>
                          </div>
                          {isSelected && <Check className="h-3 w-3 text-amber-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{w.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setIsOpen(false)} className="rounded-xl font-semibold">
                Terminer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
