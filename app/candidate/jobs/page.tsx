'use client';

import { BellRing, BookmarkPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FitLegend } from '@/components/FitBadge';
import { JobCard } from '@/components/JobCard';
import { Button, Card, Chip, DemoNote, EmptyState, PageHeader } from '@/components/ui';
import { rankJobs } from '@/lib/services/matchingService';
import { useDemo, useSelectors, useTaxonomy } from '@/lib/store';

const ANY = 'Any';

/** Healthcare-aware search: the filters are the structured fields, not keywords. */
export default function FindJobsPage() {
  const {
    applications,
    applyToJob,
    organisations,
    jobs,
    savedSearches,
    saveSearch,
    deleteSearch,
    jobAlertsOn,
    toggleJobAlerts,
  } = useDemo();
  const { activeCandidate } = useSelectors();
  const taxonomy = useTaxonomy();

  const [specialty, setSpecialty] = useState(ANY);
  const [subSpecialty, setSubSpecialty] = useState(ANY);
  const [shift, setShift] = useState(ANY);
  const [location, setLocation] = useState(ANY);
  const [employmentType, setEmploymentType] = useState(ANY);
  const [credential, setCredential] = useState(ANY);
  const [onlyGoodFit, setOnlyGoodFit] = useState(false);

  const subOptions = useMemo(
    () => [ANY, ...(specialty === ANY ? [] : (taxonomy.subSpecialties[specialty] ?? []))],
    [specialty, taxonomy],
  );

  /** The active filter set, as plain labels — what a saved search stores. */
  const activeFilters = useMemo(() => {
    const entries: Record<string, string> = {};
    if (specialty !== ANY) entries.Specialty = specialty;
    if (subSpecialty !== ANY) entries['Sub-specialty'] = subSpecialty;
    if (shift !== ANY) entries.Shift = shift;
    if (location !== ANY) entries.Location = location;
    if (employmentType !== ANY) entries['Employment type'] = employmentType;
    if (credential !== ANY) entries.Credential = credential;
    return entries;
  }, [specialty, subSpecialty, shift, location, employmentType, credential]);

  const applySaved = (filters: Record<string, string>) => {
    setSpecialty(filters.Specialty ?? ANY);
    setSubSpecialty(filters['Sub-specialty'] ?? ANY);
    setShift(filters.Shift ?? ANY);
    setLocation(filters.Location ?? ANY);
    setEmploymentType(filters['Employment type'] ?? ANY);
    setCredential(filters.Credential ?? ANY);
  };

  const results = useMemo(() => {
    const open = jobs.filter((job) => job.status === 'Open');
    const filtered = open.filter(
      (job) =>
        (specialty === ANY || job.specialty === specialty) &&
        (subSpecialty === ANY || job.subSpecialty === subSpecialty) &&
        (shift === ANY || job.shift === shift) &&
        (location === ANY || job.location === location) &&
        (employmentType === ANY || job.employmentType === employmentType) &&
        (credential === ANY || job.requiredCredentials.includes(credential)),
    );
    const ranked = rankJobs(filtered, activeCandidate);
    return onlyGoodFit ? ranked.filter((r) => r.fit.score >= 60) : ranked;
  }, [
    jobs,
    specialty,
    subSpecialty,
    shift,
    location,
    employmentType,
    credential,
    onlyGoodFit,
    activeCandidate,
  ]);

  const appliedJobIds = useMemo(
    () =>
      new Set(
        applications.filter((a) => a.candidateId === activeCandidate.id).map((a) => a.jobId),
      ),
    [applications, activeCandidate.id],
  );

  const resetFilters = () => {
    setSpecialty(ANY);
    setSubSpecialty(ANY);
    setShift(ANY);
    setLocation(ANY);
    setEmploymentType(ANY);
    setCredential(ANY);
    setOnlyGoodFit(false);
  };

  return (
    <div>
      <PageHeader
        title="Find jobs"
        lede={`Scored against your own profile — ${activeCandidate.headline}. Open the breakdown on any role to see exactly why it scored what it did.`}
      />

      <Card className="p-4">
        <h2 className="sr-only">Filters</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            id="f-specialty"
            label="Specialty"
            value={specialty}
            options={[ANY, ...taxonomy.specialties]}
            onChange={(v) => {
              setSpecialty(v);
              setSubSpecialty(ANY);
            }}
          />
          <FilterSelect
            id="f-sub"
            label="Sub-specialty"
            value={subSpecialty}
            options={subOptions}
            onChange={setSubSpecialty}
            disabled={specialty === ANY}
          />
          <FilterSelect
            id="f-shift"
            label="Shift / time-slot"
            value={shift}
            options={[ANY, ...taxonomy.shifts]}
            onChange={setShift}
          />
          <FilterSelect
            id="f-location"
            label="Location"
            value={location}
            options={[ANY, ...taxonomy.locations]}
            onChange={setLocation}
          />
          <FilterSelect
            id="f-employment"
            label="Employment type"
            value={employmentType}
            options={[ANY, ...taxonomy.employmentTypes]}
            onChange={setEmploymentType}
          />
          <FilterSelect
            id="f-credential"
            label="Requires credential"
            value={credential}
            options={[ANY, ...taxonomy.credentials]}
            onChange={setCredential}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline"
              checked={onlyGoodFit}
              onChange={(e) => setOnlyGoodFit(e.target.checked)}
            />
            Good fit or better only (60+)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={Object.keys(activeFilters).length === 0}
              title={
                Object.keys(activeFilters).length === 0
                  ? 'Set at least one filter to save a search'
                  : undefined
              }
              onClick={() =>
                saveSearch({
                  name: Object.values(activeFilters).join(' · '),
                  filters: activeFilters,
                })
              }
            >
              <BookmarkPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Save this search
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-ink">Saved searches</h2>
            <p className="mt-0.5 text-xs text-muted">
              Stored in this session only. Reset the demo and the seeded one comes back.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline"
              checked={jobAlertsOn}
              onChange={toggleJobAlerts}
            />
            <BellRing aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
            Email me matching roles
            <Chip tone="amber">mock</Chip>
          </label>
        </div>

        {savedSearches.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing saved yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <li
                key={search.id}
                className="flex items-center gap-1.5 rounded-full border border-hairline py-1 pl-3 pr-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => applySaved(search.filters)}
                  className="rounded font-medium text-jade-dark hover:underline"
                >
                  {search.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSearch(search.id)}
                  aria-label={`Delete saved search ${search.name}`}
                  className="rounded p-1 text-muted hover:text-danger-fg"
                >
                  <Trash2 aria-hidden="true" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">
          {results.length} open role{results.length === 1 ? '' : 's'}
        </h2>
        <FitLegend />
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No roles match those filters"
          body="Widen the filters — the seed data covers eight roles across six organisations."
        />
      ) : (
        <ul className="space-y-4">
          {results.map(({ job, fit }) => {
            const applied = appliedJobIds.has(job.id);
            return (
              <JobCard
                key={job.id}
                job={job}
                organisation={organisations.find((o) => o.id === job.organisationId)}
                fit={fit}
                actions={
                  <>
                    <Button
                      disabled={applied}
                      onClick={() => applyToJob(job.id, activeCandidate.id)}
                    >
                      {applied ? 'Applied' : 'Apply'}
                    </Button>
                    <Link href={`/candidate/job/?id=${job.id}`}>
                      <Button variant="secondary">View details</Button>
                    </Link>
                    {applied ? (
                      <span className="text-xs text-muted">
                        Track it under My applications.
                      </span>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </ul>
      )}

      <div className="mt-6">
        <DemoNote>
          Only Open roles are searchable — a paused or closed job disappears from here but keeps its
          pipeline on the employer side.
        </DemoNote>
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="input disabled:bg-jade-tint/50 disabled:text-muted"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
