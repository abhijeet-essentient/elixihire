'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { MatchRadar } from '@/components/charts';
import { FitBadge } from '@/components/FitBadge';
import { CandidateIdentity } from '@/components/MaskedName';
import { StageChip } from '@/components/StatusChips';
import { Card, Chip, DemoNote, EmptyState, PageHeader, TableWrap } from '@/components/ui';
import { computeFit } from '@/lib/services/matchingService';
import { useDemo, useSelectors } from '@/lib/store';
import type { Candidate, FitResult, Job } from '@/lib/types';

const MAX = 3;

export default function ComparePage() {
  return (
    <Suspense fallback={<PageHeader title="Compare candidates" lede="Loading…" />}>
      <CompareView />
    </Suspense>
  );
}

function CompareView() {
  const params = useSearchParams();
  const { applications } = useDemo();
  const { employerJobs, candidateById } = useSelectors();

  const requested = params.get('job');
  const [jobId, setJobId] = useState(
    requested && employerJobs.some((j) => j.id === requested) ? requested : employerJobs[0]?.id ?? '',
  );
  const job = employerJobs.find((j) => j.id === jobId) ?? employerJobs[0];

  const pool = useMemo(() => {
    if (!job) return [];
    return applications
      .filter((a) => a.jobId === job.id)
      .map((application) => {
        const candidate = candidateById(application.candidateId);
        return candidate ? { application, candidate, fit: computeFit(job, candidate) } : null;
      })
      .filter((x): x is { application: (typeof applications)[number]; candidate: Candidate; fit: FitResult } => x !== null)
      .sort((a, b) => b.fit.score - a.fit.score);
  }, [applications, job, candidateById]);

  // Default to the two best-fitting applicants — the comparison people actually want.
  const [selected, setSelected] = useState<string[]>([]);
  const effective = selected.length > 0 ? selected : pool.slice(0, 2).map((p) => p.candidate.id);
  const chosen = pool.filter((p) => effective.includes(p.candidate.id)).slice(0, MAX);

  const toggle = (candidateId: string) => {
    setSelected((current) => {
      const base = current.length > 0 ? current : pool.slice(0, 2).map((p) => p.candidate.id);
      if (base.includes(candidateId)) return base.filter((id) => id !== candidateId);
      if (base.length >= MAX) return [...base.slice(1), candidateId];
      return [...base, candidateId];
    });
  };

  if (!job) {
    return <EmptyState title="No jobs to compare against" body="Post a job and shortlist a few applicants first." />;
  }

  const radarData = chosen.length
    ? chosen[0].fit.dimensions.map((dimension, index) => {
        const row: Record<string, string | number> = { dimension: dimension.dimension };
        for (const entry of chosen) {
          row[entry.candidate.id] = entry.fit.dimensions[index].score;
        }
        return row;
      })
    : [];

  return (
    <div data-tour="compare">
      <PageHeader
        title="Compare candidates"
        lede="The same match dimensions side by side, so the difference between leading cases and assisting on them is impossible to miss."
      />

      <Card className="p-4">
        <label className="field-label" htmlFor="compareJob">
          Job
        </label>
        <select
          id="compareJob"
          className="input"
          value={job.id}
          onChange={(e) => {
            setJobId(e.target.value);
            setSelected([]);
          }}
        >
          {employerJobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.location}
            </option>
          ))}
        </select>

        <fieldset className="mt-4">
          <legend className="field-label">Pick up to {MAX} applicants</legend>
          {pool.length === 0 ? (
            <p className="text-sm text-muted">No applicants on this role yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pool.map(({ candidate, fit }) => {
                const on = effective.includes(candidate.id);
                return (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      on ? 'border-jade bg-jade/10 text-jade-dark' : 'border-hairline hover:bg-jade-tint'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-hairline"
                      checked={on}
                      onChange={() => toggle(candidate.id)}
                    />
                    <CandidateLabel candidate={candidate} />
                    <span className="tabular-nums text-muted">{fit.score}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      </Card>

      {chosen.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Select at least one applicant" body="Pick two to see them overlaid on the radar." />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <Card className="p-5">
              <MatchRadar
                title="Match profile"
                hint="Every axis is 0–100. An axis the job does not require shows full for everyone."
                data={radarData}
                height={300}
                series={chosen.map((entry) => ({
                  key: entry.candidate.id,
                  label: maskedShort(entry.candidate),
                }))}
              />
            </Card>

            <Card className="p-5">
              <h2 className="section-title">Side by side</h2>
              <div className="mt-3">
                <TableWrap minWidth={`${14 + chosen.length * 13}rem`}>
                  <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">Comparison of selected candidates</caption>
                    <thead>
                      <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                        <th scope="col" className="py-2 pr-3 font-medium">Dimension</th>
                        {chosen.map((entry) => (
                          <th key={entry.candidate.id} scope="col" className="py-2 pr-3 font-medium">
                            {maskedShort(entry.candidate)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-hairline/70">
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                          Overall fit
                        </th>
                        {chosen.map((entry) => (
                          <td key={entry.candidate.id} className="py-3 pr-3">
                            <FitBadge fit={entry.fit} showBar={false} />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-hairline/70">
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                          Stage
                        </th>
                        {chosen.map((entry) => (
                          <td key={entry.candidate.id} className="py-3 pr-3">
                            <StageChip stage={entry.application.stage} />
                          </td>
                        ))}
                      </tr>
                      {chosen[0].fit.dimensions.map((dimension, index) => (
                        <tr key={dimension.dimension} className="border-b border-hairline/70">
                          <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                            {dimension.dimension}
                            {!dimension.applicable ? (
                              <span className="ml-1.5 text-[10px] font-normal uppercase text-muted">n/a</span>
                            ) : null}
                          </th>
                          {chosen.map((entry) => {
                            const value = entry.fit.dimensions[index].score;
                            const best = Math.max(...chosen.map((c) => c.fit.dimensions[index].score));
                            const leads = value === best && chosen.length > 1 && dimension.applicable;
                            return (
                              <td key={entry.candidate.id} className="py-3 pr-3">
                                <span
                                  className={`tabular-nums ${leads ? 'font-semibold text-jade-dark' : 'text-body'}`}
                                >
                                  {value}
                                </span>
                                {leads ? <span className="ml-1 text-[10px] text-jade-dark">lead</span> : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-b border-hairline/70">
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                          Operative record
                        </th>
                        {chosen.map((entry) => (
                          <td key={entry.candidate.id} className="py-3 pr-3 text-xs">
                            {entry.candidate.surgical.performed ? (
                              <Chip
                                tone={
                                  entry.candidate.surgical.role === 'Primary / lead surgeon' ? 'jade' : 'amber'
                                }
                              >
                                {entry.candidate.surgical.caseVolume} ·{' '}
                                {entry.candidate.surgical.role.toLowerCase()}
                              </Chip>
                            ) : (
                              <Chip>None recorded</Chip>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-hairline/70">
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                          Availability
                        </th>
                        {chosen.map((entry) => (
                          <td key={entry.candidate.id} className="py-3 pr-3 text-xs text-muted">
                            {entry.candidate.availability.join(', ')}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th scope="row" className="py-3 pr-3 text-left font-medium text-slate-ink">
                          Notice
                        </th>
                        {chosen.map((entry) => (
                          <td key={entry.candidate.id} className="py-3 pr-3 text-xs text-muted">
                            {entry.candidate.noticePeriod}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </TableWrap>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {chosen.map((entry) => (
              <Card key={entry.candidate.id} className="p-4">
                <CandidateIdentity candidate={entry.candidate} compact />
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="mt-6">
        <DemoNote>
          Identities stay masked here exactly as they are on the applicant list — comparing people
          does not require knowing who they are.
        </DemoNote>
      </div>
    </div>
  );
}

function maskedShort(candidate: Candidate) {
  return candidate.fullName
    .replace(/^(Dr\.?|Sister|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '')
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('.');
}

function CandidateLabel({ candidate }: { candidate: Candidate }) {
  return <span className="font-medium">{maskedShort(candidate)}</span>;
}
