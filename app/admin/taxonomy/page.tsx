'use client';

import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Chip, DemoNote, PageHeader, Section } from '@/components/ui';
import { useDemo, useTaxonomy } from '@/lib/store';
import type { Taxonomy } from '@/lib/types';

/**
 * The taxonomy manager — the "extend without rework" proof.
 *
 * Specialties, credentials and shift types are data, not code. Everything edited here
 * is read live by the job wizard, the candidate profile and the job-search filters, so
 * adding a specialty the client cares about is a data change, not a release.
 */

type ListKey = 'roleTypes' | 'specialties' | 'credentials' | 'shifts' | 'employmentTypes' | 'locations';

const LISTS: { key: ListKey; title: string; note: string }[] = [
  { key: 'specialties', title: 'Specialties', note: 'Heaviest matching criterion and a gate on every role.' },
  { key: 'credentials', title: 'Credentials & licences', note: 'A job can mark any of these mandatory.' },
  { key: 'shifts', title: 'Shift / time-slots', note: 'Named slots are matched exactly, not approximately.' },
  { key: 'roleTypes', title: 'Role types', note: 'Drives the baseline credential suggestions.' },
  { key: 'employmentTypes', title: 'Employment types', note: 'Used by search filters and job posts.' },
  { key: 'locations', title: 'Locations', note: 'Matched against candidate location preferences.' },
];

