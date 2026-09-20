import type { Candidate, FitDimension, FitLabel, FitReason, FitResult, Job } from '../types';

/**
 * Deterministic, rule-based fit scoring — no AI, no network, no randomness.
 *
 * The whole rule set lives behind `computeFit` on purpose: in the real product the
 * scoring engine would be swapped for a learned model, and this module boundary is
 * where that swap happens. Callers only ever see { score, label, reasons }.
 *
 * Weights are expressed in points. The surgical criterion carries weight only when the
 * job actually asks for operative experience, so the final score is always normalised
 * against the weight that was genuinely in play for that job.
 */

const WEIGHTS = {
  specialty: 30,
  subSpecialty: 12,
  experience: 15,
  shift: 13,
  credentials: 15,
  surgical: 25,
  location: 5,
} as const;

/**
 * Some criteria are gates, not preferences. Healthcare hiring really works this way:
 * you cannot roster a nurse who lacks the mandatory council registration, and you
 * cannot put an assisting-only registrar on a lead-surgeon post however good the rest
 * of the profile is. When a job declares such a requirement and the candidate misses
 * it, the score is capped here rather than merely docked a few points.
 */
const GATE_CAP = 59;

/**
 * How well a candidate's availability covers a job's shift.
 * 1 = exact, 0.6 = workable overlap, 0 = no overlap.
 */
function shiftOverlap(jobShift: string, availability: string[]): number {
  if (availability.includes(jobShift)) return 1;

  const has = (s: string) => availability.includes(s);
  const anyFixed = has('Day') || has('Evening') || has('Night');

  // A rotational candidate can usually be rostered onto any fixed shift, and vice versa.
  if (has('Rotational') && ['Day', 'Evening', 'Night', 'On-call'].includes(jobShift)) return 0.6;
  if (jobShift === 'Rotational' && anyFixed) return 0.6;

  // Named OPD slots sit inside the broader part of the day.
  if (jobShift === '5–8 PM OPD slot' && (has('Evening') || has('Part-time / Locum'))) return 0.6;
  if (jobShift === '8–11 AM OPD slot' && has('Day')) return 0.6;
  if (jobShift === 'Evening' && has('5–8 PM OPD slot')) return 0.6;
  if (jobShift === 'Day' && has('8–11 AM OPD slot')) return 0.6;

  if (jobShift === 'Part-time / Locum' && (has('Weekend only') || has('On-call'))) return 0.6;
  if (jobShift === 'On-call' && has('Night')) return 0.6;

  return 0;
}

function labelFor(score: number): FitLabel {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Partial';
  return 'Weak';
}

/**
 * Score one candidate against one job.
 *
 * Pure: same inputs always give the same score, reasons in a stable order.
 */
