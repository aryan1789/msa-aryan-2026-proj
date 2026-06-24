# Design Decisions

A log of significant decisions and the reasoning behind them. This feeds the "design
decisions" portion of the submission video.

---

## D1 — Project concept: gym accountability "commitment device"

**Decision:** Build a gym app where friend-crews commit to a weekly training target and see
each other's progress on a live scoreboard, with visible consequences for missing.

**Alternatives considered:** solo habit/study tracker, hiking log, indoor-climbing progression
tracker, quiz battle app, job-application RPG.

**Why:** It's a personal interest (genuine motivation + a better demo), and the "commitment
device" angle is a real gap. Apps like Hevy/Strong have social *feeds* but no accountability —
flaking has no consequence. Targeting outcomes instead of engagement is a differentiator that's
easy to explain and memorable to a marker. It also makes the advanced features *load-bearing*
rather than bolted on (see D4).

---

## D2 — Database: PostgreSQL

**Decision:** PostgreSQL via EF Core.

**Why:** Free, open-source, first-class Azure support (Azure DB for PostgreSQL), and excellent
EF Core integration. Relational data (users, crews, memberships, check-ins) maps cleanly to a
SQL schema. Using EF Core's LINQ queries (not raw SQL) also gives parameterised queries for
free, mitigating SQL injection.

---

## D3 — Authentication: custom JWT in .NET (not a managed auth provider)

**Decision:** Build authentication in the .NET backend — register/login, BCrypt password
hashing, JWT tokens, RBAC roles.

**Alternatives considered:** Supabase Auth, Clerk, Auth0.

**Why:** A managed provider would handle hashing/RBAC, but then the security work isn't *mine*
and can't be claimed as the "Security" advanced feature, which requires my own implementation
plus a write-up. Building it myself also makes auth a deep, genuine talking point for full-stack
interviews (where auth questions are guaranteed). A managed DB only secures infrastructure;
application-level security (hashing, RBAC, rate limiting, validation) is the developer's job.

---

## D4 — The three marked advanced features: Security, WebSockets, Docker

**Decision:** Headline Security + WebSockets + Docker for marking (build others unmarked).

**Why (full-stack lean):** These three tell a complete full-stack story in one sentence — "a
real-time app with proper auth, containerised for deployment." Security gives the deepest
interview material; WebSockets prove I can build interactive features beyond CRUD; Docker shows
I understand delivery. Critically, all three are *load-bearing* in this product: the scoreboard
genuinely needs real-time (WebSockets), and the crew design gives multiplayer for free.

---

## D5 — Frontend styling: Tailwind + shadcn/ui

**Decision:** Tailwind CSS with shadcn/ui (on Radix primitives).

**Alternatives considered:** Mantine, MUI.

**Why:** Tailwind is the most in-demand styling skill and gives full control over a unique
visual identity (which the marking rewards). shadcn copies component *source* into the project
(I own and customise it) rather than being a black-box dependency. MUI risks looking generic;
Mantine is faster but less custom. Chose the option with the best learning + CV value.

---

## D6 — Deployment: Azure

**Decision:** Deploy to Azure (Container Apps for the API, Static Web Apps for the frontend,
Azure DB for PostgreSQL). Render + Vercel + Supabase kept as a documented fallback.

**Why:** It's a Microsoft programme, so Azure is the strongest CV signal, and deploying a Docker
image to the cloud is real, valuable DevOps learning. Trade-off accepted: more setup and credit
management than the easier Render/Vercel path.

---

## D7 — Backend project structure: simple two-project solution

**Decision:** Start with one Web API project + one xUnit test project in a single solution,
rather than a layered (Domain/Infrastructure/Application) architecture.

**Why:** Lower cognitive overhead while learning .NET, and adequate for the project's scope.
Keeping the test project separate (the .NET convention) ensures test-framework dependencies
never ship to production. Can refactor toward layered architecture later if useful.

---

## D8 — Tailwind v4 with cascade layers (lesson learned during setup)

**Decision / lesson:** Keep `index.css` minimal (`@import "tailwindcss";`) and avoid stray
unlayered CSS.

**Why:** During setup, Tailwind utility classes appeared to do nothing. Root cause: Tailwind v4
places its utilities inside CSS cascade layers, and *unlayered* CSS always beats layered CSS
regardless of specificity. Leftover template CSS (`h1 { color: ... }`) was silently overriding
every Tailwind class. Understanding cascade layers fixed it. (Documented in the AI usage log.)
