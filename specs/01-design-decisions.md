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

---

## D11 — `WeekKey` is derived in `Pacific/Auckland`, not UTC

**Decision:** A check-in's `WeekKey` (and `DayKey`) is computed by converting its UTC instant to
`Pacific/Auckland` local time, then taking the calendar date (and, for the week, that date's
**Monday**). The timezone is a single hard-coded app constant (`WeekKeys` helper), not per-user and
not detected.

**Why:** The whole product is "did you hit your Monday–Sunday weekly target," so the week boundary
must match how users experience days. New Zealand is UTC+12/+13, which means **UTC midnight is NZ
*noon*** — keying weeks off UTC would roll the week over at Monday lunchtime and split every Monday
across two weeks. That's not a rare edge; it's visibly wrong for an all-NZ user base. Evaluating the
boundary in `Pacific/Auckland` costs one constant and makes weeks roll at NZ midnight Monday.

**Note:** use the **IANA** id `"Pacific/Auckland"` (not the Windows `"New Zealand Standard Time"`)
so it resolves on both the Windows dev box and the Linux deploy target via .NET's ICU. Per-user
timezones were considered and rejected as scope the assignment doesn't need.

---

## D12 — XP formula: 10 per check-in, 50 target-met bonus

**Decision:** Each check-in awards **10 XP**. The check-in that first takes a member's weekly count
to their `WeeklyTarget` awards a **one-time 50 XP bonus** (paid once per week, on the
`false → true` transition). XP lives on `CrewMembership.Xp` (per-crew), not global `User.TotalXp`,
so a crew leaderboard ranks members within that crew.

**Why:** Small, round, explainable numbers make the gamification legible on the demo video and on
the leaderboard, and the bonus (5× a single check-in) makes *hitting the target* — the behaviour the
product wants — clearly worth more than just showing up. Deleting a check-in reverses this
symmetrically (−10, and −50 if the week drops back below target).

---

## D13 — One check-in per day maximum

**Decision:** A member may record **at most one check-in per calendar day** (in the D11 timezone),
enforced by a unique index on `CheckIn (MembershipId, DayKey)`. A second same-day attempt returns
`409 Conflict`. Multiple check-ins across *different* days in a week all count toward the weekly
target.

**Why:** A check-in models *attendance for the day's session* (D10), so one per day is the honest
unit — it stops a member inflating their weekly count by tapping the button repeatedly. Enforcing it
at the DB level (unique index) rather than in code makes it race-safe for free, matching the
invite-code and join patterns.

**Consequence:** hitting a weekly target of N requires N distinct days, so it can't be demoed in a
single sitting — demo crews should use a low `DefaultWeeklyTarget` (1–2) or seed prior-day
check-ins.

---

## D14 — Full-stack Docker Compose: same-origin, and migrate on startup

**Decision:** One `docker compose up --build` brings up Postgres, the API, and the frontend
together. The frontend is a multi-stage image (Node build → nginx serving the static bundle),
and locally nginx reverse-proxies `/Auth`, `/Crews`, `/hubs` to the API so the browser only ever
talks to one origin. The API applies EF migrations on startup, but only when a `RUN_MIGRATIONS`
env flag is set (compose sets it; a plain local `dotnet run` does not).

**Why:** A single command that stands the whole app up is the point of the Docker requirement,
and same-origin (via the nginx proxy) sidesteps CORS entirely for the container path — which
mattered because, on Docker Desktop for Windows, a browser Origin that equals a published host
port has its `Access-Control-Allow-Origin` header dropped by the host proxy, so CORS could not
be made to work locally regardless of config. Guarding the startup migration behind a flag keeps
the container self-initialising (no manual `database update` step) without changing the local dev
workflow, where migrations are still applied by hand.

