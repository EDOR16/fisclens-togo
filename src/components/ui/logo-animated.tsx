"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  interactive?: boolean;
}

export function LogoAnimated({
  size = "md",
  showText = true,
  className,
  interactive = true,
}: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeMap = {
    sm: { box: "h-8 w-8", svg: 32, text: "text-base", sub: "text-[10px]" },
    md: { box: "h-10 w-10", svg: 40, text: "text-xl", sub: "text-xs" },
    lg: { box: "h-14 w-14", svg: 56, text: "text-2xl", sub: "text-sm" },
    xl: { box: "h-20 w-20", svg: 80, text: "text-4xl", sub: "text-base" },
  };

  const current = sizeMap[size];

  return (
    <div
      className={cn("inline-flex items-center gap-3 select-none group cursor-pointer", className)}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Emblème SVG animé */}
      <div className={cn("relative flex items-center justify-center shrink-0", current.box)}>
        {/* Halo lumineux d'ambiance */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-400 to-amber-400 blur-md opacity-40 transition-all duration-500",
            isHovered ? "opacity-90 scale-125 blur-lg" : "animate-pulse-slow"
          )}
        />

        {/* Cadre en verre / Prism */}
        <div
          className={cn(
            "relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/20 shadow-xl flex items-center justify-center overflow-hidden transition-all duration-500",
            isHovered ? "border-amber-400/80 shadow-brand-500/30 scale-105" : ""
          )}
        >
          {/* Lignes d'énergie en arrière plan du logo */}
          <div
            className={cn(
              "absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3),transparent_70%)] transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-40"
            )}
          />

          {/* Anneau rotatif de précision fiscale */}
          <svg
            className={cn(
              "absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] text-brand-400/40 transition-all duration-700",
              isHovered ? "rotate-180 text-amber-400/80 scale-110" : "animate-spin-slow"
            )}
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
            <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 5" opacity="0.6" />
          </svg>

          {/* SVG Principal : Le 'F' stylisé + La Loupe / Prisme Fiscal */}
          <svg
            className="relative z-10 w-3/5 h-3/5"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-grad-brand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="logo-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>

            {/* Barre verticale du Fisc */}
            <rect
              x="22"
              y="18"
              width="14"
              height="64"
              rx="7"
              fill="url(#logo-grad-brand)"
              className={cn("transition-transform duration-300", isHovered ? "translate-y-[-1px]" : "")}
            />

            {/* Barre supérieure du F (avec accent or Togo) */}
            <rect
              x="22"
              y="18"
              width="54"
              height="14"
              rx="7"
              fill="url(#logo-grad-gold)"
              className={cn("transition-all duration-300", isHovered ? "w-[58px]" : "")}
            />

            {/* Barre médiane dynamique */}
            <rect
              x="22"
              y="44"
              width="38"
              height="12"
              rx="6"
              fill="url(#logo-grad-brand)"
            />

            {/* Étoile / Point de mire optique "Lens" */}
            <circle
              cx="74"
              cy="68"
              r="10"
              stroke="url(#logo-grad-gold)"
              strokeWidth="4"
              fill="#0f172a"
              className={cn(
                "transition-all duration-500",
                isHovered ? "scale-125 stroke-amber-300 fill-brand-950" : ""
              )}
            />
            <path
              d="M81 75L92 86"
              stroke="url(#logo-grad-gold)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Étincelle centrale */}
            <circle
              cx="74"
              cy="68"
              r="3.5"
              fill="#ffffff"
              className={cn(isHovered ? "animate-ping" : "")}
            />
          </svg>
        </div>
      </div>

      {/* Libellé Textuel */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={cn("font-extrabold tracking-tight font-sans transition-colors", current.text)}>
              <span className="bg-gradient-to-r from-emerald-400 via-brand-400 to-green-500 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-amber-300">
                Fisc
              </span>
              <span className="text-foreground">Lens</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-500">
              Togo
            </span>
          </div>
          <span className={cn("text-muted-foreground font-medium tracking-wide mt-1 uppercase text-[9px]", current.sub)}>
            SYSCOHADA & Fiscalité OTR
          </span>
        </div>
      )}
    </div>
  );
}
