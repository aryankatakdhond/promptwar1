'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { BudgetPlan, BudgetScenario, ScenarioModification } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { applyScenario, validateBudgetPlan } from '@/lib/budget-engine';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ScenarioPanelProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
  onApply: (newPlan: BudgetPlan) => void;
}

type ScenarioTab = 'current' | 'save-15' | 'premium' | 'add-guests';

function buildSave15Scenario(plan: BudgetPlan): BudgetScenario {
  const modifications: ScenarioModification[] = plan.allocations
    .filter((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return !cat?.isContingency && !cat?.isLocked && a.lockedAmount === undefined;
    })
    .map((a) => {
      const newAmount = Math.floor(a.plannedAmount * 0.85);
      return {
        categoryId: a.categoryId,
        newAmount,
        changePercent: -15,
        isLocked: false,
      };
    });

  return {
    id: uuidv4(),
    name: 'Save 15%',
    type: 'save-15',
    description: 'Reduce all non-locked categories by 15%',
    modifications,
  };
}

const PREMIUM_KEYWORDS = ['venue', 'catering', 'photography', 'building-2', 'utensils', 'camera'];

function buildPremiumScenario(plan: BudgetPlan): BudgetScenario {
  const modifications: ScenarioModification[] = plan.allocations
    .filter((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      if (!cat || cat.isContingency) return false;
      const iconOrName = (cat.icon + ' ' + cat.name).toLowerCase();
      return PREMIUM_KEYWORDS.some((k) => iconOrName.includes(k));
    })
    .slice(0, 3)
    .map((a) => {
      const newAmount = Math.floor(a.plannedAmount * 1.2);
      return {
        categoryId: a.categoryId,
        newAmount,
        changePercent: 20,
        isLocked: false,
      };
    });

  return {
    id: uuidv4(),
    name: 'Premium Experience',
    type: 'premium',
    description: 'Increase venue, catering, and photography by 20%',
    modifications,
  };
}

function buildAddGuestsScenario(plan: BudgetPlan): BudgetScenario {
  const EXTRA_GUESTS = 30;
  const modifications: ScenarioModification[] = [];

  plan.allocations.forEach((a) => {
    const cat = plan.categories.find((c) => c.id === a.categoryId);
    if (!cat || cat.isContingency) return;
    const nameLower = cat.name.toLowerCase();
    const iconLower = cat.icon.toLowerCase();
    const combined = nameLower + ' ' + iconLower;

    if (combined.includes('cater') || combined.includes('utensils')) {
      // ~₹2000 per head for catering
      const perHead = Math.floor(a.plannedAmount / Math.max(1, 100)); // rough estimate from current plan
      const increase = Math.max(perHead * EXTRA_GUESTS, Math.floor(a.plannedAmount * 0.3));
      modifications.push({
        categoryId: a.categoryId,
        newAmount: a.plannedAmount + increase,
        changePercent: Math.round((increase / a.plannedAmount) * 100),
        isLocked: false,
      });
    } else if (combined.includes('venue') || combined.includes('building')) {
      const increase = Math.floor(a.plannedAmount * 0.1);
      modifications.push({
        categoryId: a.categoryId,
        newAmount: a.plannedAmount + increase,
        changePercent: 10,
        isLocked: false,
      });
    } else if (combined.includes('staff') || combined.includes('users')) {
      const increase = Math.floor(a.plannedAmount * 0.15);
      modifications.push({
        categoryId: a.categoryId,
        newAmount: a.plannedAmount + increase,
        changePercent: 15,
        isLocked: false,
      });
    }
  });

  return {
    id: uuidv4(),
    name: '+30 Guests',
    type: 'add-guests',
    description: 'Scale catering (+30%), venue (+10%), and staffing (+15%) for 30 extra guests',
    modifications,
  };
}

interface ScenarioTableProps {
  scenario: BudgetScenario;
  plan: BudgetPlan;
  currency: CurrencyCode;
}