**Consequence:** the JWT signing key moves to a gitignored `.env` (compose reads it); the one
nginx config has to work both in compose (where the `api` hostname resolves) and, later, in the
cloud (where it doesn't) — see D15.

---

## D15 — Cloud topology: two Container Apps, not Static Web Apps (updates D6)

**Decision:** On Azure, both the API and the frontend run as **Azure Container Apps** in one
environment, backed by **Azure Database for PostgreSQL Flexible Server**. Images are built
locally with Docker and pushed to Azure Container Registry, then rolled out. The frontend (built
with an absolute `VITE_API_URL`) talks to the API cross-origin over real CORS.

**Why (forced by the Azure for Students subscription):** the original plan (D6) put the frontend
on Azure Static Web Apps. Two subscription limits changed that: (1) a region policy restricts
this subscription to Australia East, where Static Web Apps isn't offered, and the other SWA
regions are policy-blocked; (2) ACR Tasks (cloud image builds) are disabled on student
subscriptions, so `az containerapp up --source` can't build in the cloud. Containerising the
frontend and pushing pre-built images works around both and keeps the whole app on Azure.
Cross-origin CORS is fine here because the Docker Desktop host-proxy quirk (D14) doesn't exist in
the cloud.

**Two production correctness fixes this surfaced:**
- **Forwarded headers.** Container Apps terminates TLS at the ingress and forwards HTTP to the
  container, so `UseHttpsRedirection` would loop. The API now honours `X-Forwarded-Proto` via
  `ForwardedHeaders` middleware.
- **Rate limiting behind a proxy.** The auth rate limiter partitioned on `RemoteIpAddress`, which
  behind the ingress is the proxy — collapsing all callers into one bucket so it never tripped.
  It now partitions on the real client IP from `X-Forwarded-For` (the production follow-up flagged
  back in the 2026-07-09 rate-limiting entry, now done).

**Consequence:** the single nginx config keeps its proxy blocks but resolves the `api` upstream
lazily (a `resolver` + a variable in `proxy_pass`) so the image still boots in the cloud, where
that hostname doesn't exist and the blocks are never hit.

---

## D16 — Achievement badges: four, awarded in the scoring flow

**Decision:** Add four badges — **First Rep** (first check-in), **On Target** (first week the
target is hit), **Iron Month** (a 4-week streak), and **Comeback** (target met the week after a
broken week). Badges are stored per `CrewMembership` (one `Achievement` row per membership + code,
unique-indexed) and awarded inside `ScoringService` right after a check-in commits. Earned codes
are returned on the check-in response and on every scoreboard row; an `/Achievements` endpoint
aggregates them across all of a user's crews for the achievements page.

**Why:** badges are the assignment theme (gamification) made concrete, and all four are
computable from data the app already tracks (check-ins, weekly target-met history, streaks), so
no new tracking is needed. Scoping them per membership matches how XP and streaks already work
(D12) — you earn a badge *in a crew* — and the unique index makes "award once" a DB guarantee
rather than an app check, the same pattern used for invite codes and one-check-in-per-day.

---

## D17 — Global leaderboard ranks crews by average streak, not individuals by XP

**Decision:** The cross-crew leaderboard ranks **crews** by their members' **average current
streak**, not individuals by XP. Ties break by member count, then name.

**Why:** a naive global leaderboard of individuals by XP has two problems. It isn't
apples-to-apples — XP scales with your weekly target and how many crews you're in (D12 keeps XP
per-crew for exactly this reason), so it would reward volume over consistency, the opposite of
the product's point. And it breaks the private-crew model — crews are invite-only, so ranking
people against strangers they never chose to compete with is off-thesis. Ranking *crews* by
*average streak* fixes both: streak is already target-normalised (consecutive weeks on target,
regardless of target size), so crews compare fairly, and it exposes crew names and aggregates
rather than individuals across groups. It also reframes the competition as crew-vs-crew, which
reinforces the accountability thesis instead of undermining it.

**Consequence:** the unused `User.TotalXp` field stays unused (a global per-user score was
considered and rejected here); the leaderboard reuses the exact streak computation the per-crew
scoreboard already uses, so the two can never disagree.
