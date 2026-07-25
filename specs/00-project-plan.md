# Project Plan

## The product

A **gym accountability app** (working name: *CrewForge*). Small friend-crews commit to a
weekly training target, and a **live shared scoreboard** makes each member's progress — and
failures — visible to the whole crew in real time.

### The insight

Existing fitness apps (Hevy, Strong) celebrate success with a passive social *feed* — "look
what I did." But nobody is *counting on you*; flaking has no consequence. CrewForge is a
**commitment device**: the crew sets a weekly target, and missing it shows up as a visible red
mark on a shared scoreboard. It optimises for *outcomes*, not engagement.

## How it fits the theme (Gamification)

Game mechanics are core to the product, not bolted on:

- **Points / XP** — earned per check-in, with a bonus for hitting the weekly target
- **Streaks** — consecutive weeks meeting the target
- **Badges / achievements** — first check-in, 4-week streak, perfect month, "comeback" (target
  met after a broken week)
- **Leaderboard** — crew members ranked by XP / streak
- **Progress tracking** — live weekly progress bars and a kept/broken history

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | C# / .NET 10, ASP.NET Core Web API, EF Core |
| Database | PostgreSQL |
| API docs | Scalar (required instead of Swagger UI) |
| Frontend | React + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| State | Zustand |
| Routing | React Router |
| Real-time | SignalR (WebSockets) |
| Tests | xUnit (backend), Vitest + React Testing Library (frontend), Cypress (E2E) |
| Deployment | Azure (Container Apps + Static Web Apps + Azure DB for PostgreSQL) |

## Advanced requirements

The assessment marks the **top 3** listed advanced features. These are chosen to tell a strong
**full-stack** story:

1. **Security** — custom JWT authentication, BCrypt password hashing, rate limiting, input
   validation (satisfies the "minimum two security measures" advanced requirement — see D9)
2. **WebSockets** — SignalR hub powering the live shared scoreboard
3. **Docker** — `docker-compose` running API + frontend + PostgreSQL

Also being built (for learning / CV, not the marked three): multiplayer (emergent from the
crew + real-time design), Zustand state management, light/dark theme switching, Cypress E2E,
logging/metrics/performance, caching. Storybook if time allows.

## Data model (EF Core entities)

- **User** — Id, Email, DisplayName, PasswordHash, CreatedAt, TotalXp
- **Crew** — Id, Name, InviteCode, DefaultWeeklyTarget, CreatedByUserId, CreatedAt
- **CrewMembership** — Id, CrewId, UserId, WeeklyTarget, CurrentStreak, **Xp** *(Xp to be added — per-crew
  so the crew leaderboard ranks correctly; global `User.TotalXp` mixes crews)*
- **CheckIn** — Id, **MembershipId**, OccurredAt, WeekKey, Note *(built; MembershipId-based, not
  UserId/CrewId — ties a check-in to one membership)*
- **WeeklyResult** — Id, MembershipId, WeekKey, TargetMet, CheckInCount *(to build — the per-week tally
  the scoreboard reads)*
- **Achievement** / **UserAchievement** — badge definitions and unlocks *(stretch; first to cut)*

---

## Current status — 2026-07-18 (14 days to submission, target 2026-08-01)

Honest snapshot. The original ~5.5-week schedule slipped; the plan below is the compressed,
risk-first run to submission.

**Done**
- Backend security foundation: JWT auth, BCrypt hashing, rate limiting, Scalar docs — all wired in
  `Program.cs`. (Marked feature **Security** effectively complete.)
- Crews/memberships API: create, join, list, detail, leave — all ownership-scoped (D9).
- `CheckIn` entity + migration.

**Not started / incomplete (the 14-day workload)**
- ❌ Check-in endpoints + the gamification engine (XP, streaks, weekly tally) — the assignment
  **theme**.
- ❌ SignalR live scoreboard — marked feature **WebSockets**; no hub exists.
- ❌ Frontend — effectively 0%. Only Tailwind installed; no router, state, HTTP client, SignalR
  client, or test runner.
- ⚠️ **Tests** — the xUnit project exists but has **zero test files**. Tests are a *basic
  requirement*: empty = instant fail. Must not reach submission empty.
- ⚠️ Docker — marked feature; compose only runs Postgres, API + frontend not containerised.
- ❌ **Deploy to Azure** — no CI, no Azure config. Highest-risk item; de-risk early.

## Non-negotiables (protect these or fail regardless of feature count)

- **Tests exist and pass** (backend xUnit at minimum; frontend Vitest if time).
- **Responsive UI**, **Scalar docs** (✅), **regular commits**, a **deployed working app**.
- The three marked advanced features functional: **Security** (✅), **WebSockets**, **Docker**.
- The **Gamification theme** visibly present: XP, streaks, a live leaderboard/scoreboard.

## 14-day execution plan (2026-07-18 → submit 2026-08-01)

Risk-first: de-risk deploy early, land the backend engine, then spend the bulk on the frontend
(the demo), then containerise, deploy, harden, document. Each phase has a **Definition of Done**
and a **cut line** for when it runs long. Commit at every DoD.

### Phase 1 — Days 1–2 (Jul 18–19): Gamification engine (backend)
- Lock decisions **D11** (`WeekKey`: ISO-Monday + timezone), **D12** (XP formula), **D13** (streak
  semantics: per-crew, advance-on-target-met, break via lazy settle-on-read).
