"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Receipt, AlertTriangle,
  BarChart3, CalendarDays, Settings, LogOut, ChevronsUpDown,
  Users, ChevronRight, Building2, Sun, Moon, Calculator,
  Menu, X, ShieldCheck, CreditCard, Activity, Sparkles, ChevronDown,
  Briefcase, ExternalLink,
} from "lucide-react";
import { useAuth, useHasRole, type Role } from "@/lib/auth-context";
import { useAppTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { NetworkStatus } from "@/components/offline-badge";
import { RoleBadge } from "@/components/fiscal-ui";

// ---------------------------------------------------------------------------
// Contexte d'état responsive de la Sidebar (Tiroir Mobile)
// ---------------------------------------------------------------------------

type SidebarContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fermer automatiquement le menu lors d'un changement de page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

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
    label: "Portefeuille Clients",
    href: "/cabinet/portefeuille",
    icon: Briefcase,
    roles: ["CABINET", "ADMIN_SYS"],
  },
  {
    label: "Comptabilité",
    href: "/comptabilite",
    icon: BookOpen,
    children: [
      { label: "Scanner Facture (IA)", href: "/comptabilite/saisie?tab=ocr", icon: Sparkles, roles: ["GERANT", "COMPTABLE"] },
      { label: "Saisie d'écritures", href: "/comptabilite/saisie?tab=manual", icon: ChevronRight, roles: ["GERANT", "COMPTABLE"] },
      { label: "Journaux", href: "/comptabilite/journaux", icon: ChevronRight },
      { label: "Grand livre", href: "/comptabilite/grand-livre", icon: ChevronRight },
      { label: "Balance", href: "/comptabilite/balance", icon: ChevronRight },
      { label: "États financiers", href: "/comptabilite/etats-financiers", icon: ChevronRight },
      { label: "Rapprochement", href: "/comptabilite/rapprochement", icon: ChevronRight, roles: ["GERANT", "COMPTABLE"] },
      { label: "Clôture", href: "/comptabilite/cloture", icon: ChevronRight, roles: ["GERANT"] },
    ],
  },
  {
    label: "Fiscal",
    href: "/fiscal",
    icon: Receipt,
    children: [
      { label: "TVA & Précompte", href: "/fiscal/tva", icon: ChevronRight },
      { label: "IS / MFP", href: "/fiscal/is", icon: ChevronRight },
      { label: "IRPP / Paie", href: "/fiscal/irpp", icon: ChevronRight },
      { label: "Patente & TPU", href: "/fiscal/patente", icon: ChevronRight },
      { label: "Taxes Foncières", href: "/fiscal/foncier", icon: ChevronRight },
      { label: "Retenues à la source", href: "/fiscal/retenues", icon: ChevronRight },
      { label: "Centre des Déclarations", href: "/fiscal/declarations", icon: ChevronRight },
      { label: "Simulateur Global OTR", href: "/fiscal/simulateur", icon: Calculator },
      { label: "Revue Fiscale & CSP", href: "/fiscal/revue-csp", icon: ShieldCheck },
    ],
  },
  {
    label: "Contrôle",
    href: "/controle",
    icon: AlertTriangle,
    children: [
      { label: "Anomalies", href: "/controle/anomalies", icon: ChevronRight },
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
      { label: "Vue générale", href: "/analyse/dashboard", icon: ChevronRight },
      { label: "RFM clients", href: "/analyse/rfm", icon: ChevronRight },
      { label: "Concentration", href: "/analyse/concentration", icon: ChevronRight },
      { label: "Trésorerie", href: "/analyse/tresorerie", icon: ChevronRight },
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
      { label: "Fiche Entreprise (CFE / OTR)", href: "/parametres/entreprise", icon: ChevronRight },
      { label: "Plan de comptes", href: "/parametres/plan-comptes", icon: ChevronRight },
      { label: "Paramètres fiscaux", href: "/parametres/parametres-fiscaux", icon: ChevronRight, roles: ["ADMIN_SYS"] },
      { label: "Utilisateurs", href: "/parametres/utilisateurs", icon: ChevronRight, roles: ["GERANT"] },
      { label: "Sécurité", href: "/parametres/securite", icon: ChevronRight },
    ],
  },
];

