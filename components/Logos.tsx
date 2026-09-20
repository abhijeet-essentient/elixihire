/**
 * Brand placeholders.
 *
 * Both logos are inline SVG on purpose — nothing is fetched at runtime. They are
 * deliberately isolated in this one file so swapping in the real assets means editing
 * two components and nothing else.
 */

export function ElixiHireLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* [ ElixiHire logo ] — swap this SVG for the supplied asset. */}
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-8 w-8 shrink-0"
        role="presentation"
      >
        <rect width="32" height="32" rx="8" fill="#127C67" />
        <path
          d="M10 21V11h9M10 16h7"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="22.5" cy="20.5" r="2.5" fill="#8FD6C5" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-tight text-slate-ink">
          ElixiHire
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
          healthcare hiring
        </span>
      </span>
    </span>
  );
}

export function EssentientLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* [ Essentient logo ] — swap this SVG for the supplied asset. */}
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" role="presentation">
        <rect width="24" height="24" rx="6" fill="#1A2B2A" />
        <path
          d="M8 8h8M8 12h6M8 16h8"
          stroke="#8FD6C5"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="font-serif text-sm font-semibold text-slate-ink">Essentient™</span>
    </span>
  );
}
