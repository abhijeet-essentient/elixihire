import { Layers, Sparkles } from 'lucide-react';

/**
 * Core vs Preview.
 *
 * CORE screens are the Phase-1 scope and are fully interactive. PREVIEW screens are
 * roadmap capability, shown so the demo covers the full product story — visually
 * complete and clickable, with lighter mock interactivity. Every screen says which it is.
 */

export type Tier = 'core' | 'preview';

export interface TierInfo {
  tier: Tier;
  /** Roadmap phase, for preview screens only. */
  phase?: number;
}

export function TierBadge({
  tier,
  phase,
  size = 'md',
}: TierInfo & { size?: 'sm' | 'md' }) {
  const small = size === 'sm';
  const base = `inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide ${
    small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
  }`;

  if (tier === 'core') {
    return (
      <span className={`${base} border-jade/30 bg-jade/10 text-jade-dark`} title="Fully interactive Phase-1 scope">
        <Layers aria-hidden="true" className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        Core
      </span>
    );
  }

  return (
    <span
      className={`${base} border-warn-border bg-warn-bg text-warn-fg`}
      title={`Roadmap capability${phase ? ` planned for phase ${phase}` : ''} — shown to illustrate range`}
    >
      <Sparkles aria-hidden="true" className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      Preview{phase ? ` · Phase ${phase}` : ''}
    </span>
  );
}