export function computeFit(job: Job, candidate: Candidate): FitResult {
  const reasons: FitReason[] = [];
  const held = candidate.specialties.find((s) => s.specialty === job.specialty);

  // --- Specialty (heaviest) -------------------------------------------------
  reasons.push(
    held
      ? {
          criterion: 'Specialty',
          matched: true,
          detail: `Practises ${job.specialty}.`,
          awarded: WEIGHTS.specialty,
          weight: WEIGHTS.specialty,
          mandatory: true,
        }
      : {
          criterion: 'Specialty',
          matched: false,
          detail: `Does not list ${job.specialty}. Holds ${
            candidate.specialties.map((s) => s.specialty).join(', ') || 'no listed specialty'
          }.`,
          awarded: 0,
          weight: WEIGHTS.specialty,
          mandatory: true,
        },
  );

  // --- Sub-specialty --------------------------------------------------------
  if (held?.subSpecialties.includes(job.subSpecialty)) {
    reasons.push({
      criterion: 'Sub-specialty',
      matched: true,
      detail: `Focus includes ${job.subSpecialty}.`,
      awarded: WEIGHTS.subSpecialty,
      weight: WEIGHTS.subSpecialty,
    });
  } else if (held) {
    reasons.push({
      criterion: 'Sub-specialty',
      matched: false,
      detail: `In-specialty but not ${job.subSpecialty} — focus is ${
        held.subSpecialties.join(', ') || 'unstated'
      }.`,
      awarded: Math.round(WEIGHTS.subSpecialty * 0.35),
      weight: WEIGHTS.subSpecialty,
    });
  } else {
    reasons.push({
      criterion: 'Sub-specialty',
      matched: false,
      detail: `No ${job.subSpecialty} experience recorded.`,
      awarded: 0,
      weight: WEIGHTS.subSpecialty,
    });
  }

  // --- Years in that specialty ---------------------------------------------
  const years = held?.years ?? 0;
  if (job.minYearsInSpecialty <= 0 || years >= job.minYearsInSpecialty) {
    reasons.push({
      criterion: 'Experience',
      matched: true,
      detail: `${years} yr${years === 1 ? '' : 's'} in specialty against a ${
        job.minYearsInSpecialty
      }-yr minimum.`,
      awarded: WEIGHTS.experience,
      weight: WEIGHTS.experience,
    });
  } else {
    const ratio = Math.min(years / job.minYearsInSpecialty, 1);
    reasons.push({
      criterion: 'Experience',
      matched: false,
      detail: `${years} yr${years === 1 ? '' : 's'} in specialty, ${
        job.minYearsInSpecialty - years
      } short of the ${job.minYearsInSpecialty}-yr minimum.`,
      awarded: Math.round(WEIGHTS.experience * ratio * 0.8),
      weight: WEIGHTS.experience,
    });
  }

  // --- Shift / time-slot ----------------------------------------------------
  // `matched` here means "can cover the slot at all" — a candidate with no overlap
  // simply cannot do the job, so this is a gate. Partial overlap still clears it but
  // scores lower, which is what separates an exact 5–8 PM match from a rostered one.
  const overlap = shiftOverlap(job.shift, candidate.availability);
  reasons.push({
    criterion: 'Shift / time-slot',
    matched: overlap > 0,
    detail:
      overlap === 1
        ? `Available for ${job.shift}.`
        : overlap > 0
          ? `Not an exact match for ${job.shift}, but ${candidate.availability.join(
              ' / ',
            )} can usually be rostered onto it.`
          : `Cannot cover ${job.shift} — available ${
              candidate.availability.join(' / ') || 'on no stated pattern'
            }.`,
    awarded: Math.round(WEIGHTS.shift * overlap),
    weight: WEIGHTS.shift,
    mandatory: true,
  });

  // --- Credentials / licences ----------------------------------------------
  const missing = job.requiredCredentials.filter((c) => !candidate.credentials.includes(c));
  const requiredCount = job.requiredCredentials.length;
  const heldCount = requiredCount - missing.length;
  reasons.push({
    criterion: 'Credentials & licences',
    matched: missing.length === 0,
    detail:
      requiredCount === 0
        ? 'No mandatory credentials for this role.'
        : missing.length === 0
          ? `Holds all ${requiredCount} required: ${job.requiredCredentials.join(', ')}.`
          : `Holds ${heldCount} of ${requiredCount}. Missing: ${missing.join(', ')}.`,
    awarded:
      requiredCount === 0
        ? WEIGHTS.credentials
        : Math.round(WEIGHTS.credentials * (heldCount / requiredCount)),
    weight: WEIGHTS.credentials,
    mandatory: requiredCount > 0,
  });

  // --- Surgical / procedural track record ----------------------------------
  // This is the criterion generic job boards cannot express: having assisted on 180
  // caesareans is not the same as having led 100 of them, and the score must say so.
  if (!job.surgical.required) {
    reasons.push({
      criterion: 'Surgical track record',
      matched: true,
      detail: 'No operative requirement for this role.',
      awarded: 0,
      weight: 0,
    });
  } else {
    const { role: neededRole, minCaseVolume } = job.surgical;
    const s = candidate.surgical;
    const volumeRatio = minCaseVolume > 0 ? Math.min(s.caseVolume / minCaseVolume, 1) : 1;

    if (!s.performed) {
      reasons.push({
        criterion: 'Surgical track record',
        matched: false,
        detail: `Job needs ${minCaseVolume}+ cases as ${neededRole.toLowerCase()}; no operative experience recorded.`,
        awarded: 0,
        weight: WEIGHTS.surgical,
        mandatory: true,
      });
    } else if (neededRole === 'Primary / lead surgeon' && s.role === 'Assisting') {
      // Explicitly capped: assisting experience can never read as a full match here.
      reasons.push({
        criterion: 'Surgical track record',
        matched: false,
        detail: `Assisted on ${s.caseVolume} cases but has not led — this job needs ${minCaseVolume}+ as primary surgeon.`,
        awarded: Math.round(WEIGHTS.surgical * 0.25),
        weight: WEIGHTS.surgical,
        mandatory: true,
      });
    } else if (s.caseVolume >= minCaseVolume) {
      reasons.push({
        criterion: 'Surgical track record',
        matched: true,
        detail: `${s.caseVolume} cases as ${s.role.toLowerCase()} against a ${minCaseVolume}-case minimum.`,
        awarded: WEIGHTS.surgical,
        weight: WEIGHTS.surgical,
        mandatory: true,
      });
    } else {
      reasons.push({
        criterion: 'Surgical track record',
        matched: false,
        detail: `${s.caseVolume} cases as ${s.role.toLowerCase()}, short of the ${minCaseVolume}-case minimum.`,
        awarded: Math.round(WEIGHTS.surgical * volumeRatio * 0.7),
        weight: WEIGHTS.surgical,
        mandatory: true,
      });
    }
  }

  // --- Location -------------------------------------------------------------
  const locationMatched = candidate.preferredLocations.includes(job.location);
  reasons.push({
    criterion: 'Location',
    matched: locationMatched,
    detail: locationMatched
      ? `Open to ${job.location}.`
      : `Job is in ${job.location}; candidate prefers ${
          candidate.preferredLocations.join(', ') || 'no stated location'
        }.`,
    awarded: locationMatched ? WEIGHTS.location : 0,
    weight: WEIGHTS.location,
  });

  const totalWeight = reasons.reduce((sum, r) => sum + r.weight, 0);
  const totalAwarded = reasons.reduce((sum, r) => sum + r.awarded, 0);
  const raw = totalWeight === 0 ? 0 : Math.round((totalAwarded / totalWeight) * 100);

  // A gate that is not cleared holds the whole score down, so a candidate who is
  // excellent on everything else can never read as a full match. The raw score is
  // scaled into the capped band rather than clamped, so gated candidates still rank
  // sensibly against each other instead of all tying at the cap.
  const gated = reasons.some((r) => r.mandatory && !r.matched);
  const score = gated ? Math.round((raw * GATE_CAP) / 100) : raw;

  return { score, label: labelFor(score), reasons, dimensions: toDimensions(reasons) };
}

