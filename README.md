# Crew Forge

A gym accountability app. Small friend-"crews" commit to a weekly training target, and a live
shared scoreboard makes each member's progress (and misses) visible to the whole crew in real
time. It's a *commitment device*: missing your target shows up as a visible mark the crew can
see, optimising for outcomes rather than passive social engagement.

## Live demo

- **App:** https://crewforge-web.yellowbay-c662e9ed.australiaeast.azurecontainerapps.io
- **API docs (Scalar):** https://crewforge-api.yellowbay-c662e9ed.australiaeast.azurecontainerapps.io/scalar

## What it does

- **Crews** — create a crew, share its invite code, join by code. Each crew sets a default
  weekly check-in target.
- **Check-ins** — one per day, with a short note. Check-ins count toward your weekly target.
- **Gamification** — XP per check-in with a bonus for hitting your weekly target, weekly
  streaks (consecutive weeks on target), and four achievement badges (First Rep, On Target,
  Iron Month, Comeback).
- **Live scoreboard** — a per-crew board ranked by XP, pushed to every member in real time over
  SignalR when anyone checks in.
- **Achievements page** — every badge, earned or locked, with the date you unlocked it.
- **Crew leaderboard** — every crew ranked by its members' average weekly streak.
- **Light / dark theme** and a responsive layout down to mobile width.

## How it fits the theme (Gamification)

Gamification is the whole point of Crew Forge, not a layer on top. The game mechanics from the
brief are the product:

- **Points / XP** — earned per check-in, with a bonus for hitting the weekly target.
- **Streaks** — consecutive weeks meeting your target, shown on every scoreboard.
- **Badges / achievements** — First Rep, On Target, Iron Month, and Comeback, awarded as you
  play and collected on a dedicated achievements page.
- **Leaderboards** — a live per-crew scoreboard ranked by XP, plus a global leaderboard ranking
  crews by average streak.
- **Progress tracking** — weekly progress ticks and a target-met/in-progress status per member.

The twist on the theme is that the gamification is *social and consequential*: your misses are
visible to your crew in real time, so the mechanics are used as a commitment device rather than
just personal dopamine.

## What makes it unique

- **It's a commitment device, not another workout logger.** Apps like Hevy/Strong have a passive
  social feed; Crew Forge makes flaking *visible* to a small group of friends, which is the actual
  behaviour-change lever.
- **A fair, on-thesis global leaderboard.** Rather than ranking individuals by XP (which rewards
  whoever picks the highest target), it ranks *crews* by average streak — target-normalised, so
  the comparison is fair, and it keeps the competition crew-vs-crew.
- **The real-time board is load-bearing.** The SignalR live update isn't a gimmick bolted on for
  the WebSockets requirement; the product genuinely needs everyone to see a miss the moment it
  happens.
- **A distinct visual identity.** A custom industrial/athletic "Crew Forge" design system (Barlow
  type, uppercase headings, zero border-radius, warm neutrals) rather than default component-library
  styling.

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | C# / .NET 10, ASP.NET Core Web API, EF Core |
| Database | PostgreSQL |
| API docs | Scalar |
| Frontend | React + TypeScript (Vite), Tailwind CSS + shadcn/ui |
| State | Zustand |
| Real-time | SignalR (WebSockets) |
| Deployment | Azure Container Apps, containerised with Docker |

## Advanced requirements — please mark these three

- [x] **Security Measures** (three: password hashing, data validation, rate limiting)
- [x] **WebSockets** (SignalR live scoreboard)
- [x] **Dockerize your project**

Also built but **not** put forward for marking: a state management library (Zustand), light/dark
theme switching, and multiplayer (emergent from the real-time crew design).

The three marked requirements are detailed below.

### 1. Security Measures

The requirement asks for a minimum of two measures; this project implements three:

