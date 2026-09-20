import type { Candidate } from './types';

/**
 * Candidate PII is masked by default wherever an employer sees it.
 *
 * In the real product this is governed by the candidate's consent flag plus the
 * employer's access rules; in the demo the "Reveal details" toggle stands in for that.
 */

export function initialsOf(fullName: string): string {
  return fullName
    .replace(/^(Dr\.?|Sister|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** The honorific is kept — it is role context, not identity. */
export function maskedName(fullName: string): string {
  const match = fullName.match(/^(Dr\.?|Sister|Mr\.?|Ms\.?|Mrs\.?)\s+/i);
  const prefix = match ? `${match[1]} ` : '';
  return `${prefix}${initialsOf(fullName).split('').join('. ')}.`;
}

export function maskedEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return '•••••';
  return `${name.slice(0, 1)}•••••@${domain.replace(/^[^.]+/, '•••••')}`;
}

export function maskedPhone(phone: string): string {
  return `${phone.slice(0, 4)} ••••• ${phone.slice(-2)}`;
}

export interface CandidateView {
  name: string;
  email: string;
  phone: string;
  employer: string;
  revealed: boolean;
}

export function viewCandidate(candidate: Candidate, revealed: boolean): CandidateView {
  if (revealed) {
    return {
      name: candidate.fullName,
      email: candidate.contactEmail,
      phone: candidate.contactPhone,
      employer: candidate.currentEmployer,
      revealed: true,
    };
  }
  return {
    name: maskedName(candidate.fullName),
    email: maskedEmail(candidate.contactEmail),
    phone: maskedPhone(candidate.contactPhone),
    employer: 'Employer hidden',
    revealed: false,
  };
}
