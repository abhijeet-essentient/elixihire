'use client';

import { useMemo, useState } from 'react';
import { PipelineBoard } from '@/components/PipelineBoard';
import { DemoNote, EmptyState, PageHeader, StatTile } from '@/components/ui';
import { useDemo, useSelectors } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';

export default function PipelinePage() {
  const { applications } = useDemo();
  const { employerJobs, employerOrg } = useSelectors();
  const [jobFilter, setJobFilter] = useState('all');

  const jobIds = useMemo(() => new Set(employerJobs.map((j) => j.id)), [employerJobs]);

  const scoped = useMemo(
    () =>
      applications.filter(
        (a) => jobIds.has(a.jobId) && (jobFilter === 'all' || a.jobId === jobFilter),
      ),
    [applications, jobIds, jobFilter],
  );

  const joined = scoped.filter((a) => a.stage === 'Joined' || a.stage === '90-day follow-up').length;

  return (
    <div>
      <PageHeader
        title="Placement pipeline"
        lede={`Every engagement at ${employerOrg.name}, Applied through to the 90-day follow-up. Move a card with the arrows, or open it to change stage and add a note.`}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="In pipeline" value={scoped.length} />
        <StatTile label="Shortlisted" value={scoped.filter((a) => a.shortlisted).length} />
        <StatTile label="At offer" value={scoped.filter((a) => a.stage === 'Offer').length} />
        <StatTile label="Joined" value={joined} sub="incl. 90-day follow-up" />
      </div>

      <div className="mb-4 max-w-sm">
        <label className="field-label" htmlFor="jobFilter">
          Filter by job
        </label>
        <select
          id="jobFilter"
          className="input"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="all">All jobs</option>
          {employerJobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      {scoped.length === 0 ? (
        <EmptyState
          title="Nothing in the pipeline"
          body="Shortlist an applicant and the engagement will appear on this board."
        />
      ) : (
        <PipelineBoard applications={scoped} />
      )}

      <div className="mt-6">
        <DemoNote>
          Stages are fixed at {PIPELINE_STAGES.join(' → ')}. Drag a card or use its arrow buttons;
          open a card for notes, the timeline and the interview slots proposed against it. All of it
          lives in memory for this session only.
        </DemoNote>
      </div>
    </div>
  );
}
