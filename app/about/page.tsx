'use client';

import { TierBadge } from '@/components/TierBadge';
import { Card, Section } from '@/components/ui';

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl text-slate-ink">About this demo</h1>
      <p className="mt-3 text-base text-body">
        This is a clickable stand-in for wireframes, built by Essentient to accompany a proposal for
        <strong> ElixiHire</strong>, a recruitment platform for healthcare hiring. It runs entirely
        in your browser. There is no server, no database, no account and no network call once the
        page has loaded.
      </p>

      <Section title="Core vs Preview">
        <p className="text-sm text-body">
          Screens carry one of two badges, and the badge is the delivery story as much as the label:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <TierBadge tier="core" />
            <h2 className="mt-3 font-serif text-lg text-slate-ink">Core</h2>
            <p className="mt-1 text-sm text-body">
              Phase-1 scope, and fully interactive here. Posting a job, scoring applicants, comparing
              candidates, scheduling an interview, dragging the pipeline, editing the taxonomy and
              deciding a verification all genuinely change the demo&apos;s state.
            </p>
          </Card>
          <Card className="p-5">
            <TierBadge tier="preview" phase={2} />
            <h2 className="mt-3 font-serif text-lg text-slate-ink">Preview</h2>
            <p className="mt-1 text-sm text-body">
              Roadmap capability, shown so you can see the shape of the whole product rather than
              only its first release. These screens are visually complete and navigable with lighter
              mock interactivity, and each names the phase it belongs to.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="What is real here">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-body">
          <li>
            <strong>The matching rules are real logic.</strong> Fit scores come from a deterministic
            rule set you can read criterion by criterion in any &quot;Why this fits&quot; panel. Same
            inputs, same score, every time.
          </li>
          <li>
            <strong>State changes persist for your session.</strong> Everything you do updates
            in-memory state and survives a reload; <strong>Reset demo</strong> restores the seed.
          </li>
          <li>
            <strong>The taxonomy is data.</strong> Edit a specialty or credential in the Admin
            taxonomy manager and every dropdown in the app follows immediately.
          </li>
        </ul>
      </Section>

      <Section title="What is not real">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-body">
          <li>
            <strong>Nobody here exists.</strong> Every clinician, organisation, GSTIN, CIN and MSME
            number is invented for illustration and validated against nothing.
          </li>
          <li>
            <strong>There is no AI.</strong> Anything labelled &quot;AI assist&quot;, a risk score or
            a recommendation is a deterministic template or rule, marked Preview where it is roadmap.
          </li>
          <li>
            <strong>Nothing is sent anywhere.</strong> Invites, messages, offers, payments and
            payroll are mock interfaces. No email, no payment and no external service is involved.
          </li>
          <li>
            <strong>There is no authentication.</strong> The persona switcher stands in for signing
            in as an employer, candidate, recruiter or administrator.
          </li>
        </ul>
      </Section>

      <Section title="Privacy and masking">
        <p className="text-sm text-body">
          Candidate names and contact details are masked to initials anywhere an employer sees them.
          The <strong>Reveal details (demo)</strong> toggle unmasks for the session and writes an
          entry to the audit log — in the real product this would be governed by the candidate&apos;s
          consent flag and the employer&apos;s access rules, not a button. Candidates whose consent
          flag is off are excluded from employer sourcing entirely.
        </p>
      </Section>

      <Section title="Getting around">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-body">
          <li>
            Press <kbd className="rounded border border-hairline px-1 py-px text-xs">⌘K</kbd> or{' '}
            <kbd className="rounded border border-hairline px-1 py-px text-xs">Ctrl K</kbd> for the
            command palette — every screen, job and candidate in one search box.
          </li>
          <li><strong>Take the tour</strong> in the header walks the employer hero flow end to end.</li>
          <li>The persona switcher moves between Employer, Candidate, Recruiter and Admin.</li>
          <li>Light and dark themes are both fully styled; the toggle sits next to the switcher.</li>
        </ul>
      </Section>
    </div>
  );
}
