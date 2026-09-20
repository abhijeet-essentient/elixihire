# Claude Code build prompt — EXTEND the existing ElixiHire demo

> Paste below the line into Claude Code **in the existing demo project** (the one already built from the first prompt).
> This adds breadth and polish on top of what exists. Same hard rule: **static, front-end-only, no backend, no runtime network calls.** It must still build as a Next.js static export and deploy to Vercel with zero config.

---

## Context & guardrails

You are **extending an existing project**, not starting over. The current demo already has: a persona switcher (Employer, Candidate, Admin), job posting, a structured candidate profile, healthcare-aware job search, an applicant dashboard with a rule-based **Fit** score and **masked** candidate details, a **placement pipeline**, an admin verification queue + snapshot, and `lib/services/matchingService.ts`, `lib/taxonomy.ts`, `lib/seed.ts`, and an in-memory store.

Before writing anything: **read the current codebase** (routes, components, store, types, seed, services) and **reuse and extend** it. Match the existing conventions, file layout, design tokens, and store patterns. Do **not** rewrite working screens from scratch; enhance them. Keep the app compiling as a **static export** (`output: 'export'`) after every phase — run `npm run build` at the end of each phase and fix any break before moving on. Preserve all existing constraints: no backend, no DB, no auth, no external API at runtime; state stays in-memory (keep the existing store; add the optional localStorage persistence only if not already present, wrapped in try/catch). All money in **INR**. Keep the ElixiHire product header (logo placeholder), the "DEMO · no live data" badge, and the **Essentient** footer.

Add these client libraries (bundled, no runtime network): **recharts**, **@dnd-kit/core** (+ sortable), **cmdk**, **lucide-react**, **framer-motion**, **date-fns**.

## The organizing idea to introduce: Core vs Preview

Introduce a `TierBadge` shown on every screen and in the nav, with two tiers:
- **CORE** — the Phase-1 scope already in the demo (fully interactive).
- **PREVIEW · Phase N** — roadmap capability added now to show range; visually complete and clickable, lighter mock interactivity is acceptable.

Tag every existing and new screen accordingly, and add an **"About this demo"** page explaining Core vs Preview and that nothing is a live system. This lets the demo impress while reinforcing the phased delivery story.

---

## Phase A — Global shell & polish (do first)

- **Add the Recruiter persona** to the persona switcher (screens defined in Phase E).
- **Command palette (⌘K / Ctrl-K)** via `cmdk` — jump to any screen, search jobs/candidates, run demo actions.
- **Guided tour** — a "▶ Take the tour" control that runs a scripted, step-highlighted walkthrough of the employer hero flow (post job → smart-match → shortlist → schedule → pipeline → analytics). Use framer-motion for highlight/step transitions.
- **Theme toggle** (light/dark), both fully styled from the existing tokens.
- **Global search**, **toast notifications** for every mutating action, and **skeleton/loading states** with a short simulated delay so flows feel real.
- **Roadmap page** — a Now / Next / Later view mapping Core vs Preview to the five revenue streams (placement & acquisition, talent-pipeline subscription, job posting, payroll).
- Upgrade shared primitives as needed: a sortable/filterable `DataTable`, `Drawer`, `Modal`, `Chip`, `StatTile`, and Recharts wrappers — reuse across screens.

## Phase B — Employer enhancements

- **Employer dashboard (CORE)** — KPI tiles (open roles, applicants, time-to-shortlist, offers out, joined), activity feed, hiring-funnel chart, demand-by-specialty chart.
- **Post-a-job wizard (CORE)** — convert the existing form into a multi-step wizard with a **live preview** pane; keep all current structured fields (specialty, sub-specialty, shift/time-slot, credentials, **surgical requirement** primary/assisting + case volume). Add an **"AI assist" (PREVIEW)** button that fills a suggested description + recommended credentials from deterministic templates (clearly labelled).
- **Applicants + Smart Match (CORE, enhance existing)** — keep the Fit score + "Why this fits", and add a **radar chart** of per-dimension sub-scores (specialty, experience, shift, credentials, surgical, location). Extend `matchingService.computeFit` to also return `dimensions` for the radar without changing its existing outputs.
- **Compare candidates (CORE)** — side-by-side of 2–3 shortlisted candidates across the match dimensions.
- **Pipeline → Kanban (CORE, enhance existing)** — turn the placement pipeline into a **drag-and-drop board** (@dnd-kit) across Applied → Shortlisted → Interview → Offer → Joined → 90-day; per-candidate **drawer** with notes, timeline, and status history.
- **Interview scheduler (CORE)** — calendar/slot picker that respects shift/time-slot; propose slots + "send invite" (toast); reflected on the candidate timeline.
- **Offer management (PREVIEW · Phase 2)** — mock offer-letter preview + status + e-sign placeholder.
- **Messaging & notes (PREVIEW)** — threaded panel per candidate (mock).
- **Talent Pipeline subscription (PREVIEW · Phase 2)** — plan tiers with a paywalled feel (no real payment).

