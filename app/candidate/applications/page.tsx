'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { FitBadge, WhyThisFits } from '@/components/FitBadge';
import { StageChip, VerificationChip } from '@/components/StatusChips';
import { Button, Card, DemoNote, EmptyState, PageHeader } from '@/components/ui';
import { CalendarClock } from 'lucide-react';
import { computeFit } from '@/lib/services/matchingService';
import { useDemo, useSelectors } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';

export default function MyApplicationsPage() {
  const { applications, organisations, interviews } = useDemo();
  const { activeCandidate, jobById } = useSelectors();

  const mine = useMemo(
    () =>
      applications
        .filter((a) => a.candidateId === activeCandidate.id)
        .sort((a, b) => b.updatedOn.localeCompare(a.updatedOn)),
    [applications, activeCandidate.id],
  );

  return (
    <div>
      <PageHeader
        title="My applications"
        lede="The same pipeline the employer sees — one shared record rather than a spreadsheet on their side and silence on yours."
      />

      {mine.length === 0 ? (
        <EmptyState
          title="You have not applied to anything yet"
          body="Head to Find jobs, open a role's fit breakdown, and apply."
        />
      ) : (
        <ul className="space-y-4">
          {mine.map((application) => {
            const job = jobById(application.jobId);
            if (!job) return null;
            const org = organisations.find((o) => o.id === job.organisationId);
            const fit = computeFit(job, activeCandidate);
            const stageIndex = PIPELINE_STAGES.indexOf(application.stage);

            return (
              <Card as="li" key={application.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg text-slate-ink">{job.title}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>{org?.name ?? 'Unknown organisation'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.location}</span>
                      {org ? <VerificationChip status={org.verificationStatus} /> : null}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <FitBadge fit={fit} />
                    <StageChip stage={application.stage} />
                  </div>
                </div>

                <ProgressTrail stageIndex={stageIndex} />

                <StageTimeline
                  stageIndex={stageIndex}
                  notes={application.notes}
                  appliedOn={application.appliedOn}
                  slots={interviews.filter((slot) => slot.applicationId === application.id)}
                />

                <p className="mt-3 text-xs text-muted">
                  Applied {application.appliedOn} · last updated {application.updatedOn}
                </p>

                {application.notes.length > 0 ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-jade-dark">
                      Employer notes ({application.notes.length})
                    </summary>
                    <ol className="mt-2 space-y-2">
                      {application.notes.map((note) => (
                        <li
                          key={note.id}
                          className="rounded-lg border border-hairline bg-jade-tint/40 p-3 text-xs"
                        >
                          <p className="text-body">{note.text}</p>
                          <p className="mt-1 text-muted">
                            {note.stage} · {note.addedOn}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}

                <WhyThisFits fit={fit} />
              </Card>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/candidate/jobs/">
          <Button variant="secondary">Find more jobs</Button>
        </Link>
        <DemoNote>
          Notes are shown here for demonstration. Which internal notes a candidate can see would be a
          policy decision in the real product.
        </DemoNote>
      </div>
    </div>
  );
}

/**
 * The detailed tracker: every stage, what happened at it, and any interview slot
 * proposed against this engagement. It mirrors what the employer sees on their board.
 */
function StageTimeline({
  stageIndex,
  notes,
  appliedOn,
  slots,
}: {
  stageIndex: number;
  notes: { id: string; stage: string; text: string; addedOn: string }[];
  appliedOn: string;
  slots: { id: string; date: string; time: string; mode: string; state: string }[];
}) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-medium text-jade-dark">
        Full timeline
      </summary>
      <ol className="relative mt-3 space-y-3 border-l border-hairline pl-4">
        {PIPELINE_STAGES.map((stage, index) => {
          const reached = index <= stageIndex;
          const stageNotes = notes.filter((n) => n.stage === stage);
          const stageSlots = stage === 'Interview' ? slots : [];
          return (
            <li key={stage} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                  index === stageIndex
                    ? 'border-jade bg-jade'
                    : reached
                      ? 'border-jade bg-surface-raised'
                      : 'border-hairline bg-surface-raised'
                }`}
              />
              <p className={`text-sm ${reached ? 'font-medium text-slate-ink' : 'text-muted'}`}>
                {stage}
                {index === 0 ? <span className="ml-2 text-xs font-normal text-muted">{appliedOn}</span> : null}
              </p>
              {stageNotes.map((note) => (
                <p key={note.id} className="mt-0.5 text-xs text-muted">
                  {note.addedOn} — {note.text}
                </p>
              ))}
              {stageSlots.map((slot) => (
                <p key={slot.id} className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <CalendarClock aria-hidden="true" className="h-3 w-3" />
                  {slot.date} at {slot.time} · {slot.mode} · {slot.state}
                </p>
              ))}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/** A compact read-only rendering of the six pipeline stages. */
function ProgressTrail({ stageIndex }: { stageIndex: number }) {
  return (
    <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Pipeline progress">
      {PIPELINE_STAGES.map((stage, index) => {
        const done = index <= stageIndex;
        return (
          <li
            key={stage}
            aria-current={index === stageIndex ? 'step' : undefined}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
              index === stageIndex
                ? 'border-jade bg-jade text-white'
                : done
                  ? 'border-jade/30 bg-jade/10 text-jade-dark'
                  : 'border-hairline bg-surface text-muted'
            }`}
          >
            {stage}
          </li>
        );
      })}
    </ol>
  );
}
