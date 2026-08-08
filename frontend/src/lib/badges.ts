// Display metadata for the achievement codes the API awards. Keyed by the same
// code strings the backend stores, so the scoreboard and unlock toasts can look
// up a name and icon.
export interface Badge {
  name: string
  icon: string
  description: string
}

export const BADGES: Record<string, Badge> = {
  "first-rep": {
    name: "First Rep",
    icon: "🌱",
    description: "Logged your first check-in",
  },
  "on-target": {
    name: "On Target",
    icon: "🎯",
    description: "Hit your weekly target",
  },
  "iron-month": {
    name: "Iron Month",
    icon: "🏆",
    description: "Four weeks on target in a row",
  },
  comeback: {
    name: "Comeback",
    icon: "⚡",
    description: "Hit target after a broken week",
  },
}

export function badgeName(code: string): string {
  return BADGES[code]?.name ?? code
}
