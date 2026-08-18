/**
 * Composant Alerts
 * Affiche les alertes avec groupage par sévérité
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export interface Alert {
  id: string;
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

interface AlertsComponentProps {
  alerts: Alert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  onAcknowledge?: (alertId: string) => void;
}

export function AlertsComponent({
  alerts,
  summary,
  onAcknowledge,
}: AlertsComponentProps) {
  const severityConfig = {
    CRITICAL: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    WARNING: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    INFO: {
      icon: Info,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  };

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid gap-2 md:grid-cols-3">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm font-medium text-red-600">Critiques</div>
          <div className="text-2xl font-bold text-red-900">{summary.critical}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-600">Avertissements</div>
          <div className="text-2xl font-bold text-yellow-900">{summary.warning}</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-600">Informations</div>
          <div className="text-2xl font-bold text-blue-900">{summary.info}</div>
        </Card>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Aucune alerte en attente
          </Card>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <Card
                key={alert.id}
                className={`p-4 border-l-4 ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`${config.color} mt-1 flex-shrink-0`} size={20} />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${config.color}`}>
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(alert.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Acquitter
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
