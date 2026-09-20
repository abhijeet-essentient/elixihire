'use client';

import { CheckCircle2, Store } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { VerificationChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, Section, StatTile, inr } from '@/components/ui';
import { useDemo, useSelectors, useTaxonomy } from '@/lib/store';
import type { Job } from '@/lib/types';

const ANY = 'Any';

/**
 * The vacancy pool a consultancy can work on.
 *
 * Eligibility is deliberately explicit: a recruiter sees why they can or cannot take a
 * project, rather than the list silently omitting things.
 */
function estimatedFee(job: Job): number {
  // 8.33% of the mid-point of the band, read from the seed's INR strings.
  const lakhs = job.salaryBand.match(/(\d+)[–-](\d+)\s*LPA/);
  if (lakhs) {
    const mid = ((Number(lakhs[1]) + Number(lakhs[2])) / 2) * 100000;
    return Math.round((mid * 0.0833) / 1000) * 1000;
  }
  return 60000;
}

export default function MarketplacePage() {
  const { jobs, organisations, acceptVacancy, submissions } = useDemo();
  const { activeRecruiter } = useSelectors();
  const taxonomy = useTaxonomy();

  const [specialty, setSpecialty] = useState(ANY);
  const [location, setLocation] = useState(ANY);
  const [onlyEligible, setOnlyEligible] = useState(true);

  const rows = useMemo(() => {
    return jobs
      .filter((job) => job.status === 'Open')
      .filter((job) => specialty === ANY || job.specialty === specialty)
      .filter((job) => location === ANY || job.location === location)
      .map((job) => {
        const org = organisations.find((o) => o.id === job.organisationId);
        const accepted = activeRecruiter.acceptedJobIds.includes(job.id);
        const specialisationMatch = activeRecruiter.specialisations.includes(job.specialty);
        const orgVerified = org?.verificationStatus === 'Verified';
        const eligible = specialisationMatch && orgVerified;
        const reasons: string[] = [];
        if (!specialisationMatch) {
          reasons.push(`${job.specialty} is outside your registered specialisations.`);
        }
        if (!orgVerified) {
          reasons.push(`${org?.name ?? 'The organisation'} is not verified yet.`);
        }
        return { job, org, accepted, eligible, reasons, fee: estimatedFee(job) };
      })
      .filter((row) => !onlyEligible || row.eligible)
      .sort((a, b) => b.fee - a.fee);
  }, [jobs, organisations, activeRecruiter, specialty, location, onlyEligible]);

  const mine = submissions.filter((s) => s.recruiterId === activeRecruiter.id);

  return (
    <div>
      <PageHeader
        title="Marketplace"
        lede={`Open vacancies available to ${activeRecruiter.agencyName}. Accept a project to start submitting candidates against it.`}
        actions={
          <Chip tone="jade">
            {activeRecruiter.placementsClosed} placements · {activeRecruiter.rating}★
          </Chip>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Accepted projects" value={activeRecruiter.acceptedJobIds.length} />
        <StatTile label="Live submissions" value={mine.filter((s) => s.status !== 'Placed' && s.status !== 'Rejected').length} />
        <StatTile label="Placed" value={mine.filter((s) => s.status === 'Placed').length} />
        <StatTile
          label="Your specialisations"
          value={activeRecruiter.specialisations.length}
          sub={activeRecruiter.specialisations.join(', ')}
        />
      </div>

      <Card className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="mk-specialty">
              Specialty
            </label>
            <select
              id="mk-specialty"
              className="input"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {[ANY, ...taxonomy.specialties].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="mk-location">
              Location
            </label>
            <select
              id="mk-location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {[ANY, ...taxonomy.locations].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-body">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-hairline"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
              />
              Only projects I am eligible for
            </label>
          </div>
        </div>
      </Card>

      <Section title={`${rows.length} project${rows.length === 1 ? '' : 's'}`}>
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing available on those filters"
            body="Widen the filters, or untick the eligibility box to see everything in the pool."
          />
        ) : (
          <ul className="space-y-4">
            {rows.map(({ job, org, accepted, eligible, reasons, fee }) => (
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
                  <div className="text-right">
                    <p className="font-serif text-xl text-slate-ink">{inr(fee)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">est. commission</p>
                  </div>
                </div>

                <ul className="mt-3 flex flex-wrap gap-1.5">
                  <Chip tone="jade">{job.specialty}</Chip>
                  <Chip>{job.subSpecialty}</Chip>
                  <Chip>{job.shift}</Chip>
                  <Chip>{job.positionsOpen} position{job.positionsOpen === 1 ? '' : 's'}</Chip>
                  <Chip>{job.salaryBand}</Chip>
                  {job.surgical.required ? (
                    <Chip tone="amber">
                      {job.surgical.minCaseVolume}+ as {job.surgical.role.toLowerCase()}
                    </Chip>
                  ) : null}
                </ul>

                <p className="mt-3 text-sm text-body">{job.description}</p>

                {!eligible ? (
                  <ul className="mt-3 space-y-1 rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
                    {reasons.map((reason) => (
                      <li key={reason}>· {reason}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {accepted ? (
                    <>
                      <Chip tone="jade">
                        <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                        Accepted
                      </Chip>
                      <Link href={`/recruiter/submit/?job=${job.id}`}>
                        <Button size="sm">Submit a candidate</Button>
                      </Link>
                    </>
                  ) : (
                    <Button
                      disabled={!eligible}
                      onClick={() => acceptVacancy(job.id)}
                      title={eligible ? undefined : 'You are not eligible for this project'}
                    >
                      <Store aria-hidden="true" className="h-3.5 w-3.5" />
                      Accept project
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-6">
        <DemoNote>
          Commission is estimated at 8.33% of the mid-point of the advertised band — the figure used
          in the proposal. Accepting a project changes in-memory state only.
        </DemoNote>
      </div>
    </div>
  );
}