function ScenarioTable({ scenario, plan, currency }: ScenarioTableProps) {
  const newPlan = applyScenario(plan, scenario);
  const newTotal = newPlan.allocations.reduce((s, a) => s + a.plannedAmount, 0);
  const currentTotal = plan.allocations.reduce((s, a) => s + a.plannedAmount, 0);
  const totalDelta = newTotal - currentTotal;

  return (
    <div>
      <div className="overflow-x-auto rounded-brand border mb-3" style={{ borderColor: '#E5E7EB' }}>
        <table className="w-full text-sm">
          <thead style={{ background: '#F7F8FA' }}>
            <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Category</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Current</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>New Amount</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {scenario.modifications.map((mod) => {
              const cat = plan.categories.find((c) => c.id === mod.categoryId);
              const currentAlloc = plan.allocations.find((a) => a.categoryId === mod.categoryId);
              if (!cat || !currentAlloc) return null;
              const delta = mod.newAmount - currentAlloc.plannedAmount;

              return (
                <tr key={mod.categoryId} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                  <td className="px-3 py-2" style={{ color: '#1A1F2E' }}>{cat.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#5A6178' }}>
                    {formatCurrency(currentAlloc.plannedAmount, currency)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium" style={{ color: '#1A1F2E' }}>
                    {formatCurrency(mod.newAmount, currency)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-semibold"
                      style={{ color: delta < 0 ? '#2D7D6E' : delta > 0 ? '#C0392B' : '#5A6178' }}
                    >
                      {delta < 0 ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : delta > 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {delta !== 0 ? formatCurrency(Math.abs(delta), currency) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm px-1">
        <span style={{ color: '#5A6178' }}>
          New total:{' '}
          <strong style={{ color: '#1A1F2E' }}>{formatCurrency(newTotal, currency)}</strong>
          {' '}vs current{' '}
          <strong style={{ color: '#1A1F2E' }}>{formatCurrency(currentTotal, currency)}</strong>
        </span>
        <span
          className="font-semibold"
          style={{ color: totalDelta < 0 ? '#2D7D6E' : totalDelta > 0 ? '#C0392B' : '#5A6178' }}
        >
          {totalDelta < 0 ? '−' : totalDelta > 0 ? '+' : ''}
          {formatCurrency(Math.abs(totalDelta), currency)}
        </span>
      </div>
    </div>
  );
}

interface ApplyConfirmDialogProps {
  open: boolean;
  scenarioName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ApplyConfirmDialog({ open, scenarioName, onConfirm, onCancel }: ApplyConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent onClose={onCancel}>
        <DialogHeader>
          <DialogTitle>Apply Scenario: {scenarioName}</DialogTitle>
          <DialogDescription>
            This will update your budget allocations. You can always re-run scenarios afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="accent" onClick={onConfirm}>Apply This Scenario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScenarioPanel({ plan, currency, onApply }: ScenarioPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ScenarioTab>('current');
  const [confirmScenario, setConfirmScenario] = useState<BudgetScenario | null>(null);
  const [applyError, setApplyError] = useState('');

  const scenarios: Record<Exclude<ScenarioTab, 'current'>, BudgetScenario> = {
    'save-15': buildSave15Scenario(plan),
    'premium': buildPremiumScenario(plan),
    'add-guests': buildAddGuestsScenario(plan),
  };

  const TAB_LABELS: Record<ScenarioTab, string> = {
    current: 'Current Plan',
    'save-15': 'Save 15%',
    premium: 'Premium Experience',
    'add-guests': '+30 Guests',
  };

  function handleApply() {
    if (!confirmScenario) return;
    const newPlan = applyScenario(plan, confirmScenario);
    const validation = validateBudgetPlan(newPlan);
    if (!validation.isValid) {
      setApplyError(`Scenario validation failed: ${validation.errors[0]}`);
      setConfirmScenario(null);
      return;
    }
    setApplyError('');
    setConfirmScenario(null);
    onApply(newPlan);
  }

  return (
    <div
      className="rounded-brand border overflow-hidden"
      style={{ borderColor: '#E5E7EB' }}
    >
      {/* Header toggle */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
        style={{ background: '#F7F8FA' }}
        onClick={() => setOpen((x) => !x)}
      >
        <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
          📊 Scenario Planner
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" style={{ color: '#5A6178' }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: '#5A6178' }} />
        )}
      </button>

      {open && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            {(Object.keys(TAB_LABELS) as ScenarioTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px"
                style={{
                  color: activeTab === tab ? '#1A1F2E' : '#5A6178',
                  borderBottomColor: activeTab === tab ? '#1A1F2E' : 'transparent',
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {activeTab === 'current' && (
            <div>
              <p className="text-sm mb-3" style={{ color: '#5A6178' }}>
                Your current budget plan — use the tabs above to explore what-if scenarios without affecting your live data.
              </p>
              <div className="overflow-x-auto rounded-brand border" style={{ borderColor: '#E5E7EB' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: '#F7F8FA' }}>
                    <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Category</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Planned</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.categories.map((cat) => {
                      const alloc = plan.allocations.find((a) => a.categoryId === cat.id);
                      if (!alloc) return null;
                      return (
                        <tr key={cat.id} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                          <td className="px-3 py-2" style={{ color: '#1A1F2E' }}>
                            {cat.isContingency ? '🛡️ ' : ''}{cat.name}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#1A1F2E' }}>
                            {formatCurrency(alloc.plannedAmount, currency)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#5A6178' }}>
                            {alloc.percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab !== 'current' && (
            <div>
              <p className="text-sm mb-3" style={{ color: '#5A6178' }}>
                {scenarios[activeTab].description}
              </p>

              {scenarios[activeTab].modifications.length === 0 ? (
                <p className="text-sm" style={{ color: '#5A6178' }}>
                  No applicable categories found for this scenario.
                </p>
              ) : (
                <>
                  <ScenarioTable scenario={scenarios[activeTab]} plan={plan} currency={currency} />

                  <div className="flex items-center justify-between mt-4">
                    {applyError && (
                      <p className="text-xs text-red-600">{applyError}</p>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('current')}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => setConfirmScenario(scenarios[activeTab])}
                      >
                        Apply This Scenario
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {confirmScenario && (
        <ApplyConfirmDialog
          open={!!confirmScenario}
          scenarioName={confirmScenario.name}
          onConfirm={handleApply}
          onCancel={() => setConfirmScenario(null)}
        />
      )}
    </div>
  );
}
