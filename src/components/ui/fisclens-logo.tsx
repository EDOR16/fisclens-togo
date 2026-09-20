"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FiscLensLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "badge" | "full";
  interactive?: boolean;
}

export function FiscLensLogo({
  size = "md",
  showText = true,
  className,
  variant = "badge",
  interactive = true,
}: FiscLensLogoProps) {
  const sizeMap = {
    sm: { img: 32, box: "h-8 w-8", text: "text-sm", sub: "text-[9px]" },
    md: { img: 40, box: "h-10 w-10", text: "text-base", sub: "text-[10px]" },
    lg: { img: 56, box: "h-14 w-14", text: "text-xl", sub: "text-xs" },
    xl: { img: 96, box: "h-24 w-24", text: "text-3xl", sub: "text-sm" },
  };

  const current = sizeMap[size];

  if (variant === "full") {
    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center select-none",
          interactive && "transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]",
          className
        )}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/20 bg-black/40">
          <Image
            src="/images/logo-fisclens-tg.jpg"
            alt="FiscLens-TG Logo"
            width={current.img * 3}
            height={current.img * 2}
            priority
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 select-none group cursor-pointer",
        interactive && "transition-transform duration-200 active:scale-[0.98]",
        className
      )}
    >
      {/* Badge emblème avec aura dorée */}
      <div className={cn("relative flex items-center justify-center shrink-0", current.box)}>
        {/* Glow ambré / émeraude */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-tr from-[#157A46] via-[#22c55e] to-[#eab308] opacity-40 blur-sm transition-all duration-500",
            interactive && "group-hover:opacity-80 group-hover:blur-md group-hover:scale-110"
          )}
        />
        {/* Image du badge cadrée */}
        <div className="relative h-full w-full rounded-xl overflow-hidden border border-amber-400/40 shadow-lg bg-slate-950 flex items-center justify-center">
          <Image
            src="/images/logo-fisclens-tg.jpg"
            alt="FiscLens Logo"
            width={current.img}
            height={current.img}
            priority
            className="h-full w-full object-cover scale-[1.2] transition-transform duration-500 group-hover:scale-[1.3]"
          />
        </div>
      </div>

      {/* Texte stylisé FiscLens-TG */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 leading-none">
            <span className={cn("font-black tracking-tight", current.text)}>
              <span className="text-[#ef4444] drop-shadow-[0_1px_4px_rgba(239,68,68,0.4)]">
                Fisc
              </span>
              <span className="text-[#22c55e] drop-shadow-[0_1px_4px_rgba(34,197,94,0.4)]">
                Lens
              </span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm border border-amber-300">
              -TG
            </span>
          </div>
          <span className={cn("text-muted-foreground font-semibold tracking-wider uppercase mt-1", current.sub)}>
            SYSCOHADA &amp; Fiscalité OTR
          </span>
        </div>
      )}
    </div>
  );
}
