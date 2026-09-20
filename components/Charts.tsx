'use client';

/**
 * Two small charts, drawn as inline SVG — no chart library, no network, no canvas.
 *
 * Both are single-series magnitude comparisons, so they are horizontal bars with the
 * category named on the axis and the value direct-labelled at the data end. That means
 * colour never carries identity on its own: it is reinforcement, not the encoding.
 */

export interface BarDatum {
  label: string;
  value: number;
  /** Optional per-bar colour. Used for job status, where the colour is a state. */
  color?: string;
}

const JADE = '#127C67';
const HAIRLINE = '#D8E3E0';
const MUTED = '#6B7A78';

const BAR_HEIGHT = 20;
const BAR_GAP = 12; // >= 2px of surface between fills, with room for the labels
const RADIUS = 4;
const LABEL_WIDTH = 132;
const VALUE_WIDTH = 34;

/** A bar with only its data end rounded — the baseline end stays square. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, Math.max(width / 2, 0));
  if (width <= 0) return '';
  const right = x + width;
  return [
    `M ${x} ${y}`,
    `H ${right - r}`,
    `A ${r} ${r} 0 0 1 ${right} ${y + r}`,
    `V ${y + height - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${y + height}`,
    `H ${x}`,
    'Z',
  ].join(' ');
}

export function BarChart({
  title,
  data,
  unitLabel,
  width = 520,
}: {
  title: string;
  data: BarDatum[];
  unitLabel: string;
  width?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const plotWidth = Math.max(width - LABEL_WIDTH - VALUE_WIDTH, 60);
  const height = data.length * (BAR_HEIGHT + BAR_GAP) + 8;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 text-sm font-semibold text-slate-ink">{title}</figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={`${title}. ${data.map((d) => `${d.label}: ${d.value}`).join('; ')}.`}
          className="max-w-full"
        >
          {/* Recessive baseline — the axis should not compete with the data. */}
          <line
            x1={LABEL_WIDTH}
            y1={0}
            x2={LABEL_WIDTH}
            y2={height - 6}
            stroke={HAIRLINE}
            strokeWidth={1}
          />

          {data.map((datum, index) => {
            const y = index * (BAR_HEIGHT + BAR_GAP) + 4;
            const barWidth = (datum.value / max) * plotWidth;
            return (
              <g key={datum.label}>
                <title>{`${datum.label}: ${datum.value} ${unitLabel}`}</title>
                <text
                  x={LABEL_WIDTH - 8}
                  y={y + BAR_HEIGHT / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize="12"
                  fill={MUTED}
                >
                  {datum.label}
                </text>
                {datum.value > 0 ? (
                  <path
                    d={barPath(LABEL_WIDTH + 1, y, barWidth, BAR_HEIGHT)}
                    fill={datum.color ?? JADE}
                  />
                ) : null}
                <text
                  x={LABEL_WIDTH + 1 + Math.max(barWidth, 0) + 8}
                  y={y + BAR_HEIGHT / 2}
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight="600"
                  fill="#1A2B2A"
                >
                  {datum.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* The same numbers as a table, for screen readers and for anyone who wants the values. */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-jade-dark">View as table</summary>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-hairline text-left text-muted">
              <th scope="col" className="py-1 pr-3 font-medium">Category</th>
              <th scope="col" className="py-1 font-medium">{unitLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.label} className="border-b border-hairline/60">
                <td className="py-1 pr-3 text-body">{datum.label}</td>
                <td className="py-1 tabular-nums text-body">{datum.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Status colours are reserved for state, and are never reused as series colours. */
export const STATUS_COLORS: Record<string, string> = {
  Open: JADE,
  Paused: '#B45309',
  Closed: MUTED,
};
