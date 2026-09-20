'use client';

import { PairedBars, PercentTrend, ShareBars, TrendLine } from '@/components/charts';
import { Card, DemoNote, PageHeader, Section, StatTile } from '@/components/ui';
import {
  seedRetention,
  seedSourceMix,
  seedSupplyDemand,
  seedTimeToFill,
} from '@/lib/seed';

/**
 * Workforce analytics — Preview, phase 3.
 *
 * Drawn from a fixed six-month mock series in the seed, so the shapes are stable and
 * the story is the same every time the demo is shown.
 */
export default function AnalyticsPage() {
  const latest = seedTimeToFill[seedTimeToFill.length - 1];
  const first = seedTimeToFill[0];
  const totalPlacements = seedTimeToFill.reduce((sum, row) => sum + row.placements, 0);
  const shortage = seedSupplyDemand.filter((row) => row.availableCandidates < row.openRoles);

  return (
    <div>
      <PageHeader
        title="Workforce analytics"
        lede="Where hiring is slow, where supply is short, and whether placements stick. Six months of mock history."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Time to fill"
          value={`${latest.days} days`}
          trend={{ text: `${latest.days - first.days} vs April`, good: latest.days < first.days }}
        />
        <StatTile label="Placements (6 mo)" value={totalPlacements} />
        <StatTile
          label="90-day retention"
          value={`${seedRetention[seedRetention.length - 1].at90Days}%`}
          trend={{ text: '+6 pts since April', good: true }}
        />
        <StatTile
          label="Shortage specialties"
          value={shortage.length}
          sub="demand exceeds supply"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <TrendLine
            title="Time to fill"
            hint="Median days from posting to an accepted offer."
            data={seedTimeToFill as unknown as Record<string, string | number>[]}
            xKey="month"
            yKey="days"
            unit="days"
          />
        </Card>
        <Card className="p-5">
          <TrendLine
            title="Placements per month"
            hint="Engagements reaching Joined."
            data={seedTimeToFill as unknown as Record<string, string | number>[]}
            xKey="month"
            yKey="placements"
            unit="placements"
          />
        </Card>
      </div>

      <Section
        title="Supply and demand by specialty"
        lede="Where the market is tight. Both series share one scale — this is never a dual-axis chart."
      >
        <Card className="p-5">
          <PairedBars
            title="Open roles against available candidates"
            data={seedSupplyDemand as unknown as Record<string, string | number>[]}
            xKey="specialty"
            seriesA={{ key: 'openRoles', label: 'Open roles' }}
            seriesB={{ key: 'availableCandidates', label: 'Available candidates' }}
            height={330}
          />
          {shortage.length > 0 ? (
            <p className="mt-3 rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-xs text-warn-fg">
              <strong>Short on supply:</strong>{' '}
              {shortage.map((row) => row.specialty).join(', ')} — more open roles than candidates on
              the platform.
            </p>
          ) : null}
        </Card>
      </Section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <PercentTrend
            title="90-day retention"
            hint="Share of placements still in post at the 90-day follow-up."
            data={seedRetention as unknown as Record<string, string | number>[]}
            xKey="month"
            yKey="at90Days"
          />
        </Card>
        <Card className="p-5">
          <ShareBars
            title="Source mix"
            hint="Where placed candidates came from."
            data={seedSourceMix.map((row) => ({ label: row.source, value: row.value }))}
          />
        </Card>
      </div>

      <div className="mt-6">
        <DemoNote>
          Every figure here is a hand-written mock series in <code>lib/seed.ts</code>. Nothing is
          computed from real hiring data, because there is none.
        </DemoNote>
      </div>
    </div>
  );
}
