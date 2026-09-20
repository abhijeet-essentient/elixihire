'use client';

import { ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, Section, StatTile } from '@/components/ui';
import { useDemo } from '@/lib/store';
import type { RiskFlag } from '@/lib/types';

/**
 * Fraud & duplicate detection — Preview, phase 3.
 *
 * Risk scores here are fixed seed values with their reasoning written out, not model
 * output. The screen's real point is the workflow: a score never acts on its own, a
 * human decides, and the decision is audited.
 */
function toneFor(score: number) {
  if (score >= 75) return 'red' as const;
  if (score >= 50) return 'amber' as const;
  return 'neutral' as const;
}

export default function FraudPage() {
  const { riskFlags, setRiskState } = useDemo();
  const open = riskFlags.filter((f) => f.state === 'Open');
  const decided = riskFlags.filter((f) => f.state !== 'Open');

  return (
    <div>
      <PageHeader
        title="Fraud & duplicate detection"
        lede="Flagged jobs and organisations with a risk score and the reasons behind it. A score never acts on its own — a person decides, and the decision is audited."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Open flags" value={open.length} />
        <StatTile label="High risk" value={riskFlags.filter((f) => f.score >= 75).length} sub="score 75+" />
        <StatTile label="Blocked" value={riskFlags.filter((f) => f.state === 'Blocked').length} />
        <StatTile label="Allowed" value={riskFlags.filter((f) => f.state === 'Allowed').length} />
      </div>

      <Section title="Open flags" lede="Awaiting a human decision.">
        {open.length === 0 ? (
          <EmptyState title="Queue is clear" body="Every flag has been decided. Reset the demo to bring them back." />
        ) : (
          <ul className="space-y-4">
            {open.map((flag) => (
              <FlagCard key={flag.id} flag={flag} onDecide={setRiskState} />
            ))}
          </ul>
        )}
      </Section>

      {decided.length > 0 ? (
        <Section title="Decided" lede="Recorded in the audit log.">
          <ul className="space-y-2">
            {decided.map((flag) => (
              <li
                key={flag.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline px-4 py-3 text-sm"
              >
                <span className="min-w-0 flex-1 text-body">{flag.subject}</span>
                <Chip tone={toneFor(flag.score)}>Risk {flag.score}</Chip>
                <Chip tone={flag.state === 'Blocked' ? 'red' : 'jade'}>{flag.state}</Chip>
                <Button size="sm" variant="ghost" onClick={() => setRiskState(flag.id, flag.state === 'Blocked' ? 'Allowed' : 'Blocked')}>
                  Reverse
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="mt-6">
        <DemoNote>
          Scores are fixed seed values with hand-written reasoning — there is no model, no training
          data and no automated blocking anywhere in this demo.
        </DemoNote>
      </div>
    </div>
  );
}

function FlagCard({
  flag,
  onDecide,
}: {
  flag: RiskFlag;
  onDecide: (id: string, state: 'Allowed' | 'Blocked') => void;
}) {
  return (
    <Card as="li" className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-slate-ink">{flag.subject}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {flag.subjectType} · raised {flag.raisedOn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert
            aria-hidden="true"
            className={`h-5 w-5 ${flag.score >= 75 ? 'text-danger-fg' : 'text-warn-fg'}`}
          />
          <div className="text-right">
            <p className="font-serif text-2xl text-slate-ink">{flag.score}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">risk score</p>
          </div>
        </div>
      </div>

      <div
        role="img"
        aria-label={`Risk score ${flag.score} out of 100`}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-hairline"
      >
        <div
          className={`h-full rounded-full ${flag.score >= 75 ? 'bg-danger-fg' : 'bg-warn-fg'}`}
          style={{ width: `${flag.score}%` }}
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-ink">Why it was flagged</h3>
      <ul className="mt-2 space-y-1.5">
        {flag.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-sm text-body">
            <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
            {reason}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" onClick={() => onDecide(flag.id, 'Blocked')}>
          <ShieldX aria-hidden="true" className="h-3.5 w-3.5" />
          Block
        </Button>
        <Button variant="secondary" onClick={() => onDecide(flag.id, 'Allowed')}>
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Allow
        </Button>
      </div>
    </Card>
  );
}
