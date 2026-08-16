"use client";

import { Wifi, WifiOff, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { offlineQueue } from "@/lib/offline-queue";
import { cn } from "@/lib/utils";

/**
 * Badge hors-ligne — affiché dans le layout principal.
 * Indique le statut réseau + le nombre d'écritures en attente de sync.
 */
export function OfflineBadge({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline  = () => { setIsOnline(true);  void updatePending(); };
    const handleOffline = () => { setIsOnline(false); void updatePending(); };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(() => void updatePending(), 5000);

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  async function updatePending() {
    const count = await offlineQueue.count();
    setPendingCount(count);
  }

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        isOnline
          ? "bg-yellow-100 text-yellow-800"   // En ligne mais sync en cours
          : "bg-red-100 text-red-800",          // Hors ligne
        className
      )}
    >
      {isOnline ? (
        <>
          <Clock className="h-3 w-3" />
          <span>{pendingCount} en attente de sync</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Hors ligne{pendingCount > 0 ? ` · ${pendingCount} en attente` : ""}</span>
        </>
      )}
    </div>
  );
}

/** Icône réseau simple pour la barre de navigation */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return isOnline ? (
    <Wifi className="h-4 w-4 text-green-500" aria-label="Connecté" />
  ) : (
    <WifiOff className="h-4 w-4 text-red-500" aria-label="Hors ligne" />
  );
}
