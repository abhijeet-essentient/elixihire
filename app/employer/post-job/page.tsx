'use client';

import { Check, Sparkles, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { JobCard } from '@/components/JobCard';
import { TierBadge } from '@/components/TierBadge';
import { Button, Card, Chip, DemoNote, Field, PageHeader, Select } from '@/components/ui';
import { suggestPosting } from '@/lib/services/draftingService';
import { useDemo, useSelectors, useTaxonomy } from '@/lib/store';
import type { Job, SurgicalRole } from '@/lib/types';

type Draft = Omit<Job, 'id' | 'postedOn' | 'organisationId'>;

const STEPS = ['The role', 'When & where', 'Requirements', 'Describe & publish'] as const;

/**
 * The structured intake, as a four-step wizard with a live preview of exactly what a
 * candidate will see. Almost every field is a select or a toggle rather than free text —
 * that is what makes the matching rules possible downstream.
 */
export default function PostJobPage() {
  const router = useRouter();
  const { postJob } = useDemo();
  const { employerOrg } = useSelectors();
  const taxonomy = useTaxonomy();

  const initialDraft = useMemo<Draft>(
    () => ({
      title: '',
      roleType: taxonomy.roleTypes[0],
      specialty: taxonomy.specialties[0],
      subSpecialty: (taxonomy.subSpecialties[taxonomy.specialties[0]] ?? ['General'])[0],
      minYearsInSpecialty: 3,
      requiredCredentials: [],
      shift: taxonomy.shifts[0],
      employmentType: taxonomy.employmentTypes[0],
      location: taxonomy.locations[0],
      salaryBand: '',
      positionsOpen: 1,
      description: '',
      surgical: { required: false, role: 'Primary / lead surgeon', minCaseVolume: 50 },
      status: 'Open',
    }),
    [taxonomy],
  );

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [assistRationale, setAssistRationale] = useState<string[] | null>(null);

  const subSpecialties = useMemo(
    () => taxonomy.subSpecialties[draft.specialty] ?? ['General'],
    [taxonomy, draft.specialty],
  );

  const toggleCredential = (credential: string) => {
    setDraft((d) => ({
      ...d,
      requiredCredentials: d.requiredCredentials.includes(credential)
        ? d.requiredCredentials.filter((c) => c !== credential)
        : [...d.requiredCredentials, credential],
    }));
  };

  const runAssist = () => {
    const suggestion = suggestPosting(draft);
    setDraft((d) => ({
      ...d,
      description: suggestion.description,
      requiredCredentials: Array.from(
        new Set([...d.requiredCredentials, ...suggestion.credentials]),
      ),
    }));
    setAssistRationale(suggestion.rationale);
  };

  const canAdvance = step > 0 || draft.title.trim().length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('Give the role a title before posting.');
      setStep(0);
      return;
    }
    postJob({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim() || 'No description provided.',
      salaryBand: draft.salaryBand.trim() || 'Not disclosed',
    });
    router.push('/employer/jobs/');
  };

  const previewJob: Job = {
    ...draft,
    id: 'preview',
    organisationId: employerOrg.id,
    postedOn: 'today',
    title: draft.title.trim() || 'Untitled role',
    description: draft.description.trim() || 'Your description will appear here.',
    salaryBand: draft.salaryBand.trim() || 'Not disclosed',
  };

  return (
    <div>
      <PageHeader
        title="Post a job"
        lede={`Structured intake for ${employerOrg.name}. The fields here are what the fit rules read — free text is kept to the description alone.`}
      />

      <div data-tour="wizard" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={submit} noValidate>
          <ol className="mb-5 flex flex-wrap gap-1.5" aria-label="Wizard steps">
            {STEPS.map((label, index) => {
              const state = index === step ? 'current' : index < step ? 'done' : 'todo';
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      state === 'current'
                        ? 'border-jade bg-jade text-white'
                        : state === 'done'
                          ? 'border-jade/30 bg-jade/10 text-jade-dark'
                          : 'border-hairline text-muted hover:bg-jade-tint'
                    }`}
                  >
                    {state === 'done' ? (
                      <Check aria-hidden="true" className="h-3 w-3" />
                    ) : (
                      <span className="tabular-nums">{index + 1}</span>
                    )}
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>

          {step === 0 ? (
            <Card className="p-5">
              <h2 className="section-title">The role</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Job title" htmlFor="title" className="sm:col-span-2">
                  <input
                    id="title"
                    className="input"
                    value={draft.title}
                    onChange={(e) => {
                      setDraft({ ...draft, title: e.target.value });
                      setError('');
                    }}
                    placeholder="e.g. Consultant Obstetrician & Gynaecologist"
                    required
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

                <Field label="Employment type" htmlFor="employmentType">
                  <Select
                    id="employmentType"
                    options={taxonomy.employmentTypes}
                    value={draft.employmentType}
                    onChange={(e) => setDraft({ ...draft, employmentType: e.target.value })}
                  />
                </Field>

                <Field
                  label="Specialty"
                  htmlFor="specialty"
                  hint="Heaviest weighted criterion, and a mandatory gate."
                >
                  <Select
                    id="specialty"
                    options={taxonomy.specialties}
                    value={draft.specialty}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        specialty: e.target.value,
                        subSpecialty: (taxonomy.subSpecialties[e.target.value] ?? ['General'])[0],
                      })
                    }
                  />
                </Field>

                <Field label="Sub-specialty / focus" htmlFor="subSpecialty">
                  <Select
                    id="subSpecialty"
                    options={subSpecialties}
                    value={draft.subSpecialty}
                    onChange={(e) => setDraft({ ...draft, subSpecialty: e.target.value })}
                  />
                </Field>

                <Field label="Minimum years in specialty" htmlFor="minYears">
                  <input
                    id="minYears"
                    type="number"
                    min={0}
                    max={40}
                    className="input"
                    value={draft.minYearsInSpecialty}
                    onChange={(e) =>
                      setDraft({ ...draft, minYearsInSpecialty: Number(e.target.value) || 0 })
                    }
                  />
                </Field>

                <Field label="Positions open" htmlFor="positions">
                  <input
                    id="positions"
                    type="number"
                    min={1}
                    max={99}
                    className="input"
                    value={draft.positionsOpen}
                    onChange={(e) => setDraft({ ...draft, positionsOpen: Number(e.target.value) || 1 })}
                  />
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card className="p-5">
              <h2 className="section-title">When and where</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Shift / time-slot"
                  htmlFor="shift"
                  hint="Named slots like the 5–8 PM OPD are matched exactly, not approximately."
                >
                  <Select
                    id="shift"
                    options={taxonomy.shifts}
                    value={draft.shift}
                    onChange={(e) => setDraft({ ...draft, shift: e.target.value })}
                  />
                </Field>

                <Field label="Location" htmlFor="location">
                  <Select
                    id="location"
                    options={taxonomy.locations}
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </Field>

                <Field label="Salary band (INR)" htmlFor="salary" className="sm:col-span-2">
                  <input
                    id="salary"
                    className="input"
                    value={draft.salaryBand}
                    onChange={(e) => setDraft({ ...draft, salaryBand: e.target.value })}
                    placeholder="e.g. ₹36–48 LPA, or ₹18–24k per session"
                  />
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 2 ? (
            <>
              <Card className="p-5">
                <h2 className="section-title">Credentials & licences required</h2>
                <p className="mt-1 text-sm text-muted">
                  These are a gate: a candidate missing any of them cannot score as a full match.
                </p>
                <fieldset className="mt-3">
                  <legend className="sr-only">Required credentials</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {taxonomy.credentials.map((credential) => (
                      <label
                        key={credential}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-hairline px-3 py-2 text-sm hover:bg-jade-tint"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-hairline"
                          checked={draft.requiredCredentials.includes(credential)}
                          onChange={() => toggleCredential(credential)}
                        />
                        <span className="text-body">{credential}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </Card>

              <Card className="mt-5 p-5">
                <h2 className="section-title">Surgical / procedural requirement</h2>
                <p className="mt-1 text-sm text-muted">
                  The field a generic job board cannot express: whether the person must have
                  <strong> led</strong> cases, not merely attended them.
                </p>

                <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm hover:bg-jade-tint">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-hairline"
                    checked={draft.surgical.required}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        surgical: { ...draft.surgical, required: e.target.checked },
                      })
                    }
                  />
                  <span className="text-body">
                    This role requires performed surgical / procedural cases
                  </span>
                </label>

                {draft.surgical.required ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Required operative role"
                      htmlFor="surgicalRole"
                      hint="Choosing primary means assisting-only experience is explicitly capped."
                    >
                      <Select
                        id="surgicalRole"
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
                    <Field label="Minimum case volume" htmlFor="caseVolume">
                      <input
                        id="caseVolume"
                        type="number"
                        min={0}
                        className="input"
                        value={draft.surgical.minCaseVolume}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            surgical: {
                              ...draft.surgical,
                              minCaseVolume: Number(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                ) : null}
              </Card>
            </>
          ) : null}

          {step === 3 ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-title">Description</h2>
                <div className="flex items-center gap-2">
                  <TierBadge tier="preview" phase={2} size="sm" />
                  <Button type="button" size="sm" variant="secondary" onClick={runAssist}>
                    <Wand2 aria-hidden="true" className="h-3.5 w-3.5" />
                    AI assist
                  </Button>
                </div>
              </div>

              <p className="mt-1 text-xs text-muted">
                In this demo &quot;AI assist&quot; is a deterministic template — it composes the
                description and suggests credentials from the structured fields you have already
                chosen. Same inputs, same output, every time.
              </p>

              <Field label="What the job actually involves" htmlFor="description" className="mt-4">
                <textarea
                  id="description"
                  rows={7}
                  className="input"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Unit size, rota, on-call expectations, reporting line…"
                />
              </Field>

              {assistRationale ? (
                <div className="mt-3 rounded-lg border border-warn-border bg-warn-bg p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-warn-fg">
                    <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                    How the suggestion was derived
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-warn-fg">
                    {assistRationale.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep(step + 1)}
                title={canAdvance ? undefined : 'Give the role a title first'}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit">Post job</Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(initialDraft);
                setStep(0);
                setAssistRationale(null);
              }}
            >
              Clear form
            </Button>
          </div>

          <div className="mt-4">
            <DemoNote>
              Posting adds the job to in-memory state only. It appears immediately in My jobs and in
              candidate search, and disappears when you reset the demo.
            </DemoNote>
          </div>
        </form>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="section-title">Live preview</h2>
            <Chip tone="jade">as candidates see it</Chip>
          </div>
          <ul className="space-y-3">
            <JobCard job={previewJob} organisation={employerOrg} showStatus />
          </ul>
        </aside>
      </div>
    </div>
  );
}
