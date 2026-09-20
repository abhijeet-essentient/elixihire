'use client';

import { FileText, ScanEye } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Overlays';
import { VerificationChip } from '@/components/StatusChips';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader, TableWrap } from '@/components/ui';
import { pendingQueue, type VerificationDecision } from '@/lib/services/verificationService';
import { useDemo } from '@/lib/store';
import type { Organisation } from '@/lib/types';

export default function VerificationPage() {
  const { organisations, audit, decideOrganisation } = useDemo();
  const queue = pendingQueue(organisations);
  const decided = organisations.filter(
    (o) => o.verificationStatus === 'Verified' || o.verificationStatus === 'Rejected',
  );

  return (
    <div>
      <PageHeader
        title="Verification queue"
        lede="Manual review of hiring organisations. Identifiers are captured at sign-up and checked by a human — there is no automated registry lookup in this demo, and none is implied."
      />

      {queue.length === 0 ? (
        <EmptyState
          title="Queue is clear"
          body="Every organisation has been decided. Reset the demo to bring the seed queue back."
        />
      ) : (
        <ul className="space-y-4">
          {queue.map((org) => (
            <OrgReviewCard key={org.id} organisation={org} onDecide={decideOrganisation} />
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="section-title">Decided organisations</h2>
        <div className="mt-3">
          <TableWrap>
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Organisations with a final decision</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Organisation</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                  <th scope="col" className="py-2 pr-3 font-medium">City</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((org) => (
                  <tr key={org.id} className="border-b border-hairline/70">
                    <td className="py-3 pr-3 font-medium text-slate-ink">{org.name}</td>
                    <td className="py-3 pr-3 text-body">{org.type}</td>
                    <td className="py-3 pr-3 text-body">{org.city}</td>
                    <td className="py-3 pr-3">
                      <VerificationChip status={org.verificationStatus} />
                    </td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          decideOrganisation(org.id, 'hold', 'Re-opened for review from the decided list.')
                        }
                      >
                        Re-open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Audit trail</h2>
        <p className="mt-1 text-sm text-muted">
          Every decision is recorded with who, when and why. Newest first.
        </p>
        <ol className="mt-3 space-y-2">
          {audit.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-hairline bg-jade-tint/40 p-3">
              <p className="text-sm text-slate-ink">
                <span className="font-medium">{entry.action}</span> — {entry.target}
              </p>
              <p className="mt-0.5 text-xs text-muted">{entry.detail}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {entry.actor} · {entry.at}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6">
        <DemoNote>
          GSTIN, CIN and MSME values here are invented strings in the correct shape. Nothing is
          validated against any registry.
        </DemoNote>
      </div>
    </div>
  );
}

function OrgReviewCard({
  organisation,
  onDecide,
}: {
  organisation: Organisation;
  onDecide: (orgId: string, decision: VerificationDecision, note: string) => void;
}) {
  const [note, setNote] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  const decide = (decision: VerificationDecision) => {
    onDecide(organisation.id, decision, note);
    setNote('');
  };

  return (
    <Card as="li" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-slate-ink">{organisation.name}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {organisation.type} · {organisation.city}
            {organisation.beds ? ` · ${organisation.beds} beds` : ''}
          </p>
        </div>
        <VerificationChip status={organisation.verificationStatus} />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
        <Detail label="GSTIN" value={organisation.gstin} />
        <Detail label="CIN" value={organisation.cin} />
        <Detail label="MSME / Udyam" value={organisation.msmeId} />
        <Detail label="Submitted" value={organisation.submittedOn} />
        <Detail label="Contact" value={organisation.contactPerson} />
        <Detail label="Email" value={organisation.contactEmail} />
      </dl>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-ink">Submitted documents</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {[
            'GST registration certificate.pdf',
            'Certificate of incorporation.pdf',
            'Udyam registration.pdf',
            'Clinical establishment licence.pdf',
          ].map((doc) => (
            <li key={doc}>
              <button
                type="button"
                onClick={() => setViewing(doc)}
                className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-body transition-colors hover:bg-jade-tint"
              >
                <FileText aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
                {doc}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ?? 'Document'}
        wide
        footer={<Button onClick={() => setViewing(null)}>Close</Button>}
      >
        <div className="rounded-lg border border-hairline bg-jade-tint/40 p-8 text-center">
          <ScanEye aria-hidden="true" className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-serif text-lg text-slate-ink">Document viewer placeholder</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            In the real product this pane renders the uploaded document with page navigation,
            zoom and a redaction tool. This demo holds no files — there is no upload, no storage
            and nothing to display.
          </p>
          <dl className="mx-auto mt-5 grid max-w-sm gap-2 text-left text-xs">
            <div className="flex justify-between gap-3 border-b border-hairline pb-1">
              <dt className="text-muted">Declared on the form</dt>
              <dd className="font-mono text-body">{organisation.gstin}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-hairline pb-1">
              <dt className="text-muted">CIN</dt>
              <dd className="font-mono text-body">{organisation.cin}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Udyam / MSME</dt>
              <dd className="font-mono text-body">{organisation.msmeId}</dd>
            </div>
          </dl>
          <p className="mt-4">
            <Chip tone="amber">Not validated against any registry</Chip>
          </p>
        </div>
      </Modal>

      <div className="mt-4">
        <label className="field-label" htmlFor={`note-${organisation.id}`}>
          Decision note
        </label>
        <input
          id={`note-${organisation.id}`}
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What you checked, and what you found"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => decide('approve')}>Approve</Button>
        <Button variant="secondary" onClick={() => decide('hold')}>
          Hold
        </Button>
        <Button variant="danger" onClick={() => decide('reject')}>
          Reject
        </Button>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="break-all font-mono text-[11px] text-body">{value}</dd>
    </div>
  );
}
