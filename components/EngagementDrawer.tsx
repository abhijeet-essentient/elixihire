'use client';

import { CalendarClock, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from './Overlays';
import { StageChip } from './StatusChips';
import { TierBadge } from './TierBadge';
import { Button, Chip } from './ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';
import type { PipelineStage } from '@/lib/types';

/**
 * One engagement in full: stage control, notes, the interview slots proposed against it,
 * and a status timeline assembled from the notes and stage history we do hold.
 */
export function EngagementDrawer({
  applicationId,
  onClose,
}: {
  applicationId: string | null;
  onClose: () => void;
}) {
  const { applications, addNote, setStage, revealedCandidateIds, interviews } = useDemo();
  const { candidateById, jobById } = useSelectors();
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'notes' | 'timeline' | 'messages'>('notes');

  const application = applications.find((a) => a.id === applicationId);
  const candidate = application ? candidateById(application.candidateId) : undefined;
  const job = application ? jobById(application.jobId) : undefined;
  const open = Boolean(application && candidate && job);

  if (!application || !candidate || !job) {
    return <Drawer open={false} onClose={onClose} title="Engagement">{null}</Drawer>;
  }

  const view = viewCandidate(candidate, revealedCandidateIds.includes(candidate.id));
  const slots = interviews.filter((slot) => slot.applicationId === application.id);
  const stageIndex = PIPELINE_STAGES.indexOf(application.stage);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={view.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>{job.title}</span>
          <StageChip stage={application.stage} />
          {application.shortlisted ? <Chip tone="jade">Shortlisted</Chip> : null}
        </span>
      }
      footer={
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addNote(application.id, note);
            setNote('');
          }}
        >
          <label className="sr-only" htmlFor={`drawer-note-${application.id}`}>
            Add a note
          </label>
          <input
            id={`drawer-note-${application.id}`}
            className="input flex-1"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
          />
          <Button type="submit" disabled={!note.trim()}>
            Add
          </Button>
        </form>
      }
    >
      <div>
        <label className="field-label" htmlFor={`drawer-stage-${application.id}`}>
          Stage
        </label>
        <select
          id={`drawer-stage-${application.id}`}
          className="input"
          value={application.stage}
          onChange={(e) => setStage(application.id, e.target.value as PipelineStage)}
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex gap-1 border-b border-hairline">
        {(
          [
            ['notes', 'Notes'],
            ['timeline', 'Timeline'],
            ['messages', 'Messages'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? 'true' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === key
                ? 'border-jade font-medium text-jade-dark'
                : 'border-transparent text-muted hover:text-slate-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'notes' ? (
        <div className="mt-4">
          {application.notes.length === 0 ? (
            <p className="text-sm text-muted">No notes yet.</p>
          ) : (
            <ol className="space-y-2">
              {application.notes.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-hairline bg-jade-tint/40 p-3">
                  <p className="text-sm text-body">{entry.text}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {entry.stage} · {entry.addedOn}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      {tab === 'timeline' ? (
        <div className="mt-4">
          <ol className="relative space-y-3 border-l border-hairline pl-4">
            {PIPELINE_STAGES.map((stage, index) => {
              const reached = index <= stageIndex;
              const stageNotes = application.notes.filter((n) => n.stage === stage);
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
                  <p
                    className={`text-sm ${reached ? 'font-medium text-slate-ink' : 'text-muted'}`}
                  >
                    {stage}
                  </p>
                  {stageNotes.map((n) => (
                    <p key={n.id} className="mt-0.5 text-xs text-muted">
                      {n.addedOn} — {n.text}
                    </p>
                  ))}
                </li>
              );
            })}
          </ol>

          {slots.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-ink">Interview slots</h3>
              <ul className="mt-2 space-y-2">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex items-center gap-2 rounded-lg border border-hairline p-2.5 text-xs"
                  >
                    <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
                    <span className="text-body">
                      {slot.date} · {slot.time}
                    </span>
                    <Chip tone={slot.state === 'Confirmed' ? 'jade' : 'blue'}>{slot.state}</Chip>
                    <span className="ml-auto text-muted">{slot.mode}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'messages' ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <TierBadge tier="preview" phase={2} size="sm" />
            <span className="text-xs text-muted">Threaded messaging is roadmap capability.</span>
          </div>
          <ul className="space-y-2">
            <li className="rounded-lg rounded-tl-sm border border-hairline bg-jade-tint/40 p-3">
              <p className="text-sm text-body">
                Thanks for applying — are you able to make an interview later this week?
              </p>
              <p className="mt-1 text-[11px] text-muted">{job.title} team · mock message</p>
            </li>
            <li className="ml-6 rounded-lg rounded-tr-sm border border-jade/25 bg-jade/10 p-3">
              <p className="text-sm text-body">
                Yes — any evening after 6 works around my current rota.
              </p>
              <p className="mt-1 text-[11px] text-muted">{view.name} · mock message</p>
            </li>
          </ul>
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-dashed border-hairline p-3 text-xs text-muted">
            <MessageSquare aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            In the full product this is a real thread with attachments and read state. Nothing here
            is sent anywhere.
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
