import { useContext } from "react";
import { ThemeContext } from "./context.tsx";

export default function useTheme() {
  return useContext(ThemeContext);
}