- **Password hashing (BCrypt).** Passwords are hashed with a salted, adaptive hash before being
  stored, and login verifies against the hash. A leaked database can't be trivially reversed,
  and per-password salts defeat rainbow-table and cross-account attacks.
- **Data validation.** Registration and login inputs are validated with data-annotation
  attributes (required fields, email format, length bounds), enforced automatically by the
  `[ApiController]` model validation, which rejects malformed input with a `400` before it
  reaches the database. Emails are normalised and uniqueness is guaranteed by a database unique
  index, not just an application check.
- **Rate limiting.** The auth endpoints are throttled (fixed-window, per client IP) so repeated
  login/register attempts are rejected with `429 Too Many Requests`, making automated password
  guessing impractical.

Authentication itself uses custom HS256-signed **JWTs** (signing key kept out of source
control), validated for issuer, audience, lifetime, and signature on protected endpoints.
Authorization is **ownership-scoped**: a logged-in user can only act on their own data and the
crews they belong to.

### 2. WebSockets

The live shared scoreboard is powered by a SignalR hub: when any crew member checks in, the
updated standings are pushed to every connected member in real time rather than requiring a page
refresh.

### 3. Docker

The project is containerised with Docker. `docker compose` runs the API, frontend, and
PostgreSQL together for a reproducible local stack, and the same images run in the cloud.

## Running locally

### Option A — full stack with Docker Compose (recommended)

Brings up PostgreSQL, the API, and the frontend together. Nothing needed on the host but Docker.

```bash
cp .env.example .env          # then set JWT_SIGNING_KEY to a long random string
docker compose up --build
```

Then open http://localhost:8080. The API is on http://localhost:5194 (Scalar at
http://localhost:5194/scalar). The API applies EF migrations on startup, so the database is
ready on first run.

### Option B — dev mode (hot reload)

Runs Postgres in Docker and the API and frontend directly on the host.

```bash
# Database only
docker compose up -d db

# Backend API (from ./backend/msa-aryan-2026-proj.Api)
dotnet run --launch-profile http

# Frontend (from ./frontend)
npm install && npm run dev
```

In dev mode the frontend is on http://localhost:5173 and expects the API at
http://localhost:5194 (`VITE_API_URL`). The JWT signing key is supplied via .NET user-secrets
(`Jwt:SigningKey`) rather than the `.env` file.

## Tests

```bash
# Backend (xUnit)
cd backend && dotnet test

# Frontend (Vitest)
cd frontend && npm run test
```

## Deployment

Deployed on **Azure**: the API and frontend each run as an **Azure Container App**, backed by
**Azure Database for PostgreSQL Flexible Server**. Images are built locally and pushed to Azure
Container Registry, then rolled out to the container apps. The frontend talks to the API over
CORS; the API reads its connection string and JWT key from Container App secrets.

## Self-reflection — what I'd do differently

- **Deploy earlier.** I left the cloud deploy until near the end and hit avoidable surprises
  (the Azure for Students subscription blocks Static Web Apps in my region and blocks cloud image
  builds). Deploying a hello-world to Azure in week one would have surfaced those constraints while
  there was time to plan around them.
- **Add an Update endpoint from the start.** The API grew create/read/delete flows naturally but
  no edit path until late; designing the check-in resource as full CRUD up front would have been
  cleaner than retrofitting it.
- **Wire config for the proxy vs CORS split sooner.** The local Docker setup (same-origin nginx
  proxy) and the cloud setup (cross-origin CORS) diverged, which caused a couple of environment-only
  bugs (a rate limiter that only worked behind the real client IP, an HTTPS redirect loop behind the
  ingress). Testing against a deployed environment earlier would have caught these sooner.
- **A SignalR backplane if it needed to scale.** The live scoreboard keeps group state in memory,
  so the API is pinned to a single replica. Fine for this project, but a real deployment would use a
  Redis backplane to scale horizontally.

## Project documentation

Planning, design decisions, AI prompts, and the AI usage log live in [`/specs`](./specs).
