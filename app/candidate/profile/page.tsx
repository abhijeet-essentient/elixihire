'use client';

import { BadgeCheck, FileText, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Chip, DemoNote, Field, PageHeader, Select } from '@/components/ui';
import { profileCompleteness } from '@/lib/services/recommendationService';
import { useDemo, useSelectors, useTaxonomy } from '@/lib/store';
import type { Candidate, SpecialtyExperience, SurgicalRole } from '@/lib/types';

/**
 * The structured profile builder. Everything an employer's rules will read is captured
 * as a field here — including the operative track record, which is the part generic
 * CV parsing gets wrong.
 */
export default function CandidateProfilePage() {
  const { updateCandidate, candidates, activeCandidateId } = useDemo();
  const { activeCandidate } = useSelectors();
  const taxonomy = useTaxonomy();
  const [draft, setDraft] = useState<Candidate>(activeCandidate);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const completeness = useMemo(() => profileCompleteness(draft), [draft]);

  // Follow a demo reset, or a switch of the active candidate, back to the stored profile.
  useEffect(() => {
    const current = candidates.find((c) => c.id === activeCandidateId);
    if (current) setDraft(current);
  }, [candidates, activeCandidateId]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    updateCandidate(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const updateSpecialty = (index: number, patch: Partial<SpecialtyExperience>) => {
    setDraft((d) => ({
      ...d,
      specialties: d.specialties.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My profile"
        lede="Structured fields, not a free-text CV. This is what employers' fit rules read — and what your own job search is scored against."
      />

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Profile completeness</h2>
            <p className="mt-0.5 text-sm text-muted">
              Weighted by how much each field moves a fit score — it updates as you edit.
            </p>
          </div>
          <span className="font-serif text-3xl text-slate-ink">{completeness.percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completeness.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
          className="mt-3 h-2 overflow-hidden rounded-full bg-hairline"
        >
          <div
            className="h-full rounded-full bg-jade transition-[width] duration-500"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {completeness.items.map((item) => (
            <li key={item.label}>
              <Chip tone={item.done ? 'jade' : 'neutral'} title={item.hint}>
                {item.done ? '✓' : '○'} {item.label}
              </Chip>
            </li>
          ))}
        </ul>
      </Card>

      <form onSubmit={save}>
        <Card className="p-5">
          <h2 className="section-title">Identity & role</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" hint="Masked to initials for employers by default.">
              <input
                id="name"
                className="input"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              />
            </Field>
            <Field label="Role type" htmlFor="roleType">
              <Select
                id="roleType"
                options={taxonomy.roleTypes}
                value={draft.roleType}
                onChange={(e) => setDraft({ ...draft, roleType: e.target.value })}
              />
            </Field>
            <Field label="Headline" htmlFor="headline" className="sm:col-span-2">
              <input
                id="headline"
                className="input"
                value={draft.headline}
                onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
              />
            </Field>
            <Field label="Contact email" htmlFor="email">
              <input
                id="email"
                type="email"
                className="input"
                value={draft.contactEmail}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              />
            </Field>
            <Field label="Contact phone" htmlFor="phone">
              <input
                id="phone"
                className="input"
                value={draft.contactPhone}
                onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
              />
            </Field>
            <Field label="Current employer" htmlFor="employer">
              <input
                id="employer"
                className="input"
                value={draft.currentEmployer}
                onChange={(e) => setDraft({ ...draft, currentEmployer: e.target.value })}
              />
            </Field>
            <Field label="Notice period" htmlFor="notice">
              <input
                id="notice"
                className="input"
                value={draft.noticePeriod}
                onChange={(e) => setDraft({ ...draft, noticePeriod: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Specialties & years</h2>
          <p className="mt-1 text-sm text-muted">
            Years are recorded per specialty, because eleven years in medicine is not eleven years in
            obstetrics.
          </p>

          <ul className="mt-4 space-y-4">
            {draft.specialties.map((entry, index) => (
              <li key={index} className="rounded-lg border border-hairline p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Specialty" htmlFor={`spec-${index}`}>
                    <Select
                      id={`spec-${index}`}
                      options={taxonomy.specialties}
                      value={entry.specialty}
                      onChange={(e) =>
                        updateSpecialty(index, { specialty: e.target.value, subSpecialties: [] })
                      }
                    />
                  </Field>
                  <Field label="Years in this specialty" htmlFor={`years-${index}`}>
                    <input
                      id={`years-${index}`}
                      type="number"
                      min={0}
                      max={50}
                      className="input"
                      value={entry.years}
                      onChange={(e) =>
                        updateSpecialty(index, { years: Number(e.target.value) || 0 })
                      }
                    />
                  </Field>
                </div>

                <fieldset className="mt-3">
                  <legend className="field-label">Sub-specialties / focus</legend>
                  <div className="flex flex-wrap gap-2">
                    {(taxonomy.subSpecialties[entry.specialty] ?? []).map((sub) => (
                      <label
                        key={sub}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs hover:bg-jade-tint"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-hairline"
                          checked={entry.subSpecialties.includes(sub)}
                          onChange={() =>
                            updateSpecialty(index, {
                              subSpecialties: toggleIn(entry.subSpecialties, sub),
                            })
                          }
                        />
                        {sub}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {draft.specialties.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="mt-3"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        specialties: draft.specialties.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove specialty
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() =>
              setDraft({
                ...draft,
                specialties: [
                  ...draft.specialties,
                  { specialty: taxonomy.specialties[0], years: 1, subSpecialties: [] },
                ],
              })
            }
          >
            Add a specialty
          </Button>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Credential wallet</h2>
          <p className="mt-1 text-sm text-muted">
            Licences and certifications you hold. Employers see the badge, never the document.
          </p>

          {draft.credentials.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {draft.credentials.map((credential) => (
                <li
                  key={credential}
                  className="flex items-center gap-1.5 rounded-lg border border-jade/30 bg-jade/10 px-2.5 py-1.5 text-xs text-jade-dark"
                >
                  <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="font-medium">{credential}</span>
                  <span className="rounded-full border border-jade/30 px-1.5 py-px text-[9px] uppercase tracking-wide">
                    verified (mock)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No credentials recorded yet.</p>
          )}

          <p className="mt-3 text-xs text-muted">
            &quot;Verified&quot; is illustrative. In the real product a credential is checked against
            the issuing council before it carries this badge.
          </p>

          <h3 className="mt-5 text-sm font-semibold text-slate-ink">Edit what you hold</h3>
          <fieldset className="mt-3">
            <legend className="sr-only">Credentials held</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {taxonomy.credentials.map((credential) => (
                <label
                  key={credential}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-hairline px-3 py-2 text-sm hover:bg-jade-tint"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-hairline"
                    checked={draft.credentials.includes(credential)}
                    onChange={() =>
                      setDraft({ ...draft, credentials: toggleIn(draft.credentials, credential) })
                    }
                  />
                  <span className="text-body">{credential}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Résumé</h2>
          <p className="mt-1 text-sm text-muted">
            Optional. The structured fields above are what the matching rules read — a résumé is
            only context for a human.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={(e) => {
                const name = e.target.files?.[0]?.name;
                if (name) setDraft({ ...draft, resumeFileName: name });
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden="true" className="h-3.5 w-3.5" />
              Choose a file
            </Button>
            {draft.resumeFileName ? (
              <span className="flex items-center gap-1.5 text-sm text-body">
                <FileText aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
                {draft.resumeFileName}
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, resumeFileName: undefined })}
                  className="rounded text-xs text-muted underline-offset-2 hover:underline"
                >
                  remove
                </button>
              </span>
            ) : (
              <span className="text-sm text-muted">No file attached.</span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            Only the file name is kept, and only in this browser tab. The file itself is never read,
            uploaded or stored — there is nowhere for it to go.
          </p>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Availability & preferences</h2>

          <fieldset className="mt-4">
            <legend className="field-label">Shifts / time-slots you can work</legend>
            <div className="flex flex-wrap gap-2">
              {taxonomy.shifts.map((shift) => (
                <label
                  key={shift}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs hover:bg-jade-tint"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-hairline"
                    checked={draft.availability.includes(shift)}
                    onChange={() =>
                      setDraft({ ...draft, availability: toggleIn(draft.availability, shift) })
                    }
                  />
                  {shift}
                </label>
              ))}
            </div>
          </fieldset>

          <AvailabilityCalendar availability={draft.availability} />

          <fieldset className="mt-4">
            <legend className="field-label">Preferred locations</legend>
            <div className="flex flex-wrap gap-2">
              {taxonomy.locations.map((loc) => (
                <label
                  key={loc}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs hover:bg-jade-tint"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-hairline"
                    checked={draft.preferredLocations.includes(loc)}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        preferredLocations: toggleIn(draft.preferredLocations, loc),
                      })
                    }
                  />
                  {loc}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="field-label">Employment types you would consider</legend>
            <div className="flex flex-wrap gap-2">
              {taxonomy.employmentTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs hover:bg-jade-tint"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-hairline"
                    checked={draft.employmentTypePreference.includes(type)}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        employmentTypePreference: toggleIn(draft.employmentTypePreference, type),
                      })
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Surgical / procedural experience</h2>
          <p className="mt-1 text-sm text-muted">
            Whether you have <strong>led</strong> cases or <strong>assisted</strong> is scored
            separately. A job asking for a primary surgeon will never read assisting experience as a
            full match.
          </p>

          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm hover:bg-jade-tint">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-hairline"
              checked={draft.surgical.performed}
              onChange={(e) =>
                setDraft({ ...draft, surgical: { ...draft.surgical, performed: e.target.checked } })
              }
            />
            <span className="text-body">I have performed or assisted in surgical / procedural cases</span>
          </label>

          {draft.surgical.performed ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Your operative role" htmlFor="surgRole">
                <Select
                  id="surgRole"
                  options={['Primary / lead surgeon', 'Assisting']}
                  value={draft.surgical.role}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      surgical: { ...draft.surgical, role: e.target.value as SurgicalRole },
                    })
                  }
                />
              </Field>
              <Field label="Approximate case volume" htmlFor="surgVolume">
                <input
                  id="surgVolume"
                  type="number"
                  min={0}
                  className="input"
                  value={draft.surgical.caseVolume}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      surgical: { ...draft.surgical, caseVolume: Number(e.target.value) || 0 },
                    })
                  }
                />
              </Field>
              <Field label="Notable procedures" htmlFor="surgNotes" className="sm:col-span-2">
                <input
                  id="surgNotes"
                  className="input"
                  value={draft.surgical.notableProcedures}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      surgical: { ...draft.surgical, notableProcedures: e.target.value },
                    })
                  }
                  placeholder="e.g. Emergency caesarean section, hysterectomy"
                />
              </Field>
            </div>
          ) : null}
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="section-title">Consent & visibility</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm hover:bg-jade-tint">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-hairline"
              checked={draft.consentToShare}
              onChange={(e) => setDraft({ ...draft, consentToShare: e.target.checked })}
            />
            <span className="text-body">
              Let verified employers discover my profile in sourcing searches
              <span className="mt-1 block text-xs text-muted">
                With this off you can still apply to jobs yourself — you simply will not appear in an
                employer&apos;s talent-pool search. Your name and contact stay masked either way until
                you are revealed.
              </span>
            </span>
          </label>
          <div className="mt-3">
            <Chip tone={draft.consentToShare ? 'jade' : 'amber'}>
              {draft.consentToShare ? 'Discoverable' : 'Hidden from sourcing'}
            </Chip>
          </div>
        </Card>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit">Save profile</Button>
          <Button type="button" variant="ghost" onClick={() => setDraft(activeCandidate)}>
            Discard changes
          </Button>
          {saved ? (
            <span role="status" className="text-sm font-medium text-jade-dark">
              Saved — your fit scores have been recalculated.
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <DemoNote>
            Saving changes your fit scores everywhere in this session — try dropping your case volume
            below a job&apos;s minimum, or switching primary to assisting, then look at Find jobs.
          </DemoNote>
        </div>
      </form>
    </div>
  );
}

/**
 * A read-only weekly view of what the shift selections above actually mean.
 *
 * It exists to make an abstract list of chips concrete: "Rotational" and "5–8 PM OPD"
 * look very different once you see them on a week.
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BANDS = [
  { label: 'Morning', hint: '08:00–12:00' },
  { label: 'Afternoon', hint: '12:00–17:00' },
  { label: 'Evening', hint: '17:00–21:00' },
  { label: 'Night', hint: '21:00–08:00' },
];

/** Which day/band cells a given availability entry covers. */
function coverageFor(availability: string[]): Set<string> {
  const cells = new Set<string>();
  const add = (days: string[], bands: string[]) => {
    for (const day of days) for (const band of bands) cells.add(`${day}|${band}`);
  };
  const weekdays = DAYS.slice(0, 5);
  const weekend = DAYS.slice(5);

  for (const entry of availability) {
    switch (entry) {
      case 'Day':
        add(weekdays, ['Morning', 'Afternoon']);
        break;
      case 'Evening':
        add(weekdays, ['Evening']);
        break;
      case 'Night':
        add(DAYS, ['Night']);
        break;
      case '5–8 PM OPD slot':
        add(weekdays, ['Evening']);
        break;
      case '8–11 AM OPD slot':
        add(weekdays, ['Morning']);
        break;
      case 'Rotational':
        add(DAYS, ['Morning', 'Afternoon', 'Evening', 'Night']);
        break;
      case 'On-call':
        add(DAYS, ['Night', 'Evening']);
        break;
      case 'Part-time / Locum':
        add(weekdays, ['Morning']);
        break;
      case 'Weekend only':
        add(weekend, ['Morning', 'Afternoon', 'Evening']);
        break;
      default:
        break;
    }
  }
  return cells;
}

function AvailabilityCalendar({ availability }: { availability: string[] }) {
  const cells = coverageFor(availability);

  return (
    <div className="mt-5">
      <p className="field-label">What that looks like on a week</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] border-collapse text-xs">
          <caption className="sr-only">
            Weekly availability derived from the selected shift patterns
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-20 py-1 text-left font-medium text-muted">
                <span className="sr-only">Time band</span>
              </th>
              {DAYS.map((day) => (
                <th key={day} scope="col" className="py-1 text-center font-medium text-muted">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANDS.map((band) => (
              <tr key={band.label}>
                <th scope="row" className="py-1 pr-2 text-left font-medium text-muted">
                  {band.label}
                  <span className="block text-[10px] font-normal opacity-80">{band.hint}</span>
                </th>
                {DAYS.map((day) => {
                  const on = cells.has(`${day}|${band.label}`);
                  return (
                    <td key={day} className="p-0.5">
                      <div
                        title={`${day} ${band.label}: ${on ? 'available' : 'not available'}`}
                        className={`h-7 rounded ${on ? 'bg-jade/70' : 'bg-hairline/50'}`}
                      >
                        <span className="sr-only">
                          {day} {band.label}: {on ? 'available' : 'not available'}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Derived from your shift selections above — it is a reading of them, not a separate setting.
      </p>
    </div>
  );
}
