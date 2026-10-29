'use client';

import { useRouter } from 'next/navigation';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useEvent } from '@/hooks/useEvent';
import { calculateReadinessScore, detectRisks } from '@/lib/risk-engine';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskSeverity } from '@/types/risk';

const SEVERITY_COLORS: Record<RiskSeverity, string> = {
  critical: '#C4613A',
  high: '#C9A84C',
  medium: '#3B82F6',
  low: '#7A9E7E',
};

function scoreColor(score: number): string {
  if (score >= 80) return '#7A9E7E';
  if (score >= 60) return '#C9A84C';
  return '#C4613A';
}

export function ReadinessScoreCard() {
  const { activeEvent } = useEvent();
  const router = useRouter();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const params = {
    event: activeEvent.profile,
    budget: activeEvent.budget,
    tasks: activeEvent.tasks,
    vendors: activeEvent.vendors,
    runOfShow: activeEvent.runOfShow,
  };

  const score = calculateReadinessScore(params);
  const risks = detectRisks(params);
  const topRisks = risks
    .filter((r) => !r.isResolved)
    .sort((a, b) => {
      const order: Record<RiskSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 3);

  const gaugeData = [{ value: score.total, fill: scoreColor(score.total) }];

  const color = scoreColor(score.total);

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: '#E8E9EE' }}>
      <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Event Readiness</h3>

      {/* Gauge + score */}
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={100}>
          <RadialBarChart
            cx="50%"
            cy="80%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={12}
            data={gaugeData}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: '#F0F1F4' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center score label */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: '-4px' }}
        >
          <span
            className="text-3xl font-bold font-serif"
            style={{ color }}
          >
            {score.total}
          </span>
          <span className="text-sm" style={{ color: '#5A6178' }}>/100</span>
        </div>
      </div>

      {/* Top risks */}
      {topRisks.length > 0 && (
        <div className="space-y-2">
          {topRisks.map((risk) => (
            <div key={risk.id} className="flex items-start gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: SEVERITY_COLORS[risk.severity] }}
              />
              <span style={{ color: '#1A1F2E' }}>{risk.title}</span>
            </div>
          ))}
        </div>
      )}

      {topRisks.length === 0 && (
        <p className="text-xs" style={{ color: '#7A9E7E' }}>✓ No active risks detected</p>
      )}

      {/* View all link */}
      <button
        onClick={() =>
          router.push(`/dashboard/${activeEvent.profile.id}?tab=risks`)
        }
        className="text-xs font-medium text-left hover:underline"
        style={{ color: '#C4613A' }}
      >
        View all risks →
      </button>
    </div>
  );
}
