'use client';

import { Button } from './ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo } from '@/lib/store';
import type { Candidate } from '@/lib/types';

/**
 * Candidate identity as an employer sees it: masked by default, unmaskable for the
 * session. The note is deliberate — viewers should understand that in the real product
 * this is a consent and access-control decision, not a UI toggle.
 */
export function CandidateIdentity({
  candidate,
  compact = false,
}: {
  candidate: Candidate;
  compact?: boolean;
}) {
  const { revealedCandidateIds, toggleReveal } = useDemo();
  const revealed = revealedCandidateIds.includes(candidate.id);
  const view = viewCandidate(candidate, revealed);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-ink">{view.name}</span>
        {!revealed ? (
          <span className="rounded border border-hairline bg-jade-tint px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            masked
          </span>
        ) : null}
      </div>

      <p className="mt-0.5 text-xs text-muted">{candidate.headline}</p>

      {!compact ? (
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <div className="flex gap-1.5">
            <dt className="text-muted">Email</dt>
            <dd className={revealed ? 'text-body' : 'text-muted'}>{view.email}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Phone</dt>
            <dd className={revealed ? 'text-body' : 'text-muted'}>{view.phone}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Current employer</dt>
            <dd className={revealed ? 'text-body' : 'text-muted'}>{view.employer}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Notice</dt>
            <dd className="text-body">{candidate.noticePeriod}</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => toggleReveal(candidate.id)}>
          {revealed ? 'Hide details' : 'Reveal details (demo)'}
        </Button>
        <span className="text-[11px] text-muted">
          In the real product, revealing is governed by candidate consent and employer access rules.
        </span>
      </div>
    </div>
  );
}
