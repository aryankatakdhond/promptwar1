'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { BudgetPlan } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { BudgetCategoryRow } from './BudgetCategoryRow';

type SortKey = 'name' | 'priority' | 'planned' | 'actual' | 'remaining' | 'pct';
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
  essential: 0,
  high: 1,
  medium: 2,
  low: 3,
  optional: 4,
};

interface BudgetCategoryTableProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
  onUpdate: (categoryId: string, newPlannedAmount: number, newActualAmount: number, isLocked: boolean) => void;
  onDelete: (categoryId: string) => void;
}

export function BudgetCategoryTable({ plan, currency, onUpdate, onDelete }: BudgetCategoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const regularCategories = plan.categories.filter((c) => !c.isContingency);
  const contingencyCategory = plan.categories.find((c) => c.isContingency);
  const contingencyAlloc = plan.allocations.find(
    (a) => a.categoryId === contingencyCategory?.id,
  );

  const sortedRegular = [...regularCategories].sort((a, b) => {
    const allocA = plan.allocations.find((x) => x.categoryId === a.id);
    const allocB = plan.allocations.find((x) => x.categoryId === b.id);
    const dir = sortDir === 'asc' ? 1 : -1;

    switch (sortKey) {
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'priority':
        return dir * ((PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
      case 'planned':
        return dir * ((allocA?.plannedAmount ?? 0) - (allocB?.plannedAmount ?? 0));
      case 'actual':
        return dir * ((allocA?.actualAmount ?? 0) - (allocB?.actualAmount ?? 0));
      case 'remaining': {
        const remA = (allocA?.plannedAmount ?? 0) - (allocA?.actualAmount ?? 0);
        const remB = (allocB?.plannedAmount ?? 0) - (allocB?.actualAmount ?? 0);
        return dir * (remA - remB);
      }
      case 'pct':
        return dir * ((allocA?.percentage ?? 0) - (allocB?.percentage ?? 0));
      default:
        return 0;
    }
  });

  const totalPlanned = plan.allocations.reduce((s, a) => s + a.plannedAmount, 0);
  const totalActual = plan.allocations.reduce((s, a) => s + a.actualAmount, 0);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-25 inline ml-0.5" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" style={{ color: '#1A1F2E' }} />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" style={{ color: '#1A1F2E' }} />;
  }

  function Th({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
        style={{ color: '#5A6178' }}
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-brand border" style={{ borderColor: '#E5E7EB' }}>
      <table className="w-full min-w-[900px]">
        <thead style={{ background: '#F7F8FA' }}>
          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
            <Th col="name" label="Category" />
            <Th col="priority" label="Priority" />
            <Th col="planned" label="Planned" />
            <Th col="actual" label="Actual/Quoted" />
            <Th col="remaining" label="Remaining" />
            <Th col="pct" label="% of Total" />
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
              Confidence
            </th>
            <th className="px-3 py-2.5 w-10" />
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {sortedRegular.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: '#5A6178' }}>
                No budget categories yet. Add one below.
              </td>
            </tr>
          )}
          {sortedRegular.map((cat) => {
            const alloc = plan.allocations.find((a) => a.categoryId === cat.id);
            if (!alloc) return null;
            return (
              <BudgetCategoryRow
                key={cat.id}
                category={cat}
                allocation={alloc}
                currency={currency}
                plan={plan}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            );
          })}

          {/* Contingency row */}
          {contingencyCategory && contingencyAlloc && (
            <tr
              className="border-t"
              style={{ background: '#F0F4FF', borderColor: '#C7D2FE' }}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: '#5A6178' }}>
                    🛡️ {contingencyCategory.name} (Reserve)
                  </span>
                </div>
              </td>
              <td colSpan={2} className="px-3 py-2.5">
                <span className="text-sm tabular-nums font-semibold" style={{ color: '#3730A3' }}>
                  {formatCurrency(contingencyAlloc.plannedAmount, currency)}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <span className="text-sm tabular-nums" style={{ color: '#5A6178' }}>
                  {contingencyAlloc.actualAmount > 0
                    ? formatCurrency(contingencyAlloc.actualAmount, currency)
                    : '—'}
                </span>
              </td>
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5">
                <span className="text-sm tabular-nums" style={{ color: '#5A6178' }}>
                  {contingencyAlloc.percentage}%
                </span>
              </td>
              <td colSpan={3} />
            </tr>
          )}

          {/* Totals row */}
          <tr
            className="border-t font-semibold"
            style={{ background: '#F7F8FA', borderColor: '#1A1F2E' }}
          >
            <td className="px-3 py-2.5 text-sm" style={{ color: '#1A1F2E' }}>
              Total
            </td>
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5 text-sm tabular-nums" style={{ color: '#1A1F2E' }}>
              {formatCurrency(totalPlanned, currency)}
            </td>
            <td className="px-3 py-2.5 text-sm tabular-nums" style={{ color: '#1A1F2E' }}>
              {totalActual > 0 ? formatCurrency(totalActual, currency) : '—'}
            </td>
            <td
              className="px-3 py-2.5 text-sm tabular-nums"
              style={{ color: (totalPlanned - totalActual) < 0 ? '#C0392B' : '#2D7D6E' }}
            >
              {formatCurrency(totalPlanned - totalActual, currency)}
            </td>
            <td colSpan={4} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
