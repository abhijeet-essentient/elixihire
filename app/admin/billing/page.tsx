'use client';

import { Download } from 'lucide-react';
import { useMemo } from 'react';
import { ShareBars } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Card, Chip, DemoNote, PageHeader, Section, StatTile, inr } from '@/components/ui';
import { useDemo, useSelectors } from '@/lib/store';
import type { Invoice } from '@/lib/types';

/**
 * Billing & plans — Preview, phase 2.
 *
 * The commercial model made concrete: what is charged, to whom, and what is outstanding.
 * No payment provider is involved anywhere.
 */
const PRICING = [
  { item: 'Talent Pipeline subscription', price: 7500, cadence: 'per organisation / month', stream: 'Subscription' },
  { item: 'Job boost', price: 999, cadence: 'per job, 14 days', stream: 'Job posting' },
  { item: 'Placement fee', price: 0, cadence: '8.33% of annual CTC, on joining', stream: 'Placement' },
  { item: 'Payroll processing', price: 499, cadence: 'per employee / month', stream: 'Payroll' },
];

export default function BillingPage() {
  const { invoices } = useDemo();
  const { orgById } = useSelectors();

  const totals = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amountInr, 0);
    const due = invoices.filter((i) => i.status === 'Due').reduce((s, i) => s + i.amountInr, 0);
    const overdue = invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amountInr, 0);
    return { paid, due, overdue };
  }, [invoices]);

  const mix = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const invoice of invoices) {
      const key = invoice.item.includes('subscription')
        ? 'Subscription'
        : invoice.item.includes('boost')
          ? 'Job boost'
          : 'Placement fee';
      buckets.set(key, (buckets.get(key) ?? 0) + invoice.amountInr);
    }
    const total = [...buckets.values()].reduce((a, b) => a + b, 0) || 1;
    return [...buckets.entries()].map(([label, value]) => ({
      label,
      value: Math.round((value / total) * 100),
    }));
  }, [invoices]);

  const columns: Column<Invoice>[] = [
    {
      key: 'item',
      header: 'Item',
      sortValue: (row) => row.item,
      render: (row) => (
        <>
          <p className="font-medium text-slate-ink">{row.item}</p>
          <p className="text-xs text-muted">{orgById(row.organisationId)?.name ?? 'Unknown'}</p>
        </>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (row) => row.amountInr,
      render: (row) => <span className="tabular-nums text-body">{inr(row.amountInr)}</span>,
    },
    {
      key: 'issued',
      header: 'Issued',
      sortValue: (row) => row.issuedOn,
      render: (row) => <span className="text-xs text-muted">{row.issuedOn}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => (
        <Chip tone={row.status === 'Paid' ? 'jade' : row.status === 'Due' ? 'amber' : 'red'}>
          {row.status}
        </Chip>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <Button size="sm" variant="ghost" disabled title="Downloading is not available in this demo">
          <Download aria-hidden="true" className="h-3 w-3" />
          PDF
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Billing & plans"
        lede="What the platform charges and what is outstanding. All INR, all mock — there is no payment integration in this demo."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Collected" value={inr(totals.paid)} sub="all time" />
        <StatTile label="Due" value={inr(totals.due)} />
        <StatTile
          label="Overdue"
          value={inr(totals.overdue)}
          trend={totals.overdue > 0 ? { text: 'chase required', good: false } : undefined}
        />
        <StatTile label="Invoices" value={invoices.length} />
      </div>

      <Section title="Price list" lede="The four revenue streams, as charged.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING.map((row) => (
            <Card as="li" key={row.item} className="p-4">
              <Chip tone="jade">{row.stream}</Chip>
              <h3 className="mt-2 text-sm font-semibold text-slate-ink">{row.item}</h3>
              <p className="mt-1 font-serif text-2xl text-slate-ink">
                {row.price === 0 ? '8.33%' : inr(row.price)}
              </p>
              <p className="mt-0.5 text-xs text-muted">{row.cadence}</p>
            </Card>
          ))}
        </ul>
      </Section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <h2 className="section-title mb-3">Invoices</h2>
          <DataTable
            rows={invoices}
            columns={columns}
            caption="All invoices"
            rowKey={(row) => row.id}
            filterOn={(row) => `${row.item} ${row.status}`}
            filterPlaceholder="Filter invoices…"
          />
        </div>
        <Card className="p-5">
          <ShareBars title="Revenue mix" hint="Share of invoiced value by stream." data={mix} />
        </Card>
      </div>

      <div className="mt-6">
        <DemoNote>
          Figures match the proposal: ₹7,500/month Talent Pipeline, ₹999 per job boost, ₹499 PEPM
          payroll. No card, gateway or ledger exists behind this screen.
        </DemoNote>
      </div>
    </div>
  );
}
