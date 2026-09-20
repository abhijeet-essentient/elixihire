'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { MatchRadar } from '@/components/charts';
import { FitBadge, FitLegend, WhyThisFits } from '@/components/FitBadge';
import { CandidateIdentity } from '@/components/MaskedName';
import { JobStatusChip, StageChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader } from '@/components/ui';
import Link from 'next/link';
import { computeFit, rankCandidates } from '@/lib/services/matchingService';
import { useDemo, useSelectors } from '@/lib/store';
import type { Application, Candidate, Job } from '@/lib/types';

export default function ApplicantsPage() {
  // useSearchParams needs a Suspense boundary under static export.
  return (
    <Suspense
      fallback={
        <PageHeader
          title="Applicants"
          lede="Every applicant is scored against the job's structured requirements."
        />
      }
    >
      <ApplicantsView />
    </Suspense>
  );
}

function ApplicantsView() {
  const params = useSearchParams();
  const { employerJobs, candidateById } = useSelectors();
  const { applications } = useDemo();

  const requested = params.get('job');
  const [selectedId, setSelectedId] = useState<string>(
    requested && employerJobs.some((j) => j.id === requested)
      ? requested
      : (employerJobs[0]?.id ?? ''),
  );

  const job = employerJobs.find((j) => j.id === selectedId) ?? employerJobs[0];
  const jobApplications = useMemo(
    () => applications.filter((a) => a.jobId === job?.id),
    [applications, job?.id],
  );

  // Best fit first — that is the whole point of scoring them.
  const rankedApplications = useMemo(() => {
    if (!job) return [];
    return [...jobApplications].sort((a, b) => {
      const ca = candidateById(a.candidateId);
      const cb = candidateById(b.candidateId);
      const sa = ca ? computeFit(job, ca).score : -1;
      const sb = cb ? computeFit(job, cb).score : -1;
      return sb - sa || a.id.localeCompare(b.id);
    });
  }, [jobApplications, job, candidateById]);

  if (!job) {
    return (
      <EmptyState title="No jobs to show" body="Post a job first and its applicants will appear here." />
    );
  }

  return (
    <div>
      <PageHeader
        title="Applicants"
        lede="Every applicant is scored against the job's structured requirements. Identities stay masked until you choose to reveal them."
        actions={<JobStatusChip status={job.status} />}
      />

      <Card className="p-4">
        <label className="field-label" htmlFor="jobPicker">
          Job
        </label>
        <select
          id="jobPicker"
          className="input"
          value={job.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {employerJobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.location} ({applications.filter((a) => a.jobId === j.id).length} applicant
              {applications.filter((a) => a.jobId === j.id).length === 1 ? '' : 's'})
            </option>
          ))}
        </select>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          <Chip tone="jade">{job.specialty}</Chip>
          <Chip>{job.subSpecialty}</Chip>
          <Chip>{job.shift}</Chip>
          <Chip>{job.minYearsInSpecialty}+ yrs</Chip>
          {job.requiredCredentials.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {job.surgical.required ? (
            <Chip tone="amber">
              {job.surgical.minCaseVolume}+ cases as {job.surgical.role.toLowerCase()}
            </Chip>
          ) : null}
        </ul>
      </Card>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">
            {jobApplications.length} applicant{jobApplications.length === 1 ? '' : 's'}
          </h2>
          <FitLegend />
        </div>

        {jobApplications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Switch to the Candidate persona and apply to this role — it will show up here straight away."
          />
        ) : (
          <ul data-tour="applicants" className="space-y-4">
            {rankedApplications.map((application) => (
              <ApplicantRow key={application.id} application={application} job={job} />
            ))}
          </ul>
        )}
      </div>

      <SourcingSuggestions job={job} />
    </div>
  );
}

