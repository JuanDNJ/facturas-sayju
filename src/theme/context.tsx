import { createContext } from "react";
import type { Theme } from "./types";

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", setTheme: () => {} });
