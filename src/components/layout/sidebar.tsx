"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Receipt, AlertTriangle,
  BarChart3, CalendarDays, Settings, LogOut, ChevronsUpDown,
  Users, ChevronRight, Building2,
} from "lucide-react";
import { useAuth, useHasRole, type Role } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { NetworkStatus } from "@/components/offline-badge";
import { RoleBadge } from "@/components/fiscal-ui";

// ---------------------------------------------------------------------------
// Définition de la navigation — filtrée par rôle côté UI
// ---------------------------------------------------------------------------

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];           // undefined = accessible à tous les rôles connectés
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Comptabilité",
    href: "/comptabilite",
    icon: BookOpen,
    children: [
      { label: "Saisie",            href: "/comptabilite/saisie",           icon: ChevronRight, roles: ["GERANT", "COMPTABLE"] },
      { label: "Journaux",          href: "/comptabilite/journaux",          icon: ChevronRight },
      { label: "Grand livre",       href: "/comptabilite/grand-livre",       icon: ChevronRight },
      { label: "Balance",           href: "/comptabilite/balance",           icon: ChevronRight },
      { label: "États financiers",  href: "/comptabilite/etats-financiers",  icon: ChevronRight },
      { label: "Rapprochement",     href: "/comptabilite/rapprochement",     icon: ChevronRight, roles: ["GERANT", "COMPTABLE"] },
      { label: "Clôture",           href: "/comptabilite/cloture",           icon: ChevronRight, roles: ["GERANT"] },
    ],
  },
  {
    label: "Fiscal",
    href: "/fiscal",
    icon: Receipt,
    children: [
      { label: "IRPP / Paie",    href: "/fiscal/irpp",          icon: ChevronRight },
      { label: "TVA",            href: "/fiscal/tva",           icon: ChevronRight },
      { label: "IS / IMF",       href: "/fiscal/is",            icon: ChevronRight },
      { label: "Patente",        href: "/fiscal/patente",       icon: ChevronRight },
      { label: "Déclarations",   href: "/fiscal/declarations",  icon: ChevronRight },
    ],
  },
  {
    label: "Contrôle",
    href: "/controle",
    icon: AlertTriangle,
    children: [
      { label: "Anomalies",      href: "/controle/anomalies",      icon: ChevronRight },
      { label: "Risque clients", href: "/controle/risque-clients", icon: ChevronRight, roles: ["GERANT", "COMPTABLE"] },
    ],
  },
  {
    label: "Workspace BI",
    href: "/workspace-bi",
    icon: BarChart3,
  },
  {
    label: "Analyse",
    href: "/analyse",
    icon: BarChart3,
    children: [
      { label: "Vue générale",  href: "/analyse/dashboard",    icon: ChevronRight },
      { label: "RFM clients",   href: "/analyse/rfm",          icon: ChevronRight },
      { label: "Concentration", href: "/analyse/concentration", icon: ChevronRight },
      { label: "Trésorerie",    href: "/analyse/tresorerie",   icon: ChevronRight },
    ],
  },
  {
    label: "Calendrier",
    href: "/calendrier",
    icon: CalendarDays,
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    children: [
      { label: "Plan de comptes",   href: "/parametres/plan-comptes",     icon: ChevronRight },
      { label: "Paramètres fiscaux",href: "/parametres/parametres-fiscaux",icon: ChevronRight, roles: ["ADMIN_SYS"] },
      { label: "Utilisateurs",      href: "/parametres/utilisateurs",     icon: ChevronRight, roles: ["GERANT"] },
      { label: "Sécurité",          href: "/parametres/securite",         icon: ChevronRight },
    ],
  },
];

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  // Filtre par rôle côté UI
  if (item.roles && user && !item.roles.includes(user.role)) return null;

  const Icon = item.icon;

  return (
    <Link
      href={item.href as any}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        depth > 0 ? "ml-6 text-xs" : "",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavSection({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isGroupActive = pathname.startsWith(item.href);

  if (item.roles && user && !item.roles.includes(user.role)) return null;

  const Icon = item.icon;

  return (
    <div>
      <Link
        href={item.href as any}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isGroupActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
      {item.children && isGroupActive && (
        <div className="mt-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sélecteur de dossier (mode Cabinet — CABINET peut switcher de tenant)
// ---------------------------------------------------------------------------

function DossierSelector() {
  const { user, currentTenantId, switchTenant } = useAuth();
  const isCabinet = useHasRole("CABINET");
  if (!isCabinet || !user) return null;

  const currentTenant = user.tenants.find((t) => t.id === currentTenantId);

  return (
    <div className="px-3 py-2 border-b">
      <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
        Dossier client
      </p>
      <button className="w-full flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent transition-colors">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left truncate">
          {currentTenant?.name ?? "Sélectionner un dossier"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar principale
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      {/* Logo — cliquable pour retour au landing */}
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-4 border-b hover:bg-accent transition-colors group"
        title="Retour à l'accueil"
      >
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-700 transition-colors">
          <span className="text-white font-bold text-sm">F</span>
        </div>
        <div>
          <span className="font-semibold text-sm"><span className="text-foreground">Fisc</span><span style={{ color: "#B3261E" }}>Lens</span></span>
          <span className="text-xs text-muted-foreground ml-1">Togo</span>
        </div>
      </Link>

      {/* Sélecteur cabinet */}
      <DossierSelector />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <NavSection key={item.href} item={item} />
          ) : (
            <NavLink key={item.href} item={item} />
          )
        )}
      </nav>

      {/* Pied de sidebar — utilisateur */}
      {user && (
        <div className="border-t px-3 py-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-brand-700 text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Se déconnecter
          </button>
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

export function Topbar({ title }: { title?: string }) {
  const { user, expertMode, toggleExpertMode } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Statut réseau */}
        <NetworkStatus />

        {/* Toggle mode expert (cabinet) */}
        {user?.role === "CABINET" && (
          <button
            onClick={toggleExpertMode}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              expertMode
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {expertMode ? "Mode expert" : "Mode simple"}
          </button>
        )}

        {/* Notifications (placeholder) */}
        <button className="relative rounded-full p-1.5 hover:bg-accent">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