function ApplicantRow({ application, job }: { application: Application; job: Job }) {
  const { toggleShortlist } = useDemo();
  const { candidateById } = useSelectors();
  const candidate = candidateById(application.candidateId);
  if (!candidate) return null;

  const fit = computeFit(job, candidate);

  return (
    <Card as="li" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CandidateIdentity candidate={candidate} />
        <div className="flex flex-col items-end gap-2">
          <FitBadge fit={fit} />
          <StageChip stage={application.stage} />
        </div>
      </div>

      <CandidateFacts candidate={candidate} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <WhyThisFits fit={fit} defaultOpen />
        </div>
        <div className="rounded-lg border border-hairline p-2">
          <MatchRadar
            title="Match profile"
            hint="Each axis is that criterion scored 0–100."
            height={210}
            data={fit.dimensions.map((d) => ({ dimension: d.dimension, score: d.score }))}
            series={[{ key: 'score', label: 'Fit' }]}
          />
          {fit.dimensions.some((d) => !d.applicable) ? (
            <p className="px-2 pb-1 text-[11px] text-muted">
              {fit.dimensions
                .filter((d) => !d.applicable)
                .map((d) => d.dimension)
                .join(', ')}
              : not required by this role, so shown at full.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant={application.shortlisted ? 'ghost' : 'primary'}
          size="sm"
          onClick={() => toggleShortlist(application.id)}
        >
          {application.shortlisted ? 'Remove from shortlist' : 'Shortlist'}
        </Button>
        <Link href={`/employer/compare/?job=${job.id}`}>
          <Button size="sm" variant="ghost">
            Compare
          </Button>
        </Link>
        <span className="text-xs text-muted">
          Applied {application.appliedOn} · {application.source}
        </span>
      </div>
    </Card>
  );
}

/** The structured facts an employer needs, without any identifying detail. */
function CandidateFacts({ candidate }: { candidate: Candidate }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {candidate.specialties.map((s) => (
        <Chip key={s.specialty} tone="jade">
          {s.specialty} · {s.years} yr{s.years === 1 ? '' : 's'}
        </Chip>
      ))}
      {candidate.availability.map((a) => (
        <Chip key={a}>{a}</Chip>
      ))}
      {candidate.surgical.performed ? (
        <Chip tone={candidate.surgical.role === 'Primary / lead surgeon' ? 'jade' : 'amber'}>
          {candidate.surgical.caseVolume} cases · {candidate.surgical.role.toLowerCase()}
        </Chip>
      ) : (
        <Chip tone="neutral">No operative experience</Chip>
      )}
    </ul>
  );
}

/**
 * Sourcing: the same rules run across the whole talent pool, not just people who
 * happened to apply. Candidates who have not consented to be discoverable are excluded.
 */
function SourcingSuggestions({ job }: { job: Job }) {
  const { candidates, applications } = useDemo();
  const [open, setOpen] = useState(false);
  const withheldCount = candidates.filter((c) => !c.consentToShare).length;

  const suggestions = useMemo(() => {
    const applied = new Set(
      applications.filter((a) => a.jobId === job.id).map((a) => a.candidateId),
    );
    return rankCandidates(
      job,
      candidates.filter((c) => c.consentToShare && !applied.has(c.id)),
    ).slice(0, 4);
  }, [applications, candidates, job]);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-jade-dark hover:underline"
      >
        <span aria-hidden="true" className={`transition-transform ${open ? 'rotate-90' : ''}`}>
          ›
        </span>
        {open ? 'Hide' : 'Show'} sourcing suggestions from the talent pool ({suggestions.length})
      </button>

      {open ? (
        <div className="mt-3">
          <DemoNote>
            Same rules, run across candidates who have not applied. Profiles with consent switched
            off are excluded entirely — {withheldCount} in this seed.
          </DemoNote>
          <ul className="mt-3 space-y-3">
            {suggestions.map(({ candidate, fit }) => (
              <Card as="li" key={candidate.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CandidateIdentity candidate={candidate} compact />
                  <FitBadge fit={fit} />
                </div>
                <CandidateFacts candidate={candidate} />
                <WhyThisFits fit={fit} />
              </Card>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
