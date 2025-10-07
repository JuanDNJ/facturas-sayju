import { useEffect, useMemo, useState } from "react";
import type { Theme } from "./types";
import { ThemeContext } from "./context";

const THEME_KEY = "appTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const root = document.documentElement;
    root.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme: setThemeState }), [theme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
