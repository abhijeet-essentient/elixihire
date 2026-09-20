/**
 * Domain types for the ElixiHire demo.
 *
 * These mirror the shape the real product would persist, so the UI and the matching
 * rules can be written against a realistic model even though everything lives in memory.
 */

export type Role = 'employer' | 'candidate' | 'recruiter' | 'admin';

export type JobStatus = 'Open' | 'Paused' | 'Closed';

export type VerificationStatus = 'Verified' | 'Pending' | 'On hold' | 'Rejected';

export type SurgicalRole = 'Primary / lead surgeon' | 'Assisting';

export type PipelineStage =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Joined'
  | '90-day follow-up';

export type FitLabel = 'Strong' | 'Good' | 'Partial' | 'Weak';

/** A hiring organisation. Identifiers are mock strings — nothing is validated. */
export interface Organisation {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Diagnostics / Lab' | 'Pharma' | 'Health-tech';
  city: string;
  gstin: string;
  cin: string;
  msmeId: string;
  contactPerson: string;
  contactEmail: string;
  verificationStatus: VerificationStatus;
  submittedOn: string;
  beds?: number;
}

/** What a job asks for in terms of operative track record. */
export interface SurgicalRequirement {
  required: boolean;
  role: SurgicalRole;
  minCaseVolume: number;
}

export interface Job {
  id: string;
  title: string;
  organisationId: string;
  roleType: string;
  specialty: string;
  subSpecialty: string;
  minYearsInSpecialty: number;
  requiredCredentials: string[];
  shift: string;
  employmentType: string;
  location: string;
  salaryBand: string;
  positionsOpen: number;
  description: string;
  surgical: SurgicalRequirement;
  status: JobStatus;
  postedOn: string;
}

/** What a candidate has actually done in theatre. */
export interface SurgicalExperience {
  performed: boolean;
  role: SurgicalRole;
  caseVolume: number;
  notableProcedures: string;
}

export interface SpecialtyExperience {
  specialty: string;
  years: number;
  subSpecialties: string[];
}

export interface Candidate {
  id: string;
  fullName: string;
  roleType: string;
  headline: string;
  specialties: SpecialtyExperience[];
  credentials: string[];
  availability: string[];
  preferredLocations: string[];
  employmentTypePreference: string[];
  surgical: SurgicalExperience;
  /** When false the profile is hidden from employer searches. */
  consentToShare: boolean;
  contactEmail: string;
  contactPhone: string;
  currentEmployer: string;
  noticePeriod: string;
  /** Only the file name is captured — the demo never reads or stores a file. */
  resumeFileName?: string;
}

export interface PipelineNote {
  id: string;
  stage: PipelineStage;
  text: string;
  addedOn: string;
}

/** One candidate–job engagement, tracked end to end. This is the spreadsheet replacement. */
export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  stage: PipelineStage;
  appliedOn: string;
  updatedOn: string;
  shortlisted: boolean;
  notes: PipelineNote[];
  source: 'Candidate applied' | 'Sourced by employer';
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

/** A single criterion in the "Why this fits" breakdown. */
export interface FitReason {
  criterion: string;
  matched: boolean;
  detail: string;
  /** Points awarded out of `weight` — lets the UI show partial credit honestly. */
  awarded: number;
  weight: number;
  /**
   * A hard requirement the employer declared. Failing one caps the whole score,
   * however well the candidate does on everything else.
   */
  mandatory?: boolean;
}

/** One axis of the match radar: a criterion normalised to 0–100. */
export interface FitDimension {
  dimension: string;
  score: number;
  /** False when the job places no requirement on this axis (so 100 means "n/a"). */
  applicable: boolean;
}

export interface FitResult {
  score: number;
  label: FitLabel;
  reasons: FitReason[];
  /** Per-criterion sub-scores, for the radar. Same order for every candidate. */
  dimensions: FitDimension[];
}

/** A recruiter / consultancy working vacancies from the marketplace. */
export interface Recruiter {
  id: string;
  agencyName: string;
  contactPerson: string;
  city: string;
  specialisations: string[];
  placementsClosed: number;
  rating: number;
  /** Vacancy ids this recruiter has accepted from the marketplace. */
  acceptedJobIds: string[];
}

export type SubmissionStatus =
  | 'Submitted'
  | 'Client reviewing'
  | 'Interview'
  | 'Offer'
  | 'Placed'
  | 'Rejected';

export interface Submission {
  id: string;
  recruiterId: string;
  jobId: string;
  candidateId: string;
  status: SubmissionStatus;
  submittedOn: string;
  note: string;
  /** Commission in INR, payable on placement. */
  feeInr: number;
  payoutStatus: 'Pending' | 'Approved' | 'Paid';
}

export interface Invoice {
  id: string;
  organisationId: string;
  item: string;
  amountInr: number;
  issuedOn: string;
  status: 'Paid' | 'Due' | 'Overdue';
}

export interface PayrollEmployee {
  id: string;
  name: string;
  organisationId: string;
  designation: string;
  monthlyGrossInr: number;
  pepmFeeInr: number;
  status: 'Active' | 'On notice';
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organisation: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastActive: string;
}

/** A job or organisation flagged by the (mock) risk rules. */
export interface RiskFlag {
  id: string;
  subject: string;
  subjectType: 'Job' | 'Organisation';
  score: number;
  reasons: string[];
  state: 'Open' | 'Allowed' | 'Blocked';
  raisedOn: string;
}

/** The editable taxonomy — the proof that the product extends without a rebuild. */
export interface Taxonomy {
  roleTypes: string[];
  specialties: string[];
  subSpecialties: Record<string, string[]>;
  credentials: string[];
  shifts: string[];
  employmentTypes: string[];
  locations: string[];
}

/** One proposed interview slot. */
export interface InterviewSlot {
  id: string;
  applicationId: string;
  date: string;
  time: string;
  mode: 'In person' | 'Video call' | 'Telephone';
  state: 'Proposed' | 'Invited' | 'Confirmed';
}

export interface DemoState {
  organisations: Organisation[];
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  audit: AuditEntry[];
  /** The employer persona is scoped to one organisation so "My jobs" means something. */
  activeEmployerOrgId: string;
  /** The candidate persona is "logged in" as this seeded candidate. */
  activeCandidateId: string;
  /** The recruiter persona is "logged in" as this seeded agency. */
  activeRecruiterId: string;

  taxonomy: Taxonomy;
  recruiters: Recruiter[];
  submissions: Submission[];
  invoices: Invoice[];
  payroll: PayrollEmployee[];
  users: PlatformUser[];
  riskFlags: RiskFlag[];
  interviews: InterviewSlot[];
  /** Saved job searches on the candidate side. */
  savedSearches: SavedSearch[];
  jobAlertsOn: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  createdOn: string;
  filters: Record<string, string>;
}
