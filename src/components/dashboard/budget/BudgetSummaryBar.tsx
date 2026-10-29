'use client';

import type { BudgetPlan } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { getBudgetHealth } from '@/lib/budget-engine';

interface BudgetSummaryBarProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
}

export function BudgetSummaryBar({ plan, currency }: BudgetSummaryBarProps) {
  const { totalActual, totalPlanned } = getBudgetHealth(plan);
  const contingency = plan.contingencyAmount;
  const plannedSpend = totalPlanned - contingency;
  const remaining = plan.totalBudget - totalActual;
  const contingencyPct =
    plan.totalBudget > 0 ? Math.round((contingency / plan.totalBudget) * 100) : 0;

  const stats = [
    {
      label: 'Total Budget',
      value: formatCurrency(plan.totalBudget, currency),
      color: '#1A1F2E',
    },
    {
      label: 'Planned Spend',
      value: formatCurrency(plannedSpend, currency),
      color: '#1A1F2E',
    },
    {
      label: 'Contingency Reserve',
      value: `${formatCurrency(contingency, currency)} (${contingencyPct}%)`,
      color: '#5A6178',
    },
    {
      label: 'Remaining',
      value: formatCurrency(remaining, currency),
      color: remaining < 0 ? '#C0392B' : '#2D7D6E',
    },
  ];

  return (
    <div
      className="rounded-brand border p-4 mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4"
      style={{ background: '#F7F8FA', borderColor: '#E5E7EB' }}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1">
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: '#5A6178' }}
          >
            {s.label}
          </span>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: s.color }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
