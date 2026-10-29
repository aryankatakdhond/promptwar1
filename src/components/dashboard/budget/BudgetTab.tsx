'use client';

import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import { rebalanceBudget, validateBudgetPlan } from '@/lib/budget-engine';
import type { BudgetPlan } from '@/types/budget';
import { BudgetSummaryBar } from './BudgetSummaryBar';
import { BudgetHealthAlert } from './BudgetHealthAlert';
import { BudgetCategoryTable } from './BudgetCategoryTable';
import { AddCategoryDialog } from './AddCategoryDialog';
import { ScenarioPanel } from './ScenarioPanel';
import { BudgetBreakdownChart } from './BudgetBreakdownChart';

export function BudgetTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm" style={{ color: '#5A6178' }}>No active event selected.</p>
      </div>
    );
  }

  const plan = activeEvent.budget;
  const currency = activeEvent.profile.currency;
  const eventId = activeEvent.profile.id;

  if (!plan || plan.categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm" style={{ color: '#5A6178' }}>
          No budget plan found for this event. Complete the setup wizard to initialize your budget.
        </p>
      </div>
    );
  }

  function dispatchBudget(newPlan: BudgetPlan) {
    dispatch({ type: 'UPDATE_BUDGET', eventId, budget: newPlan });
  }

  function handleCategoryUpdate(
    categoryId: string,
    newPlannedAmount: number,
    newActualAmount: number,
    isLocked: boolean,
  ) {
    // If only actual changed, update without rebalancing
    const existingAlloc = plan.allocations.find((a) => a.categoryId === categoryId);
    if (!existingAlloc) return;

    if (newPlannedAmount !== existingAlloc.plannedAmount) {
      // Planned amount changed — rebalance
      const rebalanced = rebalanceBudget(plan, { categoryId, newAmount: newPlannedAmount, isLocked });
      const validation = validateBudgetPlan(rebalanced);
      if (!validation.isValid) {
        toast({
          title: 'Invalid allocation',
          description: validation.errors[0],
          variant: 'error',
        });
        return;
      }
      // Preserve actual amount change if both changed simultaneously
      if (newActualAmount !== existingAlloc.actualAmount) {
        const finalAlloc = rebalanced.allocations.find((a) => a.categoryId === categoryId);
        if (finalAlloc) finalAlloc.actualAmount = newActualAmount;
      }
      dispatchBudget(rebalanced);
      toast({
        title: 'Budget updated',
        description: 'Allocations rebalanced.',
        variant: 'success',
      });
    } else if (newActualAmount !== existingAlloc.actualAmount) {
      // Only actual changed — clone and update
      const newPlan = structuredClone(plan);
      const alloc = newPlan.allocations.find((a) => a.categoryId === categoryId);
      if (alloc) {
        alloc.actualAmount = newActualAmount;
        // Update locked status if changed
        if (isLocked && alloc.lockedAmount === undefined) {
          alloc.lockedAmount = alloc.plannedAmount;
          const cat = newPlan.categories.find((c) => c.id === categoryId);
          if (cat) cat.isLocked = true;
        } else if (!isLocked && alloc.lockedAmount !== undefined) {
          alloc.lockedAmount = undefined;
          const cat = newPlan.categories.find((c) => c.id === categoryId);
          if (cat) cat.isLocked = false;
        }
      }
      dispatchBudget(newPlan);
      toast({
        title: 'Actual spend updated',
        variant: 'success',
      });
    } else if (isLocked !== (existingAlloc.lockedAmount !== undefined)) {
      // Only lock status changed
      const newPlan = structuredClone(plan);
      const alloc = newPlan.allocations.find((a) => a.categoryId === categoryId);
      const cat = newPlan.categories.find((c) => c.id === categoryId);
      if (alloc && cat) {
        if (isLocked) {
          alloc.lockedAmount = alloc.plannedAmount;
          cat.isLocked = true;
        } else {
          alloc.lockedAmount = undefined;
          cat.isLocked = false;
        }
      }
      dispatchBudget(newPlan);
      toast({
        title: isLocked ? 'Category locked' : 'Category unlocked',
        variant: 'success',
      });
    }
  }

  function handleDeleteCategory(categoryId: string) {
    const newPlan = structuredClone(plan);
    newPlan.categories = newPlan.categories.filter((c) => c.id !== categoryId);
    const removed = newPlan.allocations.find((a) => a.categoryId === categoryId);
    const removedAmount = removed?.plannedAmount ?? 0;
    newPlan.allocations = newPlan.allocations.filter((a) => a.categoryId !== categoryId);

    // Redistribute the removed amount to remaining unlocked categories
    if (removedAmount > 0) {
      const unlocked = newPlan.allocations.filter((a) => {
        const cat = newPlan.categories.find((c) => c.id === a.categoryId);
        return !cat?.isContingency && !cat?.isLocked && a.lockedAmount === undefined;
      });
      if (unlocked.length > 0) {
        // Simple: add to first unlocked
        unlocked[0].plannedAmount += removedAmount;
        unlocked[0].percentage =
          newPlan.totalBudget > 0
            ? Math.round((unlocked[0].plannedAmount / newPlan.totalBudget) * 100)
            : 0;
      }
    }

    const validation = validateBudgetPlan(newPlan);
    if (!validation.isValid) {
      toast({
        title: 'Cannot delete category',
        description: validation.errors[0],
        variant: 'error',
      });
      return;
    }

    dispatchBudget(newPlan);
    toast({
      title: 'Category deleted',
      variant: 'success',
    });
  }

  function handleAddCategory(newPlan: BudgetPlan) {
    dispatchBudget(newPlan);
    toast({
      title: 'Category added',
      description: 'Budget rebalanced.',
      variant: 'success',
    });
  }

  function handleApplyScenario(newPlan: BudgetPlan) {
    dispatchBudget(newPlan);
    toast({
      title: 'Scenario applied',
      description: 'Budget updated with scenario allocations.',
      variant: 'success',
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Summary Banner */}
      <BudgetSummaryBar plan={plan} currency={currency} />

      {/* Health Alert */}
      <BudgetHealthAlert plan={plan} currency={currency} />

      {/* Main content: table + chart side by side */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Table + Add button */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: '#1A1F2E' }}>
              Budget Allocations
            </h2>
            <AddCategoryDialog plan={plan} currency={currency} onAdd={handleAddCategory} />
          </div>
          <BudgetCategoryTable
            plan={plan}
            currency={currency}
            onUpdate={handleCategoryUpdate}
            onDelete={handleDeleteCategory}
          />
        </div>

        {/* Right: Chart */}
        <div
          className="xl:w-[420px] shrink-0 rounded-brand border p-4"
          style={{ borderColor: '#E5E7EB' }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: '#1A1F2E' }}>
            Budget Breakdown
          </h2>
          <BudgetBreakdownChart plan={plan} currency={currency} />
        </div>
      </div>

      {/* Scenario Planner */}
      <ScenarioPanel plan={plan} currency={currency} onApply={handleApplyScenario} />
    </div>
  );
}
