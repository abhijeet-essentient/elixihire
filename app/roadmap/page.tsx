import { TierBadge } from '@/components/TierBadge';
import { Card, Chip, Section } from '@/components/ui';

export const metadata = { title: 'Roadmap — ElixiHire' };

interface RoadmapItem {
  name: string;
  detail: string;
  tier: 'core' | 'preview';
  phase?: number;
  stream: string;
}

const NOW: RoadmapItem[] = [
  { name: 'Structured job posting', detail: 'Specialty, sub-specialty, shift slot, credentials, surgical requirement.', tier: 'core', stream: 'Job posting' },
  { name: 'Rule-based matching & fit', detail: 'Deterministic scoring with a shown breakdown and per-dimension radar.', tier: 'core', stream: 'Placement & acquisition' },
  { name: 'Applicant management', detail: 'Ranked applicants, masked identity, shortlist, compare.', tier: 'core', stream: 'Placement & acquisition' },
  { name: 'Placement pipeline', detail: 'Drag-and-drop board through to the 90-day follow-up.', tier: 'core', stream: 'Placement & acquisition' },
  { name: 'Interview scheduling', detail: 'Slot proposals that respect the role’s shift pattern.', tier: 'core', stream: 'Placement & acquisition' },
  { name: 'Candidate profile & search', detail: 'Credential wallet, availability, recommendations, saved searches.', tier: 'core', stream: 'Placement & acquisition' },
  { name: 'Organisation verification', detail: 'Manual review with a full audit trail.', tier: 'core', stream: 'Job posting' },
  { name: 'Taxonomy manager', detail: 'Specialties and credentials as editable data — no rebuild to extend.', tier: 'core', stream: 'Job posting' },
];

const NEXT: RoadmapItem[] = [
  { name: 'Recruiter marketplace', detail: 'Consultancies accept vacancies, submit candidates, track earnings.', tier: 'preview', phase: 2, stream: 'Placement & acquisition' },
  { name: 'Talent Pipeline subscription', detail: 'Continuous access to the candidate pool at ₹7,500/mo.', tier: 'preview', phase: 2, stream: 'Talent-pipeline subscription' },
  { name: 'Offer management & e-sign', detail: 'Offer letters, status tracking, signature placeholder.', tier: 'preview', phase: 2, stream: 'Placement & acquisition' },
  { name: 'Messaging & notes', detail: 'Threaded employer–candidate conversation in one place.', tier: 'preview', phase: 2, stream: 'Placement & acquisition' },
  { name: 'Billing & invoicing', detail: 'Subscriptions, job boosts at ₹999, placement invoices.', tier: 'preview', phase: 2, stream: 'Job posting' },
];

const LATER: RoadmapItem[] = [
  { name: 'Fraud & duplicate detection', detail: 'Risk scoring on jobs and organisations with human review.', tier: 'preview', phase: 3, stream: 'Job posting' },
  { name: 'Workforce analytics', detail: 'Time-to-fill, supply and demand by specialty, retention, source mix.', tier: 'preview', phase: 3, stream: 'Talent-pipeline subscription' },
  { name: 'Career services', detail: 'Premium CV, interview and licensing support for candidates.', tier: 'preview', phase: 3, stream: 'Placement & acquisition' },
  { name: 'Payroll', detail: 'Per-employee-per-month payroll at ₹499 PEPM with payslips.', tier: 'preview', phase: 4, stream: 'Payroll' },
];

const STREAMS = [
  { name: 'Placement & acquisition', note: 'Success fees on placements made through the platform.' },
  { name: 'Talent-pipeline subscription', note: 'Recurring access to the candidate pool and analytics.' },
  { name: 'Job posting', note: 'Posting, boosts and verification services.' },
  { name: 'Payroll', note: 'Per-employee-per-month payroll processing.' },
];

export default function RoadmapPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl text-slate-ink">Roadmap</h1>
      <p className="mt-3 max-w-2xl text-base text-body">
        How the demo maps onto delivery. Everything under <strong>Now</strong> is Core — built and
        fully interactive in this demo. <strong>Next</strong> and <strong>Later</strong> are the
        Preview screens, present here so the shape of the whole product is visible from the start.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Column title="Now" subtitle="Phase 1 — in this demo, working" items={NOW} accent />
        <Column title="Next" subtitle="Phase 2 — previewed here" items={NEXT} />
        <Column title="Later" subtitle="Phases 3–4 — previewed here" items={LATER} />
      </div>

      <Section title="Revenue streams" lede="Each roadmap item feeds one of four streams.">
        <div className="grid gap-4 sm:grid-cols-2">
          {STREAMS.map((stream) => {
            const items = [...NOW, ...NEXT, ...LATER].filter((i) => i.stream === stream.name);
            return (
              <Card key={stream.name} className="p-5">
                <h3 className="font-serif text-lg text-slate-ink">{stream.name}</h3>
                <p className="mt-1 text-sm text-muted">{stream.note}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <li key={item.name}>
                      <Chip tone={item.tier === 'core' ? 'jade' : 'amber'}>{item.name}</Chip>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Column({
  title,
  subtitle,
  items,
  accent = false,
}: {
  title: string;
  subtitle: string;
  items: RoadmapItem[];
  accent?: boolean;
}) {
  return (
    <section>
      <header
        className={`rounded-t-xl border px-4 py-3 ${
          accent ? 'border-jade/30 bg-jade/10' : 'border-hairline bg-jade-tint'
        }`}
      >
        <h2 className="font-serif text-lg text-slate-ink">{title}</h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </header>
      <ul className="space-y-2 rounded-b-xl border border-t-0 border-hairline p-3">
        {items.map((item) => (
          <li key={item.name} className="rounded-lg border border-hairline bg-surface-raised p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-ink">{item.name}</h3>
              <TierBadge tier={item.tier} phase={item.phase} size="sm" />
            </div>
            <p className="mt-1 text-xs text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
