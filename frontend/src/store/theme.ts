import { create } from "zustand"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

// Resolve the theme the same way the inline boot script in index.html does:
// a stored choice wins; otherwise fall back to the OS preference. Keeping the
// two in sync is what prevents a flash of the wrong theme on first paint.
function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Toggle the `.dark` class on <html>, matching the `&:is(.dark *)` custom
// variant so every semantic token re-resolves.
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: resolveInitialTheme(),
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
}))
