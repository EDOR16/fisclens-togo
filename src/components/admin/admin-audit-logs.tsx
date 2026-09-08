"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, RefreshCw, Search, ChevronLeft, ChevronRight,
  Loader2, Building2, User as UserIcon, Filter
} from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  tenant: { id: string; name: string } | null;
};

type LogsResponse = {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  distinctActions: string[];
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "#157A46",
  LOGOUT: "#33604C",
  CREATE: "#2563EB",
  UPDATE: "#D97706",
  DELETE: "#B3261E",
  EXPORT: "#7C3AED",
  IMPORT: "#0891B2",
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : "#6B7280";
}

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function AdminAuditLogs() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (search) params.set("entity", search);
      if (filterAction) params.set("action", filterAction);

      const res = await api.get<LogsResponse>(
        `/api/v1/admin/audit-logs?${params.toString()}`
      );
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page on filter change
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleActionFilter = (val: string) => { setFilterAction(val); setPage(1); };

  return (
    <div
      className="space-y-6 p-3 sm:p-5 md:p-6"
      style={{
        background: "#F5F0E4",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E6DEC8 31px, #E6DEC8 32px)",
        minHeight: "100%",
      }}
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.6rem" }}>
              SuperAdmin
            </span>
            <h2
              className="chapter-heading text-xl sm:text-2xl"
              style={{ fontFamily: "var(--font-hand), cursive", color: "#0B3D2E" }}
            >
              Journaux d&apos;Audit & Sécurité
            </h2>
          </div>
          <p className="font-mono text-[11px] text-[#33604C] tracking-widest uppercase">
            Traçabilité immuable · {data?.total ?? "..."} événement(s) enregistré(s)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="bg-white/80 border-[#C8BEA8] text-[#0B3D2E] hover:bg-white text-xs self-start"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#33604C]" />
          <input
            type="text"
            placeholder="Filtrer par entité (User, Ecriture, Tenant...)"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded border border-[#C8BEA8] bg-white/80 focus:outline-none focus:ring-1 focus:ring-[#157A46]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#33604C]" />
          <select
            value={filterAction}
            onChange={(e) => handleActionFilter(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs font-mono rounded border border-[#C8BEA8] bg-white/80 focus:outline-none focus:ring-1 focus:ring-[#157A46] appearance-none min-w-[150px]"
          >
            <option value="">Toutes les actions</option>
            {data?.distinctActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline des logs */}
      <div className="receipt shadow-sm" style={{ borderRadius: "6px", padding: 0, background: "#FAF7EE" }}>
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ background: "#0B3D2E", borderRadius: "5px 5px 0 0" }}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#FCD116]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FBF7EC]">
              Journal d&apos;Audit Système
            </span>
          </div>
          {data && (
            <span className="font-mono text-[10px] text-[#BFD8CC]">
              Page {data.page} / {data.pages} · {data.total} entrées
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs font-mono">Chargement des logs...</span>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="text-center py-10 text-xs font-mono text-muted-foreground">
            Aucun log trouvé
          </div>
        ) : (
          <div className="divide-y divide-[#EDE8D9]">
            {data.logs.map((log, i) => {
              const actionColor = getActionColor(log.action);
              return (
                <div key={log.id} className="flex gap-3 px-4 py-3 hover:bg-black/5 transition-colors">
                  {/* Indicateur timeline */}
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full border-2 border-white shadow"
                      style={{ background: actionColor }}
                    />
                    {i < (data?.logs.length ?? 0) - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "#EDE8D9" }} />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      {/* Action badge */}
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: `${actionColor}20`, color: actionColor }}
                      >
                        {log.action}
                      </span>
                      {/* Entity */}
                      <span className="text-[11px] font-mono text-[#0B3D2E] font-semibold">
                        {log.entity}
                        {log.entityId && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            #{log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#33604C]">
                      {log.user && (
                        <span className="flex items-center gap-0.5">
                          <UserIcon className="h-2.5 w-2.5" />
                          {log.user.email}
                        </span>
                      )}
                      {log.tenant && log.tenant.id !== "tenant-fisclens-admin" && (
                        <span className="flex items-center gap-0.5">
                          <Building2 className="h-2.5 w-2.5" />
                          {log.tenant.name}
                        </span>
                      )}
                      <span className="text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                    </div>

                    {log.details && (
                      <p className="mt-1 text-[10px] font-mono text-muted-foreground truncate max-w-lg">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t border-[#EDE8D9]"
            style={{ borderRadius: "0 0 5px 5px" }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 text-xs font-mono border-[#C8BEA8] text-[#0B3D2E]"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Précédent
            </Button>
            <span className="font-mono text-[11px] text-[#33604C]">
              {page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages || loading}
              className="h-7 text-xs font-mono border-[#C8BEA8] text-[#0B3D2E]"
            >
              Suivant
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2" style={{ opacity: 0.35 }}>
        <div className="stamp-badge" style={{ borderColor: "#157A46", color: "#157A46", fontSize: "0.55rem" }}>
          FiscLens Admin · Traçabilité & Sécurité
        </div>
      </div>
    </div>
  );
}
