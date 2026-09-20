'use client';

import { useEffect, useMemo, useState } from 'react';
import { CategoryBars, FunnelBars, PairedBars } from '@/components/charts';
import { STATUS_COLORS } from '@/components/Charts';
import { DataTable, type Column } from '@/components/DataTable';
import { VerificationChip } from '@/components/StatusChips';
import { Card, DemoNote, PageHeader, Section, Skeleton, StatTile } from '@/components/ui';
import { useDemo } from '@/lib/store';
import { PIPELINE_STAGES } from '@/lib/taxonomy';
import type { JobStatus, Organisation } from '@/lib/types';

const JOB_STATUSES: JobStatus[] = ['Open', 'Paused', 'Closed'];

export default function SnapshotPage() {
  const { jobs, candidates, applications, organisations, submissions } = useDemo();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const jobsByStatus = useMemo(
    () =>
      JOB_STATUSES.map((status) => ({
        status,
        count: jobs.filter((j) => j.status === status).length,
      })),
    [jobs],
  );

  const byStage = useMemo(
    () => PIPELINE_STAGES.map((stage) => ({ stage, count: applications.filter((a) => a.stage === stage).length })),
    [applications],
  );

  /** Open positions against candidates who could plausibly fill them, per specialty. */
  const supplyDemand = useMemo(() => {
    const specialties = Array.from(new Set(jobs.filter((j) => j.status === 'Open').map((j) => j.specialty)));
    return specialties
      .map((specialty) => ({
        specialty,
        openRoles: jobs
          .filter((j) => j.status === 'Open' && j.specialty === specialty)
          .reduce((sum, j) => sum + j.positionsOpen, 0),
        candidates: candidates.filter((c) => c.specialties.some((s) => s.specialty === specialty)).length,
      }))
      .sort((a, b) => b.openRoles - a.openRoles);
  }, [jobs, candidates]);

  const placements = applications.filter(
    (a) => a.stage === 'Joined' || a.stage === '90-day follow-up',
  ).length;
  const verified = organisations.filter((o) => o.verificationStatus === 'Verified').length;
  const backlog = organisations.filter(
    (o) => o.verificationStatus === 'Pending' || o.verificationStatus === 'On hold',
  ).length;

  const columns: Column<Organisation>[] = [
    {
      key: 'name',
      header: 'Organisation',
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-slate-ink">{row.name}</span>,
    },
    { key: 'type', header: 'Type', sortValue: (row) => row.type, render: (row) => <span className="text-body">{row.type}</span> },
    { key: 'city', header: 'City', sortValue: (row) => row.city, render: (row) => <span className="text-body">{row.city}</span> },
    {
      key: 'open',
      header: 'Open jobs',
      sortValue: (row) => jobs.filter((j) => j.organisationId === row.id && j.status === 'Open').length,
      render: (row) => (
        <span className="tabular-nums text-body">
          {jobs.filter((j) => j.organisationId === row.id && j.status === 'Open').length}
        </span>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      sortValue: (row) => row.verificationStatus,
      render: (row) => <VerificationChip status={row.verificationStatus} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Operations"
        lede="Counts across the whole platform. Everything recalculates as roles are posted and engagements move."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Jobs" value={jobs.length} sub={`${jobsByStatus[0].count} open`} />
        <StatTile label="Candidates" value={candidates.length} />
        <StatTile label="Applications" value={applications.length} />
        <StatTile label="Placements" value={placements} sub="Joined or later" />
        <StatTile label="Organisations" value={organisations.length} sub={`${verified} verified`} />
        <StatTile
          label="Verification backlog"
          value={backlog}
          trend={backlog > 2 ? { text: 'needs attention', good: false } : undefined}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          {ready ? (
            <CategoryBars
              title="Jobs by status"
              hint="Status colours are reserved for state and never reused as series colours."
              data={jobsByStatus as unknown as Record<string, string | number>[]}
              xKey="status"
              yKey="count"
              yLabel="jobs"
              colorFor={(row) => STATUS_COLORS[String(row.status)] ?? STATUS_COLORS.Open}
            />
          ) : (
            <Skeleton className="h-[240px] w-full" />
          )}
        </Card>
        <Card className="p-5">
          {ready ? (
            <FunnelBars
              title="Engagements by pipeline stage"
              hint="Every application across every organisation."
              data={byStage}
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </Card>
      </div>

      <div className="mt-5">
        <Card className="p-5">
          {ready ? (
            <PairedBars
              title="Supply and demand by specialty"
              hint="Open positions against candidates on the platform holding that specialty. One shared scale — never two axes."
              data={supplyDemand as unknown as Record<string, string | number>[]}
              xKey="specialty"
              seriesA={{ key: 'openRoles', label: 'Open positions' }}
              seriesB={{ key: 'candidates', label: 'Candidates available' }}
            />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </Card>
      </div>

      <Section title="Organisations" lede="Filter by name, type or city.">
        <DataTable
          rows={organisations}
          columns={columns}
          caption="All organisations and their verification state"
          rowKey={(row) => row.id}
          filterOn={(row) => `${row.name} ${row.type} ${row.city}`}
          filterPlaceholder="Filter organisations…"
        />
      </Section>

      <div className="mt-6">
        <DemoNote>
          Charts are drawn from the in-memory seed with no network request of any kind —{' '}
          {submissions.length} recruiter submissions are included in the platform totals but tracked
          separately under the Recruiter persona.
        </DemoNote>
      </div>
    </div>
  );
}
