'use client';

import Link from 'next/link';
import { useState } from 'react';
import { JobStatusChip, VerificationChip } from '@/components/StatusChips';
import { Button, Card, EmptyState, PageHeader, Select, TableWrap } from '@/components/ui';
import { EMPLOYMENT_TYPES, SHIFTS } from '@/lib/taxonomy';
import { useDemo, useSelectors } from '@/lib/store';
import type { Job, JobStatus } from '@/lib/types';

const STATUSES: JobStatus[] = ['Open', 'Paused', 'Closed'];

export default function EmployerJobsPage() {
  const { setJobStatus, applications } = useDemo();
  const { employerJobs, employerOrg } = useSelectors();
  const [editing, setEditing] = useState<Job | null>(null);

  const countFor = (jobId: string) => applications.filter((a) => a.jobId === jobId).length;

  return (
    <div>
      <PageHeader
        title="My jobs"
        lede={`Roles posted by ${employerOrg.name}. Pausing a role stops it appearing in candidate search without losing its pipeline.`}
        actions={
          <>
            <VerificationChip status={employerOrg.verificationStatus} />
            <Link href="/employer/post-job/">
              <Button>Post a job</Button>
            </Link>
          </>
        }
      />

      {employerJobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          body="Post a role and it will appear here immediately — the demo keeps it in memory for this session."
        />
      ) : (
        <TableWrap>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Jobs posted by {employerOrg.name}</caption>
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Role</th>
                <th scope="col" className="py-2 pr-3 font-medium">Specialty</th>
                <th scope="col" className="py-2 pr-3 font-medium">Shift</th>
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 pr-3 font-medium">Applicants</th>
                <th scope="col" className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employerJobs.map((job) => (
                <tr key={job.id} className="border-b border-hairline/70 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-ink">{job.title}</p>
                    <p className="text-xs text-muted">
                      {job.location} · {job.employmentType} · {job.positionsOpen} position
                      {job.positionsOpen === 1 ? '' : 's'}
                      {job.surgical.required
                        ? ` · ${job.surgical.minCaseVolume}+ cases as ${job.surgical.role.toLowerCase()}`
                        : ''}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <p className="text-body">{job.specialty}</p>
                    <p className="text-xs text-muted">{job.subSpecialty}</p>
                  </td>
                  <td className="py-3 pr-3 text-body">{job.shift}</td>
                  <td className="py-3 pr-3">
                    <JobStatusChip status={job.status} />
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-body">{countFor(job.id)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(job)}>
                        Edit
                      </Button>
                      {job.status === 'Open' ? (
                        <Button size="sm" variant="ghost" onClick={() => setJobStatus(job.id, 'Paused')}>
                          Pause
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setJobStatus(job.id, 'Open')}>
                          Reopen
                        </Button>
                      )}
                      {job.status !== 'Closed' ? (
                        <Button size="sm" variant="danger" onClick={() => setJobStatus(job.id, 'Closed')}>
                          Close
                        </Button>
                      ) : null}
                      <Link href={`/employer/applicants/?job=${job.id}`}>
                        <Button size="sm" variant="secondary">
                          Applicants
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {editing ? <QuickEdit job={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

/**
 * A deliberately small edit surface — the fields an employer actually tweaks after
 * posting. The full field set lives on the Post a job form.
 */
function QuickEdit({ job, onClose }: { job: Job; onClose: () => void }) {
  const { updateJob } = useDemo();
  const [draft, setDraft] = useState(job);

  return (
    <Card className="mt-6 p-5">
      <h2 className="section-title">Edit — {job.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Title</span>
          <input
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">Shift / time-slot</span>
          <Select
            options={SHIFTS}
            value={draft.shift}
            onChange={(e) => setDraft({ ...draft, shift: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">Employment type</span>
          <Select
            options={EMPLOYMENT_TYPES}
            value={draft.employmentType}
            onChange={(e) => setDraft({ ...draft, employmentType: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">Status</span>
          <Select
            options={STATUSES}
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as JobStatus })}
          />
        </label>
        <label className="block">
          <span className="field-label">Positions open</span>
          <input
            type="number"
            min={1}
            className="input"
            value={draft.positionsOpen}
            onChange={(e) => setDraft({ ...draft, positionsOpen: Number(e.target.value) || 1 })}
          />
        </label>
        <label className="block">
          <span className="field-label">Salary band</span>
          <input
            className="input"
            value={draft.salaryBand}
            onChange={(e) => setDraft({ ...draft, salaryBand: e.target.value })}
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={() => {
            updateJob(draft);
            onClose();
          }}
        >
          Save changes
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
