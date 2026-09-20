'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { FitBadge, WhyThisFits } from '@/components/FitBadge';
import { Button, Card, Chip, DemoNote, EmptyState, Field, PageHeader, inr } from '@/components/ui';
import { maskedName } from '@/lib/mask';
import { computeFit, rankCandidates } from '@/lib/services/matchingService';
import { useDemo, useSelectors } from '@/lib/store';

export default function SubmitPage() {
  return (
    <Suspense fallback={<PageHeader title="Submit candidates" lede="Loading…" />}>
      <SubmitView />
    </Suspense>
  );
}

function SubmitView() {
  const params = useSearchParams();
  const router = useRouter();
  const { jobs, candidates, submissions, addSubmission, organisations } = useDemo();
  const { activeRecruiter } = useSelectors();

  const acceptedJobs = useMemo(
    () => jobs.filter((job) => activeRecruiter.acceptedJobIds.includes(job.id)),
    [jobs, activeRecruiter],
  );

  const requested = params.get('job');
  const [jobId, setJobId] = useState(
    requested && acceptedJobs.some((j) => j.id === requested) ? requested : acceptedJobs[0]?.id ?? '',
  );
  const job = acceptedJobs.find((j) => j.id === jobId) ?? acceptedJobs[0];

  const alreadySubmitted = useMemo(
    () =>
      new Set(
        submissions
          .filter((s) => s.recruiterId === activeRecruiter.id && s.jobId === job?.id)
          .map((s) => s.candidateId),
      ),
    [submissions, activeRecruiter.id, job?.id],
  );

  const ranked = useMemo(() => {
    if (!job) return [];
    return rankCandidates(
      job,
      candidates.filter((c) => c.consentToShare && !alreadySubmitted.has(c.id)),
    ).slice(0, 8);
  }, [job, candidates, alreadySubmitted]);

  const [candidateId, setCandidateId] = useState('');
  const [note, setNote] = useState('');

  if (acceptedJobs.length === 0) {
    return (
      <div>
        <PageHeader title="Submit candidates" lede="Structured submission against a project you have accepted." />
        <EmptyState
          title="No accepted projects yet"
          body="Accept a project on the Marketplace and it becomes available here."
        />
      </div>
    );
  }

  const selected = candidates.find((c) => c.id === candidateId);
  const fit = job && selected ? computeFit(job, selected) : null;
  const org = job ? organisations.find((o) => o.id === job.organisationId) : undefined;

  const fee = (() => {
    if (!job) return 0;
    const lakhs = job.salaryBand.match(/(\d+)[–-](\d+)\s*LPA/);
    if (!lakhs) return 60000;
    const mid = ((Number(lakhs[1]) + Number(lakhs[2])) / 2) * 100000;
    return Math.round((mid * 0.0833) / 1000) * 1000;
  })();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!job || !selected) return;
    addSubmission({
      recruiterId: activeRecruiter.id,
      jobId: job.id,
      candidateId: selected.id,
      status: 'Submitted',
      submittedOn: new Date().toISOString().slice(0, 10),
      note: note.trim() || 'No note provided.',
      feeInr: fee,
    });
    router.push('/recruiter/submissions/');
  };

  return (
    <div>
      <PageHeader
        title="Submit candidates"
        lede="The same structured submission the employer's rules will read — you see the fit score before you send it."
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <Field label="Project" htmlFor="sub-job">
              <select
                id="sub-job"
                className="input"
                value={job?.id ?? ''}
                onChange={(e) => {
                  setJobId(e.target.value);
                  setCandidateId('');
                }}
              >
                {acceptedJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.location}
                  </option>
                ))}
              </select>
            </Field>

            {job ? (
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
                    {job.surgical.minCaseVolume}+ as {job.surgical.role.toLowerCase()}
                  </Chip>
                ) : null}
              </ul>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="section-title">Candidate</h2>
            <p className="mt-1 text-sm text-muted">
              Ranked against this project. Candidates who have not consented to be discoverable are
              excluded, and identities stay masked until the client reveals them.
            </p>

            {ranked.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Everyone eligible has already been submitted for this project.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {ranked.map(({ candidate, fit: candidateFit }) => {
                  const on = candidate.id === candidateId;
                  return (
                    <li key={candidate.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          on ? 'border-jade bg-jade/5' : 'border-hairline hover:bg-jade-tint'
                        }`}
                      >
                        <input
                          type="radio"
                          name="candidate"
                          className="mt-1 h-4 w-4"
                          checked={on}
                          onChange={() => setCandidateId(candidate.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-slate-ink">
                              {maskedName(candidate.fullName)}
                            </span>
                            <FitBadge fit={candidateFit} showBar={false} />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">{candidate.headline}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <Field
              label="Submission note"
              htmlFor="sub-note"
              hint="What the client should know that the structured fields do not say."
            >
              <textarea
                id="sub-note"
                rows={3}
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Operative log verified directly with the previous unit head."
              />
            </Field>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!selected}>
              Submit to client
            </Button>
            {!selected ? <span className="text-xs text-muted">Pick a candidate first.</span> : null}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-ink">Submission preview</h2>
            {selected && fit ? (
              <>
                <p className="mt-2 font-medium text-slate-ink">{maskedName(selected.fullName)}</p>
                <p className="text-xs text-muted">{selected.headline}</p>
                <div className="mt-3">
                  <FitBadge fit={fit} />
                </div>
                <WhyThisFits fit={fit} />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Select a candidate to preview the fit.</p>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-slate-ink">Commission if placed</h2>
            <p className="mt-1 font-serif text-2xl text-slate-ink">{inr(fee)}</p>
            <p className="mt-1 text-xs text-muted">
              8.33% of the mid-point of {job?.salaryBand ?? 'the band'}, payable by{' '}
              {org?.name ?? 'the client'} on joining.
            </p>
          </Card>
        </aside>
      </form>

      <div className="mt-6">
        <DemoNote>
          Submitting adds a record to in-memory state and nothing else. No client is notified, and
          the candidate&apos;s identity is never transmitted anywhere.
        </DemoNote>
      </div>
    </div>
  );
}
