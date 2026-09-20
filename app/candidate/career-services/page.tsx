'use client';

import { Check, Lock } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Overlays';
import { Button, Card, Chip, DemoNote, PageHeader, Section, inr } from '@/components/ui';
import { profileCompleteness } from '@/lib/services/recommendationService';
import { useSelectors } from '@/lib/store';

/**
 * Career services — Preview, later phase.
 *
 * A teaser for the paid candidate-side services. Deliberately concrete about what each
 * one would be, and equally clear that none of it is purchasable here.
 */
const SERVICES = [
  {
    name: 'Structured profile review',
    price: 1499,
    blurb: 'A recruiter walks your profile against real postings and tells you which gates you fail and why.',
    includes: [
      'Line-by-line review of specialty, sub-specialty and years',
      'Credential gap analysis against live roles',
      'Rewritten headline and surgical record framing',
    ],
  },
  {
    name: 'Interview preparation',
    price: 2999,
    blurb: 'Two mock interviews with a clinician in your specialty, with written feedback.',
    includes: [
      'Two 45-minute mock panels',
      'Specialty-specific clinical questioning',
      'Written feedback and a follow-up call',
    ],
  },
  {
    name: 'Licensing & registration support',
    price: 4999,
    blurb: 'Guidance through council registration and state transfer paperwork.',
    includes: [
      'Document checklist for your council',
      'State-transfer guidance',
      'Timeline tracking to your start date',
    ],
  },
];

export default function CareerServicesPage() {
  const { activeCandidate } = useSelectors();
  const [wanted, setWanted] = useState<string | null>(null);
  const completeness = profileCompleteness(activeCandidate);

  return (
    <div>
      <PageHeader
        title="Career services"
        lede="Paid support for candidates, alongside the free platform. Illustrative only — nothing here can be bought in this demo."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="section-title">Start with the free thing</h2>
            <p className="mt-1 max-w-xl text-sm text-body">
              Your structured profile is {completeness.percent}% complete. Filling the remaining
              fields costs nothing and moves your fit scores more than any service on this page.
            </p>
          </div>
          <Chip tone={completeness.percent >= 90 ? 'jade' : 'amber'}>
            {completeness.percent}% complete
          </Chip>
        </div>
      </Card>

      <Section title="Services" lede="Fixed-price, delivered by clinicians and recruiters.">
        <ul className="grid gap-4 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Card as="li" key={service.name} className="flex flex-col p-5">
              <h3 className="font-serif text-lg text-slate-ink">{service.name}</h3>
              <p className="mt-1 text-sm text-muted">{service.blurb}</p>
              <p className="mt-4 font-serif text-2xl text-slate-ink">{inr(service.price)}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {service.includes.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" />
                    <span className="text-body">{line}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-5" variant="secondary" onClick={() => setWanted(service.name)}>
                <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                Preview only
              </Button>
            </Card>
          ))}
        </ul>
      </Section>

      <Modal
        open={Boolean(wanted)}
        onClose={() => setWanted(null)}
        title="Career services are a preview"
        footer={<Button onClick={() => setWanted(null)}>Understood</Button>}
      >
        <p className="text-sm text-body">
          <strong>{wanted}</strong> is a roadmap capability shown to illustrate the candidate-side
          revenue stream. This demo has no payment integration and no way to book anything.
        </p>
        <p className="mt-3 text-sm text-muted">
          Everything a candidate needs to be matched well — the structured profile, the fit
          breakdown, the recommendations — is free and works today in the Core screens.
        </p>
      </Modal>

      <div className="mt-6">
        <DemoNote>
          Prices are illustrative INR figures for the proposal, not a published price list.
        </DemoNote>
      </div>
    </div>
  );
}
