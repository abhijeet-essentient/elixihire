import type { Job } from '../types';

/**
 * "AI assist" — deliberately not AI.
 *
 * This is a deterministic template engine: it composes a description and suggests
 * credentials from the structured fields the employer has already chosen. It is
 * labelled Preview in the UI because in a later phase a model would do this properly;
 * keeping it behind one module means that swap touches nothing else.
 *
 * Same inputs always produce the same text. Nothing is generated at random.
 */

type Draft = Pick<
  Job,
  'title' | 'roleType' | 'specialty' | 'subSpecialty' | 'minYearsInSpecialty' | 'shift' | 'employmentType' | 'location' | 'positionsOpen' | 'surgical'
>;

const SETTING_BY_ROLE: Record<string, string> = {
  'Doctor / Consultant': 'a consultant-led unit',
  Nurse: 'a busy ward team',
  'Diagnostic technician': 'a high-throughput imaging suite',
  'Lab technologist': 'an accredited laboratory',
  Pharmacist: 'the clinical pharmacy team',
  'Allied health': 'a multidisciplinary therapy team',
  'Hospital administration / management': 'the hospital operations function',
  Support: 'the facilities team',
};

const SHIFT_SENTENCE: Record<string, string> = {
  Day: 'The role runs on day shifts with no routine night cover.',
  Evening: 'The role covers evening shifts.',
  Night: 'This is a night-shift post with a structured handover each morning.',
  '5–8 PM OPD slot': 'This is a strict 5–8 PM outpatient engagement — no inpatient or on-call commitment.',
  '8–11 AM OPD slot': 'This is a morning 8–11 AM outpatient engagement.',
  Rotational: 'Shifts rotate across the roster, with the pattern published a month ahead.',
  'On-call': 'Cover is provided on a shared on-call rota.',
  'Part-time / Locum': 'This is a part-time engagement with sessions agreed in advance.',
  'Weekend only': 'This post covers weekends only.',
};

/** Credentials that are effectively mandatory for a given role type in Indian practice. */
const BASELINE_CREDENTIALS: Record<string, string[]> = {
  'Doctor / Consultant': ['NMC registration (national)', 'State Medical Council registration'],
  Nurse: ['Indian Nursing Council registration', 'State Nursing Council registration'],
  'Diagnostic technician': ['AERB radiation safety clearance'],
  'Lab technologist': ['NABL-lab competency sign-off'],
  Pharmacist: ['Pharmacy Council registration'],
  'Allied health': ['BLS certification'],
  'Hospital administration / management': ['Fire & safety mandatory training'],
  Support: ['Fire & safety mandatory training'],
};

/** Extra credentials implied by the specialty itself. */
const SPECIALTY_CREDENTIALS: Record<string, string[]> = {
  'Paediatrics / Neonatology': ['NRP (Neonatal Resuscitation) certification', 'BLS certification'],
  'Emergency Medicine': ['BLS certification', 'ACLS certification'],
  'Critical Care': ['BLS certification', 'ACLS certification'],
  Cardiology: ['ACLS certification'],
  Anaesthesia: ['ACLS certification'],
  Radiology: ['AERB radiation safety clearance'],
  Pathology: ['NABL-lab competency sign-off'],
};

export interface DraftSuggestion {
  description: string;
  credentials: string[];
  rationale: string[];
}

export function suggestPosting(draft: Draft): DraftSuggestion {
  const setting = SETTING_BY_ROLE[draft.roleType] ?? 'the clinical team';
  const plural = draft.positionsOpen > 1;

  const opening = `${draft.title.trim() || `A ${draft.specialty} post`} joining ${setting} in ${draft.location}.`;

  const focus = `The post is focused on ${draft.subSpecialty.toLowerCase()}, and we are looking for at least ${
    draft.minYearsInSpecialty
  } year${draft.minYearsInSpecialty === 1 ? '' : 's'} of ${draft.specialty.toLowerCase()} practice.`;

  const shift = SHIFT_SENTENCE[draft.shift] ?? `Shift pattern: ${draft.shift}.`;

  const surgical = draft.surgical.required
    ? draft.surgical.role === 'Primary / lead surgeon'
      ? `An independent operating record is essential: at least ${draft.surgical.minCaseVolume} cases performed as the primary surgeon. Assisting experience alone will not meet this requirement.`
      : `Theatre experience is required — at least ${draft.surgical.minCaseVolume} cases, assisting or leading.`
    : 'There is no operative requirement for this post.';

  const closing = plural
    ? `We are recruiting ${draft.positionsOpen} positions on a ${draft.employmentType.toLowerCase()} basis.`
    : `This is a single ${draft.employmentType.toLowerCase()} position.`;

  const credentials = Array.from(
    new Set([
      ...(BASELINE_CREDENTIALS[draft.roleType] ?? []),
      ...(SPECIALTY_CREDENTIALS[draft.specialty] ?? []),
    ]),
  );

  const rationale = [
    `Role type "${draft.roleType}" implies ${(BASELINE_CREDENTIALS[draft.roleType] ?? ['no baseline registration']).join(' and ')}.`,
    SPECIALTY_CREDENTIALS[draft.specialty]
      ? `${draft.specialty} typically also requires ${SPECIALTY_CREDENTIALS[draft.specialty].join(' and ')}.`
      : `${draft.specialty} adds no further mandatory credential in this taxonomy.`,
    draft.surgical.required
      ? 'Operative requirement detected, so the description states the primary-vs-assisting expectation explicitly.'
      : 'No operative requirement set, so the description says so rather than leaving it ambiguous.',
  ];

  return {
    description: [opening, focus, shift, surgical, closing].join(' '),
    credentials,
    rationale,
  };
}
