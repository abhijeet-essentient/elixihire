'use client';

import { ArrowRight, Command, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { NAV, ROLE_BLURB, ROLE_HOME, ROLE_LABEL } from '@/components/nav';
import { TierBadge } from '@/components/TierBadge';
import { Card, Chip } from '@/components/ui';
import { useDemo } from '@/lib/store';
import type { Role } from '@/lib/types';

const ROLES: Role[] = ['employer', 'candidate', 'recruiter', 'admin'];

export default function LandingPage() {
  const { setRole, jobs, candidates, applications, organisations, submissions } = useDemo();

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jade-dark">
        Interactive demo
      </p>
      <h1 className="mt-2 font-serif text-3xl text-slate-ink sm:text-4xl">
        ElixiHire — healthcare hiring, matched on what actually matters
      </h1>
      <p className="mt-3 max-w-2xl text-base text-body">
        A clickable stand-in for the real product: structured specialty, shift and credential
        matching, with operative track record — primary surgeon or assisting — treated as a
        first-class field. Pick a persona to start.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/about/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-body transition-colors hover:bg-jade-tint"
        >
          What is Core vs Preview?
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <PlayCircle aria-hidden="true" className="h-4 w-4" />
          Use <strong className="font-medium text-body">Take the tour</strong> in the header for the
          guided walkthrough
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Command aria-hidden="true" className="h-4 w-4" />
          <kbd className="rounded border border-hairline px-1 py-px text-[11px]">⌘K</kbd> jumps
          anywhere
        </span>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const screens = NAV[role];
          const coreCount = screens.filter((s) => s.tier === 'core').length;
          return (
            <Card as="li" key={role} className="transition-shadow hover:shadow-pop">
              <Link
                href={ROLE_HOME[role]}
                onClick={() => setRole(role)}
                className="flex h-full flex-col rounded-xl p-5"
              >
                <h2 className="font-serif text-xl text-slate-ink">
                  Enter as {ROLE_LABEL[role]}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">{ROLE_BLURB[role]}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {coreCount > 0 ? <TierBadge tier="core" size="sm" /> : null}
                  {coreCount < screens.length ? <TierBadge tier="preview" size="sm" /> : null}
                  <span className="text-xs text-muted">{screens.length} screens</span>
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-jade-dark">
                  Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Card>
          );
        })}
      </ul>

      <section className="mt-10">
        <h2 className="section-title">What is loaded</h2>
        <p className="mt-1 text-sm text-muted">
          Mock seed data held in your browser for this session. Nothing is sent anywhere, and{' '}
          <strong>Reset demo</strong> in the header puts it all back.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Jobs', jobs.length],
            ['Candidates', candidates.length],
            ['Applications', applications.length],
            ['Organisations', organisations.length],
            ['Submissions', submissions.length],
          ].map(([label, value]) => (
            <div key={label as string} className="card p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
              <dd className="mt-1 font-serif text-2xl text-slate-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="section-title">What this demo is not</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>No backend, database, authentication or network calls — it runs fully offline.</li>
          <li>
            No AI. Fit scores, risk scores and recommendations are deterministic rules you can read
            in the breakdown.
          </li>
          <li>Every person, organisation and identifier shown is invented for illustration.</li>
          <li>
            Screens badged <Chip tone="amber">Preview</Chip> are roadmap capability with lighter mock
            interactivity — see <Link href="/roadmap/" className="text-jade-dark underline underline-offset-2">the roadmap</Link>.
          </li>
        </ul>
      </section>
    </div>
  );
}
