'use client';

import { useMemo } from 'react';
import { TrendLine } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, Chip, DemoNote, PageHeader, Section, StatTile, inr } from '@/components/ui';
import { maskedName } from '@/lib/mask';
import { useDemo, useSelectors } from '@/lib/store';
import type { Submission } from '@/lib/types';

/**
 * The commission ledger — Preview, phase 2.
 *
 * Earnings follow directly from the submissions: a fee becomes approved when the client
 * marks the candidate placed, and paid after the 90-day retention point.
 */
export default function EarningsPage() {
  const { submissions } = useDemo();
  const { activeRecruiter, jobById, candidateById, orgById } = useSelectors();

  const mine = useMemo(
    () => submissions.filter((s) => s.recruiterId === activeRecruiter.id && s.feeInr > 0),
    [submissions, activeRecruiter.id],
  );

  const paid = mine.filter((s) => s.payoutStatus === 'Paid');
  const approved = mine.filter((s) => s.payoutStatus === 'Approved');
  const pending = mine.filter((s) => s.payoutStatus === 'Pending');

  const sum = (rows: Submission[]) => rows.reduce((total, row) => total + row.feeInr, 0);

  // A fixed six-month earnings shape so the chart tells the same story each time.
  const history = [
    { month: 'Apr', earnings: 0 },
    { month: 'May', earnings: 0 },
    { month: 'Jun', earnings: sum(paid) },
    { month: 'Jul', earnings: 0 },
    { month: 'Aug', earnings: 0 },
    { month: 'Sep', earnings: sum(approved) },
  ];

  const columns: Column<Submission>[] = [
    {
      key: 'candidate',
      header: 'Placement',
      sortValue: (row) => candidateById(row.candidateId)?.fullName ?? '',
      render: (row) => {
        const candidate = candidateById(row.candidateId);
        const job = jobById(row.jobId);
        return (
          <>
            <p className="font-medium text-slate-ink">
              {candidate ? maskedName(candidate.fullName) : 'Unknown'}
            </p>
            <p className="text-xs text-muted">{job?.title}</p>
          </>
        );
      },
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (row) => {
        const job = jobById(row.jobId);
        return job ? orgById(job.organisationId)?.name ?? '' : '';
      },
      render: (row) => {
        const job = jobById(row.jobId);
        return <span className="text-body">{job ? orgById(job.organisationId)?.name : '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Submission',
      sortValue: (row) => row.status,
      render: (row) => <Chip tone={row.status === 'Placed' ? 'jade' : 'amber'}>{row.status}</Chip>,
    },
    {
      key: 'fee',
      header: 'Commission',
      sortValue: (row) => row.feeInr,
      render: (row) => <span className="tabular-nums text-body">{inr(row.feeInr)}</span>,
    },
    {
      key: 'payout',
      header: 'Payout',
      sortValue: (row) => row.payoutStatus,
      render: (row) => (
        <Chip
          tone={row.payoutStatus === 'Paid' ? 'jade' : row.payoutStatus === 'Approved' ? 'blue' : 'neutral'}
        >
          {row.payoutStatus}
        </Chip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Earnings"
        lede={`Commission ledger for ${activeRecruiter.agencyName}. All INR, all mock — no money moves in this demo.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Paid out" value={inr(sum(paid))} sub={`${paid.length} placement${paid.length === 1 ? '' : 's'}`} />
        <StatTile label="Approved" value={inr(sum(approved))} sub="awaiting the 90-day point" />
        <StatTile label="Pending" value={inr(sum(pending))} sub="not yet placed" />
        <StatTile label="Lifetime placements" value={activeRecruiter.placementsClosed} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-5">
          <TrendLine
            title="Earnings by month"
            hint="Commission recognised when a placement is confirmed."
            data={history as unknown as Record<string, string | number>[]}
            xKey="month"
            yKey="earnings"
            unit="INR"
          />
        </Card>

        <Card className="p-5">
          <h2 className="section-title">How payouts work</h2>
          <ol className="mt-3 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade/15 text-[11px] font-semibold text-jade-dark">
                1
              </span>
              <span className="text-body">
                <strong className="text-slate-ink">Pending</strong> — candidate submitted, still
                moving through the client&apos;s pipeline.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade/15 text-[11px] font-semibold text-jade-dark">
                2
              </span>
              <span className="text-body">
                <strong className="text-slate-ink">Approved</strong> — client marked the candidate
                placed; the fee is recognised.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-jade/15 text-[11px] font-semibold text-jade-dark">
                3
              </span>
              <span className="text-body">
                <strong className="text-slate-ink">Paid</strong> — released after the 90-day
                retention point, which is why that stage exists on the pipeline.
              </span>
            </li>
          </ol>
        </Card>
      </div>

      <Section title="Ledger" lede="Every submission carrying a commission.">
        {mine.length === 0 ? (
          <p className="text-sm text-muted">No commission-bearing submissions yet.</p>
        ) : (
          <DataTable
            rows={mine}
            columns={columns}
            caption="Commission ledger"
            rowKey={(row) => row.id}
            filterOn={(row) => `${jobById(row.jobId)?.title ?? ''} ${row.payoutStatus}`}
            filterPlaceholder="Filter ledger…"
            minWidth="54rem"
          />
        )}
      </Section>

      <div className="mt-6">
        <DemoNote>
          The 90-day retention gate on payouts is the same 90-day follow-up stage the employer sees
          on their pipeline — one mechanism serving both sides.
        </DemoNote>
      </div>
    </div>
  );
}
