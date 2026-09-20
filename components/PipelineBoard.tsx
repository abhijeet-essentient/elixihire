'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';
import { EngagementDrawer } from './EngagementDrawer';
import { Button } from './ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';
import type { Application, PipelineStage } from '@/lib/types';

/**
 * The spreadsheet replacement: every engagement tracked from Applied all the way to the
 * 90-day follow-up.
 *
 * Cards drag between columns, and the same move is available from keyboard-reachable
 * arrow buttons on every card — dragging is never the only way to do something.
 */
export function PipelineBoard({ applications }: { applications: Application[] }) {
  const { setStage } = useDemo();
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const sensors = useSensors(
    // A small distance threshold so a click still reads as a click, not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (event: DragStartEvent) => setDragging(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;
    const stage = String(over.id) as PipelineStage;
    const application = applications.find((a) => a.id === String(active.id));
    if (application && PIPELINE_STAGES.includes(stage) && application.stage !== stage) {
      setStage(application.id, stage);
    }
  };

  const draggedApplication = applications.find((a) => a.id === dragging);

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div data-tour="pipeline" className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex gap-3" style={{ minWidth: `${PIPELINE_STAGES.length * 13.5}rem` }}>
            {PIPELINE_STAGES.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                applications={applications.filter((a) => a.stage === stage)}
                onOpen={setSelected}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {draggedApplication ? <CardBody application={draggedApplication} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <p className="mt-3 text-xs text-muted">
        Drag a card between columns, or use the ← → buttons on any card — both do the same thing, so
        the board works without a pointer.
      </p>

      <EngagementDrawer applicationId={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function StageColumn({
  stage,
  applications,
  onOpen,
}: {
  stage: PipelineStage;
  applications: Application[];
  onOpen: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <section className="w-52 shrink-0">
      <header className="flex items-center justify-between rounded-t-lg border border-hairline bg-jade-tint px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-ink">{stage}</h3>
        <span className="tabular-nums text-xs text-muted">{applications.length}</span>
      </header>
      <ul
        ref={setNodeRef}
        className={`min-h-[7rem] space-y-2 rounded-b-lg border border-t-0 p-2 transition-colors ${
          isOver ? 'border-jade bg-jade/10' : 'border-hairline bg-surface-raised'
        }`}
      >
        {applications.map((application) => (
          <DraggableCard key={application.id} application={application} onOpen={onOpen} />
        ))}
        {applications.length === 0 ? (
          <li className="px-1 py-3 text-center text-xs text-muted">Empty</li>
        ) : null}
      </ul>
    </section>
  );
}

function DraggableCard({
  application,
  onOpen,
}: {
  application: Application;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id });

  return (
    <li ref={setNodeRef} className={isDragging ? 'opacity-40' : undefined}>
      <CardBody
        application={application}
        onOpen={onOpen}
        handleProps={{ ...listeners, ...attributes }}
      />
    </li>
  );
}

function CardBody({
  application,
  onOpen,
  handleProps,
  overlay = false,
}: {
  application: Application;
  onOpen?: (id: string) => void;
  handleProps?: Record<string, unknown>;
  overlay?: boolean;
}) {
  const { moveStage, revealedCandidateIds } = useDemo();
  const { candidateById, jobById } = useSelectors();
  const candidate = candidateById(application.candidateId);
  const job = jobById(application.jobId);
  if (!candidate || !job) return null;

  const view = viewCandidate(candidate, revealedCandidateIds.includes(candidate.id));
  const index = PIPELINE_STAGES.indexOf(application.stage);

  return (
    <div
      className={`rounded-lg border border-hairline bg-surface-raised p-2.5 ${
        overlay ? 'w-48 rotate-2 shadow-pop' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          aria-label={`Drag ${view.name}`}
          className="mt-0.5 cursor-grab rounded text-muted active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onOpen?.(application.id)}
          className="block min-w-0 flex-1 rounded text-left text-sm font-medium text-slate-ink hover:text-jade-dark"
        >
          {view.name}
        </button>
      </div>

      <p className="mt-0.5 truncate text-xs text-muted">{job.title}</p>
      <p className="mt-0.5 text-[11px] text-muted">Updated {application.updatedOn}</p>

      {!overlay ? (
        <div className="mt-2 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={index <= 0}
            onClick={() => moveStage(application.id, 'back')}
            aria-label={`Move ${view.name} back a stage`}
            title="Move back a stage"
          >
            ←
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={index >= PIPELINE_STAGES.length - 1}
            onClick={() => moveStage(application.id, 'forward')}
            aria-label={`Advance ${view.name} a stage`}
            title="Advance a stage"
          >
            →
          </Button>
          {application.notes.length > 0 ? (
            <span className="ml-auto text-[11px] text-muted">
              {application.notes.length} note{application.notes.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
