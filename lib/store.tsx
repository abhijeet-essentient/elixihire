'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeedState } from './seed';
import { applyDecision, type VerificationDecision } from './services/verificationService';
import { PIPELINE_STAGES } from './taxonomy';
import { useToast } from './toast';
import type {
  Application,
  AuditEntry,
  Candidate,
  DemoState,
  InterviewSlot,
  Job,
  JobStatus,
  PipelineStage,
  Role,
  SavedSearch,
  Submission,
  SubmissionStatus,
  Taxonomy,
} from './types';

/**
 * The entire demo's state lives here, in memory, for the life of the tab.
 *
 * There is no server. `localStorage` is used only as a convenience so a reload does not
 * throw away what the viewer just did — every access is wrapped, and the app works
 * exactly the same if storage is unavailable, empty or corrupt.
 *
 * Mutating actions raise a toast and, where the action is sensitive (unmasking a
 * candidate, changing consent, deciding a verification), also write to the audit log.
 */

const STORAGE_KEY = 'elixihire-demo-state-v2';

type JobDraft = Omit<Job, 'id' | 'postedOn' | 'organisationId'>;

interface DemoContextValue extends DemoState {
  role: Role;
  setRole: (role: Role) => void;

  /** Candidate ids unmasked for this session only — never persisted. */
  revealedCandidateIds: string[];
  toggleReveal: (candidateId: string) => void;

  postJob: (draft: JobDraft) => Job;
  setJobStatus: (jobId: string, status: JobStatus) => void;
  updateJob: (job: Job) => void;

  applyToJob: (jobId: string, candidateId: string) => void;
  toggleShortlist: (applicationId: string) => void;
  moveStage: (applicationId: string, direction: 'forward' | 'back') => void;
  setStage: (applicationId: string, stage: PipelineStage) => void;
  addNote: (applicationId: string, text: string) => void;

  updateCandidate: (candidate: Candidate) => void;
  decideOrganisation: (orgId: string, decision: VerificationDecision, note: string) => void;

  // --- added by the extension ---
  updateTaxonomy: (next: Taxonomy, description: string) => void;
  scheduleInterview: (slot: Omit<InterviewSlot, 'id' | 'state'>) => void;
  sendInterviewInvite: (slotId: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'payoutStatus'>) => void;
  setSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
  acceptVacancy: (jobId: string) => void;
  setRiskState: (flagId: string, state: 'Allowed' | 'Blocked') => void;
  saveSearch: (search: Omit<SavedSearch, 'id' | 'createdOn'>) => void;
  deleteSearch: (id: string) => void;
  toggleJobAlerts: () => void;
  logAudit: (action: string, target: string, detail: string) => void;

