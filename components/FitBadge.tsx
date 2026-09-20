'use client';

import { useId, useState } from 'react';
import { Chip } from './ui';
import type { FitLabel, FitResult } from '@/lib/types';

const LABEL_STYLES: Record<FitLabel, string> = {
  Strong: 'bg-jade text-white border-jade',
  Good: 'bg-jade/15 text-jade-dark border-jade/30',
  Partial: 'bg-warn-bg text-warn-fg border-warn-border',
  Weak: 'bg-surface text-muted border-hairline',
};

const BAR_STYLES: Record<FitLabel, string> = {
  Strong: 'bg-jade',
  Good: 'bg-jade/60',
  Partial: 'bg-warn-fg',
  Weak: 'bg-muted/40',
};

/** Score + label, with a small meter so the spread is readable at a glance. */
export function FitBadge({ fit, showBar = true }: { fit: FitResult; showBar?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-baseline gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
          LABEL_STYLES[fit.label]
        }`}
      >
        <span className="tabular-nums">{fit.score}</span>
        <span className="font-medium">· {fit.label} fit</span>
      </span>
      {showBar ? (
        <span
          className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-hairline sm:block"
          role="img"
          aria-label={`Fit score ${fit.score} out of 100`}
        >
          <span
            className={`block h-full rounded-full ${BAR_STYLES[fit.label]}`}
            style={{ width: `${fit.score}%` }}
          />
        </span>
      ) : null}
    </div>
  );
}

/**
 * The "Why this fits" breakdown — every criterion the rules looked at, matched or not,
 * with the points it contributed. Nothing is hidden, which is the point: the score is
 * explainable because it is a rule, not a model.
 */
export function WhyThisFits({ fit, defaultOpen = false }: { fit: FitResult; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const unmetGates = fit.reasons.filter((r) => r.mandatory && !r.matched);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-jade-dark hover:underline"
      >
        <span aria-hidden="true" className={`transition-transform ${open ? 'rotate-90' : ''}`}>
          ›
        </span>
        {open ? 'Hide' : 'Why this fits'}
      </button>

      {open ? (
        <div id={panelId} className="mt-2 rounded-lg border border-hairline bg-jade-tint/40 p-3">
          {unmetGates.length > 0 ? (
            <p className="mb-3 rounded-md border border-warn-border bg-warn-bg px-2.5 py-2 text-xs text-warn-fg">
              <strong>Held below 60.</strong>{' '}
              {unmetGates.length === 1 ? 'A mandatory requirement is' : 'Mandatory requirements are'}{' '}
              unmet ({unmetGates.map((r) => r.criterion.toLowerCase()).join(', ')}), so this cannot
              read as a full match however strong the rest of the profile is.
            </p>
          ) : null}
          <ul className="space-y-2">
            {fit.reasons.map((reason) => (
              <li key={reason.criterion} className="flex gap-2.5 text-xs">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    reason.matched ? 'bg-jade text-white' : 'bg-danger-bg text-danger-fg'
                  }`}
                >
                  {reason.matched ? '✓' : '✗'}
                </span>
                <span className="min-w-0">
                  <span className="font-semibold text-slate-ink">
                    {reason.criterion}
                    <span className="sr-only">{reason.matched ? ' matched' : ' not matched'}</span>
                  </span>
                  {reason.mandatory ? (
                    <span className="ml-1.5 rounded border border-hairline bg-surface px-1 py-px text-[10px] uppercase tracking-wide text-muted">
                      required
                    </span>
                  ) : null}
                  {reason.weight > 0 ? (
                    <span className="ml-1.5 tabular-nums text-muted">
                      {reason.awarded}/{reason.weight} pts
                    </span>
                  ) : null}
                  <span className="block text-muted">{reason.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-hairline pt-2 text-[11px] text-muted">
            Deterministic rules, no AI — specialty and sub-specialty, years in specialty, shift fit,
            credentials, operative track record and location. Criteria marked <em>required</em> are
            gates: miss one and the score is capped. Same inputs, same score, every time.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Compact legend used above ranked lists. */
export function FitLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>Fit bands:</span>
      <Chip tone="jade">Strong 80+</Chip>
      <Chip tone="jade">Good 60–79</Chip>
      <Chip tone="amber">Partial 40–59</Chip>
      <Chip tone="neutral">Weak &lt;40</Chip>
    </div>
  );
}
