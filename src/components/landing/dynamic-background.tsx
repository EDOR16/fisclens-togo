"use client";

import React, { useEffect, useRef } from "react";
import { useAppTheme } from "@/components/theme/theme-provider";

export function DynamicBackground() {
  const { wallpaper, wallpaperEnabled } = useAppTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation pour le mode Particules (uniquement si activé)
  useEffect(() => {
    if (!wallpaperEnabled || wallpaper !== "particles") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const numParticles = Math.min(50, Math.floor((width * height) / 30000));
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.4 ? "#22c55e" : "#eab308",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (!p2) continue;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.12;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaper, wallpaperEnabled]);

  // Si le fond d'écran dynamique est désactivé (comportement par défaut)
  if (!wallpaperEnabled || wallpaper === "none") {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* 1. Mode Aurora */}
      {wallpaper === "aurora" && (
        <div className="absolute inset-0">
          <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-brand-600/20 via-emerald-500/15 to-transparent blur-[120px] animate-float opacity-70" />
          <div className="absolute top-[20%] -right-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-amber-500/15 via-yellow-600/10 to-transparent blur-[140px] animate-float-delayed opacity-60" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-cyan-600/15 via-brand-500/10 to-transparent blur-[130px] animate-pulse-slow opacity-60" />
        </div>
      )}

      {/* 2. Mode Cyber Grid SYSCOHADA */}
      {wallpaper === "grid" && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(34, 197, 94, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-90" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/15 rounded-full blur-[100px]" />
        </div>
      )}

      {/* 3. Mode Particules Constellation Canvas */}
      {wallpaper === "particles" && (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
        </>
      )}

      {/* 4. Mode Minimaliste */}
      {wallpaper === "minimal" && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-brand-500/10 to-transparent rounded-full blur-[120px]" />
        </div>
      )}
    </div>
  );
}
