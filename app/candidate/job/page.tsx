'use client';

import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { MatchRadar } from '@/components/charts';
import { FitBadge, WhyThisFits } from '@/components/FitBadge';
import { JobCard } from '@/components/JobCard';
import { VerificationChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, Section } from '@/components/ui';
import { computeFit } from '@/lib/services/matchingService';
import { similarJobs } from '@/lib/services/recommendationService';
import { useDemo, useSelectors } from '@/lib/store';

export default function JobDetailPage() {
  return (
    <Suspense fallback={<PageHeader title="Job detail" lede="Loading…" />}>
      <JobDetailView />
    </Suspense>
  );
}

function JobDetailView() {
  const params = useSearchParams();
  const { jobs, organisations, applications, applyToJob } = useDemo();
  const { activeCandidate } = useSelectors();

  const jobId = params.get('id');
  const job = jobs.find((j) => j.id === jobId) ?? jobs.find((j) => j.status === 'Open');
  const org = job ? organisations.find((o) => o.id === job.organisationId) : undefined;

  const fit = useMemo(() => (job ? computeFit(job, activeCandidate) : null), [job, activeCandidate]);
  const similar = useMemo(() => (job ? similarJobs(jobs, job) : []), [jobs, job]);

  if (!job || !fit) {
    return <EmptyState title="Job not found" body="It may have been closed or reset. Try Find jobs." />;
  }

  const applied = applications.some(
    (a) => a.jobId === job.id && a.candidateId === activeCandidate.id,
  );

  return (
    <div>
      <Link
        href="/candidate/jobs/"
        className="mb-3 inline-flex items-center gap-1 rounded text-sm text-muted hover:text-slate-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Back to search
      </Link>

      <PageHeader
        title={job.title}
        lede={`${org?.name ?? 'Unknown organisation'} · ${job.location}`}
        actions={
          <>
            {org ? <VerificationChip status={org.verificationStatus} /> : null}
            <FitBadge fit={fit} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <h2 className="section-title">The role</h2>
            <p className="mt-2 text-sm text-body">{job.description}</p>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              <Chip tone="jade">{job.specialty}</Chip>
              <Chip>{job.subSpecialty}</Chip>
              <Chip>{job.shift}</Chip>
              <Chip>{job.employmentType}</Chip>
              <Chip>{job.minYearsInSpecialty}+ yrs</Chip>
              {job.surgical.required ? (
                <Chip tone="amber">
                  {job.surgical.minCaseVolume}+ cases as {job.surgical.role.toLowerCase()}
                </Chip>
              ) : null}
            </ul>

            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Detail label="Salary band" value={job.salaryBand} />
              <Detail label="Positions open" value={String(job.positionsOpen)} />
              <Detail label="Role type" value={job.roleType} />
              <Detail label="Posted" value={job.postedOn} />
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted">Required credentials</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {job.requiredCredentials.length === 0 ? (
                    <span className="text-sm text-muted">None specified</span>
                  ) : (
                    job.requiredCredentials.map((credential) => {
                      const held = activeCandidate.credentials.includes(credential);
                      return (
                        <Chip key={credential} tone={held ? 'jade' : 'red'}>
                          {held ? '✓' : '✗'} {credential}
                        </Chip>
                      );
                    })
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="section-title">How you score against it</h2>
            <p className="mt-1 text-sm text-muted">
              Exactly the score and breakdown the employer sees for you — one shared calculation.
            </p>
            <div className="mt-3">
              <WhyThisFits fit={fit} defaultOpen />
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-4">
            <MatchRadar
              title="Your match profile"
              data={fit.dimensions.map((d) => ({ dimension: d.dimension, score: d.score }))}
              series={[{ key: 'score', label: 'You' }]}
              height={230}
            />
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-ink">Location</h2>
            <StaticMap location={job.location} />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {job.location}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Illustrative sketch drawn in the page — no map tiles are fetched.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-ink">Apply</h2>
            <p className="mt-1 text-xs text-muted">
              Applying adds an engagement that both you and the employer can see.
            </p>
            <Button
              className="mt-3 w-full"
              disabled={applied}
              onClick={() => applyToJob(job.id, activeCandidate.id)}
            >
              {applied ? 'Already applied' : 'Apply for this role'}
            </Button>
            {applied ? (
              <Link
                href="/candidate/applications/"
                className="mt-2 block rounded text-center text-xs font-medium text-jade-dark hover:underline"
              >
                Track it under My applications
              </Link>
            ) : null}
          </Card>
        </aside>
      </div>

      <Section title="Similar roles" lede="Other open posts close to this one.">
        {similar.length === 0 ? (
          <p className="text-sm text-muted">Nothing closely comparable is open right now.</p>
        ) : (
          <ul className="space-y-4">
            {similar.map((other) => (
              <JobCard
                key={other.id}
                job={other}
                organisation={organisations.find((o) => o.id === other.organisationId)}
                fit={computeFit(other, activeCandidate)}
                actions={
                  <Link href={`/candidate/job/?id=${other.id}`}>
                    <Button variant="secondary" size="sm">
                      View details
                    </Button>
                  </Link>
                }
              />
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-6">
        <DemoNote>
          Every figure on this page comes from the in-memory seed. Salary bands are illustrative INR
          ranges, not market data.
        </DemoNote>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-body">{value}</dd>
    </div>
  );
}

/**
 * A deliberately abstract location sketch.
 *
 * Real map tiles would be a network request, which this demo does not make. This is a
 * drawn placeholder that reads as "a map" without pretending to be one.
 */
function StaticMap({ location }: { location: string }) {
  // Derive a stable pseudo-layout from the location name so each city looks different
  // but the same city always looks the same.
  const seed = [...location].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const roads = Array.from({ length: 5 }, (_, i) => ((seed + i * 37) % 60) + 12);

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-hairline">
      <svg viewBox="0 0 200 110" className="h-auto w-full bg-jade-tint" role="img" aria-label={`Illustrative map of ${location}`}>
        {roads.map((offset, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={offset + i * 8}
            x2={200}
            y2={offset + i * 6}
            className="stroke-hairline"
            strokeWidth={i % 2 === 0 ? 3 : 1.5}
          />
        ))}
        {roads.map((offset, i) => (
          <line
            key={`v-${i}`}
            x1={offset * 2.4}
            y1={0}
            x2={offset * 2.2}
            y2={110}
            className="stroke-hairline"
            strokeWidth={i % 3 === 0 ? 3 : 1.5}
          />
        ))}
        <circle cx={100} cy={55} r={16} className="fill-jade" opacity={0.15} />
        <circle cx={100} cy={55} r={5} className="fill-jade" />
      </svg>
    </div>
  );
}