- Build `WeeklyResult` entity + migration; add `CrewMembership.Xp` + migration.
- `CheckInsController` (`Crews/{crewId:int}/check-ins`): `POST`, `GET`, `DELETE`, ownership-scoped
  (resolve caller's membership; non-member → generic `404`). `Note` required (D10); `OccurredAt`/
  `WeekKey` server-derived.
- Extract a `ScoringService`: on each check-in, upsert the `WeeklyResult` tally, award per-check-in
  XP + a one-time target-met bonus. Wrap tally-upsert + XP in a transaction; handle the
  `(MembershipId, WeekKey)` unique-violation like `Join` does.
- **DoD:** check in via Scalar → `WeeklyResult` increments, `Xp` rises, target-met bonus pays once.
- **Cut line:** badges deferred to Phase 8; streak *break* is Phase 2's lazy-settle, not here.

### Phase 2 — Real-time + Docker smoke test (done)
- SignalR hub with per-crew groups; emit updated scoreboard state after a committed check-in. ✅
- `GET /Crews/{id}/scoreboard` read endpoint with **lazy streak settle** (streak recomputed live
  from met-week history on read). ✅
- **Docker/CORS scaffolding + local container smoke test:** API `Dockerfile` written; `docker build`
  + run the container against compose Postgres to prove the **Docker marked feature** works locally.
- **Deploy re-sequenced:** the full **Azure cloud deploy moved to Phase 7** (de-risk trade accepted —
  see note there). Deferring is safe: the frontend talks to `localhost` in dev, so no later phase is
  blocked by the API not being on the cloud yet.
- **DoD:** a websocket client sees a live push on check-in ✅; the container builds and runs locally.

### Phase 3 — Days 4–5 (Jul 21–22): Backend tests + frontend foundation
- **Kill the instant-fail:** xUnit tests for the scoring logic (tally increments, target-met bonus
  pays once, ownership `404`, `WeekKey` derivation). This makes the test project non-empty and
  covers the highest-value logic.
- Frontend deps + shell: React Router, Zustand, an HTTP client with JWT bearer attach, SignalR
  client, Vitest + Testing-Library. Layout/nav skeleton.
- Auth pages (register/login) wired to `AuthController`; token stored; protected routes.
- **DoD:** backend tests green; can register, log in, and land on an authenticated shell.

### Phase 4 — Days 6–8 (Jul 23–25): Frontend core + live scoreboard
- Crews: list, create, join, detail views calling the existing endpoints.
- Check-in action from the UI.
- Scoreboard view: weekly progress bars, streaks, XP, kept/broken history — subscribed to SignalR
  for live updates.
- **DoD:** check in from the UI and watch the scoreboard update live — ideally in two browser
  windows (the multiplayer/real-time demo moment).
- **Cut line:** kept/broken *history* view is trimmable; live current-week scoreboard is not.

### Phase 5 — Days 9–10 (Jul 26–27): Visual identity, theme, responsive, frontend tests
- Distinct Tailwind visual identity (marking rewards a unique look, not generic shadcn defaults).
- Light/dark theme toggle; responsive across mobile→desktop breakpoints.
- Vitest + RTL component tests for a few key components/flows.
- **DoD:** looks intentional, works at mobile width, theme toggles, frontend tests green.
- **Cut line:** Cypress E2E is stretch — one happy-path spec (register→create crew→check in) only
  if ahead.

### Phase 6 — Day 11 (Jul 28): Docker (marked feature)
- Extend `docker-compose` to run **API + frontend + Postgres** together; Dockerfiles for API and
  frontend; wire env/config.
- **DoD:** `docker compose up` brings the full stack up and the app works end-to-end locally.

### Phase 7 — Day 12 (Jul 29): Production deploy (full stack)
- Deploy frontend (Azure Static Web Apps) + API (Container Apps, reusing the Phase 2 Dockerfile) +
  Azure DB for PostgreSQL; put `Jwt:SigningKey` + connection string in Azure secrets (real key, not
  the dev one); add the deployed frontend origin to `Cors:AllowedOrigins`; run `ef database update`
  against cloud Postgres; smoke-test the live app.
- **Risk note (deploy was de-risked late):** the Phase 2 deploy skeleton was traded for a local
  container smoke test, so the *first* real cloud deploy happens here with limited runway. Mitigate:
  (1) confirm Azure subscription + credits are active **before** this day — it's the failure mode
  with no workaround; (2) the container already builds/runs locally, so image bugs are ruled out;
  (3) Day 13 is the hard buffer.
- **Cut line:** if Azure fights back more than a few hours, take the documented Render + Supabase
  fallback (D6) — a working deployed link matters more than it being on Azure.
- **DoD:** the deployed app is usable end-to-end (register → crew → check in → live scoreboard).

### Phase 8 — Day 13 (Jul 30): Buffer / bug bash / stretch
- Full playthrough on the deployed app; fix what breaks. Verify rate limiting (security measure).
- **Only if genuinely ahead:** badges/achievements, logging/metrics, caching.
- **DoD:** a clean happy-path playthrough on production with no blocking bugs.

### Phase 9 — Day 14 (Jul 31): Documentation + video + submit (Aug 1)
- README (run/deploy instructions), finalise `/specs` (decisions D11–D13, AI usage log), record the
  demo video, submit.
- **DoD:** submitted with a working deployed link, tests passing, and complete specs.

## Guiding principle

The original "deploy early" principle was missed, and the Phase 2 deploy skeleton was later traded
for a local container smoke test to keep feature momentum — so the **cloud deploy is the single
biggest late risk (Phase 7); confirm Azure access/credits early, and keep the test project
non-empty (Phase 3) before any polish.** Commit at every Definition of Done. Protect the non-negotiables above; every badge, animation, or stretch feature is cut
before any non-negotiable slips. When a phase runs long, take its cut line rather than stealing
from a later phase.
