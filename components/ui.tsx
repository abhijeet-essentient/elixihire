'use client';

import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

/**
 * Small, shared UI primitives. One set of buttons, chips, tables and stat tiles so
 * every screen reads as the same product rather than a pile of one-off styles.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-jade text-white hover:bg-jade-dark border border-transparent',
  secondary: 'bg-surface text-jade-dark border border-jade/40 hover:bg-jade-tint',
  ghost: 'bg-transparent text-slate-ink border border-hairline hover:bg-jade-tint',
  danger: 'bg-surface text-danger-fg border border-danger-border hover:bg-danger-bg',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors
                  disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}

type ChipTone = 'neutral' | 'jade' | 'amber' | 'red' | 'blue';

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: 'bg-jade-tint text-slate-ink border-hairline',
  jade: 'bg-jade/10 text-jade-dark border-jade/25',
  amber: 'bg-warn-bg text-warn-fg border-warn-border',
  red: 'bg-danger-bg text-danger-fg border-danger-border',
  blue: 'bg-info-bg text-info-fg border-info-border',
};

export function Chip({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  tone?: ChipTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

export function PageHeader({
  title,
  lede,
  actions,
}: {
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl text-slate-ink sm:text-3xl">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Select({
  options,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  return (
    <select {...props} className={`input ${className}`}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** A horizontally scrollable table wrapper — the page body never scrolls sideways. */
export function TableWrap({
  children,
  minWidth = '44rem',
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div style={{ minWidth }} className="sm:min-w-0">
        {children}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** A short delta such as "-7 days". Direction drives the colour. */
  trend?: { text: string; good: boolean };
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl text-slate-ink">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {sub ? <span className="text-xs text-muted">{sub}</span> : null}
        {trend ? (
          <span className={`text-xs font-medium ${trend.good ? 'text-jade-dark' : 'text-warn-fg'}`}>
            {trend.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Formats a number as INR. All money in this demo is rupees. */
export function inr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** A labelled section with a consistent heading rhythm. */
export function Section({
  title,
  lede,
  actions,
  children,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="section-title">{title}</h2>
          {lede ? <p className="mt-0.5 text-sm text-muted">{lede}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Skeleton placeholders, used while a screen simulates a short load. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-serif text-lg text-slate-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

/** Inline note explaining a demo-only shortcut. Used sparingly, where it matters. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-hairline bg-jade-tint/60 px-3 py-2 text-xs text-muted">
      {children}
    </p>
  );
}
