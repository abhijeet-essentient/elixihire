import { computeFit } from './matchingService';
import type { Application, Candidate, FitResult, Job } from '../types';

/**
 * The candidate-side feed.
 *
 * It reuses `computeFit` rather than inventing a second opinion — a candidate should
 * never see a different score from the one the employer sees for the same pairing. What
 * this module adds is the *ordering and framing* of a feed: filtering out what is not
 * applicable, surfacing the single reason a role is worth a look, and flagging the one
 * thing standing in the way.
 *
 * Deterministic. No model, no network.
 */

export interface Recommendation {
  job: Job;
  fit: FitResult;
  /** The strongest matched criterion — why this is in the feed at all. */
  headline: string;
  /** The most significant unmet requirement, if any. */
  blocker: string | null;
  /** True when a mandatory requirement is unmet, so the UI can say what to fix. */
  gated: boolean;
}

export interface RecommendationOptions {
  /** Exclude roles the candidate has already applied to. */
  applications?: Application[];
  /** Drop anything below this score; the feed is meant to be useful, not exhaustive. */
  minimumScore?: number;
  limit?: number;
}

export function recommendJobs(
  jobs: Job[],
  candidate: Candidate,
  { applications = [], minimumScore = 25, limit = 8 }: RecommendationOptions = {},
): Recommendation[] {
  const appliedTo = new Set(
    applications.filter((a) => a.candidateId === candidate.id).map((a) => a.jobId),
  );

  return jobs
    .filter((job) => job.status === 'Open' && !appliedTo.has(job.id))
    .map((job) => {
      const fit = computeFit(job, candidate);

      // The headline is the matched criterion carrying the most weight — the reason
      // this role is worth the candidate's attention.
      const strongest = [...fit.reasons]
        .filter((r) => r.matched && r.weight > 0)
        .sort((a, b) => b.awarded - a.awarded)[0];

      // The blocker is the unmet criterion costing the most points, mandatory first.
      const unmet = [...fit.reasons]
        .filter((r) => !r.matched)
        .sort(
          (a, b) =>
            Number(Boolean(b.mandatory)) - Number(Boolean(a.mandatory)) ||
            b.weight - b.awarded - (a.weight - a.awarded),
        )[0];

      return {
        job,
        fit,
        headline: strongest ? strongest.detail : 'Open role in the demo dataset.',
        blocker: unmet ? unmet.detail : null,
        gated: fit.reasons.some((r) => r.mandatory && !r.matched),
      };
    })
    .filter((rec) => rec.fit.score >= minimumScore)
    .sort((a, b) => b.fit.score - a.fit.score || a.job.id.localeCompare(b.job.id))
    .slice(0, limit);
}

/** Other open roles closest to a given one — the "similar jobs" rail. */
export function similarJobs(jobs: Job[], job: Job, limit = 3): Job[] {
  return jobs
    .filter((other) => other.id !== job.id && other.status === 'Open')
    .map((other) => {
      let score = 0;
      if (other.specialty === job.specialty) score += 4;
      if (other.subSpecialty === job.subSpecialty) score += 3;
      if (other.roleType === job.roleType) score += 2;
      if (other.location === job.location) score += 2;
      if (other.shift === job.shift) score += 1;
      if (other.employmentType === job.employmentType) score += 1;
      return { other, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.other.id.localeCompare(b.other.id))
    .slice(0, limit)
    .map((x) => x.other);
}

/**
 * Profile completeness, as the share of the fields the matching rules actually read.
 * Weighted by how much each field affects a score, so the advice is honest.
 */
export interface CompletenessItem {
  label: string;
  done: boolean;
  weight: number;
  hint: string;
}

export function profileCompleteness(candidate: Candidate): {
  percent: number;
  items: CompletenessItem[];
} {
  const items: CompletenessItem[] = [
    {
      label: 'Specialties and years',
      done: candidate.specialties.length > 0 && candidate.specialties.every((s) => s.years > 0),
      weight: 25,
      hint: 'The heaviest criterion, and a gate on every job.',
    },
    {
      label: 'Sub-specialty focus',
      done: candidate.specialties.some((s) => s.subSpecialties.length > 0),
      weight: 12,
      hint: 'Separates you from others in the same specialty.',
    },
    {
      label: 'Credentials and licences',
      done: candidate.credentials.length > 0,
      weight: 20,
      hint: 'A missing mandatory licence caps your score on that role.',
    },
    {
      label: 'Availability',
      done: candidate.availability.length > 0,
      weight: 15,
      hint: 'Without it you cannot clear the shift gate on any role.',
    },
    {
      label: 'Preferred locations',
      done: candidate.preferredLocations.length > 0,
      weight: 8,
      hint: 'A small but free win on roles near you.',
    },
    {
      label: 'Surgical / procedural record',
      done: !candidate.surgical.performed || candidate.surgical.caseVolume > 0,
      weight: 12,
      hint: 'Primary versus assisting is scored separately — state it precisely.',
    },
    {
      label: 'Contact details',
      done: Boolean(candidate.contactEmail && candidate.contactPhone),
      weight: 5,
      hint: 'Masked from employers until you are revealed.',
    },
    {
      label: 'Résumé attached',
      done: Boolean(candidate.resumeFileName),
      weight: 3,
      hint: 'Optional — the structured fields above do the real work.',
    },
  ];

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const earned = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  return { percent: Math.round((earned / total) * 100), items };
}
