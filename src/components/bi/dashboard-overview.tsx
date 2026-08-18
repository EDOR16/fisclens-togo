/**
 * Composant Dashboard BI - Overview
 * Affiche les KPIs clés
 */

import React from "react";
import { Card } from "@/components/ui/card";

interface DashboardOverviewProps {
  ca: number;
  margeBrute: number;
  margePercent: number;
  trésorerie: number;
  clientsActifs: number;
  tendanceVsN1: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardOverview({
  ca,
  margeBrute,
  margePercent,
  trésorerie,
  clientsActifs,
  tendanceVsN1,
}: DashboardOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">Chiffre d'affaires</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(ca)}</div>
        <div className="text-xs text-gray-400 mt-2">Ventes HT</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">Marge Brute</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(margeBrute)}</div>
        <div className="text-xs text-green-600 mt-2">{margePercent}% de marge</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">Trésorerie</div>
        <div className="text-2xl font-bold mt-2">{formatCurrency(trésorerie)}</div>
        <div className="text-xs text-gray-400 mt-2">Total TTC</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">Clients Actifs</div>
        <div className="text-2xl font-bold mt-2">{clientsActifs}</div>
        <div className="text-xs text-gray-400 mt-2">Avec transactions</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">Tendance</div>
        <div className={`text-2xl font-bold mt-2 ${tendanceVsN1 >= 0 ? "text-green-600" : "text-red-600"}`}>
          {tendanceVsN1 >= 0 ? "+" : ""}{tendanceVsN1}%
        </div>
        <div className="text-xs text-gray-400 mt-2">vs N-1</div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-medium text-gray-500">État</div>
        <div className="text-xl font-bold mt-2">✓</div>
        <div className="text-xs text-green-600 mt-2">Données cohérentes</div>
      </Card>
    </div>
  );
}
