'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { BudgetPlan } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { getBudgetHealth } from '@/lib/budget-engine';

interface BudgetHealthAlertProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
}

export function BudgetHealthAlert({ plan, currency }: BudgetHealthAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { overBudgetCategories, totalActual, isOverBudget } = getBudgetHealth(plan);

  if (dismissed) return null;
  if (overBudgetCategories.length === 0 && !isOverBudget) return null;

  const overBudgetItems = overBudgetCategories.map((catId) => {
    const cat = plan.categories.find((c) => c.id === catId);
    const alloc = plan.allocations.find((a) => a.categoryId === catId);
    if (!cat || !alloc) return null;
    const overage = alloc.actualAmount - alloc.plannedAmount;
    return { name: cat.name, overage };
  }).filter(Boolean) as { name: string; overage: number }[];

  const n = overBudgetItems.length;

  return (
    <div
      className="rounded-brand border mb-4 overflow-hidden"
      style={{ background: '#FFFBEA', borderColor: '#F5C542' }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#B7860B' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#7A5800' }}>
            {n > 0
              ? `⚠️ ${n} ${n === 1 ? 'category is' : 'categories are'} over budget. Consider reviewing your allocations.`
              : '⚠️ Total spend is over budget.'}
          </p>
          {isOverBudget && (
            <p className="text-xs mt-0.5" style={{ color: '#7A5800' }}>
              Total actual spend ({formatCurrency(totalActual, currency)}) exceeds planned budget.
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {n > 0 && (
            <button
              onClick={() => setExpanded((x) => !x)}
              className="p-1 rounded hover:bg-yellow-100 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" style={{ color: '#7A5800' }} />
              ) : (
                <ChevronDown className="h-4 w-4" style={{ color: '#7A5800' }} />
              )}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-yellow-100 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" style={{ color: '#7A5800' }} />
          </button>
        </div>
      </div>

      {expanded && n > 0 && (
        <div
          className="border-t px-4 py-3 space-y-1"
          style={{ borderColor: '#F5C542', background: '#FFF8DC' }}
        >
          {overBudgetItems.map((item) => (
            <div key={item.name} className="flex justify-between text-xs" style={{ color: '#7A5800' }}>
              <span>{item.name}</span>
              <span className="font-semibold text-red-700">
                +{formatCurrency(item.overage, currency)} over
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
