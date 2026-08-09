# AI Prompts

A representative selection of the prompts used during development, grouped by phase. This is a
curated sample, not an exhaustive transcript — it shows *how* I directed the AI, from
learning/review prompts early on to directive build prompts later. It pairs with the narrative in
[`02-ai-usage-log.md`](./02-ai-usage-log.md).

Primary tool: **Claude (Claude Code)**. Frontend visual work also used **GitHub Copilot** and
Claude's design tooling (called out where relevant).

## Standing instruction (given to the agent throughout the build phases)

> "While working on this, make sure the code looks like I'm writing it — if there's text it
> shouldn't look AI-generated (human-sounding language, no em-dashes), no comments in the code,
> always develop the simplest version that works rather than over-engineering. It doesn't need to
> scale — it's a Microsoft Student Accelerator project. Let me know if you have questions or
> concerns."

This was the persistent context the agent worked under: write the simplest thing that works, keep
it human, and flag real trade-offs rather than guessing.

## Planning & technical decisions

> "I've decided on the concept — help me turn it into a concrete technical plan. Work through the
> database, auth approach, deployment target, and styling library as a structured Q&A weighing the
> trade-offs, then write it up."

> "Would a managed database or Supabase cover the security requirements automatically, so I
> wouldn't have to build auth myself?"

(The answer — infrastructure security is not the same as application security — is what pushed the
decision to build authentication myself. See design decision D3.)

## Backend (mostly self-written, AI for concepts + review)

> "Can you explain what the API and test projects are for? Why is a separate test project
> required — can't the tests and the API live in the same project?"

> "What is Docker and how will we be using it here? Explain images, volumes, and ports."

> "Here's my register endpoint — review it for correctness and security gaps before I commit.
> Explain any issue's root cause, don't just hand me a fix."

> "Explain why my Tailwind utility classes aren't applying — walk me through the cause, not just
> the fix." (Root cause: CSS cascade layers — see D8.)

> "Review my leave-crew endpoint diff before I commit."

(The review caught the crew-creator-can't-leave case and a concurrent double-leave race — see the
2026-07-17 entry.)

## Frontend visual identity (AI-assisted, then curated)

> "Make the UI look less AI-generated. Also give me a prompt I can hand to Claude's design tool to
> make it look more intentional."

> "Import this design project via the design tool and implement `Crew Forge.dc.html` — read the
> `support.js` and `image-slot.js` files it depends on."

(For the imported hero image slot, the AI flagged that the asset resolved to a competitor's
screenshot and refused to ship it, using a styled panel instead — recorded in the run notes.)

## Phase 6 — full-stack Docker Compose

> "Extend the compose file so one `docker compose up --build` brings up Postgres, the API, and the
> frontend wired together, working end-to-end with nothing on the host but Docker. Lock the two
> decisions: same-origin via an nginx reverse proxy (not CORS), and a startup migration guarded by
> an env flag (not a separate migrator container)."

## Phase 7 — Azure deployment

> "Deploy the full stack to Azure for Students — API + frontend + PostgreSQL — with real secrets
> and a working public link. Check whether my subscription can actually do it before sinking time
> in."

(This surfaced the student-subscription limits — blocked Static Web Apps region and blocked ACR
cloud builds — which changed the deployment topology. See D15.)

## Phase 8 — hardening and gamification stretch

> "Bug-bash the live app — verify the rate limiting actually fires in production."

(This caught a real bug: rate limiting keyed on the proxy IP behind the ingress, so it never
tripped. Fixed to key on the forwarded client IP.)

> "Add four achievement badges — First Rep, On Target, Iron Month, Comeback. Write the code the
> way I write mine, keep it maintainable, and make the frontend match the current UI."

> "Shouldn't there be a leaderboard across all crews, not just the ones I'm in?"

(The AI pushed back on a naive global XP leaderboard — unfair across targets, and it breaks the
private-crew model — which led to my decision: rank *crews* by average streak instead. See D17.)

## Documentation

> "Before submission, check the project honestly against the assessment doc and tell me where it
> does and doesn't meet the requirements — don't just say it's fine."

(This audit found the missing CRUD Update endpoint and the README/specs gaps, which were then
fixed.)
