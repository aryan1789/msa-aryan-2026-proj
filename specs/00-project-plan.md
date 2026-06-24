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

1. **Security** — custom JWT authentication, BCrypt password hashing, RBAC (Leader vs Member),
   rate limiting, input validation
2. **WebSockets** — SignalR hub powering the live shared scoreboard
3. **Docker** — `docker-compose` running API + frontend + PostgreSQL

Also being built (for learning / CV, not the marked three): multiplayer (emergent from the
crew + real-time design), Zustand state management, light/dark theme switching, Cypress E2E,
logging/metrics/performance, caching. Storybook if time allows.

## Data model (EF Core entities)

- **User** — Id, Email, DisplayName, PasswordHash, CreatedAt, TotalXp
- **Crew** — Id, Name, InviteCode, DefaultWeeklyTarget, CreatedByUserId, CreatedAt
- **CrewMembership** — Id, CrewId, UserId, Role (Leader | Member), WeeklyTarget, CurrentStreak
- **CheckIn** — Id, UserId, CrewId, OccurredAt, WeekKey, Note
- **WeeklyResult** — Id, MembershipId, WeekKey, TargetMet, CheckInCount
- **Achievement** / **UserAchievement** — badge definitions and unlocks

## Weekly breakdown (~5.5 weeks)

- **Week 0** — Repo + scaffolding (.NET backend, React frontend, Tailwind, shadcn), Docker +
  deploy skeleton, CI. *(in progress)*
- **Week 1** — Auth + security foundation (JWT, hashing, RBAC, rate limiting), Scalar docs
- **Week 2** — Crews, memberships, check-in CRUD with RBAC; frontend shell
- **Week 3** — SignalR live scoreboard + gamification engine (XP, streaks, weekly tally)
- **Week 4** — Visual identity / polish, dark mode, badges UI, responsive, begin Cypress
- **Week 5** — Testing, stretch features (logging/metrics, caching), production deploy
- **Week 5.5** — README, finalise /specs, record video, submit

## Guiding principle

Deploy end-to-end early (Week 0) so deployment never becomes a last-week crisis. Commit
frequently. Protect the basic requirements (responsive UI, tests, Scalar, regular commits) —
neglecting any one is an instant fail. Breadth features are additive and never block the core.