// ---------------------------------------------------------------------------
// Composants Navigation
// ---------------------------------------------------------------------------

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { close } = useSidebar();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  // Filtre par rôle côté UI
  if (item.roles && user && !item.roles.includes(user.role)) return null;

  const Icon = item.icon;

  return (
    <Link
      href={item.href as any}
      onClick={() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          close();
        }
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        depth > 0 ? "ml-6 text-xs" : "",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
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
  const { close } = useSidebar();

  // Le groupe est actif si on est sur sa page ou une sous-page
  const isGroupActive = pathname === item.href || pathname.startsWith(item.href + "/");

  // État d'expansion locale (toggle manuel par l'utilisateur)
  const [isExpanded, setIsExpanded] = useState(isGroupActive);

  // Sync automatique : si on navigue vers une sous-page, ouvrir le groupe
  useEffect(() => {
    if (isGroupActive) setIsExpanded(true);
  }, [isGroupActive]);

  if (item.roles && user && !item.roles.includes(user.role)) return null;

  const Icon = item.icon;
  const hasChildren = !!item.children && item.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      // Toggle au lieu de naviguer — empêche la redirection
      e.preventDefault();
      setIsExpanded((prev) => !prev);
    } else if (typeof window !== "undefined" && window.innerWidth < 768) {
      close();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isGroupActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
          />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {item.children!.map((child) => (
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
  const isAdmin = useHasRole("ADMIN_SYS") || user?.isSuperAdmin;
  
  if ((!isCabinet && !isAdmin) || !user || !user.tenants || user.tenants.length <= 1) return null;

  return (
    <div className="px-3 py-2 border-b border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
          {isAdmin ? "Dossier sous audit" : "Dossier client"}
        </p>
        <Link
          href="/cabinet/portefeuille"
          className="text-[10px] font-mono text-[#157A46] hover:underline flex items-center gap-0.5"
          title="Ouvrir le hub portefeuille"
        >
          Hub <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>
      <div className="relative">
        <select
          value={currentTenantId ?? ""}
          onChange={(e) => {
            if (e.target.value) switchTenant(e.target.value);
          }}
          className="w-full appearance-none rounded-md border border-[#E6DEC8] dark:border-[rgba(251,247,236,.2)] bg-white/90 dark:bg-black/40 pl-8 pr-7 py-1.5 text-xs font-medium text-[#0B3D2E] dark:text-[#FBF7EC] shadow-sm hover:bg-white focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
        >
          {user.tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <Building2 className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section de navigation Admin (visible uniquement pour les SuperAdmins)
// ---------------------------------------------------------------------------

const ADMIN_NAV: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "Dashboard Plateforme", href: "/dashboard",           icon: LayoutDashboard },
  { label: "Entreprises Clientes", href: "/admin/tenants",       icon: Building2 },
  { label: "Utilisateurs",         href: "/admin/utilisateurs",  icon: Users },
  { label: "Audit Logs",           href: "/admin/audit-logs",    icon: Activity },
  { label: "Abonnements & Plans",  href: "/admin/abonnements",   icon: CreditCard },
];

function AdminNavSection({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="mt-4 pt-3 border-t border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)]">
      <p className="px-3 mb-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1">
        <ShieldCheck className="h-2.5 w-2.5" />
        Administration
      </p>
      {ADMIN_NAV.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href as any}
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-semibold"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar principale (Drawer sur mobile avec croix, fixe sur desktop)
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Fond sombre transparent avec flou sur mobile quand le menu est ouvert */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden animate-in fade-in"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Barre verticale (Drawer sur mobile, colonne fixe sur desktop) */}
      <aside
        className={cn(
          "sidebar-ledger flex h-screen w-72 md:w-60 shrink-0 flex-col transition-transform duration-300 ease-in-out",
          // Position fixe sur mobile avec z-index élevé, statique sur écran standard (>= md)
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* En-tête : Logo + Bouton Croix (Fermer) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)]">
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) close();
            }}
            className="flex items-center gap-2.5 hover:bg-[rgba(21,122,70,.06)] transition-colors group rounded-md p-1 -ml-1"
            title="Retour à l'accueil"
          >
            {/* Tampon circulaire */}
            <div className="stamp-circle shrink-0" style={{ borderColor: "#157A46", color: "#157A46", width: 32, height: 32, fontSize: 14 }}>
              <span className="font-extrabold">F</span>
            </div>
            <div>
              <span className="font-semibold text-sm text-[#0B3D2E] dark:text-[#FBF7EC]" style={{ fontFamily: "var(--font-hand), cursive" }}>FiscLens</span>
              <span className="text-[10px] font-mono ml-1 text-[#33604C] dark:text-[#BFD8CC] tracking-widest uppercase">Togo</span>
            </div>
          </Link>

          {/* Bouton croix pour fermer / réduire la barre verticale sur mobile */}
          <button
            onClick={close}
            aria-label="Fermer le menu"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-[#E6DEC8] dark:border-[rgba(251,247,236,.2)] text-[#0B3D2E] dark:text-[#FBF7EC] hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
            title="Réduire la page verticale"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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

          {/* ── Section Administration (SuperAdmin uniquement) ── */}
          {(user?.isSuperAdmin || user?.role === "ADMIN_SYS") && (
            <AdminNavSection onClose={close} />
          )}
        </nav>

        {/* Pied de sidebar — utilisateur */}
        {user && (
          <div className="border-t border-[#E6DEC8] dark:border-[rgba(251,247,236,.12)] px-3 py-3">
            {/* Annotation manuscrite de rôle */}
            <div className="margin-note mb-2 text-[10px]">{user.role}</div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                style={{ background: "#157A46", color: "#FDFAF1" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-[#0B3D2E] dark:text-[#FBF7EC]">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) close();
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#B3261E] hover:bg-[rgba(179,38,30,.08)] transition-colors font-mono tracking-wide"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sélecteur de thème clair/sombre
// ---------------------------------------------------------------------------

function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme !== "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Topbar (avec barre de trois lignes / Hamburger sur mobile)
// ---------------------------------------------------------------------------

export function Topbar({ title }: { title?: string }) {
  const { user, expertMode, toggleExpertMode } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header
      className="flex h-14 items-center justify-between px-3 sm:px-6 shrink-0"
      style={{
        background: "#FDFAF1",
        borderBottom: "2px solid #E6DEC8",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #EDE8D9 27px, #EDE8D9 28px)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Barre de trois lignes (Bouton Hamburger) — visible sur mobile */}
        <button
          onClick={toggle}
          aria-label="Ouvrir le menu de navigation"
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-md border border-[#C8BEA8] bg-white/90 text-[#0B3D2E] shadow-sm hover:bg-white active:scale-95 transition-all shrink-0"
          title="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Titre en style chapitre */}
        <h1
          className="text-base font-semibold text-[#0B3D2E] dark:text-[#FBF7EC] truncate"
          style={{ fontFamily: "var(--font-hand), cursive", fontSize: "1.1rem" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Statut réseau */}
        <NetworkStatus />

        {/* Sélecteur clair/sombre */}
        <ThemeToggle />

        {/* Toggle mode expert (cabinet) */}
        {user?.role === "CABINET" && (
          <button
            onClick={toggleExpertMode}
            className={cn(
              "hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              expertMode
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {expertMode ? "Mode expert" : "Mode simple"}
          </button>
        )}

        {/* Calendrier / Notifications */}
        <Link
          href="/calendrier"
          className="relative rounded-full p-1.5 hover:bg-accent transition-colors"
          title="Calendrier des échéances"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </header>
  );
}