  resetDemo: () => void;
  /** True once the client has hydrated, so server and client markup agree on first paint. */
  hydrated: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function stamp(): string {
  const now = new Date();
  return `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
}

function auditEntry(action: string, target: string, detail: string): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    at: stamp(),
    actor: 'Demo session',
    action,
    target,
    detail,
  };
}

function loadPersisted(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    // Shape check — a stale or hand-edited entry must never break the demo.
    if (
      !Array.isArray(parsed.jobs) ||
      !Array.isArray(parsed.candidates) ||
      !Array.isArray(parsed.applications) ||
      !Array.isArray(parsed.organisations) ||
      !parsed.taxonomy
    ) {
      return null;
    }
    return parsed as DemoState;
  } catch {
    return null;
  }
}

function persist(state: DemoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode, blocked storage, quota — the in-memory demo carries on regardless.
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const [role, setRole] = useState<Role>('employer');
  const [revealedCandidateIds, setRevealed] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { push } = useToast();

  // Restore after mount only: the static export is pre-rendered with seed data, so
  // reading storage during render would desync server and client markup.
  useEffect(() => {
    const restored = loadPersisted();
    if (restored) setState(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(state);
  }, [state, hydrated]);

  const logAudit = useCallback((action: string, target: string, detail: string) => {
    setState((s) => ({ ...s, audit: [auditEntry(action, target, detail), ...s.audit] }));
  }, []);

  const toggleReveal = useCallback(
    (candidateId: string) => {
      setRevealed((ids) => {
        const revealing = !ids.includes(candidateId);
        if (revealing) {
          // Unmasking is a sensitive action, so it is recorded.
          setState((s) => {
            const candidate = s.candidates.find((c) => c.id === candidateId);
            return {
              ...s,
              audit: [
                auditEntry(
                  'Revealed candidate details',
                  candidate ? candidate.fullName : candidateId,
                  'Employer unmasked contact details for this session.',
                ),
                ...s.audit,
              ],
            };
          });
        }
        return revealing ? [...ids, candidateId] : ids.filter((id) => id !== candidateId);
      });
    },
    [],
  );

  const postJob = useCallback(
    (draft: JobDraft) => {
      const job: Job = {
        ...draft,
        id: `job-${Date.now()}`,
        organisationId: state.activeEmployerOrgId,
        postedOn: today(),
      };
      setState((s) => ({ ...s, jobs: [job, ...s.jobs] }));
      push({ tone: 'success', title: 'Job posted', detail: `${job.title} is now live in the demo.` });
      return job;
    },
    [state.activeEmployerOrgId, push],
  );

  const setJobStatus = useCallback(
    (jobId: string, status: JobStatus) => {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
      }));
      push({ tone: 'info', title: `Job marked ${status.toLowerCase()}` });
    },
    [push],
  );

  const updateJob = useCallback(
    (job: Job) => {
      setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === job.id ? job : j)) }));
      push({ tone: 'success', title: 'Job updated', detail: job.title });
    },
    [push],
  );

  const applyToJob = useCallback(
    (jobId: string, candidateId: string) => {
      setState((s) => {
        if (s.applications.some((a) => a.jobId === jobId && a.candidateId === candidateId)) {
          return s;
        }
        const application: Application = {
          id: `app-${Date.now()}`,
          jobId,
          candidateId,
          stage: 'Applied',
          appliedOn: today(),
          updatedOn: today(),
          shortlisted: false,
          notes: [],
          source: 'Candidate applied',
        };
        return { ...s, applications: [application, ...s.applications] };
      });
      push({ tone: 'success', title: 'Application submitted', detail: 'Track it under My applications.' });
    },
    [push],
  );

  const toggleShortlist = useCallback(
    (applicationId: string) => {
      let shortlistedNow = false;
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) => {
          if (a.id !== applicationId) return a;
          const shortlisted = !a.shortlisted;
          shortlistedNow = shortlisted;
          return {
            ...a,
            shortlisted,
            // Shortlisting from the applicant list moves the engagement along with it.
            stage: shortlisted && a.stage === 'Applied' ? 'Shortlisted' : a.stage,
            updatedOn: today(),
          };
        }),
      }));
      push({
        tone: shortlistedNow ? 'success' : 'info',
        title: shortlistedNow ? 'Added to shortlist' : 'Removed from shortlist',
      });
    },
    [push],
  );

  const setStage = useCallback(
    (applicationId: string, stage: PipelineStage) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                stage,
                shortlisted: a.shortlisted || PIPELINE_STAGES.indexOf(stage) >= 1,
                updatedOn: today(),
              }
            : a,
        ),
      }));
      push({ tone: 'info', title: `Moved to ${stage}` });
    },
    [push],
  );

  const moveStage = useCallback(
    (applicationId: string, direction: 'forward' | 'back') => {
      let landedOn: PipelineStage | null = null;
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) => {
          if (a.id !== applicationId) return a;
          const i = PIPELINE_STAGES.indexOf(a.stage);
          const next = direction === 'forward' ? i + 1 : i - 1;
          if (next < 0 || next >= PIPELINE_STAGES.length) return a;
          const stage = PIPELINE_STAGES[next];
          landedOn = stage;
          return { ...a, stage, shortlisted: a.shortlisted || next >= 1, updatedOn: today() };
        }),
      }));
      if (landedOn) push({ tone: 'info', title: `Moved to ${landedOn}` });
    },
    [push],
  );

  const addNote = useCallback(
    (applicationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                updatedOn: today(),
                notes: [
                  ...a.notes,
                  { id: `note-${Date.now()}`, stage: a.stage, text: trimmed, addedOn: today() },
                ],
              }
            : a,
        ),
      }));
      push({ tone: 'success', title: 'Note added' });
    },
    [push],
  );

  const updateCandidate = useCallback(
    (candidate: Candidate) => {
      setState((s) => {
        const previous = s.candidates.find((c) => c.id === candidate.id);
        const consentChanged = previous && previous.consentToShare !== candidate.consentToShare;
        return {
          ...s,
          candidates: s.candidates.map((c) => (c.id === candidate.id ? candidate : c)),
          audit: consentChanged
            ? [
                auditEntry(
                  'Consent / visibility changed',
                  candidate.fullName,
                  candidate.consentToShare
                    ? 'Profile made discoverable in employer sourcing.'
                    : 'Profile hidden from employer sourcing.',
                ),
                ...s.audit,
              ]
            : s.audit,
        };
      });
      push({ tone: 'success', title: 'Profile saved', detail: 'Fit scores have been recalculated.' });
    },
    [push],
  );

  const decideOrganisation = useCallback(
    (orgId: string, decision: VerificationDecision, note: string) => {
      setState((s) => {
        const target = s.organisations.find((o) => o.id === orgId);
        if (!target) return s;
        const { organisation, audit } = applyDecision(target, decision, note);
        return {
          ...s,
          organisations: s.organisations.map((o) => (o.id === orgId ? organisation : o)),
          audit: [audit, ...s.audit],
        };
      });
      push({ tone: decision === 'reject' ? 'warn' : 'success', title: `Organisation ${decision}d` });
    },
    [push],
  );

  const updateTaxonomy = useCallback(
    (next: Taxonomy, description: string) => {
      setState((s) => ({
        ...s,
        taxonomy: next,
        audit: [auditEntry('Taxonomy changed', 'Reference data', description), ...s.audit],
      }));
      push({ tone: 'success', title: 'Taxonomy updated', detail: 'Every dropdown now reflects the change.' });
    },
    [push],
  );

  const scheduleInterview = useCallback(
    (slot: Omit<InterviewSlot, 'id' | 'state'>) => {
      setState((s) => ({
        ...s,
        interviews: [{ ...slot, id: `int-${Date.now()}`, state: 'Proposed' }, ...s.interviews],
      }));
      push({ tone: 'success', title: 'Slot proposed', detail: `${slot.date} at ${slot.time}` });
    },
    [push],
  );

  const sendInterviewInvite = useCallback(
    (slotId: string) => {
      setState((s) => {
        const slot = s.interviews.find((i) => i.id === slotId);
        return {
          ...s,
          interviews: s.interviews.map((i) => (i.id === slotId ? { ...i, state: 'Invited' } : i)),
          applications: s.applications.map((a) =>
            slot && a.id === slot.applicationId && PIPELINE_STAGES.indexOf(a.stage) < 2
              ? { ...a, stage: 'Interview', shortlisted: true, updatedOn: today() }
              : a,
          ),
        };
      });
      push({ tone: 'success', title: 'Invite sent', detail: 'Demo only — no email leaves the browser.' });
    },
    [push],
  );

  const addSubmission = useCallback(
    (submission: Omit<Submission, 'id' | 'payoutStatus'>) => {
      setState((s) => ({
        ...s,
        submissions: [
          { ...submission, id: `sub-${Date.now()}`, payoutStatus: 'Pending' },
          ...s.submissions,
        ],
      }));
      push({ tone: 'success', title: 'Candidate submitted', detail: 'Now tracked under My submissions.' });
    },
    [push],
  );

  const setSubmissionStatus = useCallback(
    (submissionId: string, status: SubmissionStatus) => {
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                status,
                payoutStatus: status === 'Placed' ? 'Approved' : sub.payoutStatus,
              }
            : sub,
        ),
      }));
      push({ tone: 'info', title: `Submission marked ${status.toLowerCase()}` });
    },
    [push],
  );

  const acceptVacancy = useCallback(
    (jobId: string) => {
      setState((s) => ({
        ...s,
        recruiters: s.recruiters.map((r) =>
          r.id === s.activeRecruiterId && !r.acceptedJobIds.includes(jobId)
            ? { ...r, acceptedJobIds: [...r.acceptedJobIds, jobId] }
            : r,
        ),
      }));
      push({ tone: 'success', title: 'Project accepted', detail: 'You can now submit candidates against it.' });
    },
    [push],
  );

  const setRiskState = useCallback(
    (flagId: string, riskState: 'Allowed' | 'Blocked') => {
      setState((s) => {
        const flag = s.riskFlags.find((f) => f.id === flagId);
        return {
          ...s,
          riskFlags: s.riskFlags.map((f) => (f.id === flagId ? { ...f, state: riskState } : f)),
          audit: flag
            ? [
                auditEntry(
                  riskState === 'Blocked' ? 'Blocked flagged item' : 'Allowed flagged item',
                  flag.subject,
                  `Risk score ${flag.score}. Reviewed manually.`,
                ),
                ...s.audit,
              ]
            : s.audit,
        };
      });
      push({ tone: riskState === 'Blocked' ? 'warn' : 'success', title: `Item ${riskState.toLowerCase()}` });
    },
    [push],
  );

  const saveSearch = useCallback(
    (search: Omit<SavedSearch, 'id' | 'createdOn'>) => {
      setState((s) => ({
        ...s,
        savedSearches: [
          { ...search, id: `search-${Date.now()}`, createdOn: today() },
          ...s.savedSearches,
        ],
      }));
      push({ tone: 'success', title: 'Search saved' });
    },
    [push],
  );

  const deleteSearch = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, savedSearches: s.savedSearches.filter((x) => x.id !== id) }));
      push({ tone: 'info', title: 'Saved search removed' });
    },
    [push],
  );

  const toggleJobAlerts = useCallback(() => {
    let on = false;
    setState((s) => {
      on = !s.jobAlertsOn;
      return { ...s, jobAlertsOn: on };
    });
    push({ tone: 'info', title: on ? 'Job alerts on' : 'Job alerts off', detail: 'Mock — nothing is sent.' });
  }, [push]);

  const resetDemo = useCallback(() => {
    setState(createSeedState());
    setRevealed([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage was never available.
    }
    push({ tone: 'success', title: 'Demo reset', detail: 'Seed data restored.' });
  }, [push]);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      role,
      setRole,
      revealedCandidateIds,
      toggleReveal,
      postJob,
      setJobStatus,
      updateJob,
      applyToJob,
      toggleShortlist,
      moveStage,
      setStage,
      addNote,
      updateCandidate,
      decideOrganisation,
      updateTaxonomy,
      scheduleInterview,
      sendInterviewInvite,
      addSubmission,
      setSubmissionStatus,
      acceptVacancy,
      setRiskState,
      saveSearch,
      deleteSearch,
      toggleJobAlerts,
      logAudit,
      resetDemo,
      hydrated,
    }),
    [
      state,
      role,
      revealedCandidateIds,
      toggleReveal,
      postJob,
      setJobStatus,
      updateJob,
      applyToJob,
      toggleShortlist,
      moveStage,
      setStage,
      addNote,
      updateCandidate,
      decideOrganisation,
      updateTaxonomy,
      scheduleInterview,
      sendInterviewInvite,
      addSubmission,
      setSubmissionStatus,
      acceptVacancy,
      setRiskState,
      saveSearch,
      deleteSearch,
      toggleJobAlerts,
      logAudit,
      resetDemo,
      hydrated,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>');
  return ctx;
}

/** Convenience selectors — keep the components free of repeated lookups. */
export function useSelectors() {
  const demo = useDemo();
  return useMemo(() => {
    const orgById = (id: string) => demo.organisations.find((o) => o.id === id);
    const jobById = (id: string) => demo.jobs.find((j) => j.id === id);
    const candidateById = (id: string) => demo.candidates.find((c) => c.id === id);

    // Fall back to the first record rather than asserting: persisted state from an
    // older seed could name an id that no longer exists.
    const employerOrg = orgById(demo.activeEmployerOrgId) ?? demo.organisations[0];
    const activeCandidate = candidateById(demo.activeCandidateId) ?? demo.candidates[0];
    const activeRecruiter =
      demo.recruiters.find((r) => r.id === demo.activeRecruiterId) ?? demo.recruiters[0];

    return {
      orgById,
      jobById,
      candidateById,
      employerOrg,
      activeCandidate,
      activeRecruiter,
      employerJobs: demo.jobs.filter((j) => j.organisationId === employerOrg?.id),
      applicationsForJob: (jobId: string) => demo.applications.filter((a) => a.jobId === jobId),
      applicationsForCandidate: (candidateId: string) =>
        demo.applications.filter((a) => a.candidateId === candidateId),
      interviewsForApplication: (applicationId: string) =>
        demo.interviews.filter((i) => i.applicationId === applicationId),
    };
  }, [demo]);
}

/** The live, editable taxonomy. Every dropdown in the app reads through this. */
export function useTaxonomy(): Taxonomy {
  return useDemo().taxonomy;
}
