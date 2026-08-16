"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "theme-midnight" | "theme-emerald";
export type WallpaperPreset = "none" | "aurora" | "grid" | "particles" | "minimal";

type ThemeContextType = {
  theme: ThemeMode;
  wallpaper: WallpaperPreset;
  wallpaperEnabled: boolean;
  setTheme: (t: ThemeMode) => void;
  setWallpaper: (w: WallpaperPreset) => void;
  setWallpaperEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [wallpaper, setWallpaperState] = useState<WallpaperPreset>("none");
  const [wallpaperEnabled, setWallpaperEnabledState] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("fl_theme_mode") as ThemeMode | null;
    const savedWallpaper = localStorage.getItem("fl_wallpaper") as WallpaperPreset | null;
    const savedEnabled = localStorage.getItem("fl_wallpaper_enabled");

    if (savedTheme) {
      setThemeState(savedTheme);
      applyThemeToDoc(savedTheme);
    } else {
      applyThemeToDoc("dark");
    }

    if (savedEnabled === "true") {
      setWallpaperEnabledState(true);
      if (savedWallpaper && savedWallpaper !== "none") {
        setWallpaperState(savedWallpaper);
      } else {
        setWallpaperState("aurora");
      }
    } else {
      setWallpaperEnabledState(false);
      setWallpaperState("none");
    }
  }, []);

  function applyThemeToDoc(t: ThemeMode) {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "theme-midnight", "theme-emerald");
    if (t !== "light") {
      root.classList.add(t);
    }
  }

  function setTheme(t: ThemeMode) {
    setThemeState(t);
    localStorage.setItem("fl_theme_mode", t);
    applyThemeToDoc(t);
  }

  function setWallpaper(w: WallpaperPreset) {
    setWallpaperState(w);
    localStorage.setItem("fl_wallpaper", w);
    if (w !== "none") {
      setWallpaperEnabledState(true);
      localStorage.setItem("fl_wallpaper_enabled", "true");
    } else {
      setWallpaperEnabledState(false);
      localStorage.setItem("fl_wallpaper_enabled", "false");
    }
  }

  function setWallpaperEnabled(enabled: boolean) {
    setWallpaperEnabledState(enabled);
    localStorage.setItem("fl_wallpaper_enabled", String(enabled));
    if (enabled) {
      if (wallpaper === "none") {
        setWallpaperState("aurora");
        localStorage.setItem("fl_wallpaper", "aurora");
      }
    } else {
      setWallpaperState("none");
      localStorage.setItem("fl_wallpaper", "none");
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        wallpaper,
        wallpaperEnabled,
        setTheme,
        setWallpaper,
        setWallpaperEnabled,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return ctx;
}
