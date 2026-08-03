import { Moon, Sun } from "lucide-react"
import { useThemeStore } from "@/store/theme"

// Light/dark switch. Lives in the permanently-dark Crew Forge header, so it's
// styled against header tokens rather than the shadcn Button (whose light-mode
// border would vanish on the dark bar). Icon shows the theme you'll switch to.
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const next = theme === "dark" ? "light" : "dark"

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex size-8 items-center justify-center border border-header-border text-header-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-header"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
