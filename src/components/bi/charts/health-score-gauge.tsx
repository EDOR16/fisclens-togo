"use client";

/**
 * HealthScoreGauge — Jauge animée du score de santé commerciale
 * Utilisé dans l'onglet "Analyse IA" du Workspace BI
 */

import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface HealthScoreGaugeProps {
  score: number; // 0–100
  size?: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return "#16a34a"; // vert
  if (score >= 60) return "#ca8a04"; // amber
  return "#dc2626"; // rouge
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Bon";
  if (score >= 55) return "Moyen";
  return "À améliorer";
}

export function HealthScoreGauge({ score, size = 160 }: HealthScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0);

  // Animation d'incrémentation du score
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(score / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [score]);

  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const data = [{ name: "Score", value: displayed, fill: color }];

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="68%"
          outerRadius="90%"
          startAngle={225}
          endAngle={-45}
          data={data}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          {/* Piste de fond */}
          <RadialBar
            background={{ fill: "#f1f5f9" }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Score au centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black font-mono leading-none transition-all"
          style={{ fontSize: size * 0.24, color }}
        >
          {displayed}
        </span>
        <span
          className="font-semibold text-muted-foreground mt-0.5"
          style={{ fontSize: size * 0.1 }}
        >
          {label}
        </span>
        <span
          className="text-muted-foreground/60"
          style={{ fontSize: size * 0.08 }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