/**
 * Collapse the reasons into six radar axes.
 *
 * Specialty and sub-specialty share an axis because they measure the same thing at two
 * depths. An axis the job places no requirement on reports 100 and is flagged as not
 * applicable, so the UI can say so rather than implying a perfect score.
 */
const RADAR_AXES: { dimension: string; criteria: string[] }[] = [
  { dimension: 'Specialty', criteria: ['Specialty', 'Sub-specialty'] },
  { dimension: 'Experience', criteria: ['Experience'] },
  { dimension: 'Shift fit', criteria: ['Shift / time-slot'] },
  { dimension: 'Credentials', criteria: ['Credentials & licences'] },
  { dimension: 'Surgical', criteria: ['Surgical track record'] },
  { dimension: 'Location', criteria: ['Location'] },
];

function toDimensions(reasons: FitReason[]): FitDimension[] {
  return RADAR_AXES.map(({ dimension, criteria }) => {
    const parts = reasons.filter((r) => criteria.includes(r.criterion));
    const weight = parts.reduce((sum, r) => sum + r.weight, 0);
    const awarded = parts.reduce((sum, r) => sum + r.awarded, 0);
    return {
      dimension,
      score: weight === 0 ? 100 : Math.round((awarded / weight) * 100),
      applicable: weight > 0,
    };
  });
}

/** Rank candidates against a job, best first. Ties break on id so the order is stable. */
export function rankCandidates(job: Job, candidates: Candidate[]) {
  return candidates
    .map((candidate) => ({ candidate, fit: computeFit(job, candidate) }))
    .sort((a, b) => b.fit.score - a.fit.score || a.candidate.id.localeCompare(b.candidate.id));
}

/** Rank jobs against one candidate's own profile, best first. */
export function rankJobs(jobs: Job[], candidate: Candidate) {
  return jobs
    .map((job) => ({ job, fit: computeFit(job, candidate) }))
    .sort((a, b) => b.fit.score - a.fit.score || a.job.id.localeCompare(b.job.id));
}
