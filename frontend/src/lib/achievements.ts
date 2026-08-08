import { api } from "@/lib/api"
import type { EarnedAchievement } from "@/lib/types"

export async function getMyAchievements(): Promise<EarnedAchievement[]> {
  const { data } = await api.get<EarnedAchievement[]>("/Achievements")
  return data
}
