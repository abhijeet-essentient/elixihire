'use client';

import { Check, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/Overlays';
import { Button, Card, Chip, DemoNote, PageHeader, Section, inr } from '@/components/ui';
import { useDemo, useSelectors } from '@/lib/store';

/**
 * Talent Pipeline subscription — Preview, phase 2.
 *
 * Plans are presented with a paywalled feel so the commercial model is visible, but no
 * payment path exists anywhere in this demo.
 */
interface Plan {
  name: string;
  price: number;
  cadence: string;
  blurb: string;
  features: string[];
  /** Feature fragments rendered with a padlock rather than a tick. */
  locked: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 0,
    cadence: 'free',
    blurb: 'Post roles and manage applicants who come to you.',
    features: [
      'Unlimited structured job posts',
      'Rule-based fit scoring with the full breakdown',
      'Applicant management and placement pipeline',
      'Masked candidate identities',
    ],
    locked: [],
  },
  {
    name: 'Talent Pipeline',
    price: 7500,
    cadence: 'per month',
    blurb: 'Search the whole pool, not only the people who applied.',
    features: [
      'Everything in Starter',
      'Sourcing search across all consented candidates',
      'Saved talent pools and candidate alerts',
      'Compare up to three candidates side by side',
      'Workforce analytics for your specialties',
    ],
    locked: ['Sourcing search', 'Talent pools'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 24000,
    cadence: 'per month',
    blurb: 'Multi-site hiring with governance and reporting.',
    features: [
      'Everything in Talent Pipeline',
      'Multiple sites and departmental budgets',
      'Role-based access and approval chains',
      'Audit exports and retention reporting',
      'Named account support',
    ],
    locked: ['Approval chains', 'Audit exports'],
  },
];

export default function SubscriptionPage() {
  const { invoices } = useDemo();
  const { employerOrg } = useSelectors();
  const [wanted, setWanted] = useState<string | null>(null);

  const mine = invoices.filter((i) => i.organisationId === employerOrg.id);

  return (
    <div>
      <PageHeader
        title="Talent Pipeline"
        lede="Continuous access to the candidate pool, rather than paying per placement. Plans are illustrative — there is no payment path in this demo."
        actions={<Chip tone="jade">Current plan: Starter</Chip>}
      />

      <ul className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            as="li"
            key={plan.name}
            className={`flex flex-col p-5 ${plan.highlight ? 'border-jade ring-1 ring-jade/30' : ''}`}
          >
            {plan.highlight ? (
              <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-jade/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-jade-dark">
                <Sparkles aria-hidden="true" className="h-3 w-3" />
                Most relevant
              </span>
            ) : null}

            <h2 className="font-serif text-xl text-slate-ink">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted">{plan.blurb}</p>

            <p className="mt-4 font-serif text-3xl text-slate-ink">
              {plan.price === 0 ? 'Free' : inr(plan.price)}
              {plan.price > 0 ? (
                <span className="ml-1 font-sans text-xs font-normal text-muted">{plan.cadence}</span>
              ) : null}
            </p>

            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {plan.features.map((feature) => {
                const locked = plan.locked.some((l) => feature.includes(l));
                return (
                  <li key={feature} className="flex items-start gap-2">
                    {locked ? (
                      <Lock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn-fg" />
                    ) : (
                      <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" />
                    )}
                    <span className={locked ? 'text-muted' : 'text-body'}>{feature}</span>
                  </li>
                );
              })}
            </ul>

            <Button
              className="mt-5"
              variant={plan.highlight ? 'primary' : 'secondary'}
              disabled={plan.price === 0}
              onClick={() => setWanted(plan.name)}
            >
              {plan.price === 0 ? 'Your current plan' : `Choose ${plan.name}`}
            </Button>
          </Card>
        ))}
      </ul>

      <Section title="Billing history" lede={`Invoices raised to ${employerOrg.name}.`}>
        {mine.length === 0 ? (
          <p className="text-sm text-muted">No invoices yet.</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline px-4 py-3 text-sm"
              >
                <span className="min-w-0 flex-1 text-body">{invoice.item}</span>
                <span className="tabular-nums text-slate-ink">{inr(invoice.amountInr)}</span>
                <span className="text-xs text-muted">{invoice.issuedOn}</span>
                <Chip
                  tone={invoice.status === 'Paid' ? 'jade' : invoice.status === 'Due' ? 'amber' : 'red'}
                >
                  {invoice.status}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Modal
        open={Boolean(wanted)}
        onClose={() => setWanted(null)}
        title="Subscriptions are a preview"
        footer={<Button onClick={() => setWanted(null)}>Understood</Button>}
      >
        <p className="text-sm text-body">
          Choosing <strong>{wanted}</strong> would start a subscription in the real product. This
          demo has no payment integration, no billing backend and no way to take money — the plans
          are here to show the commercial model, nothing more.
        </p>
        <p className="mt-3 text-sm text-muted">
          Subscription billing is planned for phase 2, alongside the recruiter marketplace.
        </p>
      </Modal>

      <div className="mt-6">
        <DemoNote>
          Pricing shown (₹7,500/month for Talent Pipeline, ₹999 per job boost) is illustrative and
          matches the figures used in the proposal.
        </DemoNote>
      </div>
    </div>
  );
}
