'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { BudgetPlan } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';

interface BudgetBreakdownChartProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
}

function formatK(value: number, currency: CurrencyCode): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SGD: 'S$',
  };
  const sym = symbols[currency] ?? '';
  if (Math.abs(value) >= 100000) return `${sym}${Math.round(value / 100000)}L`;
  if (Math.abs(value) >= 1000) return `${sym}${Math.round(value / 1000)}K`;
  return `${sym}${value}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
  currency: CurrencyCode;
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-brand border bg-white shadow-lg px-3 py-2 text-sm"
      style={{ borderColor: '#E5E7EB' }}
    >
      <p className="font-semibold mb-1" style={{ color: '#1A1F2E' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.fill }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

export function BudgetBreakdownChart({ plan, currency }: BudgetBreakdownChartProps) {
  const data = plan.categories
    .filter((c) => !c.isContingency)
    .map((cat) => {
      const alloc = plan.allocations.find((a) => a.categoryId === cat.id);
      return {
        name: cat.name.length > 10 ? cat.name.slice(0, 9) + '…' : cat.name,
        Planned: alloc?.plannedAmount ?? 0,
        Actual: alloc?.actualAmount ?? 0,
      };
    })
    .filter((d) => d.Planned > 0 || d.Actual > 0);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[300px] rounded-brand border"
        style={{ borderColor: '#E5E7EB', color: '#5A6178' }}
      >
        <p className="text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#5A6178' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatK(v as number, currency)}
          tick={{ fontSize: 11, fill: '#5A6178' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
        />
        <Bar dataKey="Planned" fill="#C0392B" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Actual" fill="#1A1F2E" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
