# Claude Code build prompt — ElixiHire interactive demo (static, front-end only)

> Paste everything below the line into Claude Code, from the root of an empty folder.
> It builds a static, no-backend interactive demo that deploys to Vercel with zero config.

---

## Role & goal

You are building a **static, front-end-only interactive demo** of a healthcare recruitment platform called **ElixiHire**. The demo is produced by **Essentient** and accompanies a proposal; it is a clickable stand-in for wireframes — it must *look and feel* like the real product but has **no backend, no database, no authentication, no real logic, and no network calls**. All data is mocked in the front end and all interactivity is client-side and in-memory. It will be hosted as a **static site on Vercel**.

Build the whole thing, run the production build to confirm it compiles, and write a short README with run + deploy steps.

## What ElixiHire is (context for the screens)

ElixiHire is a recruitment platform built specifically for healthcare hiring (hospitals, clinics, diagnostics/labs, pharma, health-tech). Its differentiator versus generic job boards is **structured, healthcare-specific matching**: specialty and sub-specialty depth, shift / time-slot fit (e.g. an evening 5–8 PM OPD slot), credential/licence matching, and **procedural/surgical track record** (has the person actually performed surgeries — and were they the **primary/lead surgeon** or **assisting**). The demo must make this differentiator obvious.

Four user types exist in the full product: Employers, Recruiters/Consultancies, Candidates, Admin. **This demo covers only Employer, Candidate, and Admin** (Recruiter is out of scope). Since there is no auth, provide a **role switcher** so the viewer can move between the three personas.

## Tech stack & hard constraints

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS.** Configure `output: 'export'` so it builds to a fully static site; Vercel deploys it with zero config. No API routes, no server components that fetch, no server actions.
- **No backend of any kind**: no database, no auth, no external APIs, no fonts/images fetched from the network at runtime (bundle everything or use system/Tailwind fonts and inline SVG). It must run fully offline once built.
- **State is client-side and in-memory** via React Context (or Zustand). Actions (post a job, apply, advance a candidate, verify an org) mutate in-memory state so the demo feels live within a session. Add a **"Reset demo"** control that restores seed data. `localStorage` may be used *only* as an optional convenience to persist within one browser; wrap every access in try/catch and work correctly if it's empty.
- Responsive (works at phone width, no horizontal scroll), keyboard-accessible, semantic HTML.
- Keep it a clean, well-structured codebase — this demo doubles as a sample of our engineering.

## Branding & design system

- The **product** shown is branded **ElixiHire**; put an `[ ElixiHire logo ]` placeholder in the app header (leave it as a clearly swappable component/asset).
- A small **persistent badge** in the header or a top ribbon reads: **"DEMO · illustrative only — no live data"**.
- The **footer** reads: **"A demo by Essentient™ · front-end only, not the working product"**, with an `[ Essentient logo ]` placeholder.
- Palette (match the proposal): jade/teal accent `#127C67`, darker teal `#0C5A4A`, near-black slate `#1A2B2A`, body text `#2E2E2E`, muted `#6B7A78`, light borders `#D8E3E0`, subtle fill `#F1F7F5`, white surfaces. Support a clean light theme (dark mode optional). Use a serif for major headings (e.g. Georgia/system serif) and a sans (system UI / Inter-like) for body — no runtime web-font fetch.
- One cohesive system: consistent cards, chips, tables, buttons, form controls. Aim for a polished, enterprise-SaaS look, not a toy.

## Screens to build

Provide a left nav or top nav scoped to the active role, plus the global role switcher.

### 0. Entry / role switcher
A simple landing that introduces the demo in one line and lets the viewer enter as **Employer**, **Candidate**, or **Admin**. The chosen role is switchable at any time from the header.

### Employer
1. **Post a job** — a structured form with healthcare-specific fields (see field list). Emphasise the structured inputs (specialty, sub-specialty, shift/time-slot, credentials, surgical requirement) as selects/toggles, not free text. On submit, the job is added to in-memory state and appears in the job list.
2. **My jobs** — list/table of the employer's jobs with status (Open / Paused / Closed) and applicant counts; edit/pause/close actions.
3. **Applicants for a job** — for a selected job, show applicants each with a **rule-based Fit indicator** (score + Strong/Good/Partial label) and an expandable **"Why this fits"** breakdown (matched vs unmatched criteria). **Candidate identity is masked by default** (initials + hidden contact); a **"Reveal details (demo)"** action unmasks. Allow **Shortlist**.
4. **Placement pipeline** — a board or table tracking each shortlisted candidate–job engagement through **Applied → Shortlisted → Interview → Offer → Joined → 90-day follow-up**, with the ability to advance/revert status and add a note. This is the spreadsheet replacement.

### Candidate
1. **My profile** — structured healthcare profile builder (see field list), including a **consent / visibility** toggle and **surgical experience** (performed yes/no; primary vs assisting; case volume).
2. **Find jobs** — job search with **healthcare-aware filters**: specialty, sub-specialty, shift/time-slot, location, employment type, credential requirement. Each result shows the same Fit indicator computed against *the candidate's own profile*. **Apply** adds an application.
3. **My applications** — list of applied jobs with their pipeline status (mirrors what the employer sees).

### Admin
1. **Verification queue** — pending employer organisations (with captured identifiers like GST/CIN/MSME as mock strings) to **Approve / Hold / Reject**; the decision updates the org's state and is recorded in a simple audit list.
2. **Operational snapshot** — a small dashboard of counts: jobs by status, candidates, applications, placements by pipeline stage. Simple stat tiles + one or two lightweight charts (pure SVG or a tiny lib; no network).

