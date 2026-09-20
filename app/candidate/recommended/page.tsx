'use client';

import { ArrowRight, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FitBadge, FitLegend, WhyThisFits } from '@/components/FitBadge';
import { VerificationChip } from '@/components/StatusChips';
import {
  Button,
  Card,
  Chip,
  DemoNote,
  EmptyState,
  PageHeader,
  Section,
  SkeletonList,
} from '@/components/ui';
import { profileCompleteness, recommendJobs } from '@/lib/services/recommendationService';
import { useDemo, useSelectors } from '@/lib/store';

export default function RecommendedPage() {
  const { jobs, applications, organisations, applyToJob } = useDemo();
  const { activeCandidate } = useSelectors();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const recommendations = useMemo(
    () => recommendJobs(jobs, activeCandidate, { applications }),
    [jobs, activeCandidate, applications],
  );

  const completeness = useMemo(() => profileCompleteness(activeCandidate), [activeCandidate]);
  const missing = completeness.items.filter((item) => !item.done);

  return (
    <div>
      <PageHeader
        title="Recommended for you"
        lede={`Ranked against your own structured profile — ${activeCandidate.headline}.`}
        actions={<Link href="/candidate/jobs/"><Button variant="secondary">Search all jobs</Button></Link>}
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Profile completeness</h2>
            <p className="mt-0.5 text-sm text-muted">
              Weighted by how much each field actually moves a fit score.
            </p>
          </div>
          <span className="font-serif text-3xl text-slate-ink">{completeness.percent}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={completeness.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
          className="mt-3 h-2 overflow-hidden rounded-full bg-hairline"
        >
          <div
            className="h-full rounded-full bg-jade transition-[width] duration-500"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>

        {missing.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {missing.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-xs">
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn-fg" />
                <span>
                  <span className="font-medium text-slate-ink">{item.label}</span>
                  <span className="text-muted"> — {item.hint}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-jade-dark">
            Everything the matching rules read is filled in.
          </p>
        )}

        <Link
          href="/candidate/profile/"
          className="mt-3 inline-flex items-center gap-1 rounded text-sm font-medium text-jade-dark hover:underline"
        >
          Edit profile <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </Card>

      <Section
        title={`${recommendations.length} role${recommendations.length === 1 ? '' : 's'} worth a look`}
        lede="Roles you have not applied to yet, best fit first."
        actions={<FitLegend />}
      >
        {!ready ? (
          <SkeletonList count={3} />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="Nothing to recommend right now"
            body="You have applied to everything that fits, or your filters in Find jobs are narrower than the seed data."
          />
        ) : (
          <ul className="space-y-4">
            {recommendations.map(({ job, fit, headline, blocker, gated }) => {
              const org = organisations.find((o) => o.id === job.organisationId);
              return (
                <Card as="li" key={job.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg text-slate-ink">{job.title}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>{org?.name ?? 'Unknown organisation'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.location}</span>
                        {org ? <VerificationChip status={org.verificationStatus} /> : null}
                      </p>
                    </div>
                    <FitBadge fit={fit} />
                  </div>

                  <p className="mt-3 rounded-lg border border-jade/25 bg-jade/10 px-3 py-2 text-sm text-jade-dark">
                    <strong>Why you:</strong> {headline}
                  </p>

                  {blocker ? (
                    <p
                      className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                        gated
                          ? 'border border-warn-border bg-warn-bg text-warn-fg'
                          : 'border border-hairline text-muted'
                      }`}
                    >
                      <strong>{gated ? 'Blocking this match:' : 'Worth knowing:'}</strong> {blocker}
                    </p>
                  ) : null}

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    <Chip tone="jade">{job.specialty}</Chip>
                    <Chip>{job.subSpecialty}</Chip>
                    <Chip>{job.shift}</Chip>
                    <Chip>{job.employmentType}</Chip>
                    <Chip>{job.salaryBand}</Chip>
                  </ul>

                  <WhyThisFits fit={fit} />

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button onClick={() => applyToJob(job.id, activeCandidate.id)}>Apply</Button>
                    <Link href={`/candidate/job/?id=${job.id}`}>
                      <Button variant="secondary">View details</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="mt-6">
        <DemoNote>
          Recommendations reuse the same rules the employer sees, so a score never differs between
          the two sides. No model is involved — change your profile and the feed reorders instantly.
        </DemoNote>
      </div>
    </div>
  );
}
