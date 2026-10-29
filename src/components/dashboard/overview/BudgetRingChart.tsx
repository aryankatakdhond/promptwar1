'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEvent } from '@/hooks/useEvent';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = {
  planned: '#C4613A',   // terracotta
  contingency: '#C9A84C', // gold
  remaining: '#7A9E7E',  // sage
};

export function BudgetRingChart() {
  const { activeEvent } = useEvent();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-full mx-auto" />
      </div>
    );
  }

  const { budget, profile } = activeEvent;
  const totalBudget = budget.totalBudget;
  const contingencyAmount = budget.contingencyAmount;

  // Planned = sum of non-contingency plannedAmounts
  const plannedSpend = budget.allocations.reduce((sum, a) => {
    const cat = budget.categories.find((c) => c.id === a.categoryId);
    return cat?.isContingency ? sum : sum + a.plannedAmount;
  }, 0);

  const remaining = Math.max(0, totalBudget - plannedSpend - contingencyAmount);

  const data = [
    { name: 'Planned', value: plannedSpend, color: COLORS.planned },
    { name: 'Contingency', value: contingencyAmount, color: COLORS.contingency },
    { name: 'Remaining', value: remaining, color: COLORS.remaining },
  ].filter((d) => d.value > 0);

  const stats = [
    { label: 'Planned', value: plannedSpend, color: COLORS.planned },
    { label: 'Contingency', value: contingencyAmount, color: COLORS.contingency },
    { label: 'Remaining', value: remaining, color: COLORS.remaining },
  ];

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: '#E8E9EE' }}>
      <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Budget Overview</h3>

      <div className="relative">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              dataKey="value"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                typeof value === 'number'
                  ? formatCurrency(value, profile.currency)
                  : String(value)
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ top: 0 }}
        >
          <span className="text-xs font-medium" style={{ color: '#5A6178' }}>Total</span>
          <span className="text-sm font-bold" style={{ color: '#1A1F2E' }}>
            {formatCurrency(totalBudget, profile.currency)}
          </span>
        </div>
      </div>

      {/* Stat rows */}
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <span style={{ color: '#5A6178' }}>{s.label}</span>
            </div>
            <span className="font-medium" style={{ color: '#1A1F2E' }}>
              {formatCurrency(s.value, profile.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
