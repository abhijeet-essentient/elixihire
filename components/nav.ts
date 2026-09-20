import {
  Info,
  BadgeIndianRupee,
  Blocks,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  Columns3,
  FileSignature,
  GitCompareArrows,
  Handshake,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Store,
  Trophy,
  UserRoundCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Tier } from './TierBadge';
import type { Role } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tier: Tier;
  /** Roadmap phase, preview items only. */
  phase?: number;
  /** One line used by the command palette and the screen header. */
  blurb: string;
}

/** Navigation is scoped to the active persona. */
export const NAV: Record<Role, NavItem[]> = {
  employer: [
    {
      href: '/employer/dashboard/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      tier: 'core',
      blurb: 'Hiring KPIs, funnel and demand by specialty.',
    },
    {
      href: '/employer/jobs/',
      label: 'My jobs',
      icon: BriefcaseBusiness,
      tier: 'core',
      blurb: 'Every role you have posted, with status and applicant counts.',
    },
    {
      href: '/employer/post-job/',
      label: 'Post a job',
      icon: ClipboardList,
      tier: 'core',
      blurb: 'Structured multi-step intake with a live preview.',
    },
    {
      href: '/employer/applicants/',
      label: 'Applicants',
      icon: Users,
      tier: 'core',
      blurb: 'Ranked applicants with the fit breakdown and match radar.',
    },
    {
      href: '/employer/compare/',
      label: 'Compare candidates',
      icon: GitCompareArrows,
      tier: 'core',
      blurb: 'Two or three shortlisted candidates, side by side.',
    },
    {
      href: '/employer/pipeline/',
      label: 'Placement pipeline',
      icon: Columns3,
      tier: 'core',
      blurb: 'Drag-and-drop board from Applied to the 90-day follow-up.',
    },
    {
      href: '/employer/schedule/',
      label: 'Interview scheduler',
      icon: CalendarClock,
      tier: 'core',
      blurb: 'Propose slots that respect the role’s shift pattern.',
    },
    {
      href: '/employer/offers/',
      label: 'Offers',
      icon: FileSignature,
      tier: 'preview',
      phase: 2,
      blurb: 'Offer letters, status and an e-sign placeholder.',
    },
    {
      href: '/employer/messages/',
      label: 'Messages',
      icon: MessagesSquare,
      tier: 'preview',
      phase: 2,
      blurb: 'Threaded conversation per candidate.',
    },
    {
      href: '/employer/subscription/',
      label: 'Talent Pipeline',
      icon: Trophy,
      tier: 'preview',
      phase: 2,
      blurb: 'Subscription tiers for continuous access to the talent pool.',
    },
  ],
  candidate: [
    {
      href: '/candidate/recommended/',
      label: 'Recommended',
      icon: Sparkles,
      tier: 'core',
      blurb: 'A ranked feed built from your own structured profile.',
    },
    {
      href: '/candidate/jobs/',
      label: 'Find jobs',
      icon: Search,
      tier: 'core',
      blurb: 'Healthcare-aware filters, saved searches and alerts.',
    },
    {
      href: '/candidate/profile/',
      label: 'My profile',
      icon: UserRoundCog,
      tier: 'core',
      blurb: 'Structured profile, credential wallet and availability.',
    },
    {
      href: '/candidate/applications/',
      label: 'My applications',
      icon: ListChecks,
      tier: 'core',
      blurb: 'The same pipeline stage the employer sees.',
    },
    {
      href: '/candidate/career-services/',
      label: 'Career services',
      icon: Trophy,
      tier: 'preview',
      phase: 3,
      blurb: 'Premium CV, interview and licensing support.',
    },
  ],
  recruiter: [
    {
      href: '/recruiter/marketplace/',
      label: 'Marketplace',
      icon: Store,
      tier: 'preview',
      phase: 2,
      blurb: 'Open vacancies you are eligible to work on.',
    },
    {
      href: '/recruiter/submit/',
      label: 'Submit candidates',
      icon: Handshake,
      tier: 'preview',
      phase: 2,
      blurb: 'Structured submission against an accepted vacancy.',
    },
    {
      href: '/recruiter/submissions/',
      label: 'My submissions',
      icon: ClipboardList,
      tier: 'preview',
      phase: 2,
      blurb: 'Track your candidates through the client pipeline.',
    },
    {
      href: '/recruiter/earnings/',
      label: 'Earnings',
      icon: Wallet,
      tier: 'preview',
      phase: 2,
      blurb: 'Commission ledger and payout status.',
    },
  ],
  admin: [
    {
      href: '/admin/snapshot/',
      label: 'Operations',
      icon: LayoutDashboard,
      tier: 'core',
      blurb: 'Counts and charts across the whole platform.',
    },
    {
      href: '/admin/verification/',
      label: 'Verification queue',
      icon: ShieldCheck,
      tier: 'core',
      blurb: 'Approve, hold or reject hiring organisations.',
    },
    {
      href: '/admin/taxonomy/',
      label: 'Taxonomy manager',
      icon: Blocks,
      tier: 'core',
      blurb: 'Edit specialties and credentials as data — every dropdown follows.',
    },
    {
      href: '/admin/users/',
      label: 'Users & audit log',
      icon: Users,
      tier: 'core',
      blurb: 'Accounts, roles and a trail of sensitive actions.',
    },
    {
      href: '/admin/fraud/',
      label: 'Fraud & duplicates',
      icon: ShieldAlert,
      tier: 'preview',
      phase: 3,
      blurb: 'Flagged jobs and organisations with mock risk scores.',
    },
    {
      href: '/admin/analytics/',
      label: 'Workforce analytics',
      icon: ChartNoAxesCombined,
      tier: 'preview',
      phase: 3,
      blurb: 'Time-to-fill, supply and demand, retention, source mix.',
    },
    {
      href: '/admin/billing/',
      label: 'Billing & plans',
      icon: BadgeIndianRupee,
      tier: 'preview',
      phase: 2,
      blurb: 'Subscription tiers, invoices and payment history.',
    },
    {
      href: '/admin/payroll/',
      label: 'Payroll',
      icon: Wallet,
      tier: 'preview',
      phase: 4,
      blurb: 'Per-employee-per-month payroll with payslip preview.',
    },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  employer: 'Employer',
  candidate: 'Candidate',
  recruiter: 'Recruiter',
  admin: 'Admin',
};

export const ROLE_BLURB: Record<Role, string> = {
  employer: 'Post structured roles, see ranked applicants, run the placement pipeline.',
  candidate: 'Build a structured healthcare profile, find roles that actually fit, apply.',
  recruiter: 'Work open vacancies from the marketplace and submit candidates.',
  admin: 'Verify organisations, manage the taxonomy, watch the operational numbers.',
};

/** Where each persona lands when picked from the switcher. */
export const ROLE_HOME: Record<Role, string> = {
  employer: '/employer/dashboard/',
  candidate: '/candidate/recommended/',
  recruiter: '/recruiter/marketplace/',
  admin: '/admin/snapshot/',
};

/** Pages that sit outside any persona. */
export const GLOBAL_PAGES: NavItem[] = [
  {
    href: '/about/',
    label: 'About this demo',
    icon: Info,
    tier: 'core',
    blurb: 'What is Core, what is Preview, and what is not real.',
  },
  {
    href: '/roadmap/',
    label: 'Roadmap',
    icon: ChartNoAxesCombined,
    tier: 'core',
    blurb: 'Now / Next / Later against the revenue streams.',
  },
];

/** Derive the persona from the URL so the frame and the store never disagree. */
export function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith('/employer')) return 'employer';
  if (pathname.startsWith('/candidate')) return 'candidate';
  if (pathname.startsWith('/recruiter')) return 'recruiter';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
}

/** Look up the nav entry for a path, so a screen can render its own tier badge. */
export function navItemFor(pathname: string): NavItem | undefined {
  const normalised = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const all = [...Object.values(NAV).flat(), ...GLOBAL_PAGES];
  return all.find((item) => item.href === normalised);
}