## Phase C — Candidate enhancements

- **Profile (CORE, enhance)** — add a **completeness meter**, a **credential wallet** (licences/certs as chips with mock "verified" badges), an **availability calendar** (shift/time-slot), résumé upload capturing filename only, and keep consent/visibility + surgical experience.
- **Recommended for you (CORE)** — a `recommendationService.ts` module producing a ranked feed against the candidate's own profile, each with match reasons.
- **Find jobs (CORE, enhance)** — add saved searches and a job-alerts toggle (mock) to the existing healthcare-aware filters.
- **Job detail (CORE)** — full posting, fit summary, static location-map image, similar jobs; Apply adds an application.
- **My applications (CORE, enhance)** — a timeline tracker mirroring the employer pipeline stage.
- **Career services (PREVIEW · Later)** — premium-services teaser.

## Phase D — Admin enhancements

- **Operations dashboard (CORE, enhance snapshot)** — counts + charts: jobs by status, candidates, applications, placements by stage, verification backlog.
- **Verification queue (CORE, enhance)** — add a mock document-viewer placeholder and write every Approve/Hold/Reject to an **audit log**.
- **Taxonomy manager (CORE — proves extensibility)** — add/edit specialties, sub-specialties, credentials, shift types, employment types **as data**, updating every dropdown in the app live. Call this out as the "extend without rework" proof.
- **User management & audit log (CORE)** — user list + roles + a chronological trail of sensitive actions (consent changes, unmasking, verifications).
- **Fraud & duplicate detection (PREVIEW · Phase 3)** — queue of flagged jobs/orgs with mock AI **risk scores** + reasons; block/allow.
- **Analytics & workforce intelligence (PREVIEW · Phase 3)** — time-to-fill trends, supply/demand by specialty (heatmap), retention trends, source mix.
- **Billing & plans (PREVIEW · Phase 2)** — subscription tiers (Talent Pipeline ₹7,500/mo; job boost ₹999), invoices, payment history (mock, INR).
- **Payroll (PREVIEW · Phase 4)** — per-employee-per-month (₹499 PEPM), employee list, mock payslip preview.

## Phase E — Recruiter marketplace (PREVIEW · Phase 2)

New persona showing the full four-sided marketplace:
- **Marketplace** — browse the open vacancy pool with eligibility filters; **accept a project**.
- **Submit candidates** — structured submission against an accepted vacancy.
- **My submissions & status** — track submitted candidates through the client pipeline.
- **Earnings** — mock commission/payout ledger.

## Data / seed

**Extend** the existing `seed.ts` (don't discard current records) so every new screen looks populated and charts are meaningful: grow to ~12 jobs and ~24 candidates with varied nuance (e.g. an O&G surgeon **primary on 140 C-sections** vs an **assisting-only** nurse; a cardiologist available **only 5–8 PM**; candidates missing a required licence), plus ~8 orgs (mixed verification), applications spread across all pipeline stages, sample recruiters + submissions, sample invoices, and mock analytics time-series. Reuse the existing taxonomy; extend it via the taxonomy manager.

## Build order & safety

Do the phases in order A → B → C → D → E. After each phase, run `npm run build` (static export) and fix any breakage before continuing. Keep **all existing CORE flows working**; if scope gets large, let PREVIEW screens be visually complete with lighter interactivity, but every screen listed must be present and navigable. Update the README to list the new screens and keep the two Vercel deploy paths.

## Acceptance checklist

- Still compiles as a **static export**; no server/runtime deps; zero runtime network calls; runs offline once built.
- Four personas reachable (Employer, Candidate, Recruiter, Admin); every new screen present and **Core/Preview badged**; About + Roadmap pages exist.
- New hero interactions work in-memory: job wizard + AI-assist, smart-match radar, compare, drag-and-drop pipeline, scheduler, recommendations, taxonomy edits update dropdowns live, audit log records actions, Reset demo restores seed.
- Command palette, guided tour, theme toggle, global search, toasts, skeletons all function.
- Charts render from mock data; INR everywhere; demo badge + Essentient footer on every page; responsive at phone width; no console errors.

## Non-goals

No real backend, DB, auth, payments, or external API; no real AI (all "AI"/risk/recommendation output is deterministic mock, labelled Preview where roadmap). Everything client-side and static. Do not remove or regress existing working features.
