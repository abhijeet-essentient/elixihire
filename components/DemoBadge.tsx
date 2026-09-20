/** Persistent reminder that nothing here is real. Rendered on every page via the frame. */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-warn-border bg-warn-bg
                  px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warn-fg ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warn-fg" />
      DEMO · illustrative only — no live data
    </span>
  );
}
