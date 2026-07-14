# AI Usage Log

A running record of how AI was used during development, including the kinds of prompts used and
how I critically evaluated the outputs. AI was used as a **guide and mentor** — explaining
concepts, reviewing decisions, and helping debug — while I wrote the code and made the decisions
myself, so that I genuinely understand and can speak to every part of the project.

Tool used: Claude (Claude Code).

---

## 2026-06-24 — Planning & technical decisions

**Goal:** Turn the project concept I'd decided on into a concrete technical plan — choosing the
database, auth approach, deployment target, styling library, and which three advanced features
to headline.

**How AI was used:** Worked through each decision as a structured Q&A, weighing the trade-offs,
then produced the project plan and design-decision records.

**Critical evaluation:** I questioned AI recommendations rather than accepting them — e.g. I
asked whether a managed database / Supabase would cover the security requirements automatically.
The answer clarified that infrastructure security ≠ application security, which directly shaped
the decision to build authentication myself (see design decision D3).

---

## 2026-06-24 — Project scaffolding & debugging

**How AI was used:** Guidance on scaffolding the .NET backend and the React/Vite frontend. I ran
all commands myself and asked AI to explain what each did and to help diagnose errors.

**Notable debugging / learning moments:**

1. **.NET version mismatch** — the backend initially built against .NET 8 instead of the
   required .NET 10. AI helped me read the build output to spot `net8.0` in the path, install
   the .NET 10 SDK, and retarget the `.csproj` files. Learned what `.csproj`/`.sln` files are
   and why a separate test project exists (so test dependencies don't ship to production).

2. **Tailwind classes not applying** — utilities appeared to do nothing. AI helped me realise
   this wasn't an install problem (an `<h1>` is large/bold by default, so that was a false
   positive) but a **CSS cascade-layers** issue: leftover unlayered template CSS was overriding
   Tailwind's layered utilities regardless of specificity. Fixed by stripping `index.css`.

3. **shadcn path aliases + a deprecated `baseUrl` warning** — set up `@/` path aliases across
   `tsconfig` and `vite.config.ts`. Hit a warning that TypeScript's `baseUrl` is deprecated;
   learned that modern TS resolves `paths` relative to the config file, so `baseUrl` is no longer
   needed — a case where the official docs lagged behind the tooling.

**Critical evaluation:** In several cases AI's (or the official docs') first suggestion needed
adjusting for the current tool versions — e.g. the `baseUrl` deprecation. I treated AI output as
a starting point to verify against official docs and the actual error messages, not as gospel.

---

## 2026-06-25 — Database setup: EF Core + Dockerised PostgreSQL

**Goal:** Connect the .NET API to a real database, with PostgreSQL running in Docker for a
reproducible local setup.

**How AI was used:** Guidance setting up a `docker-compose.yml` for PostgreSQL, then wiring up
EF Core (a `DbContext`, the first `User` entity, DI registration, and the initial migration). I
ran every command myself and asked AI to explain the underlying concepts — ORMs,
`DbContext`/`DbSet`, migrations, dependency injection, and how Docker images/volumes/ports work —
rather than copy-pasting code I didn't understand.

**Example prompts (learning-oriented):**
> "Can you explain what the API and test projects are for?"
> "Why is a separate test project required? Can't the tests and API be in the same project?"
> "What is Docker and how will we be using it here?"
> (plus pasting build/runtime errors and asking for an explanation of the *cause*, not just a fix)

**Notable debugging / learning moments:**

1. **Postgres credentials baked into the Docker volume** — got `28P01: password authentication
   failed`. Learned that `POSTGRES_PASSWORD` is only applied when the data volume is *first*
   created; changing it later has no effect. Fixed by recreating the volume with
   `docker compose down -v` so it re-initialised with the correct credentials.

2. **Missing namespace** — a new `User.cs` had no `namespace` line, causing `CS0234`. Learned
   that C# namespaces aren't set automatically by folder location; they must be declared
   explicitly in each file.

3. **Unsaved file** — an apparent dependency-injection error (`Unable to resolve service for
   DbContextOptions`) was actually caused by `Program.cs` not being saved. Lesson: build tools
   only ever see what's written to disk, so check for unsaved-file indicators first.

