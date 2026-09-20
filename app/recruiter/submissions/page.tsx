'use client';

import { useMemo } from 'react';
import { DataTable, type Column } from '@/components/DataTable';
import { Chip, DemoNote, EmptyState, PageHeader, Section, StatTile, inr } from '@/components/ui';
import { maskedName } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import type { Submission, SubmissionStatus } from '@/lib/types';

const FLOW: SubmissionStatus[] = [
  'Submitted',
  'Client reviewing',
  'Interview',
  'Offer',
  'Placed',
];

function toneFor(status: SubmissionStatus) {
  if (status === 'Placed') return 'jade' as const;
  if (status === 'Rejected') return 'red' as const;
  if (status === 'Offer') return 'blue' as const;
  return 'amber' as const;
}

export default function SubmissionsPage() {
  const { submissions, setSubmissionStatus } = useDemo();
  const { activeRecruiter, jobById, candidateById, orgById } = useSelectors();

  const mine = useMemo(
    () =>
      submissions
        .filter((s) => s.recruiterId === activeRecruiter.id)
        .sort((a, b) => b.submittedOn.localeCompare(a.submittedOn)),
    [submissions, activeRecruiter.id],
  );

  const columns: Column<Submission>[] = [
    {
      key: 'candidate',
      header: 'Candidate',
      sortValue: (row) => candidateById(row.candidateId)?.fullName ?? '',
      render: (row) => {
        const candidate = candidateById(row.candidateId);
        return (
          <>
            <p className="font-medium text-slate-ink">
              {candidate ? maskedName(candidate.fullName) : 'Unknown'}
            </p>
            <p className="text-xs text-muted">{candidate?.headline}</p>
          </>
        );
      },
    },
    {
      key: 'job',
      header: 'Project',
      sortValue: (row) => jobById(row.jobId)?.title ?? '',
      render: (row) => {
        const job = jobById(row.jobId);
        return (
          <>
            <p className="text-body">{job?.title ?? 'Unknown'}</p>
            <p className="text-xs text-muted">
              {job ? orgById(job.organisationId)?.name : ''}
            </p>
          </>
        );
      },
    },
    {
      key: 'submitted',
      header: 'Submitted',
      sortValue: (row) => row.submittedOn,
      render: (row) => <span className="text-xs text-muted">{row.submittedOn}</span>,
    },
    {
      key: 'status',
      header: 'Client status',
      sortValue: (row) => row.status,
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={toneFor(row.status)}>{row.status}</Chip>
          {row.status !== 'Placed' && row.status !== 'Rejected' ? (
            <button
              type="button"
              onClick={() => {
                const next = FLOW[Math.min(FLOW.indexOf(row.status) + 1, FLOW.length - 1)];
                setSubmissionStatus(row.id, next);
              }}
              className="rounded text-[11px] font-medium text-jade-dark hover:underline"
            >
              advance
            </button>
          ) : null}
        </div>
      ),
    },
    {
      key: 'fee',
      header: 'Commission',
      sortValue: (row) => row.feeInr,
      render: (row) => (
        <>
          <p className="tabular-nums text-body">{row.feeInr > 0 ? inr(row.feeInr) : '—'}</p>
          <p className="text-xs text-muted">{row.payoutStatus}</p>
        </>
      ),
    },
  ];

  const live = mine.filter((s) => s.status !== 'Placed' && s.status !== 'Rejected');
  const placed = mine.filter((s) => s.status === 'Placed');

  return (
    <div>
      <PageHeader
        title="My submissions"
        lede={`Candidates ${activeRecruiter.agencyName} has put forward, and where each sits in the client's pipeline.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total submitted" value={mine.length} />
        <StatTile label="Live" value={live.length} />
        <StatTile label="Placed" value={placed.length} />
        <StatTile
          label="Conversion"
          value={mine.length ? `${Math.round((placed.length / mine.length) * 100)}%` : '—'}
          sub="submitted to placed"
        />
      </div>

      <Section title="All submissions" lede="Advance a status to see the ledger update.">
        {mine.length === 0 ? (
          <EmptyState
            title="Nothing submitted yet"
            body="Accept a project on the Marketplace, then submit a candidate against it."
          />
        ) : (
          <DataTable
            rows={mine}
            columns={columns}
            caption="Submissions by this recruiter"
            rowKey={(row) => row.id}
            filterOn={(row) => `${jobById(row.jobId)?.title ?? ''} ${row.status}`}
            filterPlaceholder="Filter submissions…"
            minWidth="56rem"
          />
        )}
      </Section>

      {mine.some((s) => s.note) ? (
        <Section title="Submission notes" lede="What you told the client alongside each candidate.">
          <ul className="space-y-2">
            {mine
              .filter((s) => s.note && s.note !== 'No note provided.')
              .map((submission) => {
                const candidate = candidateById(submission.candidateId);
                return (
                  <li key={submission.id} className="rounded-lg border border-hairline bg-jade-tint/40 p-3">
                    <p className="text-sm text-body">{submission.note}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {candidate ? maskedName(candidate.fullName) : 'Unknown'} ·{' '}
                      {jobById(submission.jobId)?.title} · {submission.submittedOn}
                    </p>
                  </li>
                );
              })}
          </ul>
        </Section>
      ) : null}

      <div className="mt-6">
        <DemoNote>
          Advancing a status here is a demo convenience — in the real product the client&apos;s own
          pipeline drives it, and a recruiter only ever sees the stage, never the internal notes.
        </DemoNote>
      </div>
    </div>
  );
}
