import { useEffect, useState } from "react"
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { getScoreboard } from "@/lib/crews"
import { apiErrorMessage, API_BASE_URL } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import type { ScoreboardRow } from "@/lib/types"

// Ranking rule shared by the server and the live merge: XP desc, then streak
// desc. Keeping it identical means a re-sort after a live push produces the
// same order the server would.
function rank(rows: ScoreboardRow[]): ScoreboardRow[] {
  return [...rows].sort((a, b) => b.xp - a.xp || b.currentStreak - a.currentStreak)
}

export interface UseScoreboard {
  rows: ScoreboardRow[] | null
  error: string | null
  live: boolean
  /** Re-pull the whole board from the API (fallback when the socket is down). */
  refresh: () => Promise<void>
}

export function useScoreboard(crewId: number): UseScoreboard {
  const [rows, setRows] = useState<ScoreboardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  function mergeRow(row: ScoreboardRow) {
    setRows((prev) => {
      const others = (prev ?? []).filter((r) => r.userId !== row.userId)
      return rank([...others, row])
    })
  }

  async function refresh() {
    try {
      const data = await getScoreboard(crewId)
      setRows(rank(data))
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load the scoreboard."))
    }
  }

  // Initial board state from a plain fetch — independent of the realtime layer.
  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError(null)
    getScoreboard(crewId)
      .then((data) => {
        if (!cancelled) setRows(rank(data))
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load the scoreboard."))
      })
    return () => {
      cancelled = true
    }
  }, [crewId])

  // SignalR connection: join the crew group, merge pushes, re-join on
  // reconnect, and tear down cleanly (StrictMode double-mounts this in dev).
  useEffect(() => {
    let cancelled = false

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/scoreboard`, {
        accessTokenFactory: () => useAuthStore.getState().token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on("scoreboardUpdated", (row: ScoreboardRow) => {
      mergeRow(row)
    })

    // Auto-reconnect rejoins the connection but not the group — re-join so
    // pushes keep flowing.
    connection.onreconnected(() => {
      connection.invoke("JoinCrew", crewId).catch(() => {})
    })

    connection.onclose(() => {
      if (!cancelled) setLive(false)
    })

    // Keep a handle on the start sequence so cleanup can wait for it to settle
    // before stopping. Calling stop() mid-negotiation (which StrictMode's
    // double-mount provokes in dev) throws "stopped during negotiation"; waiting
    // for start to finish first avoids that and guarantees a clean teardown.
    const started = connection
      .start()
      .then(async () => {
        if (cancelled) return
        await connection.invoke("JoinCrew", crewId)
        if (!cancelled) setLive(true)
      })
      .catch(() => {
        if (!cancelled) setLive(false)
      })

    return () => {
      cancelled = true
      setLive(false)
      started.finally(() => {
        if (connection.state === HubConnectionState.Connected) {
          connection
            .invoke("LeaveCrew", crewId)
            .catch(() => {})
            .finally(() => connection.stop().catch(() => {}))
        } else {
          connection.stop().catch(() => {})
        }
      })
    }
  }, [crewId])

  return { rows, error, live, refresh }
}
