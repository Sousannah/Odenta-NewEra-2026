import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "odenta.site-theme";

/* Mirrors `--s-bg` in site.css — the canvas behind overscroll and the phone's status bar. */
const CANVAS = { light: "#f3f6fa", dark: "#030a14" };

const ThemeContext = createContext(null);

function readStored() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Light / dark for the public site only.
 *
 * Follows the operating system until the visitor picks one, then remembers the
 * choice. The class goes on the site root rather than `<html>`, so the portals
 * — which have no dark theme — are never affected by a visitor's preference.
 */
export function SiteThemeProvider({ children }) {
  const [chosen, setChosen] = useState(() => (typeof window === "undefined" ? null : readStored()));
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystem(event.matches ? "dark" : "light");
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  const theme = chosen ?? system;

  /* the page canvas and the browser chrome follow the theme while the site is mounted */
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.backgroundColor;
    root.style.backgroundColor = CANVAS[theme];
    const meta = document.querySelector('meta[name="theme-color"]');
    const previousMeta = meta?.getAttribute("content");
    meta?.setAttribute("content", CANVAS[theme]);
    return () => {
      root.style.backgroundColor = previous;
      if (meta && previousMeta) meta.setAttribute("content", previousMeta);
    };
  }, [theme]);

  const setTheme = useCallback((next) => {
    setChosen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the choice simply lasts for this visit */
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useSiteTheme must be used inside <SiteThemeProvider>");
  return ctx;
}
