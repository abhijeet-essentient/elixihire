'use client';

import { FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/DataTable';
import { Modal } from '@/components/Overlays';
import { Button, Card, Chip, DemoNote, PageHeader, Section, StatTile, inr } from '@/components/ui';
import { useDemo, useSelectors } from '@/lib/store';
import type { PayrollEmployee } from '@/lib/types';

/**
 * Payroll — Preview, phase 4.
 *
 * The furthest-out capability in the roadmap, included so the full commercial picture is
 * visible. The payslip is composed from seed data; no calculation here is authoritative.
 */
export default function PayrollPage() {
  const { payroll } = useDemo();
  const { orgById } = useSelectors();
  const [slipFor, setSlipFor] = useState<PayrollEmployee | null>(null);

  const totals = useMemo(() => {
    const gross = payroll.reduce((sum, e) => sum + e.monthlyGrossInr, 0);
    const fees = payroll.reduce((sum, e) => sum + e.pepmFeeInr, 0);
    return { gross, fees };
  }, [payroll]);

  const columns: Column<PayrollEmployee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortValue: (row) => row.name,
      render: (row) => (
        <>
          <p className="font-medium text-slate-ink">{row.name}</p>
          <p className="text-xs text-muted">{row.designation}</p>
        </>
      ),
    },
    {
      key: 'org',
      header: 'Organisation',
      sortValue: (row) => orgById(row.organisationId)?.name ?? '',
      render: (row) => <span className="text-body">{orgById(row.organisationId)?.name ?? 'Unknown'}</span>,
    },
    {
      key: 'gross',
      header: 'Monthly gross',
      sortValue: (row) => row.monthlyGrossInr,
      render: (row) => <span className="tabular-nums text-body">{inr(row.monthlyGrossInr)}</span>,
    },
    {
      key: 'fee',
      header: 'PEPM fee',
      sortValue: (row) => row.pepmFeeInr,
      render: (row) => <span className="tabular-nums text-muted">{inr(row.pepmFeeInr)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => (
        <Chip tone={row.status === 'Active' ? 'jade' : 'amber'}>{row.status}</Chip>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setSlipFor(row)}>
          <FileText aria-hidden="true" className="h-3 w-3" />
          Payslip
        </Button>
      ),
    },
  ];

  // Illustrative Indian payroll deductions, at conventional rates.
  const slip = slipFor
    ? (() => {
        const basic = Math.round(slipFor.monthlyGrossInr * 0.5);
        const hra = Math.round(basic * 0.4);
        const allowances = slipFor.monthlyGrossInr - basic - hra;
        const pf = Math.min(Math.round(basic * 0.12), 1800);
        const professionalTax = 200;
        const tds = Math.round(slipFor.monthlyGrossInr * 0.1);
        const net = slipFor.monthlyGrossInr - pf - professionalTax - tds;
        return { basic, hra, allowances, pf, professionalTax, tds, net };
      })()
    : null;

  return (
    <div>
      <PageHeader
        title="Payroll"
        lede="Per-employee-per-month processing at ₹499. Illustrative only — no payroll is calculated, filed or paid here."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Employees" value={payroll.length} />
        <StatTile label="Monthly gross" value={inr(totals.gross)} />
        <StatTile label="Platform fees" value={inr(totals.fees)} sub="₹499 PEPM" />
        <StatTile label="On notice" value={payroll.filter((e) => e.status === 'On notice').length} />
      </div>

      <Section title="Employees on payroll" lede="Placed candidates whose employer uses payroll processing.">
        <DataTable
          rows={payroll}
          columns={columns}
          caption="Payroll employees"
          rowKey={(row) => row.id}
          filterOn={(row) => `${row.name} ${row.designation}`}
          filterPlaceholder="Filter employees…"
          minWidth="52rem"
        />
      </Section>

      <Modal
        open={Boolean(slipFor)}
        onClose={() => setSlipFor(null)}
        title="Payslip preview"
        wide
        footer={<Button onClick={() => setSlipFor(null)}>Close</Button>}
      >
        {slipFor && slip ? (
          <article className="rounded-lg border border-hairline bg-surface p-6">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline pb-4">
              <div>
                <p className="font-serif text-lg text-slate-ink">
                  {orgById(slipFor.organisationId)?.name}
                </p>
                <p className="text-xs text-muted">Payslip · September 2026</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-ink">{slipFor.name}</p>
                <p className="text-xs text-muted">{slipFor.designation}</p>
              </div>
            </header>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-ink">Earnings</h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <Row label="Basic" value={slip.basic} />
                  <Row label="House rent allowance" value={slip.hra} />
                  <Row label="Other allowances" value={slip.allowances} />
                  <Row label="Gross" value={slipFor.monthlyGrossInr} strong />
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-ink">Deductions</h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <Row label="Provident fund" value={slip.pf} />
                  <Row label="Professional tax" value={slip.professionalTax} />
                  <Row label="TDS" value={slip.tds} />
                  <Row label="Net pay" value={slip.net} strong />
                </dl>
              </div>
            </div>

            <p className="mt-6 rounded-md border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
              Specimen only. Deductions use conventional illustrative rates and are not a payroll
              calculation. Nothing is filed with any authority.
            </p>
          </article>
        ) : null}
      </Modal>

      <div className="mt-6">
        <DemoNote>
          Payroll is the last phase on the roadmap. It is shown here so the full commercial picture
          is visible, not because any of it is built.
        </DemoNote>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'border-t border-hairline pt-1.5' : ''}`}>
      <dt className={strong ? 'font-medium text-slate-ink' : 'text-muted'}>{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-medium text-slate-ink' : 'text-body'}`}>
        {inr(value)}
      </dd>
    </div>
  );
}
