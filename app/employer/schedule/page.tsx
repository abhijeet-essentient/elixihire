'use client';

import { addDays, format, parseISO } from 'date-fns';
import { CalendarClock, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StageChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, Section } from '@/components/ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import type { InterviewSlot, Job } from '@/lib/types';

/**
 * Slot proposals that respect the role's own shift pattern.
 *
 * An evening-only OPD consultant should never be offered a 9 AM slot, so the candidate
 * times on offer are derived from the job's shift rather than from a generic calendar.
 */
const TIMES_BY_SHIFT: Record<string, string[]> = {
  Day: ['09:00', '10:30', '12:00', '14:00', '15:30'],
  Evening: ['17:00', '18:00', '19:00', '20:00'],
  Night: ['21:00', '22:00', '23:00'],
  '5–8 PM OPD slot': ['17:00', '17:45', '18:30', '19:15'],
  '8–11 AM OPD slot': ['08:00', '08:45', '09:30', '10:15'],
  Rotational: ['09:00', '11:00', '14:00', '17:00', '20:00'],
  'On-call': ['08:30', '13:00', '18:30'],
  'Part-time / Locum': ['10:00', '11:30', '15:00'],
  'Weekend only': ['10:00', '11:30', '14:00'],
};

function timesFor(job: Job | undefined): string[] {
  if (!job) return TIMES_BY_SHIFT.Day;
  return TIMES_BY_SHIFT[job.shift] ?? TIMES_BY_SHIFT.Day;
}

export default function SchedulerPage() {
  const { applications, interviews, scheduleInterview, sendInterviewInvite, revealedCandidateIds } =
    useDemo();
  const { employerJobs, candidateById, jobById } = useSelectors();

  const scoped = useMemo(() => {
    const ids = new Set(employerJobs.map((j) => j.id));
    // Only people actually in play are worth scheduling.
    return applications.filter((a) => ids.has(a.jobId) && a.shortlisted);
  }, [applications, employerJobs]);

  const [applicationId, setApplicationId] = useState(scoped[0]?.id ?? '');
  const application = scoped.find((a) => a.id === applicationId) ?? scoped[0];
  const job = application ? jobById(application.jobId) : undefined;
  const candidate = application ? candidateById(application.candidateId) : undefined;

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date('2026-09-21T00:00:00'), i)),
    [],
  );
  const times = timesFor(job);

  const [day, setDay] = useState(() => format(days[0], 'yyyy-MM-dd'));
  const [time, setTime] = useState(times[0]);
  const [mode, setMode] = useState<InterviewSlot['mode']>('Video call');

  const proposed = interviews.filter((slot) => scoped.some((a) => a.id === slot.applicationId));

  if (scoped.length === 0) {
    return (
      <div>
        <PageHeader title="Interview scheduler" lede="Propose times that fit the role's rota." />
        <EmptyState
          title="Nobody is shortlisted yet"
          body="Shortlist an applicant and they become schedulable here."
        />
      </div>
    );
  }

  return (
    <div data-tour="scheduler">
      <PageHeader
        title="Interview scheduler"
        lede="Times on offer come from the role's own shift pattern — an evening-slot consultant is never offered a morning interview."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-5">
          <div>
            <label className="field-label" htmlFor="whom">
              Who
            </label>
            <select
              id="whom"
              className="input"
              value={application?.id ?? ''}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              {scoped.map((a) => {
                const c = candidateById(a.candidateId);
                const j = jobById(a.jobId);
                return (
                  <option key={a.id} value={a.id}>
                    {c ? viewCandidate(c, revealedCandidateIds.includes(c.id)).name : 'Unknown'} —{' '}
                    {j?.title}
                  </option>
                );
              })}
            </select>
          </div>

          {job ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Chip tone="jade">{job.shift}</Chip>
              <span>
                Slots below are filtered to this role&apos;s shift pattern.
                {candidate ? ` Candidate is available: ${candidate.availability.join(', ')}.` : ''}
              </span>
            </p>
          ) : null}

          <fieldset className="mt-5">
            <legend className="field-label">Day</legend>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => {
                const value = format(d, 'yyyy-MM-dd');
                const on = value === day;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDay(value)}
                    aria-pressed={on}
                    className={`rounded-lg border px-3 py-2 text-center text-xs transition-colors ${
                      on ? 'border-jade bg-jade text-white' : 'border-hairline hover:bg-jade-tint'
                    }`}
                  >
                    <span className="block font-medium">{format(d, 'EEE')}</span>
                    <span className="block opacity-80">{format(d, 'd MMM')}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="field-label">Time</legend>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => {
                const on = t === time;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    aria-pressed={on}
                    className={`rounded-lg border px-3 py-1.5 text-xs tabular-nums transition-colors ${
                      on ? 'border-jade bg-jade text-white' : 'border-hairline hover:bg-jade-tint'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="field-label">Mode</legend>
            <div className="flex flex-wrap gap-2">
              {(['Video call', 'In person', 'Telephone'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    mode === m ? 'border-jade bg-jade text-white' : 'border-hairline hover:bg-jade-tint'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <Button
              onClick={() =>
                application &&
                scheduleInterview({ applicationId: application.id, date: day, time, mode })
              }
            >
              <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
              Propose this slot
            </Button>
          </div>
        </Card>

        <aside>
          <h2 className="section-title">Proposed slots</h2>
          {proposed.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing proposed yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {proposed
                .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                .map((slot) => {
                  const app = applications.find((a) => a.id === slot.applicationId);
                  const c = app ? candidateById(app.candidateId) : undefined;
                  return (
                    <li key={slot.id} className="card p-3">
                      <p className="text-sm font-medium text-slate-ink">
                        {format(parseISO(slot.date), 'EEE d MMM')} · {slot.time}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {c ? viewCandidate(c, revealedCandidateIds.includes(c.id)).name : 'Unknown'} ·{' '}
                        {slot.mode}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Chip tone={slot.state === 'Confirmed' ? 'jade' : slot.state === 'Invited' ? 'blue' : 'neutral'}>
                          {slot.state}
                        </Chip>
                        {app ? <StageChip stage={app.stage} /> : null}
                        {slot.state === 'Proposed' ? (
                          <Button size="sm" variant="secondary" onClick={() => sendInterviewInvite(slot.id)}>
                            <Send aria-hidden="true" className="h-3 w-3" />
                            Send invite
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </aside>
      </div>

      <Section title="What happens on send">
        <DemoNote>
          Sending an invite moves the engagement to <strong>Interview</strong> on the pipeline and
          adds the slot to the candidate&apos;s timeline. No email, calendar entry or notification
          leaves the browser — this is a demo.
        </DemoNote>
      </Section>
    </div>
  );
}
