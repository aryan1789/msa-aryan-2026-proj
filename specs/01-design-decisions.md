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
hashing, JWT tokens. (Role-based authorization was later dropped from scope — see D9.)

**Alternatives considered:** Supabase Auth, Clerk, Auth0.

**Why:** A managed provider would handle hashing/auth, but then the security work isn't *mine*
and can't be claimed as the "Security Measures" advanced requirement, which requires my own
implementation plus a write-up. Building it myself also makes auth a deep, genuine talking point
for full-stack interviews (where auth questions are guaranteed). A managed DB only secures
infrastructure; application-level security (hashing, rate limiting, validation) is the
developer's job.

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

---

## D9 — Drop RBAC (role-based authorization) from scope

**Decision:** Do not build a Leader/Member role system. `CrewMembership` keeps `WeeklyTarget` and
`CurrentStreak` but no `Role` field. Access control is limited to **ownership scoping** — a
logged-in user can only act on their own data and the crews they belong to (enforced via the
authenticated user id from the JWT), not a role hierarchy.

**Why:** The "Security Measures" advanced requirement asks for a **minimum of two** measures from
{RBAC, Anti-CSRF, password hashing, data validation, rate limiting}. The project already
implements **three** — password hashing, data validation, and rate limiting — so the requirement
is over-satisfied without RBAC. RBAC is one *optional* item on that menu, not a mandatory
sub-feature. Building a role system purely to tick a box it doesn't need would be scope for no
marking benefit, and the product works as a peer crew without an admin tier. Ownership-scoped
authorization is retained because it's baseline security any multi-user app needs (a user must not
be able to act as another), which is distinct from RBAC and nearly free given the existing JWT.

**Consequence:** supersedes the RBAC mentions in D3 and the earlier weekly plan; the three marked
advanced requirements are **Security Measures, WebSockets, and Docker** (see D4).

---

## D10 — Measure attendance (behaviour), not workout outcomes

**Decision:** A check-in measures *that you showed up and trained*, counted against a weekly
target — not what you did or how much you progressed. No structured exercise/sets/reps/weight
data. `CheckIn.Note` (free text, and made **required**) is the only "what I did" capture, kept as
a light quality signal rather than a workout log.

**The tension considered:** "Someone could show up and make no progress, so counting attendance
feels pointless." Real, but resolved in favour of attendance:

- **Behaviour is the controllable lever.** You can choose to show up; you can't directly choose an
  outcome (strength/weight depend on genetics, diet, sleep, time). Habit design (streaks,
  "don't break the chain") measures behaviour for exactly this reason — for the target user, who
  *flakes*, consistency is the binding constraint, and consistency produces results.
- **The crew is the anti-gaming mechanism.** It's a small group of friends who see each other, so
  phoning it in isn't invisible. Social visibility deters slacking far more than any metric could;
  gaming a commitment device made of your own friends is self-defeating.
- **Measuring real fitness outcomes would recreate Hevy/Strong** — the exact workout-logger model
  D1 rejects. It would balloon scope, dilute the differentiator, and outcomes are slow/noisy/unfair
  to gamify weekly.

**Reframing D1's "outcomes not engagement":** "outcomes" contrasts with *social-feed vanity
metrics*, meaning real behaviour change vs app dopamine — not clinical fitness results. Read that
way, consistent attendance *is* the outcome.

**Consequence:** `WeeklyTarget`/`DefaultWeeklyTarget` are `int` (a session count); `CheckIn.Note`
will be required when that entity is built. Does not affect the `Crew`/`CrewMembership` entities.
