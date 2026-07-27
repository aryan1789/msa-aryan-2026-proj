import { api } from "@/lib/api"
import type {
  MyCrew,
  CrewDetail,
  ScoreboardRow,
  CreatedCrew,
  CheckInResult,
} from "@/lib/types"

export async function listCrews(): Promise<MyCrew[]> {
  const { data } = await api.get<MyCrew[]>("/Crews")
  return data
}

export async function createCrew(
  name: string,
  defaultWeeklyTarget: number,
): Promise<CreatedCrew> {
  const { data } = await api.post<CreatedCrew>("/Crews", { name, defaultWeeklyTarget })
  return data
}

export async function joinCrew(inviteCode: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/Crews/join", { inviteCode })
  return data
}

export async function getCrew(id: number): Promise<CrewDetail> {
  const { data } = await api.get<CrewDetail>(`/Crews/${id}`)
  return data
}

export async function getScoreboard(id: number): Promise<ScoreboardRow[]> {
  const { data } = await api.get<ScoreboardRow[]>(`/Crews/${id}/scoreboard`)
  return data
}

export async function checkIn(crewId: number, note: string): Promise<CheckInResult> {
  const { data } = await api.post<CheckInResult>(`/Crews/${crewId}/check-ins`, { note })
  return data
}

export async function leaveCrew(crewId: number): Promise<void> {
  await api.delete(`/Crews/${crewId}/membership`)
}

interface CheckInsWeek {
  checkIns: { id: number; occurredAt: string; dayKey: string; note: string }[]
}

// Returns true if the current user already checked in on today's NZ calendar
// day, so the crew screen can render "Checked in today" across refreshes.
export async function hasCheckedInToday(crewId: number): Promise<boolean> {
  const { data } = await api.get<CheckInsWeek>(`/Crews/${crewId}/check-ins`)
  const nzToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
  }).format(new Date())
  return data.checkIns.some((c) => c.dayKey === nzToday)
}
