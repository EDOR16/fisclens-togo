"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "theme-midnight" | "theme-emerald";
export type WallpaperPreset = "aurora" | "grid" | "particles" | "minimal";

type ThemeContextType = {
  theme: ThemeMode;
  wallpaper: WallpaperPreset;
  setTheme: (t: ThemeMode) => void;
  setWallpaper: (w: WallpaperPreset) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [wallpaper, setWallpaperState] = useState<WallpaperPreset>("aurora");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("fl_theme_mode") as ThemeMode | null;
    const savedWallpaper = localStorage.getItem("fl_wallpaper") as WallpaperPreset | null;

    if (savedTheme) {
      setThemeState(savedTheme);
      applyThemeToDoc(savedTheme);
    } else {
      applyThemeToDoc("dark");
    }

    if (savedWallpaper) {
      setWallpaperState(savedWallpaper);
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
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, wallpaper, setTheme, setWallpaper, toggleTheme }}>
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