**Critical evaluation:** I focused on understanding each error's root cause
(volume-persisted credentials, C# namespace rules, editor save state) rather than blindly
applying fixes, so I can recognise and avoid them next time.

---

## 2026-06-25 — Scalar API documentation

**Goal:** Replace the default Swagger UI with Scalar for interactive API documentation (a basic
requirement of the assessment).

**How AI was used:** Clarified how the pieces fit together — that OpenAPI is the underlying
spec format and Swagger UI / Scalar are interchangeable viewers of it — then guided swapping the
NuGet packages (removing Swashbuckle, adding `Microsoft.AspNetCore.OpenApi` and
`Scalar.AspNetCore`) and updating `Program.cs`.

**Critical evaluation:** Understood the swap conceptually (spec vs. viewer) rather than treating
it as a magic incantation, so I can explain why the change works.

---

## 2026-06-25 — Authentication & security (self-directed)

**Goal:** Build the authentication/security feature (registration with password hashing, then
login + JWT, then RBAC).

**Approach:** For this feature I chose to research and write the implementation myself using
official documentation (Microsoft Learn) and Google, rather than have AI generate the code. AI's
role here was limited to up-front concept explanation (how password hashing, JWT, and DTOs work
and why), pointing me at the right docs/search terms, and reviewing my own code afterwards for
correctness and security gaps. The goal was to genuinely understand auth — the most
security-critical part of the app — so I can defend every line of it.

*(Implementation progress is logged in the dated entries below.)*

---

## 2026-07-05 — User registration endpoint (self-directed, AI-reviewed)

**Goal:** Implement `POST /Auth/register` — accept new user details, store the user with a
hashed password, and reject duplicate email addresses.

**How I worked:** I wrote the endpoint myself using the official ASP.NET Core Web API
documentation on Microsoft Learn (controllers, `[ApiController]`, attribute routing, model
binding, action return types), the "Create a web API with ASP.NET Core controllers" tutorial
(the POST action and the "Prevent over-posting" / DTO guidance), and the BCrypt.Net-Next README
for password hashing. AI's role was to point me to those resources and then to review my code.

**What the AI review caught, and I then fixed:**
- **Over-posting:** I first bound the request directly to the `User` entity, which would let a
  client set fields like `Id` or `PasswordHash`. I replaced it with a dedicated `RegisterRequest`
  DTO exposing only Email, DisplayName, and Password.
- **Unhashed password:** my initial version stored the raw password in the `PasswordHash` column.
  I fixed it to hash with `BCrypt.HashPassword` before saving.
- **Duplicate emails:** added an `AnyAsync` check that returns `409 Conflict` when the email is
  already registered.

**Verification (manual, end-to-end):** registered a user through the Scalar UI (200 OK), confirmed
in the database that `PasswordHash` was a BCrypt `$2a$...` hash rather than plaintext, and
confirmed that repeating the registration returns `409 Conflict`.

**Still to do for the security feature:** input validation (data annotations), a unique index on
Email, login with `BCrypt.Verify`, JWT issuing/validation, and RBAC.

---

## 2026-07-07 — Registration input validation (self-directed, AI-reviewed)

**Goal:** Reject malformed registration input (missing/invalid email, too-short password) before
it reaches the database, without hand-writing validation checks in the action method.

**How I worked:** I added data-annotation attributes to the `RegisterRequest` DTO myself, working
from the "Model validation in ASP.NET Core" docs on Microsoft Learn. Because the controller is
marked `[ApiController]`, the framework validates the model automatically and returns a `400` with
a problem-details body before the action runs, so I didn't need an explicit `ModelState.IsValid`
check. I chose: `[Required]` on all three fields; `[EmailAddress]` on Email; `[StringLength(254)]`
for Email (the RFC 5321 address limit); `[StringLength(100)]` for DisplayName; and
`[StringLength(72, MinimumLength = 8)]` for Password. I asked AI to review afterwards.

**What the AI review confirmed / surfaced:** No bugs — the attributes were correct. The review
confirmed two things I wanted to be sure of and could then explain:
- `[Required]` rejects empty and whitespace-only strings by default (`AllowEmptyStrings` is false),
  so an empty-string email is caught by `[Required]` before `[EmailAddress]` ever runs — the
  `= string.Empty` default doesn't slip past validation.
- The 72-character password cap lines up with BCrypt's 72-*byte* input limit, but `StringLength`
  counts characters, not bytes, so a password of 72 multi-byte characters could still be silently
  truncated by BCrypt. A known edge case I've noted rather than a bug for this project.

**Verification:** project builds with 0 errors; the `[ApiController]` automatic-400 behaviour is
what enforces the annotations at runtime.

**Still to do for the security feature:** a unique index on Email (DB-level guarantee behind the
existing `AnyAsync` check), login with `BCrypt.Verify`, JWT issuing/validation, and RBAC.

---

## 2026-07-08 — Enforcing unique emails end-to-end (self-directed, AI-reviewed)

**Goal:** Make email uniqueness an actual guarantee rather than a best-effort check, and make
`Foo@x.com` and `foo@x.com` count as the same account.

**How I worked:** Three changes, written myself from the EF Core and Npgsql docs:
1. **DB-level unique index** — added `HasIndex(u => u.Email).IsUnique()` in `OnModelCreating`,
   generated the `AddUniqueEmailIndex` migration, read the generated `CreateIndex(unique: true)`
   before applying, and ran `database update`.
2. **Case normalization** — normalize the email once at the top of the action with
   `Trim().ToLowerInvariant()` and use that single value for both the `AnyAsync` lookup and the
   stored entity, so the check and the saved row can't disagree.
3. **Race backstop** — wrapped `SaveChangesAsync` in a `try/catch (DbUpdateException) when (...)`
   exception filter that returns `409` only for a Postgres unique-violation, so the DB guarantee
   surfaces as a clean `409` instead of an unhandled `500`.

**Why this design (the reasoning I worked through):**
- The `AnyAsync` pre-check alone is a check-then-act race: two simultaneous requests can both pass
  it and both insert. The unique index is the real guarantee; the pre-check just provides the
  friendly common-path message. Belt and suspenders.
- Used `ToLowerInvariant()` rather than `ToLower()` on purpose — culture-sensitive lowercasing
  (e.g. the Turkish dotless-i) could normalize the same email differently depending on server
  locale, which would break matching.
- The exception filter matches *only* `PostgresErrorCodes.UniqueViolation` so other DB failures
  still surface as `500` rather than being mislabelled as duplicate-email.

**Verification (end-to-end):** built with 0 errors, ran the API and exercised `/Auth/register` —
first registration returned `200` and stored the email lowercased; re-registering the same address
in **UPPERCASE** returned `409` (proving case-insensitivity); and an invalid email plus a 5-char
password returned `400` with per-field validation errors.

**Still to do for the security feature:** login with `BCrypt.Verify`, JWT issuing/validation,
and RBAC.

---

## 2026-07-08 — Login endpoint with enumeration/timing hardening (self-directed, AI-reviewed)

**Goal:** Implement `POST /Auth/login` — verify an email/password pair against the stored BCrypt
hash and return `200` on success / `401` on failure, without leaking which emails have accounts.

**How I worked:** Wrote the endpoint myself from the BCrypt.Net-Next README (`Verify`). It
normalizes the email the same way registration does (`Trim().ToLowerInvariant()`) so a user who
registered as `Foo@x.com` can still log in, looks the user up with `FirstOrDefaultAsync`, and
checks the password with `BCryptNet.Verify`. `LoginRequest` uses `[Required]` + `[EmailAddress]`
but deliberately no password `MinimumLength` — password policy belongs on registration, and a
length rule on login would leak policy and reject legacy passwords.

**Security reasoning I applied (the graded part):**
- **No user enumeration:** both the "no such account" and "wrong password" paths return the same
  `401` with the same `"Invalid email or password."` message, so the response can't be used to
  discover which emails are registered.
- **Timing side-channel:** returning early when the user is null would make that path much faster
  than the wrong-password path (which runs slow BCrypt), which itself leaks whether the email
  exists. I mitigated it by running `BCrypt.Verify` against a reusable dummy hash on the null path
  so both branches take comparable time. The dummy hash is computed once as `static readonly`.
- **Known asymmetry I can speak to:** login is enumeration-safe, but registration intentionally
  isn't — it returns `409 "account already exists"` because the sign-up UX needs to tell the user
  the email is taken. A deliberate trade-off rather than an oversight.

**Verification (end-to-end):** ran the API and exercised `/Auth/login` — correct credentials → `200`;
the same email in **UPPERCASE** with the correct password → `200` (normalization matches register);
wrong password → `401`; a nonexistent account → `401` with an identical body; and a missing password
→ `400` validation error.

**Still to do for the security feature:** JWT issuing/validation (the login success path is kept
simple so the token slots straight in), and RBAC.

---

## 2026-07-09 — JWT issuing + validation (self-directed, AI-reviewed)

**Goal:** Issue a signed JWT on successful login and validate it on protected endpoints, with the
API acting as its own token issuer (single API, shared symmetric key).

**How I worked:** Wrote it myself across four pieces — a `TokenService` that builds the token
(`sub`/`email`/`jti` claims, `SymmetricSecurityKey` + `SigningCredentials` with HS256, expiry),
`AddJwtBearer` wiring with `TokenValidationParameters` in `Program.cs`, hooking the token into the
login success path, and a `[Authorize]`-protected `GET /Auth/me` to exercise the validation side.

**Documentation gap I had to reason around:** there's no single official Microsoft tutorial for a
self-contained API that *issues* its own tokens with a symmetric key — the "Generate tokens with
dotnet user-jwts" doc covers the validation/config side but delegates issuance to a dev CLI tool,
and explicitly notes a production app "might get the JWT from a Security token service." So for the
issuance code I stitched together the API reference for the token primitives (`SymmetricSecurityKey`,
`SigningCredentials`, `JwtSecurityTokenHandler`) rather than following one walkthrough, and
cross-checked community Q&A examples against the reference rather than trusting them verbatim.

**Security reasoning I applied:**
- **Signing key kept out of source control** — `appsettings.json` holds only Issuer/Audience/
  ExpiryMinutes; the key lives in user-secrets (64 bytes, well above the 256-bit HS256 minimum).
  A leaked key means anyone can forge tokens for any user, so it must never be committed.
- **A JWT is signed, not encrypted** — the payload is readable base64, so I put only an id, email,
  and jti in the claims, nothing sensitive.
- **Validate everything** — issuer, audience, lifetime, and signing key all checked, so a token
  that's expired, for a different audience, or signed with another key is rejected.
- Two hardening touches: `ClockSkew` reduced to 1 minute (tightening the sloppy 5-minute default),
  and `MapInboundClaims = false` so claims keep their original names (`sub`/`email`).
- Middleware order: `UseAuthentication()` before `UseAuthorization()` — authentication (who you
  are) must run before authorization (what you're allowed to do).

**Verification (end-to-end):** logged in and decoded the returned token to confirm the claims,
issuer, audience, expiry, and `HS256` header; then hit `/Auth/me` with no token (`401`), a valid
token (`200` returning the caller's id/email from the validated claims), and a garbage token
(`401`) — proving both the issuing and validation halves.

**Still to do for the security feature:** RBAC (Leader vs Member — layers a role claim on the token
and role-gated endpoints, and depends on the `CrewMembership` entity from Week 2) and rate limiting.

---

## 2026-07-09 — Rate limiting on the auth endpoints (self-directed, AI-reviewed)

**Goal:** Throttle `/Auth/login` and `/Auth/register` so they can't be used for brute-force or
credential-stuffing — an unthrottled login is a free password-guessing oracle.

**How I worked:** Used ASP.NET Core's built-in rate limiting (no NuGet package needed since .NET 7),
from the "Rate limiting middleware in ASP.NET Core" docs. Registered a named `"auth"` policy with
`AddRateLimiter`, applied it with `[EnableRateLimiting("auth")]` on the login and register actions,
and added `app.UseRateLimiter()` to the pipeline.

**Design decisions (and why):**
- **Fixed window, by client IP, 10 requests/minute.** Fixed window is the simplest algorithm to
  reason about and explain; partitioning by `RemoteIpAddress` stops one attacker from starving
  everyone else. `QueueLimit = 0` so excess attempts are rejected immediately rather than queued.
- **Scoped to the auth endpoints, not global** — brute-force is what matters here, and I didn't
  want to throttle ordinary app traffic.
- **`RejectionStatusCode = 429`** — the middleware defaults to `503`, which is misleading; a
  rate-limited client should get `429 Too Many Requests`.

**Known production follow-up (noted, not a bug):** behind a proxy/load balancer (the planned Azure
Container Apps deploy), `RemoteIpAddress` is the proxy's IP, which would collapse every client into
one partition. The fix is `ForwardedHeaders` middleware to recover the real client IP — not needed
locally, but required before this is effective in production.

**Verification (end-to-end):** fired 14 login attempts in one window against the running API — the
first 10 returned `401` (normal invalid-credentials) and attempts 11–14 returned `429`, confirming
the limit trips at exactly `PermitLimit` and returns `429` rather than the default `503`.

**Still to do for the security feature:** RBAC (Leader vs Member), which depends on the
`CrewMembership` entity from Week 2.

---

## 2026-07-10 — Crew + CrewMembership data model (self-directed, AI-reviewed)

**Goal:** Add the first Week 2 entities — `Crew` and `CrewMembership` — with correct relationships
and a migration, as the foundation for crews/memberships (and everything that references them).

**Design discussion before writing any code:** I worked through two product/modelling questions
with AI acting as a sounding board rather than a code generator:
- *Why is `CrewMembership` needed — isn't it just a middleman to avoid many-to-many?* Concluded it's
  a **join entity with payload**: the relationship carries data (`WeeklyTarget`, `CurrentStreak`)
  that belongs to the user-in-a-crew pairing, not to either entity alone, which is what forces it
  to be a first-class entity rather than an implicit join table.
- *Should we track workout progress, or just attendance?* Decided attendance-only (recorded as
  design decision D10): behaviour is the controllable lever, the crew provides social anti-gaming,
  and measuring real fitness outcomes would recreate the Hevy/Strong logger that D1 rejects.
- Also confirmed RBAC is out of scope (D9), so `CrewMembership` has no `Role` field.

**How I worked:** Wrote both entities myself as plain `Models/` classes (matching `User.cs` style),
added navigation properties, and configured relationships in `OnModelCreating` from the EF Core
relationships + cascade-delete docs. AI reviewed the modelling before I generated the migration.

**The modelling decision that needed care — cascade paths:** there are two User→Crew relationships
(membership, and the `CreatedByUserId` creator link). Leaving both User-facing relationships as
cascade risks multiple-cascade-path problems. I set the **creator** FK to `Restrict` (a user can't
be deleted while they own crews) and the two **membership** FKs to `Cascade`, which also breaks the
User→Crew→Membership→User cycle. Also added a composite unique index on `(CrewId, UserId)` so a user
can't join the same crew twice, and a unique index on `InviteCode`.

**Verification (end-to-end):** builds clean; generated the `AddCrewAndMembership` migration and read
it before applying (confirmed the FK actions and both unique indexes); ran `database update`; then
queried Postgres directly to confirm the delete rules actually landed — `FK_Crews_..._CreatedByUserId`
= `RESTRICT`, both `CrewMemberships` FKs = `CASCADE`.

**Next:** `CheckIn` entity (with a required `Note`, per D10), then the crew/membership endpoints
(create crew + generate invite code, join, list, leave) with ownership-scoped authorization.

---

## 2026-07-11 — CheckIn entity (self-directed, AI-reviewed)

**Goal:** Add the `CheckIn` entity — the record that a member showed up and trained, which is the
atomic unit everything else (weekly target, scoreboard, streaks, XP) is computed from.

**Two modelling decisions I made (with AI as a sounding board):**
- **Reference `MembershipId`, not `UserId` + `CrewId`.** A check-in is inherently an event on a
  membership, and pointing at the membership *structurally* prevents check-ins for a crew you're
  not a member of (referential integrity the DB enforces, instead of an app-only check). It's also
  consistent with how `WeeklyResult` keys off the membership, and it's one FK instead of two. This
  deviates from the original plan's `UserId + CrewId`, deliberately.
- **`WeekKey` as a `DateOnly` (the Monday of the week), not an ISO week string.** "Same week" is
  then just equality and "consecutive weeks" is a 7-day difference, which keeps streak logic trivial
  and sidesteps ISO-week year-boundary edge cases. `WeekKey` will be computed from `OccurredAt` in a
  single helper when check-ins are created, never ad hoc.

**Other config:** `Note` required (`NOT NULL`) with a 500-char cap; a non-unique composite index on
`(MembershipId, WeekKey)` to serve the core "count a member's check-ins this week" query
(non-unique because multiple check-ins per week are the whole point); FK → membership `Cascade`.

**Verification (end-to-end):** built clean, generated the `AddCheckIn` migration and read it before
applying, ran `database update`, then queried Postgres to confirm the live schema — `WeekKey` is
`date`, `Note` is `varchar(500) NOT NULL`, the composite index exists, and the FK to
`CrewMemberships` is `ON DELETE CASCADE`.

**Next:** crew/membership endpoints — create crew (generate invite code, creator auto-joins), join
by code, list/view, leave — all scoped to the authenticated user from the JWT.

---

## 2026-07-14 — Create-crew endpoint (self-directed, AI-reviewed)

**Goal:** Implement `POST /Crews` — the authenticated user creates a crew, gets a unique invite
code, and is auto-enrolled as the first member, all in one transaction.

**How I worked:** Wrote the controller myself. It's `[Authorize]`-gated, binds to a dedicated
`CreateCrewRequest` DTO (`Name`, `DefaultWeeklyTarget` only), reads the owner id from the JWT `sub`
claim via a small `GetUserId()` helper, and adds both the `Crew` and the creator's `CrewMembership`
(linked by navigation property) before a single `SaveChangesAsync`. Invite codes are generated with
`RandomNumberGenerator.GetInt32` over an unambiguous alphabet (no `0/O/1/I/L`), inside a retry loop
that regenerates only on a Postgres unique-violation.

**Security reasoning I applied:**
- **Owner id comes from the token, never the body.** `CreatedByUserId` is set from the validated
  `sub` claim, so a client can't create a crew "as" someone else.
- **Over-posting closed off.** The DTO exposes only the two writable fields — `Id`, `InviteCode`,
  and `CreatedByUserId` can't be injected. I verified this rather than assuming it (see below).
- **Invite codes are crypto-random, not `Guid`/`Random`.** `RandomNumberGenerator` so codes aren't
  predictable; the DB unique index is the real guarantee and the retry loop is a bounded backstop
  (max 5 attempts) that catches the rare collision without masking other DB errors.

**Verification (end-to-end):** ran the API against the live Postgres and drove the full flow with
curl — register → login → `POST /Crews`. No token → `401`; valid request → `201` with the crew +
generated invite code; `defaultWeeklyTarget: 9` → `400` (the `[Range(1,7)]` annotation); and an
**over-post attempt** injecting `id: 999`, `inviteCode: "HACKED01"`, `createdByUserId: 999` → `201`
but the row came back with a server-generated id and invite code and `CreatedByUserId` from *my*
token, proving the injected fields were ignored. Finally queried Postgres directly to confirm both
rows landed: the `Crews` row and a matching creator `CrewMemberships` row with `WeeklyTarget`
inherited from the crew's `DefaultWeeklyTarget` and `CurrentStreak = 0`.

**Next:** join crew by invite code, then list/view and leave — all ownership-scoped to the
authenticated user.

---

## 2026-07-15 — Join-crew endpoint (self-directed, AI-reviewed)

**Goal:** Implement `POST /Crews/join` — an authenticated user submits an invite code and becomes a
member of that crew.

**How I worked:** Added a second action to `CrewsController`, reusing the `GetUserId()` helper and
the same patterns from create-crew and the unique-email work. It normalizes the incoming code with
`Trim().ToUpperInvariant()` (my alphabet is all-uppercase, so a user typing the code in lowercase
still matches), looks up the crew by `InviteCode`, then creates the member's `CrewMembership` with
`WeeklyTarget` inherited from the crew's `DefaultWeeklyTarget` and `CurrentStreak = 0`.

**The cases I handled, and why:**
- **Invalid code → `404`** — no crew with that code, nothing leaked beyond that.
- **Already a member → `409`** — same belt-and-suspenders I used for unique email: an `AnyAsync`
  pre-check for the friendly common-path message, **plus** a `catch (DbUpdateException) when
  (UniqueViolation)` backstop that catches the check-then-act race against the composite
  `(CrewId, UserId)` unique index. That catch is safe to treat as "duplicate membership" precisely
  because that composite index is the *only* unique constraint on `CrewMemberships` — I checked
  before assuming it.
- **Success → `200`** with a crew/membership summary. Chose `200` over `201` because joining isn't
  creating a new top-level resource at a client-known URL; it's the caller acting on an existing
  crew.

**One deliberate wrinkle I noted:** `[StringLength(8)]` validates the *raw* input before `Trim()`
runs, so a code pasted with surrounding spaces would be rejected as too long rather than trimmed. A
known UX edge case, not a correctness bug — noted rather than fixed for this project.

**Verification (end-to-end):** ran the API against live Postgres with two users. User A created a
crew; user B joined using the code **in lowercase** → `200` (proving normalization); B joining again
→ `409`; a bogus code → `404`; an empty code → `400`; and no token → `401`. Then queried Postgres to
confirm the crew had *both* memberships — the creator (auto-joined) and B (joined by code) — each
with the inherited `WeeklyTarget` and `CurrentStreak = 0`.

**Next:** list/view the crews the authenticated user belongs to, then leave — both ownership-scoped
to the JWT identity.

---

## Template for future entries

```
## YYYY-MM-DD — <topic>
**Goal:** ...
**How AI was used:** ...
**Example prompt(s):** ...
**Critical evaluation / what I changed:** ...
```
