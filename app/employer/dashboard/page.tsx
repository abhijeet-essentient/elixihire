'use client';

import { ArrowRight, BriefcaseBusiness, CalendarClock, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CategoryBars, FunnelBars } from '@/components/charts';
import { STATUS_COLORS } from '@/components/Charts';
import { JobStatusChip, StageChip, VerificationChip } from '@/components/StatusChips';
import { Button, Card, EmptyState, PageHeader, Section, Skeleton, StatTile } from '@/components/ui';
import { maskedName } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';

/** A short simulated load, so the dashboard feels like it is fetching something. */
function useSimulatedLoad(ms = 450) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return ready;
}

export default function EmployerDashboardPage() {
  const { applications, candidates, interviews } = useDemo();
  const { employerOrg, employerJobs, candidateById, jobById } = useSelectors();
  const ready = useSimulatedLoad();

  const scoped = useMemo(() => {
    const ids = new Set(employerJobs.map((j) => j.id));
    return applications.filter((a) => ids.has(a.jobId));
  }, [applications, employerJobs]);

  const openRoles = employerJobs.filter((j) => j.status === 'Open');
  const positions = openRoles.reduce((sum, j) => sum + j.positionsOpen, 0);
  const offers = scoped.filter((a) => a.stage === 'Offer').length;
  const joined = scoped.filter((a) => a.stage === 'Joined' || a.stage === '90-day follow-up').length;
  const shortlisted = scoped.filter((a) => a.shortlisted).length;

  const jobsByStatus = useMemo(
    () =>
      (['Open', 'Paused', 'Closed'] as const).map((status) => ({
        status,
        count: employerJobs.filter((j) => j.status === status).length,
      })),
    [employerJobs],
  );

  const funnel = useMemo(
    () => PIPELINE_STAGES.map((stage) => ({ stage, count: scoped.filter((a) => a.stage === stage).length })),
    [scoped],
  );

  const demandBySpecialty = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of openRoles) {
      counts.set(job.specialty, (counts.get(job.specialty) ?? 0) + job.positionsOpen);
    }
    return [...counts.entries()]
      .map(([specialty, positions]) => ({ specialty, positions }))
      .sort((a, b) => b.positions - a.positions);
  }, [openRoles]);

  const activity = useMemo(
    () =>
      [...scoped]
        .sort((a, b) => b.updatedOn.localeCompare(a.updatedOn))
        .slice(0, 6)
        .map((application) => ({
          application,
          candidate: candidateById(application.candidateId),
          job: jobById(application.jobId),
        })),
    [scoped, candidateById, jobById],
  );

  const upcoming = useMemo(
    () =>
      interviews
        .filter((slot) => scoped.some((a) => a.id === slot.applicationId))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 3),
    [interviews, scoped],
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        lede={`Hiring at ${employerOrg.name} at a glance.`}
        actions={
          <>
            <VerificationChip status={employerOrg.verificationStatus} />
            <Link href="/employer/post-job/">
              <Button>
                <BriefcaseBusiness aria-hidden="true" className="h-3.5 w-3.5" />
                Post a job
              </Button>
            </Link>
          </>
        }
      />

      <div data-tour="kpis" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ready ? (
          <>
            <StatTile label="Open roles" value={openRoles.length} sub={`${positions} positions`} />
            <StatTile label="Applicants" value={scoped.length} sub={`${shortlisted} shortlisted`} />
            <StatTile
              label="Time to shortlist"
              value="6 days"
              trend={{ text: '−2 vs last quarter', good: true }}
            />
            <StatTile label="Offers out" value={offers} />
            <StatTile label="Joined" value={joined} sub="incl. 90-day follow-up" />
          </>
        ) : (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card space-y-2 p-4">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          {ready ? (
            <FunnelBars
              title="Hiring funnel"
              hint="Every engagement at this organisation, by pipeline stage."
              data={funnel}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </Card>
        <Card className="p-5">
          {ready ? (
            <CategoryBars
              title="Demand by specialty"
              hint="Open positions across live roles."
              data={demandBySpecialty as unknown as Record<string, string | number>[]}
              xKey="specialty"
              yKey="positions"
              yLabel="positions"
            />
          ) : (
            <Skeleton className="h-[240px] w-full" />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="section-title">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing has moved yet.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {activity.map(({ application, candidate, job }) => (
                <li
                  key={application.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm"
                >
                  <UserRoundPlus aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                  <span className="font-medium text-slate-ink">
                    {candidate ? maskedName(candidate.fullName) : 'Unknown'}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{job?.title}</span>
                  <StageChip stage={application.stage} />
                  <span className="text-xs text-muted">{application.updatedOn}</span>
                </li>
              ))}
            </ol>
          )}
          <Link
            href="/employer/pipeline/"
            className="mt-3 inline-flex items-center gap-1 rounded text-sm font-medium text-jade-dark hover:underline"
          >
            Open the pipeline <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="section-title">Upcoming interviews</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No slots proposed yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((slot) => {
                const application = scoped.find((a) => a.id === slot.applicationId);
                const candidate = application ? candidateById(application.candidateId) : undefined;
                return (
                  <li key={slot.id} className="rounded-lg border border-hairline p-3">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-ink">
                      <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
                      {slot.date} · {slot.time}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {candidate ? maskedName(candidate.fullName) : 'Unknown'} · {slot.mode} · {slot.state}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/employer/schedule/"
            className="mt-3 inline-flex items-center gap-1 rounded text-sm font-medium text-jade-dark hover:underline"
          >
            Open the scheduler <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      <Section title="Your live roles" lede="Open and paused roles, newest first.">
        {employerJobs.length === 0 ? (
          <EmptyState title="No jobs yet" body="Post a role and it appears here immediately." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {employerJobs.slice(0, 6).map((job) => (
              <li key={job.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-ink">{job.title}</h3>
                  <JobStatusChip status={job.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {job.specialty} · {job.shift} · {job.location}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {applications.filter((a) => a.jobId === job.id).length} applicant
                  {applications.filter((a) => a.jobId === job.id).length === 1 ? '' : 's'} ·{' '}
                  {job.positionsOpen} position{job.positionsOpen === 1 ? '' : 's'} open
                </p>
                <Link
                  href={`/employer/applicants/?job=${job.id}`}
                  className="mt-3 inline-flex items-center gap-1 rounded text-xs font-medium text-jade-dark hover:underline"
                >
                  View applicants <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="mt-6 text-xs text-muted">
        Total candidates in the demo pool: {candidates.length}. Job status colours:{' '}
        <span style={{ color: STATUS_COLORS.Open }}>Open</span>,{' '}
        <span style={{ color: STATUS_COLORS.Paused }}>Paused</span>,{' '}
        <span style={{ color: STATUS_COLORS.Closed }}>Closed</span> — {jobsByStatus
          .map((s) => `${s.status} ${s.count}`)
          .join(', ')}.
      </p>
    </div>
  );
}
