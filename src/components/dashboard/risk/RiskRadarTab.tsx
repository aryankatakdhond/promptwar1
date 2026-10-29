'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEvent } from '@/hooks/useEvent';
import { calculateReadinessScore, detectRisks } from '@/lib/risk-engine';

const SEVERITY_STYLES = {
  critical: { label: 'Critical', color: '#B42318', background: '#FEE4E2' },
  high: { label: 'High', color: '#C2410C', background: '#FFEDD5' },
  medium: { label: 'Medium', color: '#A16207', background: '#FEF3C7' },
  low: { label: 'Low', color: '#4D7C0F', background: '#ECFCCB' },
} as const;

export function RiskRadarTab() {
  const { activeEvent } = useEvent();
  const router = useRouter();

  if (!activeEvent) return null;

  const params = {
    event: activeEvent.profile,
    budget: activeEvent.budget,
    tasks: activeEvent.tasks,
    vendors: activeEvent.vendors,
    runOfShow: activeEvent.runOfShow,
  };
  const risks = detectRisks(params).filter((risk) => !risk.isResolved);
  const readiness = calculateReadinessScore(params);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ color: '#1A1F2E' }}>Risk Radar</h2>
        <p className="mt-1 text-sm" style={{ color: '#5A6178' }}>
          Resolve the highest-impact blockers before they affect your celebration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border p-5 text-center" style={{ borderColor: '#E5E0D8', background: '#FFFEFB' }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Readiness score</div>
          <div className="mt-3 text-5xl font-bold" style={{ color: readiness.total >= 80 ? '#4D7C0F' : readiness.total >= 60 ? '#A16207' : '#B42318' }}>
            {readiness.total}
          </div>
          <div className="mt-1 text-sm" style={{ color: '#5A6178' }}>out of 100</div>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: '#E5E0D8', background: '#FFFEFB' }}>
          <h3 className="font-semibold" style={{ color: '#1A1F2E' }}>Readiness breakdown</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {readiness.breakdown.map((factor) => (
              <div key={factor.factor}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#5A6178' }}>{factor.factor}</span>
                  <span className="font-semibold" style={{ color: '#1A1F2E' }}>{factor.score}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: '#EEEAE3' }}>
                  <div className="h-full rounded-full" style={{ width: `${factor.score}%`, background: factor.score >= 80 ? '#78966B' : factor.score >= 60 ? '#D0A84B' : '#C4613A' }} />
                </div>
                <p className="mt-1 text-[11px]" style={{ color: '#7B8192' }}>{factor.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border" style={{ borderColor: '#E5E0D8', background: '#FFFEFB' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#E5E0D8' }}>
          <h3 className="font-semibold" style={{ color: '#1A1F2E' }}>Open risks</h3>
          <span className="text-sm" style={{ color: '#5A6178' }}>{risks.length} active</span>
        </div>
        {risks.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8 text-sm" style={{ color: '#4D7C0F' }}>
            <CheckCircle2 size={20} /> No active risks detected.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E5E0D8' }}>
            {risks.map((risk) => {
              const severity = SEVERITY_STYLES[risk.severity];
              return (
                <div key={risk.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0" size={18} style={{ color: severity.color }} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium" style={{ color: '#1A1F2E' }}>{risk.title}</h4>
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: severity.color, background: severity.background }}>
                          {severity.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: '#5A6178' }}>{risk.explanation}</p>
                      <p className="mt-2 text-sm font-medium" style={{ color: '#1A1F2E' }}>Next: {risk.recommendedAction}</p>
                    </div>
                  </div>
                  {risk.actionTarget && (
                    <button
                      type="button"
                      onClick={() => router.push(`?tab=${risk.actionTarget}`)}
                      className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg px-3 py-2 text-sm font-medium"
                      style={{ background: '#FAF0EB', color: '#C4613A' }}
                    >
                      Open {risk.actionTarget} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
