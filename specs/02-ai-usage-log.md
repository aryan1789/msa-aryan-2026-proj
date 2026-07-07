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

## Template for future entries

```
## YYYY-MM-DD — <topic>
**Goal:** ...
**How AI was used:** ...
**Example prompt(s):** ...
**Critical evaluation / what I changed:** ...
```
