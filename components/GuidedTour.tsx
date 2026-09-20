'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui';

/**
 * A scripted walkthrough of the employer hero flow.
 *
 * Each step navigates to a screen and highlights one element by its `data-tour` tag.
 * The highlight is a positioned ring rather than a DOM change, so nothing about the
 * underlying screen is altered while the tour runs.
 */

interface TourStep {
  href: string;
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    href: '/employer/dashboard/',
    target: 'kpis',
    title: 'Where a hiring lead starts',
    body: 'Open roles, applicants in play, time-to-shortlist and placements — the numbers a hospital HR head is asked for every week.',
  },
  {
    href: '/employer/post-job/',
    target: 'wizard',
    title: 'Structured intake, not a text box',
    body: 'Specialty, sub-specialty, shift slot, credentials and the surgical requirement are captured as fields. That is what makes everything downstream possible.',
  },
  {
    href: '/employer/applicants/',
    target: 'applicants',
    title: 'Smart match with its reasoning shown',
    body: 'Each applicant is scored against those structured fields, with a radar of the per-dimension sub-scores and a criterion-by-criterion breakdown.',
  },
  {
    href: '/employer/compare/',
    target: 'compare',
    title: 'Two finalists, side by side',
    body: 'The same dimensions across shortlisted candidates, so the difference between leading 240 caesareans and assisting on 180 is impossible to miss.',
  },
  {
    href: '/employer/schedule/',
    target: 'scheduler',
    title: 'Slots that respect the rota',
    body: 'Proposed interview times are filtered by the role’s own shift pattern, so an evening-only consultant is never offered a 9 AM slot.',
  },
  {
    href: '/employer/pipeline/',
    target: 'pipeline',
    title: 'The spreadsheet replacement',
    body: 'Drag an engagement across Applied → Shortlisted → Interview → Offer → Joined → 90-day follow-up. This is the record both sides share.',
  },
];

export function useTourController() {
  const [step, setStep] = useState<number | null>(null);
  const start = useCallback(() => setStep(0), []);
  const stop = useCallback(() => setStep(null), []);
  return { step, setStep, start, stop };
}

export function GuidedTour({
  step,
  setStep,
  stop,
}: {
  step: number | null;
  setStep: (step: number | null) => void;
  stop: () => void;
}) {
  const router = useRouter();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const active = step === null ? null : STEPS[step];

  // Navigate to the step's screen.
  useEffect(() => {
    if (active) router.push(active.href);
  }, [active, router]);

  // Find and follow the highlighted element. Polling briefly covers the gap while the
  // next route mounts, without needing a mutation observer.
  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }
    let frame = 0;
    let tries = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${active.target}"]`);
      if (el) {
        const box = el.getBoundingClientRect();
        setRect(box);
        if (tries === 0) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      tries += 1;
      if (tries < 60) frame = window.requestAnimationFrame(find);
    };
    frame = window.requestAnimationFrame(find);
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop();
      if (event.key === 'ArrowRight') setStep(step + 1 >= STEPS.length ? null : step + 1);
      if (event.key === 'ArrowLeft' && step > 0) setStep(step - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, setStep, stop]);

  if (step === null || !active) return null;

  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="pointer-events-none fixed inset-0 z-[65]">
        {/* Highlight ring follows the target element. */}
        {rect ? (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute rounded-xl border-2 border-jade shadow-[0_0_0_9999px_rgba(12,32,30,0.55)]"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-ink/50" />
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          role="dialog"
          aria-label={`Tour step ${step + 1} of ${STEPS.length}`}
          className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(30rem,calc(100vw-2rem))]
                     -translate-x-1/2 rounded-2xl border border-hairline bg-surface-raised p-4 shadow-pop"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-jade-dark">
              Guided tour · {step + 1} of {STEPS.length}
            </span>
            <button
              type="button"
              onClick={stop}
              className="rounded text-xs text-muted underline-offset-2 hover:underline"
            >
              End tour
            </button>
          </div>

          <h2 className="mt-2 font-serif text-lg text-slate-ink">{active.title}</h2>
          <p className="mt-1 text-sm text-body">{active.body}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-1" aria-hidden="true">
              {STEPS.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-5 rounded-full ${index <= step ? 'bg-jade' : 'bg-hairline'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(last ? null : step + 1)}>
                {last ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
