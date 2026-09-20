'use client';

import { FileSignature, PenLine } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Overlays';
import { StageChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, inr } from '@/components/ui';
import { viewCandidate } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';

/**
 * Offer management — Preview, phase 2.
 *
 * The offer letter is rendered from the data the demo already holds, so it looks like
 * the real thing, but nothing is generated, stored or signed.
 */
export default function OffersPage() {
  const { applications, revealedCandidateIds } = useDemo();
  const { employerJobs, employerOrg, candidateById, jobById } = useSelectors();
  const [previewing, setPreviewing] = useState<string | null>(null);

  const jobIds = new Set(employerJobs.map((j) => j.id));
  const atOffer = applications.filter(
    (a) => jobIds.has(a.jobId) && ['Offer', 'Joined', '90-day follow-up'].includes(a.stage),
  );

  const current = atOffer.find((a) => a.id === previewing);
  const currentCandidate = current ? candidateById(current.candidateId) : undefined;
  const currentJob = current ? jobById(current.jobId) : undefined;

  return (
    <div>
      <PageHeader
        title="Offers"
        lede="Offer letters, their status, and where an e-signature would sit. Everything here is a mock — nothing is generated or sent."
      />

      {atOffer.length === 0 ? (
        <EmptyState
          title="No offers out"
          body="Advance an engagement to the Offer stage on the pipeline and it appears here."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {atOffer.map((application) => {
            const candidate = candidateById(application.candidateId);
            const job = jobById(application.jobId);
            if (!candidate || !job) return null;
            const view = viewCandidate(candidate, revealedCandidateIds.includes(candidate.id));
            const signed = application.stage !== 'Offer';

            return (
              <Card as="li" key={application.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-serif text-lg text-slate-ink">{view.name}</h2>
                    <p className="mt-0.5 text-sm text-muted">{job.title}</p>
                  </div>
                  <StageChip stage={application.stage} />
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Band</dt>
                    <dd className="text-body">{job.salaryBand}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Notice</dt>
                    <dd className="text-body">{candidate.noticePeriod}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Shift</dt>
                    <dd className="text-body">{job.shift}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Updated</dt>
                    <dd className="text-body">{application.updatedOn}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setPreviewing(application.id)}>
                    <FileSignature aria-hidden="true" className="h-3.5 w-3.5" />
                    Preview letter
                  </Button>
                  <Chip tone={signed ? 'jade' : 'amber'}>
                    {signed ? 'Signed (mock)' : 'Awaiting signature'}
                  </Chip>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(current)}
        onClose={() => setPreviewing(null)}
        title="Offer letter preview"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreviewing(null)}>
              Close
            </Button>
            <Button disabled title="E-signature is a roadmap capability — disabled in this demo">
              <PenLine aria-hidden="true" className="h-3.5 w-3.5" />
              Send for e-signature
            </Button>
          </>
        }
      >
        {current && currentCandidate && currentJob ? (
          <article className="rounded-lg border border-hairline bg-surface p-6 text-sm leading-relaxed text-body">
            <header className="border-b border-hairline pb-4">
              <p className="font-serif text-lg text-slate-ink">{employerOrg.name}</p>
              <p className="text-xs text-muted">
                {employerOrg.city} · GSTIN {employerOrg.gstin}
              </p>
            </header>

            <p className="mt-4">
              Dear{' '}
              {viewCandidate(currentCandidate, revealedCandidateIds.includes(currentCandidate.id)).name},
            </p>

            <p className="mt-3">
              We are pleased to offer you the position of <strong>{currentJob.title}</strong> at{' '}
              {employerOrg.name}, based at our {currentJob.location} site. The role operates on a{' '}
              <strong>{currentJob.shift}</strong> pattern on a {currentJob.employmentType.toLowerCase()}{' '}
              basis, within the {currentJob.specialty} department ({currentJob.subSpecialty}).
            </p>

            <p className="mt-3">
              Remuneration will be within the band <strong>{currentJob.salaryBand}</strong>, reviewed
              annually. {currentJob.surgical.required
                ? `This post carries an independent operating commitment of at least ${currentJob.surgical.minCaseVolume} cases per annum as ${currentJob.surgical.role.toLowerCase()}.`
                : 'This post carries no operative commitment.'}
            </p>

            <p className="mt-3">
              This offer is subject to verification of your{' '}
              {currentJob.requiredCredentials.join(', ') || 'stated credentials'} and to satisfactory
              references.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="h-10 border-b border-dashed border-hairline" />
                <p className="mt-1 text-xs text-muted">For {employerOrg.name}</p>
              </div>
              <div>
                <div className="flex h-10 items-end border-b border-dashed border-hairline">
                  <span className="text-xs italic text-muted">e-signature placeholder</span>
                </div>
                <p className="mt-1 text-xs text-muted">Candidate</p>
              </div>
            </div>

            <p className="mt-6 rounded-md border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
              Specimen only. This is a demo document produced from mock data — it is not an offer,
              and no signature is captured.
            </p>
          </article>
        ) : null}
      </Modal>

      <div className="mt-6">
        <DemoNote>
          In phase 2 this becomes a real document flow: templated letters, version history, reminders
          and an e-signature integration. None of that is wired here.
        </DemoNote>
      </div>
    </div>
  );
}