export default function TaxonomyPage() {
  const { updateTaxonomy, jobs, candidates } = useDemo();
  const taxonomy = useTaxonomy();
  const [specialtyForSubs, setSpecialtyForSubs] = useState(taxonomy.specialties[0] ?? '');

  /** How many records would be orphaned if a value disappeared. */
  const usageOf = (key: ListKey, value: string) => {
    switch (key) {
      case 'specialties':
        return (
          jobs.filter((j) => j.specialty === value).length +
          candidates.filter((c) => c.specialties.some((s) => s.specialty === value)).length
        );
      case 'credentials':
        return (
          jobs.filter((j) => j.requiredCredentials.includes(value)).length +
          candidates.filter((c) => c.credentials.includes(value)).length
        );
      case 'shifts':
        return (
          jobs.filter((j) => j.shift === value).length +
          candidates.filter((c) => c.availability.includes(value)).length
        );
      case 'roleTypes':
        return jobs.filter((j) => j.roleType === value).length + candidates.filter((c) => c.roleType === value).length;
      case 'employmentTypes':
        return jobs.filter((j) => j.employmentType === value).length;
      case 'locations':
        return (
          jobs.filter((j) => j.location === value).length +
          candidates.filter((c) => c.preferredLocations.includes(value)).length
        );
      default:
        return 0;
    }
  };

  const addTo = (key: ListKey, value: string) => {
    const trimmed = value.trim();
    if (!trimmed || taxonomy[key].includes(trimmed)) return;
    const next: Taxonomy = { ...taxonomy, [key]: [...taxonomy[key], trimmed] };
    // A new specialty needs a sub-specialty bucket, or the cascading select breaks.
    if (key === 'specialties') {
      next.subSpecialties = { ...taxonomy.subSpecialties, [trimmed]: ['General'] };
    }
    updateTaxonomy(next, `Added "${trimmed}" to ${key}.`);
  };

  const removeFrom = (key: ListKey, value: string) => {
    const next: Taxonomy = { ...taxonomy, [key]: taxonomy[key].filter((v) => v !== value) };
    if (key === 'specialties') {
      const { [value]: _removed, ...rest } = taxonomy.subSpecialties;
      next.subSpecialties = rest;
    }
    updateTaxonomy(next, `Removed "${value}" from ${key}.`);
  };

  const addSub = (specialty: string, value: string) => {
    const trimmed = value.trim();
    const existing = taxonomy.subSpecialties[specialty] ?? [];
    if (!trimmed || existing.includes(trimmed)) return;
    updateTaxonomy(
      {
        ...taxonomy,
        subSpecialties: { ...taxonomy.subSpecialties, [specialty]: [...existing, trimmed] },
      },
      `Added sub-specialty "${trimmed}" under ${specialty}.`,
    );
  };

  const removeSub = (specialty: string, value: string) => {
    const existing = taxonomy.subSpecialties[specialty] ?? [];
    updateTaxonomy(
      {
        ...taxonomy,
        subSpecialties: { ...taxonomy.subSpecialties, [specialty]: existing.filter((v) => v !== value) },
      },
      `Removed sub-specialty "${value}" from ${specialty}.`,
    );
  };

  return (
    <div>
      <PageHeader
        title="Taxonomy manager"
        lede="Specialties, credentials and shift patterns are data, not code. Change one here and every dropdown in the product follows immediately — no release required."
      />

      <Card className="border-jade/30 bg-jade/5 p-5">
        <h2 className="section-title">Why this screen exists</h2>
        <p className="mt-1 text-sm text-body">
          Healthcare taxonomies differ by client: a diagnostics chain and a tertiary hospital do not
          use the same specialty list. Add &quot;Nuclear Medicine&quot; below, then open{' '}
          <Link href="/employer/post-job/" className="text-jade-dark underline underline-offset-2">
            Post a job
          </Link>{' '}
          or{' '}
          <Link href="/candidate/profile/" className="text-jade-dark underline underline-offset-2">
            the candidate profile
          </Link>{' '}
          — it is already there, with a sub-specialty bucket ready for it.
        </p>
      </Card>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {LISTS.map((list) => (
          <ListEditor
            key={list.key}
            title={list.title}
            note={list.note}
            values={taxonomy[list.key]}
            usageOf={(value) => usageOf(list.key, value)}
            onAdd={(value) => addTo(list.key, value)}
            onRemove={(value) => removeFrom(list.key, value)}
          />
        ))}
      </div>

      <Section
        title="Sub-specialties"
        lede="Scoped to a parent specialty, which is what makes the job form cascade."
      >
        <Card className="p-5">
          <label className="field-label" htmlFor="parentSpecialty">
            Parent specialty
          </label>
          <select
            id="parentSpecialty"
            className="input sm:max-w-sm"
            value={specialtyForSubs}
            onChange={(e) => setSpecialtyForSubs(e.target.value)}
          >
            {taxonomy.specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>

          <ul className="mt-4 flex flex-wrap gap-2">
            {(taxonomy.subSpecialties[specialtyForSubs] ?? []).map((sub) => (
              <li
                key={sub}
                className="flex items-center gap-1.5 rounded-full border border-hairline py-1 pl-3 pr-1.5 text-xs"
              >
                <span className="text-body">{sub}</span>
                <button
                  type="button"
                  onClick={() => removeSub(specialtyForSubs, sub)}
                  aria-label={`Remove sub-specialty ${sub}`}
                  className="rounded p-1 text-muted hover:text-danger-fg"
                >
                  <Trash2 aria-hidden="true" className="h-3 w-3" />
                </button>
              </li>
            ))}
            {(taxonomy.subSpecialties[specialtyForSubs] ?? []).length === 0 ? (
              <li className="text-sm text-muted">None yet.</li>
            ) : null}
          </ul>

          <AddRow
            label={`Add a sub-specialty under ${specialtyForSubs}`}
            placeholder="e.g. Foetal medicine"
            onAdd={(value) => addSub(specialtyForSubs, value)}
          />
        </Card>
      </Section>

      <div className="mt-6">
        <DemoNote>
          Removing a value does not rewrite existing records — a job already using it keeps it, and
          the usage count beside each value shows how many records would be affected. Every change
          is written to the admin audit log.
        </DemoNote>
      </div>
    </div>
  );
}

function ListEditor({
  title,
  note,
  values,
  usageOf,
  onAdd,
  onRemove,
}: {
  title: string;
  note: string;
  values: string[];
  usageOf: (value: string) => number;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="section-title">{title}</h2>
      <p className="mt-0.5 text-sm text-muted">{note}</p>

      <ul className="mt-3 space-y-1.5">
        {values.map((value) => {
          const uses = usageOf(value);
          return (
            <li
              key={value}
              className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-body">{value}</span>
              <Chip tone={uses > 0 ? 'jade' : 'neutral'} title={`${uses} record(s) use this`}>
                {uses} in use
              </Chip>
              <button
                type="button"
                onClick={() => onRemove(value)}
                aria-label={`Remove ${value}`}
                className="rounded p-1 text-muted transition-colors hover:text-danger-fg"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      <AddRow label={`Add to ${title.toLowerCase()}`} placeholder="New value" onAdd={onAdd} />
    </Card>
  );
}

function AddRow({
  label,
  placeholder,
  onAdd,
}: {
  label: string;
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue('');
      }}
    >
      <label className="sr-only" htmlFor={label.replace(/\W+/g, '-')}>
        {label}
      </label>
      <input
        id={label.replace(/\W+/g, '-')}
        className="input flex-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <Button type="submit" size="sm" disabled={!value.trim()}>
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Add
      </Button>
    </form>
  );
}
