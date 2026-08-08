import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ScoreboardRowCard } from "@/components/ScoreboardRowCard"
import type { ScoreboardRow } from "@/lib/types"

function makeRow(overrides: Partial<ScoreboardRow> = {}): ScoreboardRow {
  return {
    userId: 1,
    displayName: "Ada Lovelace",
    xp: 120,
    currentStreak: 0,
    checkInCount: 1,
    weeklyTarget: 3,
    targetMet: false,
    badges: [],
    ...overrides,
  }
}

// Render a row inside an <ol> so the <li> has a valid parent.
function renderRow(row: ScoreboardRow, rank = 1, isMe = false) {
  return render(
    <ol>
      <ScoreboardRowCard row={row} rank={rank} isMe={isMe} />
    </ol>,
  )
}

// A tick is "filled" when it does not carry the empty (bg-muted) class.
function tickCounts(container: HTMLElement) {
  const ticks = within(container)
    .getByTestId("progress-ticks")
    .querySelectorAll("span")
  const filled = Array.from(ticks).filter((t) => !t.className.includes("bg-muted"))
  return { total: ticks.length, filled: filled.length }
}

describe("ScoreboardRowCard", () => {
  it("shows the numeric streak only when currentStreak > 0", () => {
    const { rerender } = renderRow(makeRow({ currentStreak: 0 }))
    // xp 120, count 1/3 — no lone "4" anywhere when streak is 0.
    expect(screen.queryByText("4")).not.toBeInTheDocument()

    rerender(
      <ol>
        <ScoreboardRowCard row={makeRow({ currentStreak: 4 })} rank={1} isMe={false} />
      </ol>,
    )
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("renders weeklyTarget ticks with checkInCount filled", () => {
    const { container } = renderRow(makeRow({ checkInCount: 2, weeklyTarget: 4 }))
    expect(tickCounts(container)).toEqual({ total: 4, filled: 2 })
  })

  it("caps filled ticks at weeklyTarget when over target", () => {
    const { container } = renderRow(makeRow({ checkInCount: 9, weeklyTarget: 3 }))
    expect(tickCounts(container)).toEqual({ total: 3, filled: 3 })
  })

  it("flips the status badge when targetMet changes", () => {
    const { rerender } = renderRow(
      makeRow({ checkInCount: 1, weeklyTarget: 3, targetMet: false }),
    )
    expect(screen.getByText(/1\/3 · In Progress/)).toBeInTheDocument()
    expect(screen.queryByText(/target met/i)).not.toBeInTheDocument()

    rerender(
      <ol>
        <ScoreboardRowCard
          row={makeRow({ checkInCount: 3, weeklyTarget: 3, targetMet: true })}
          rank={1}
          isMe={false}
        />
      </ol>,
    )
    expect(screen.getByText(/target met/i)).toBeInTheDocument()
    expect(screen.queryByText(/in progress/i)).not.toBeInTheDocument()
  })

  it("renders a chip for each earned badge", () => {
    renderRow(makeRow({ badges: ["first-rep", "on-target"] }))
    expect(screen.getByLabelText("First Rep")).toBeInTheDocument()
    expect(screen.getByLabelText("On Target")).toBeInTheDocument()
    expect(screen.queryByLabelText("Comeback")).not.toBeInTheDocument()
  })

  it("shows the 'You' marker only when isMe", () => {
    const { rerender } = renderRow(makeRow(), 2, false)
    expect(screen.queryByText(/^you$/i)).not.toBeInTheDocument()

    rerender(
      <ol>
        <ScoreboardRowCard row={makeRow()} rank={2} isMe={true} />
      </ol>,
    )
    expect(screen.getByText(/^you$/i)).toBeInTheDocument()
  })
})
