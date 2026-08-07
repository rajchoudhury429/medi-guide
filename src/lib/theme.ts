export type ThemeMode = "light" | "dark";

const KEY = "mediguide-theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return (window.localStorage.getItem(KEY) as ThemeMode | null) ?? "light";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
  window.localStorage.setItem(KEY, mode);
}
