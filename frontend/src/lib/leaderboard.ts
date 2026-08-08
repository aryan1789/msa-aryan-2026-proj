import { api } from "@/lib/api"
import type { CrewLeaderboardRow } from "@/lib/types"

export async function getLeaderboard(): Promise<CrewLeaderboardRow[]> {
  const { data } = await api.get<CrewLeaderboardRow[]>("/Leaderboard")
  return data
}
