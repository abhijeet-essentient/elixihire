'use client';

import { ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, Chip, DemoNote, PageHeader, Section, StatTile } from '@/components/ui';
import { ROLE_LABEL } from '@/components/nav';
import { useDemo } from '@/lib/store';
import type { AuditEntry, PlatformUser } from '@/lib/types';

/**
 * Accounts and the audit trail.
 *
 * The audit list is the same one the verification queue and the taxonomy manager write
 * to, plus every candidate unmasking and consent change — the actions that matter for
 * governance are all in one chronological place.
 */
const SENSITIVE = ['Revealed candidate details', 'Consent / visibility changed'];

export default function UsersPage() {
  const { users, audit } = useDemo();
  const [onlySensitive, setOnlySensitive] = useState(false);

  const visibleAudit = useMemo(
    () => (onlySensitive ? audit.filter((entry) => SENSITIVE.includes(entry.action)) : audit),
    [audit, onlySensitive],
  );

  const columns: Column<PlatformUser>[] = [
    {
      key: 'name',
      header: 'User',
      sortValue: (row) => row.name,
      render: (row) => (
        <>
          <p className="font-medium text-slate-ink">{row.name}</p>
          <p className="text-xs text-muted">{row.email}</p>
        </>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (row) => row.role,
      render: (row) => <Chip tone="jade">{ROLE_LABEL[row.role]}</Chip>,
    },
    {
      key: 'organisation',
      header: 'Organisation',
      sortValue: (row) => row.organisation,
      render: (row) => <span className="text-body">{row.organisation}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => (
        <Chip tone={row.status === 'Active' ? 'jade' : row.status === 'Invited' ? 'blue' : 'red'}>
          {row.status}
        </Chip>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last active',
      sortValue: (row) => row.lastActive,
      render: (row) => <span className="text-xs text-muted">{row.lastActive}</span>,
    },
  ];

  const byRole = (role: PlatformUser['role']) => users.filter((u) => u.role === role).length;

  return (
    <div>
      <PageHeader
        title="Users & audit log"
        lede="Who has an account, what role they hold, and a chronological trail of the actions that matter for governance."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Users" value={users.length} />
        <StatTile label="Employers" value={byRole('employer')} />
        <StatTile label="Candidates" value={byRole('candidate')} />
        <StatTile label="Recruiters" value={byRole('recruiter')} />
        <StatTile label="Suspended" value={users.filter((u) => u.status === 'Suspended').length} />
      </div>

      <Section title="Accounts" lede="Filter by name, email or organisation.">
        <DataTable
          rows={users}
          columns={columns}
          caption="Platform users"
          rowKey={(row) => row.id}
          filterOn={(row) => `${row.name} ${row.email} ${row.organisation} ${row.role}`}
          filterPlaceholder="Filter users…"
        />
      </Section>

      <Section
        title="Audit log"
        lede="Verification decisions, taxonomy changes, unmaskings and consent changes, newest first."
        actions={
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline"
              checked={onlySensitive}
              onChange={(e) => setOnlySensitive(e.target.checked)}
            />
            Sensitive actions only
          </label>
        }
      >
        {visibleAudit.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted">
              Nothing recorded yet. Reveal a candidate&apos;s details or decide a verification and it
              appears here immediately.
            </p>
          </Card>
        ) : (
          <ol className="space-y-2">
            {visibleAudit.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </Section>

      <div className="mt-6">
        <DemoNote>
          The audit log is in-memory like everything else — try revealing a candidate on the
          Employer applicants screen, then come back and see the entry.
        </DemoNote>
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const sensitive = SENSITIVE.includes(entry.action);

  return (
    <li
      className={`rounded-lg border p-3 ${
        sensitive ? 'border-warn-border bg-warn-bg/50' : 'border-hairline bg-jade-tint/40'
      }`}
    >
      <p className="flex flex-wrap items-center gap-2 text-sm text-slate-ink">
        {sensitive ? (
          <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-warn-fg" />
        ) : null}
        <span className="font-medium">{entry.action}</span>
        <span className="text-muted">—</span>
        <span>{entry.target}</span>
      </p>
      <p className="mt-0.5 text-xs text-muted">{entry.detail}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {entry.actor} · {entry.at}
      </p>
    </li>
  );
}