## Data model & seed data

Put all types in `lib/types.ts` and all seed data in `lib/seed.ts`. Seed realistically so the demo is convincing.

**Taxonomy (reference lists):**
- Role types: Doctor/Consultant, Nurse, Diagnostic technician, Lab technologist, Pharmacist, Allied health, Hospital administration/management, Support.
- Specialties: Obstetrics & Gynaecology, Paediatrics/Neonatology, Cardiology, Radiology, Anaesthesia, Emergency Medicine, Oncology, Pathology, Physiotherapy (extendable).
- Sub-specialty examples: nursing → maternity/neonatal, ICU/critical care, OT; radiology → MRI, CT, ultrasound.
- Credentials/licences: council/board registrations, certifications, mandatory licences (use plausible mock names).
- Shift/time-slot: Day, Evening, Night, specific slots (e.g. "5–8 PM OPD"), Rotational, On-call, Part-time/Locum.
- Employment types: Full-time, Part-time, Contract, Locum/Visiting, Consultant (fee-for-service).

**Job fields:** id, organisation, orgVerificationStatus, role type, specialty, sub-specialty, minimum years in specialty, required credentials/licences, shift/time-slot, employment type, location, salary band, positions open, description, **surgical requirement** (required: yes/no; role: primary or assisting; min case volume), status.

**Candidate fields:** id, display name (for masking), role type, specialties held, years of experience per specialty, credentials/licences held, availability (shift/time-slot), preferred locations, employment-type preference, **surgical experience** (performed: yes/no; role: primary/assisting; case volume), consent/visibility flag, contact (masked until revealed).

Seed roughly: **6–8 jobs**, **10–14 candidates** (varied so fit scores differ and the surgical/shift nuances actually change outcomes — e.g. an O&G surgeon who was primary on 120 C-sections vs a nurse with only assisting experience; a cardiologist available specifically 5–8 PM), **4–6 organisations** (mix of verified/pending), and some pre-seeded applications so the pipeline isn't empty.

## The matching rule (the USP — deterministic, no AI)

Implement in `lib/services/matchingService.ts` as a single pure function `computeFit(job, candidate) → { score: number, label: 'Strong'|'Good'|'Partial'|'Weak', reasons: {criterion, matched, detail}[] }`. Keep it behind this one module so the interface mirrors the real product (where AI would later replace the rules). Deterministic weighting, e.g.:

- Specialty match (candidate holds the job's specialty) — heaviest.
- Sub-specialty / focus match.
- Experience threshold met (years in that specialty ≥ job minimum).
- Shift / time-slot compatibility.
- Credential/licence match (candidate holds all required).
- Surgical requirement match (if the job requires performed surgeries as **primary**, a candidate with only **assisting** experience must not score as if fully matched).
- Location match.

Return a 0–100 score, a label, and a human-readable reasons list so the UI can render "Why this fits" (matched ✓ / unmatched ✗ with a short detail each). Also add a light `lib/services/verificationService.ts` (manual approve/hold/reject) so the module boundaries echo the real architecture.

## Masking rule

Candidate PII (full name, contact) is masked by default anywhere an employer sees it: show initials + role/specialty, hide contact. A **"Reveal details (demo)"** toggle unmasks for the session. Add a one-line note that in the real product this is governed by consent + access rules.

## Suggested structure

```
app/                     # App Router: /, /employer/*, /candidate/*, /admin/*
components/               # Header, Footer, RoleSwitcher, DemoBadge, FitBadge,
                         #   MaskedName, JobCard, CandidateCard, PipelineBoard,
                         #   StatTile, form controls, Table, Chip, Button
lib/types.ts
lib/seed.ts
lib/taxonomy.ts
lib/store.tsx            # React Context/Zustand in-memory store + Reset
lib/services/matchingService.ts
lib/services/verificationService.ts
next.config.js           # output: 'export'
README.md
```

## README & deploy

Write a README with: what the demo is (and is not), `npm install` / `npm run dev` / `npm run build`, and **two deploy paths to Vercel**: (a) push to a Git repo and import in Vercel (framework auto-detected, no settings needed), and (b) `npm i -g vercel && vercel` from the project root. State that the static output requires no environment variables and no backend.

## Acceptance checklist (verify before finishing)

- Builds cleanly with `npm run build` as a **static export**; no server/runtime dependencies; no network calls at runtime.
- All three personas reachable via the role switcher; every screen listed above is present and navigable.
- Posting a job, applying, shortlisting, advancing pipeline status, and approving/holding/rejecting an org all update the in-memory state live; **Reset demo** restores seed.
- Fit indicator visibly changes across candidates and correctly reflects specialty, experience, shift, credential, and **surgical primary-vs-assisting** differences, with a readable "Why this fits" breakdown.
- Candidate details are masked by default and can be revealed.
- "DEMO — no live data" badge and the Essentient footer are visible on every page; ElixiHire product branding in the app header with a swappable logo placeholder.
- Responsive at phone width, keyboard-navigable, no console errors.

## Non-goals (do not build)

Recruiter marketplace, payments/subscriptions/billing, payroll, AI/ML matching, automated fraud/duplicate detection, social distribution, document management/e-sign, real authentication, any server or database, any external API. Rules only, all client-side.
