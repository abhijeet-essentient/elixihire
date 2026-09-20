'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactElement, ReactNode } from 'react';
import { useChartPalette } from '@/lib/theme';

/**
 * Recharts wrappers.
 *
 * House rules, applied once here so every chart in the app obeys them: one axis per
 * chart (never a second y-scale), recessive grid and axes, thin marks with rounded data
 * ends, a legend only when there are two or more series, and a tooltip on every plot.
 * Colours come from the live theme tokens so the charts re-step in dark mode rather
 * than being flipped.
 */

function Figure({
  title,
  hint,
  children,
  height = 240,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  height?: number;
}) {
  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-sm font-semibold text-slate-ink">{title}</figcaption>
      {hint ? <p className="mb-3 text-xs text-muted">{hint}</p> : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** Recharts types the tooltip value loosely, so suffix formatting goes through here. */
function suffix(unit: string) {
  return (value: unknown): [string, string] => [`${value}${unit ? ` ${unit}` : ''}`, ''];
}

function useAxisProps() {
  const palette = useChartPalette();
  return {
    palette,
    axis: {
      stroke: palette.hairline,
      tick: { fill: palette.muted, fontSize: 11 },
      tickLine: false,
      axisLine: { stroke: palette.hairline },
    },
    tooltip: {
      contentStyle: {
        background: palette.surface,
        border: `1px solid ${palette.hairline}`,
        borderRadius: '0.6rem',
        fontSize: '12px',
        color: palette.ink,
        boxShadow: '0 8px 24px rgb(0 0 0 / 0.10)',
      },
      labelStyle: { color: palette.ink, fontWeight: 600 },
      cursor: { fill: palette.hairline, fillOpacity: 0.35 },
    },
  };
}

/** Vertical bars for a single measure across categories. */
export function CategoryBars({
  title,
  hint,
  data,
  xKey,
  yKey,
  yLabel,
  colorFor,
  height = 240,
}: {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  yLabel: string;
  colorFor?: (row: Record<string, string | number>) => string;
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();
  const crowded = data.length > 5;

  return (
    <Figure title={title} hint={hint} height={height}>
      <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
        <CartesianGrid vertical={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          {...axis}
          interval={0}
          angle={crowded ? -18 : 0}
          textAnchor={crowded ? 'end' : 'middle'}
          height={crowded ? 52 : 28}
        />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltip} formatter={suffix(yLabel)} />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={38}>
          {data.map((row, index) => (
            <Cell key={index} fill={colorFor ? colorFor(row) : palette.jade} />
          ))}
        </Bar>
      </ReBarChart>
    </Figure>
  );
}

/** A funnel rendered as horizontal bars — ordered stages, one measure. */
export function FunnelBars({
  title,
  hint,
  data,
  height = 260,
}: {
  title: string;
  hint?: string;
  data: { stage: string; count: number }[];
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <ReBarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
        <CartesianGrid horizontal={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} {...axis} />
        <YAxis type="category" dataKey="stage" width={108} {...axis} />
        <Tooltip {...tooltip} formatter={suffix('engagements')} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={palette.jade} maxBarSize={22} />
      </ReBarChart>
    </Figure>
  );
}

/** A single-measure trend over time. */
export function TrendLine({
  title,
  hint,
  data,
  xKey,
  yKey,
  unit,
  height = 240,
}: {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  unit: string;
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <defs>
          <linearGradient id={`fill-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.jade} stopOpacity={0.28} />
            <stop offset="100%" stopColor={palette.jade} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} />
        <Tooltip
          {...tooltip}
          cursor={{ stroke: palette.muted, strokeDasharray: '3 3' }}
          formatter={suffix(unit)}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={palette.jade}
          strokeWidth={2}
          fill={`url(#fill-${yKey})`}
          dot={{ r: 3, fill: palette.jade, strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: palette.surface, strokeWidth: 2 }}
        />
      </AreaChart>
    </Figure>
  );
}

/** Two series on one shared scale — never two y-axes. */
export function PairedBars({
  title,
  hint,
  data,
  xKey,
  seriesA,
  seriesB,
  height = 300,
}: {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  xKey: string;
  seriesA: { key: string; label: string };
  seriesB: { key: string; label: string };
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 40, left: -18 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axis} interval={0} angle={-24} textAnchor="end" height={90} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip {...tooltip} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: palette.muted, paddingTop: 4 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey={seriesA.key}
          name={seriesA.label}
          fill={palette.series[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={20}
        />
        <Bar
          dataKey={seriesB.key}
          name={seriesB.label}
          fill={palette.series[1]}
          radius={[4, 4, 0, 0]}
          maxBarSize={20}
        />
      </ReBarChart>
    </Figure>
  );
}

/** Per-dimension match profile for one or more candidates. */
export function MatchRadar({
  title,
  hint,
  data,
  series,
  height = 280,
}: {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  height?: number;
}) {
  const { palette, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke={palette.hairline} />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: palette.muted, fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: palette.muted, fontSize: 9 }} axisLine={false} />
        <Tooltip {...tooltip} cursor={false} formatter={(value: unknown): [string, string] => [`${value} / 100`, '']} />
        {series.length > 1 ? (
          <Legend wrapperStyle={{ fontSize: 11, color: palette.muted }} iconType="circle" iconSize={8} />
        ) : null}
        {series.map((s, index) => (
          <Radar
            key={s.key}
            name={s.label}
            dataKey={s.key}
            stroke={palette.series[index % palette.series.length]}
            fill={palette.series[index % palette.series.length]}
            fillOpacity={series.length > 1 ? 0.16 : 0.26}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </Figure>
  );
}

/** Horizontal share-of-total bars. Used instead of a pie, which is harder to read. */
export function ShareBars({
  title,
  hint,
  data,
  height = 220,
}: {
  title: string;
  hint?: string;
  data: { label: string; value: number }[];
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <ReBarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 24 }}>
        <CartesianGrid horizontal={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis type="number" unit="%" {...axis} />
        <YAxis type="category" dataKey="label" width={132} {...axis} />
        <Tooltip {...tooltip} formatter={(value: unknown): [string, string] => [`${value}%`, '']} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((_, index) => (
            <Cell key={index} fill={palette.series[index % palette.series.length]} />
          ))}
        </Bar>
      </ReBarChart>
    </Figure>
  );
}

/** A retention / percentage trend. */
export function PercentTrend({
  title,
  hint,
  data,
  xKey,
  yKey,
  height = 220,
}: {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  const { palette, axis, tooltip } = useAxisProps();

  return (
    <Figure title={title} hint={hint} height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <CartesianGrid vertical={false} stroke={palette.hairline} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis domain={[80, 100]} unit="%" {...axis} />
        <Tooltip
          {...tooltip}
          cursor={{ stroke: palette.muted, strokeDasharray: '3 3' }}
          formatter={(value: unknown): [string, string] => [`${value}%`, '']}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={palette.jade}
          strokeWidth={2}
          dot={{ r: 3, fill: palette.jade, strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: palette.surface, strokeWidth: 2 }}
        />
      </LineChart>
    </Figure>
  );
}
