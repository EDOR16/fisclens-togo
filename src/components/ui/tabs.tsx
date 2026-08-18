"use client";

import * as React from "react";

const TabsContext = React.createContext<{
  value: string;
  onValueChange?: (value: string) => void;
} | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>");
  }
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  className = "",
  children,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={className}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = "",
  onClick,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { value: active, onValueChange } = useTabsContext();
  const isActive = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={[
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#0B3D2E] text-[#FBF7EC] shadow-sm"
          : "bg-white text-slate-600 hover:bg-slate-100",
        className,
      ].join(" ")}
      onClick={() => {
        onClick?.();
        onValueChange?.(value);
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active } = useTabsContext();
  if (value !== active) return null;

  return (
    <div
      role="tabpanel"
      data-state={value === active ? "active" : "inactive"}
      className={className}
    >
      {children}
    </div>
  );
}
