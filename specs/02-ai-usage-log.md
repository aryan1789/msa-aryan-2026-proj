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

## Template for future entries

```
## YYYY-MM-DD — <topic>
**Goal:** ...
**How AI was used:** ...
**Example prompt(s):** ...
**Critical evaluation / what I changed:** ...
```
