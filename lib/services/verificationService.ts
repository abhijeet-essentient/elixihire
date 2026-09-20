import type { AuditEntry, Organisation, VerificationStatus } from '../types';

/**
 * Manual organisation verification.
 *
 * Kept as its own module so the boundary matches the real architecture, where this
 * would call out to a KYC/registry check. Here every decision is a human one and the
 * identifiers are never validated — they are mock strings.
 */

export type VerificationDecision = 'approve' | 'hold' | 'reject';

const DECISION_STATUS: Record<VerificationDecision, VerificationStatus> = {
  approve: 'Verified',
  hold: 'On hold',
  reject: 'Rejected',
};

const DECISION_VERB: Record<VerificationDecision, string> = {
  approve: 'Approved organisation',
  hold: 'Placed organisation on hold',
  reject: 'Rejected organisation',
};

export function statusForDecision(decision: VerificationDecision): VerificationStatus {
  return DECISION_STATUS[decision];
}

/** Apply a decision, returning the updated org plus the audit entry it generates. */
export function applyDecision(
  organisation: Organisation,
  decision: VerificationDecision,
  note: string,
  now: Date = new Date(),
): { organisation: Organisation; audit: AuditEntry } {
  const status = statusForDecision(decision);
  const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

  return {
    organisation: { ...organisation, verificationStatus: status },
    audit: {
      id: `audit-${now.getTime()}-${organisation.id}`,
      at: stamp,
      actor: 'Admin (demo)',
      action: DECISION_VERB[decision],
      target: organisation.name,
      detail: note.trim() || 'No note recorded.',
    },
  };
}

/** Orgs still awaiting a decision, oldest submission first. */
export function pendingQueue(organisations: Organisation[]): Organisation[] {
  return organisations
    .filter((o) => o.verificationStatus === 'Pending' || o.verificationStatus === 'On hold')
    .sort((a, b) => a.submittedOn.localeCompare(b.submittedOn));
}
