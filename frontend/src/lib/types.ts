// API response shapes for crews, scoreboard, and check-ins.

export interface MyCrew {
  id: number
  name: string
  inviteCode: string
  defaultWeeklyTarget: number
  myWeeklyTarget: number
  myCurrentStreak: number
  memberCount: number
}

export interface CrewMember {
  userId: number
  displayName: string
  weeklyTarget: number
  currentStreak: number
}

export interface CrewDetail {
  id: number
  name: string
  inviteCode: string
  defaultWeeklyTarget: number
  createdByUserId: number
  createdAt: string
  members: CrewMember[]
}

export interface ScoreboardRow {
  userId: number
  displayName: string
  xp: number
  currentStreak: number
  checkInCount: number
  weeklyTarget: number
  targetMet: boolean
}

export interface CreatedCrew {
  id: number
  name: string
  inviteCode: string
  defaultWeeklyTarget: number
}

export interface CheckInResult {
  xp: number
  checkInCount: number
  weeklyTarget: number
  targetMet: boolean
  justMet: boolean
}
