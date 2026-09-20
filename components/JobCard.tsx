'use client';

import type { ReactNode } from 'react';
import { FitBadge, WhyThisFits } from './FitBadge';
import { JobStatusChip, VerificationChip } from './StatusChips';
import { Card, Chip } from './ui';
import type { FitResult, Job, Organisation } from '@/lib/types';

/** One job, rendered the same way wherever it appears. */
export function JobCard({
  job,
  organisation,
  fit,
  actions,
  showStatus = false,
}: {
  job: Job;
  organisation?: Organisation;
  fit?: FitResult;
  actions?: ReactNode;
  showStatus?: boolean;
}) {
  return (
    <Card as="li" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-slate-ink">{job.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{organisation?.name ?? 'Unknown organisation'}</span>
            <span aria-hidden="true">·</span>
            <span>{job.location}</span>
            {organisation ? <VerificationChip status={organisation.verificationStatus} /> : null}
            {showStatus ? <JobStatusChip status={job.status} /> : null}
          </p>
        </div>
        {fit ? <FitBadge fit={fit} /> : null}
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone="jade">{job.specialty}</Chip>
        <Chip>{job.subSpecialty}</Chip>
        <Chip>{job.shift}</Chip>
        <Chip>{job.employmentType}</Chip>
        <Chip>{job.minYearsInSpecialty}+ yrs</Chip>
        {job.surgical.required ? (
          <Chip tone="amber">
            Surgical: {job.surgical.minCaseVolume}+ as {job.surgical.role.toLowerCase()}
          </Chip>
        ) : null}
      </ul>

      <p className="mt-3 text-sm text-body">{job.description}</p>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <div className="flex gap-1.5">
          <dt className="text-muted">Salary band</dt>
          <dd className="text-body">{job.salaryBand}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Positions open</dt>
          <dd className="text-body">{job.positionsOpen}</dd>
        </div>
        <div className="flex gap-1.5 sm:col-span-2">
          <dt className="shrink-0 text-muted">Credentials</dt>
          <dd className="text-body">{job.requiredCredentials.join(', ') || 'None specified'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Posted</dt>
          <dd className="text-body">{job.postedOn}</dd>
        </div>
      </dl>

      {fit ? <WhyThisFits fit={fit} /> : null}

      {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </Card>
  );
}
