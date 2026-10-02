# ElixiHire — interactive demo

A **static, front-end-only** interactive demo of **ElixiHire**, a recruitment platform built for
healthcare hiring. Produced by **Essentient** to accompany a proposal, it is a clickable stand-in
for wireframes: it looks and behaves like the product, but there is nothing behind it.

> **DEMO · illustrative only — no live data.** Every person, organisation, identifier and vacancy
> in this demo is invented.
>
> **Access is restricted.** The demo sits behind a login screen — see
> [Access control](#access-control) for how to configure it, and for an honest account of
> what a client-side gate on a static site can and cannot do.

---

## What this demo is

A walkthrough of four personas — **Employer**, **Candidate**, **Recruiter** and **Admin** — across
31 screens, showing the thing that makes ElixiHire different from a generic job board: **structured,
healthcare-specific matching**.

- **Specialty and sub-specialty depth** — Obstetrics & Gynaecology → high-risk obstetrics, not just
  "doctor".
- **Shift and time-slot fit** — a consultant free exactly 5–8 PM is matched to the 5–8 PM OPD slot,
  and someone day-only is not.
- **Credential and licence matching** — council registrations, NRP, ACLS, AERB clearance.
- **Procedural / surgical track record** — whether the candidate has actually **performed**
  surgeries, and whether as **primary/lead surgeon** or **assisting**. A registrar who has assisted
  on 180 caesareans does not score like a consultant who has led 240 of them, and the demo makes
  that difference visible.

Every score comes with a **"Why this fits"** breakdown and a **match radar** of per-dimension
sub-scores.

### Core vs Preview

Every screen carries one of two badges, and the badge is the delivery story as much as the label:

- **CORE** — Phase-1 scope, fully interactive. Posting a job, scoring applicants, comparing
  candidates, scheduling interviews, dragging the pipeline, editing the taxonomy and deciding
  verifications all genuinely change state.
- **PREVIEW · Phase N** — roadmap capability, visually complete and navigable with lighter mock
  interactivity, each naming the phase it belongs to.

The **About this demo** and **Roadmap** pages explain the split and map it to the four revenue
streams.

## Screens

| Persona | Screen | Tier |
|---|---|---|
| — | Landing, About this demo, Roadmap | Core |
| **Employer** | Dashboard (KPIs, funnel, demand by specialty) | Core |
| | My jobs · Post a job (4-step wizard + live preview + AI assist) | Core |
| | Applicants (fit score, breakdown, match radar) | Core |
| | Compare candidates (2–3 side by side) | Core |
| | Placement pipeline (drag-and-drop kanban + drawer) | Core |
| | Interview scheduler (shift-aware slots) | Core |
| | Offers · Messages · Talent Pipeline subscription | Preview · 2 |
| **Candidate** | Recommended for you (ranked feed + completeness meter) | Core |
| | Find jobs (healthcare filters, saved searches, alerts) | Core |
| | Job detail (fit summary, radar, similar jobs) | Core |
| | My profile (completeness, credential wallet, availability calendar, résumé) | Core |
| | My applications (pipeline timeline) | Core |
| | Career services | Preview · 3 |
| **Recruiter** | Marketplace · Submit candidates · My submissions · Earnings | Preview · 2 |
| **Admin** | Operations (counts, charts, organisations) | Core |
| | Verification queue (document viewer, audit trail) | Core |
| | Taxonomy manager (specialties/credentials as live data) | Core |
| | Users & audit log | Core |
| | Fraud & duplicates · Workforce analytics | Preview · 3 |
| | Billing & plans | Preview · 2 |
| | Payroll | Preview · 4 |

## Global features

- **Command palette** — `⌘K` / `Ctrl K` jumps to any screen, job or candidate, or runs a demo action.
- **Guided tour** — "Take the tour" walks the employer hero flow: dashboard → wizard → smart match →
  compare → scheduler → pipeline.
- **Light and dark themes**, both fully styled from the same tokens and remembered per browser.
- **Toasts** on every mutating action, **skeleton states** with a short simulated delay.
- **Reset demo** restores the seed at any time.

## What this demo is not

- **No backend.** No database, no authentication, no API routes, no server actions, no external
  services. It builds to a static site and runs fully offline.
- **No AI.** Fit scores come from a deterministic rule set in
  [`lib/services/matchingService.ts`](lib/services/matchingService.ts). "AI assist" on the job wizard
  is a template engine in [`lib/services/draftingService.ts`](lib/services/draftingService.ts); risk
  scores are fixed seed values with hand-written reasoning. Same inputs, same output, every time.
- **No real data.** All content is mock seed data in [`lib/seed.ts`](lib/seed.ts) — 12 jobs, 24
  candidates, 8 organisations, 21 applications, 2 recruiters, 5 submissions, invoices, payroll and
  six months of mock analytics. GSTIN, CIN and MSME values are invented strings in a plausible shape,
  validated against nothing.
- **No money moves.** Subscriptions, invoices, commissions and payroll are interfaces over mock
  numbers. There is no payment provider.

All money is in **INR**. State lives in memory for the session; `localStorage` is used only so a
reload does not throw away what you just did, with every access wrapped in `try`/`catch`.

## Access control

The demo is gated behind a login screen. Every route renders the restricted notice until
a viewer signs in, and the sign-in state lasts for the browser tab's session.

### Read this before relying on it

**This is a deterrent, not security.** The site is a static export with no server, so the
credential check necessarily runs in the visitor's browser. It will stop someone who
stumbles on the URL or is forwarded the link, which is what it is for. It will not stop
anyone who opens developer tools: the JavaScript bundle — including all the mock seed
data — is downloadable, and the gate can be bypassed by anyone who knows how.

Three things are done to make it as sound as a static site allows:

- **It fails closed.** A production build with no credential configured admits *nobody*.
  There is deliberately no default password, because a default committed to this
  repository would mean an unconfigured deployment was open to anyone who read the source.
- The credential is compared as a **SHA-256 hash**, so the plaintext password does not
  appear anywhere in the deployed files.
- The gate renders *instead of* each screen rather than on top of it, so the pre-rendered
  HTML and RSC payload of every route contain the login screen and **no screen content**.

Sessions are tied to the credential in force when they were created, so rotating the
password immediately invalidates every existing session.

**If you need real protection,** turn on Vercel's **Deployment Protection**
(Project → Settings → Deployment Protection). That gates the deployment at the edge,
before any file is served, so the bundle is never handed to an unauthorised visitor. It
works alongside this login screen; the two are not mutually exclusive. Check which
protection modes your Vercel plan includes.

### Verifying a deployment is actually gated

Because the variables are read at build time, the commonest failure is a deployment that
was never rebuilt. Check the live site from a terminal — this needs no browser and no
session:

```bash
# Should print 1 for every route. 0 means that page is serving ungated content.
for p in / /admin/payroll/ /employer/pipeline/ /candidate/profile/; do
  printf '%s ' "$p"
  curl -s "https://YOUR-DEPLOYMENT.vercel.app$p" | grep -c "Restricted demo"
done
```

If a route prints `0`, the deployment is stale: redeploy in Vercel and re-run. If it
prints `1` but you can still reach pages in your browser, you have an existing session in
that tab — use a private window, or **Sign out** in the header.

### Configuring the credential

Set these in Vercel under **Settings → Environment Variables**:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DEMO_USERNAME` | Username reviewers type. Defaults to `essentient`. |
| `NEXT_PUBLIC_DEMO_PASSWORD_SHA256` | **Preferred.** SHA-256 hash of the password. |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Fallback plaintext password. Readable in the bundle; the login screen warns while it is in use. |

Generate the hash locally and paste the result into Vercel:

```bash
npm run hash-password -- 'your-password-here'
```

> **These variables are read at build time, not at run time.** Changing one in Vercel has
> no effect until you **redeploy**. Vercel offers "Redeploy" on the latest deployment for
> exactly this.

With nothing configured, a production build shows a "this deployment is sealed" notice and
disables the sign-in form. That is the intended safe state, not a bug — but do not leave a
deployment there if you want reviewers to get in.

For local development, copy [`.env.example`](.env.example) to `.env.local` and fill it in.
With neither variable set, `npm run dev` accepts the password `local-dev-only`; that path
is compiled out of production builds. `.env.local` is gitignored — share the real
credential with reviewers out of band, never in the repo.

### Rotating or revoking access

- **Change the password:** regenerate the hash, update the Vercel variable, redeploy. Every
  existing session is invalidated automatically, because the session token is derived from
  the credential.
- **Lock everyone out immediately:** delete the credential variables and redeploy. The gate
  seals.
- Signing out is available in the header, the footer and the command palette.

### Caching and indexing

[`vercel.json`](vercel.json) sets `Cache-Control: no-store` on every document response, so
a stale HTML copy — from before the gate existed, or from before a credential rotation —
can never be served from an edge or browser cache. Hashed build assets under
`/_next/static/` are still cached immutably. It also sends `X-Robots-Tag: noindex`,
`X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`; `robots.txt` and a `noindex`
meta tag cover crawlers that ignore headers.

If you deployed before these headers existed, do a hard reload (Ctrl/Cmd-Shift-R) once —
your browser may still be holding the pre-gate HTML.

## Running it

Requires Node 18.17+ (developed on Node 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # static export → ./out
npm start          # serve ./out locally to check the built site
```

Other scripts: `npm run lint`, `npm run typecheck`.

The build is configured with `output: 'export'` in [`next.config.js`](next.config.js), so
`npm run build` produces a directory of plain HTML, CSS and JS in `out/` with no server component.

## Deploying to Vercel

The static output needs **no backend and no build settings**. It needs no environment
variables to *build*, but you should set the access credential before sharing the URL —
see [Access control](#access-control).

**(a) Git import — recommended**

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, **Add New → Project** and import the repository.
3. Vercel auto-detects Next.js and honours the `output: 'export'` config. Accept the defaults and
   deploy — there is nothing to configure.

**(b) From the command line**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

Run either from the project root. Any static host works equally well — the contents of `out/` can be
dropped onto Netlify, S3, GitHub Pages or a plain web server.

---

## Walking through the demo

Press **Take the tour** in the header for the scripted version, or drive it yourself:

1. **Employer → Applicants**, job *Consultant Obstetrician & Gynaecologist*. Open **Why this fits**
   on each applicant: Dr. A. R. scores **100 · Strong**; Dr. V. I. scores **46 · Partial** despite
   matching specialty, credentials and shift, because he has only ever *assisted*. The match radar
   shows exactly which axis collapsed. Both identities are **masked** — use **Reveal details
   (demo)**, then check the Admin audit log to see that unmasking was recorded.
2. **Employer → Compare candidates** overlays two finalists on one radar.
3. **Employer → Placement pipeline.** Drag a card between columns, or use its arrow buttons. Open a
   card for notes, timeline and interview slots.
4. **Employer → Interview scheduler.** Pick the evening-OPD cardiology role and note that only
   evening slots are offered.
5. **Candidate → My profile.** Change the surgical role from primary to assisting, save, then look
   at **Recommended** — every score has moved.
6. **Admin → Taxonomy manager.** Add a specialty, then open **Post a job** or the candidate profile
   — it is already in the dropdown, with a sub-specialty bucket ready.
7. **Admin → Verification queue.** Approve or hold an organisation with a note; it lands in the
   audit trail on **Users & audit log**.

## Project structure

```
app/                              App Router — /, /about, /roadmap,
                                    /employer/*, /candidate/*, /recruiter/*, /admin/*
components/
  AppFrame, RoleSwitcher, TierBadge, DemoBadge, Logos    shell & branding
  CommandPalette, GuidedTour, ThemeToggle, Toasts        global features
  ui.tsx, Overlays (Modal/Drawer), DataTable             shared primitives
  charts/index.tsx                                       Recharts wrappers
  Charts.tsx                                             hand-drawn SVG bars
  AuthGate, LoginScreen                                  access gate
  FitBadge, MaskedName, JobCard, PipelineBoard,          domain components
    EngagementDrawer, StatusChips
lib/types.ts                      Domain model
lib/seed.ts                       All mock data
lib/taxonomy.ts                   Starting reference lists (seeded into the editable taxonomy)
lib/mask.ts                       PII masking helpers
lib/store.tsx                     React Context in-memory store + Reset demo
lib/auth.tsx                      Access gate provider (client-side, see Access control)
lib/authConfig.ts                 Credential + session config, read by the layout too
lib/theme.tsx                     Light/dark theme + chart palette
lib/toast.tsx                     Toast notifications
lib/services/matchingService.ts   computeFit(job, candidate) — the rule-based USP
lib/services/recommendationService.ts  Candidate feed, similar jobs, profile completeness
lib/services/draftingService.ts   Deterministic "AI assist" templates
lib/services/verificationService.ts  Manual approve / hold / reject
scripts/hash-password.mjs         Generates NEXT_PUBLIC_DEMO_PASSWORD_SHA256
vercel.json                       no-store on HTML, noindex + security headers
public/robots.txt                 Disallows crawlers on the private demo
.env.example                      Credential variables, documented
next.config.js                    output: 'export'
```

### Client libraries

All bundled, none fetched at runtime: **recharts** (charts), **@dnd-kit** (pipeline drag-and-drop),
**cmdk** (command palette), **lucide-react** (icons), **framer-motion** (tour and overlay
transitions), **date-fns** (scheduler dates).

### How the fit score works

`computeFit(job, candidate)` returns `{ score, label, reasons, dimensions }`, where `dimensions`
are the six radar axes. Criteria are weighted — specialty
heaviest, then the surgical requirement where a job declares one, then experience, credentials,
shift, sub-specialty and location — and the score is normalised against the weight actually in play
for that job.

Some criteria are **gates**, not preferences: specialty, the declared credentials, the ability to
cover the shift at all, and the surgical requirement where one is set. Healthcare hiring genuinely
works this way — you cannot roster a nurse who lacks the mandatory council registration, and you
cannot put an assisting-only registrar on a lead-surgeon post. When a gate is not cleared, the score
is scaled down below the 60-point line however strong the rest of the profile is, and the breakdown
says which gate failed.

### Branding & theming

The `[ ElixiHire logo ]` and `[ Essentient logo ]` placeholders are inline SVG in
[`components/Logos.tsx`](components/Logos.tsx) — the only file to edit when swapping in the real
assets.

Colour is defined once as CSS custom properties in [`app/globals.css`](app/globals.css) and exposed
to Tailwind through [`tailwind.config.ts`](tailwind.config.ts), so a single `data-theme` swap on the
root element repaints the whole app. The light palette matches the proposal: jade `#127C67`, darker
teal `#0C5A4A`, slate `#1A2B2A`, body `#2E2E2E`, muted `#6B7A78`, borders `#D8E3E0`, tint `#F1F7F5`.
The dark palette is a deliberate re-step of the same brand hue rather than an inversion — jade
brightens so it still carries on a dark ground. Headings are a system serif, body a system sans; no
web fonts are fetched at runtime.

## Privacy & masking

Candidate names and contact details are masked to initials wherever an employer sees them, with a
**Reveal details (demo)** toggle that unmasks for the session only. In the real product this would be
governed by the candidate's consent flag plus the employer's access rules, not a UI switch — the
demo notes this wherever the toggle appears. Candidates whose consent flag is off are excluded from
employer sourcing searches entirely.

---

*A demo by Essentient™ · front-end only, not the working product · [essentient.co](https://essentient.co)*
