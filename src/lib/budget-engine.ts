import { v4 as uuidv4 } from 'uuid';
import type { EventType } from '@/types/event';
import type {
  BudgetCategory,
  BudgetAllocation,
  BudgetPlan,
  BudgetScenario,
  AllocationPriority,
} from '@/types/budget';

const PRIORITY_WEIGHTS: Record<AllocationPriority, number> = {
  essential: 5,
  high: 4,
  medium: 3,
  low: 2,
  optional: 1,
};

// ---------------------------------------------------------------------------
// allocateBudget
// ---------------------------------------------------------------------------
export function allocateBudget(
  totalBudget: number,
  categories: BudgetCategory[],
  contingencyPercent: number,
  lockedAllocations: BudgetAllocation[],
): BudgetPlan {
  if (!Number.isFinite(totalBudget) || !Number.isInteger(totalBudget) || totalBudget < 0) {
    throw new RangeError('Total budget must be a non-negative integer.');
  }
  if (!Number.isFinite(contingencyPercent) || contingencyPercent < 0 || contingencyPercent > 100) {
    throw new RangeError('Contingency percentage must be between 0 and 100.');
  }
  const lockedMap = new Map(lockedAllocations.map((a) => [a.categoryId, a]));

  // 1. Contingency
  const contingencyCategory = categories.find((c) => c.isContingency);
  const contingencyAmount = Math.floor((totalBudget * contingencyPercent) / 100);

  // 2. Sum of locked (non-contingency) amounts
  const lockedCategories = categories.filter((c) => !c.isContingency && lockedMap.has(c.id));
  const sumLocked = lockedCategories.reduce((sum, c) => {
    const locked = lockedMap.get(c.id)!;
    const amount = locked.lockedAmount ?? locked.plannedAmount;
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new RangeError(`Locked allocation for ${c.name} must be a non-negative integer.`);
    }
    return sum + amount;
  }, 0);

  if (sumLocked + contingencyAmount > totalBudget) {
    throw new RangeError('Locked allocations and contingency exceed the total budget.');
  }

  // 3. Remaining for unlocked categories
  const remaining = totalBudget - contingencyAmount - sumLocked;

  // Unlocked non-contingency categories
  const unlockedCategories = categories.filter((c) => !c.isContingency && !lockedMap.has(c.id));
  const totalWeight = unlockedCategories.reduce((s, c) => s + PRIORITY_WEIGHTS[c.priority], 0);

  // 4. Initial floor allocations
  type WithFractional = { category: BudgetCategory; floor: number; fractional: number };
  const withFloors: WithFractional[] = unlockedCategories.map((c) => {
    const weight = PRIORITY_WEIGHTS[c.priority];
    const exact = totalWeight > 0 ? (remaining * weight) / totalWeight : 0;
    const floor = Math.floor(exact);
    return { category: c, floor, fractional: exact - floor };
  });

  // 5. How much remainder after floors + locked + contingency?
  const sumFloors = withFloors.reduce((s, x) => s + x.floor, 0);
  let remainder = totalBudget - contingencyAmount - sumLocked - sumFloors;

  // 6. Largest-remainder correction
  const sorted = [...withFloors].sort((a, b) => b.fractional - a.fractional);
  const allocMap = new Map(withFloors.map((x) => [x.category.id, x.floor]));
  for (let i = 0; i < sorted.length && remainder > 0; i++) {
    allocMap.set(sorted[i].category.id, allocMap.get(sorted[i].category.id)! + 1);
    remainder--;
  }

  // 7. Build allocations array
  const allocations: BudgetAllocation[] = [];

  // Contingency
  if (contingencyCategory) {
    allocations.push({
      categoryId: contingencyCategory.id,
      plannedAmount: contingencyAmount,
      actualAmount: 0,
      lockedAmount: undefined,
      percentage: totalBudget > 0 ? Math.round((contingencyAmount / totalBudget) * 100) : 0,
      confidence: 'estimated',
    });
  }

  // Locked
  for (const cat of lockedCategories) {
    const locked = lockedMap.get(cat.id)!;
    const amount = locked.lockedAmount ?? locked.plannedAmount;
    allocations.push({
      categoryId: cat.id,
      plannedAmount: amount,
      actualAmount: locked.actualAmount,
      lockedAmount: amount,
      percentage: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
      confidence: locked.confidence,
    });
  }

  // Unlocked
  for (const cat of unlockedCategories) {
    const amount = allocMap.get(cat.id) ?? 0;
    allocations.push({
      categoryId: cat.id,
      plannedAmount: amount,
      actualAmount: 0,
      lockedAmount: undefined,
      percentage: totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0,
      confidence: 'rough-estimate',
    });
  }

  return {
    eventId: '',
    totalBudget,
    contingencyAmount,
    categories,
    allocations,
    version: 1,
    lastValidated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// validateBudgetPlan
// ---------------------------------------------------------------------------
export function validateBudgetPlan(plan: BudgetPlan): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const sum = plan.allocations.reduce((s, a) => s + a.plannedAmount, 0);
  if (sum !== plan.totalBudget) {
    errors.push(`Sum of allocations (${sum}) does not equal totalBudget (${plan.totalBudget})`);
  }

  for (const alloc of plan.allocations) {
    if (alloc.plannedAmount < 0) {
      errors.push(`Category ${alloc.categoryId} has a negative plannedAmount (${alloc.plannedAmount})`);
    }
    if (alloc.actualAmount < 0) {
      errors.push(`Category ${alloc.categoryId} has a negative actualAmount (${alloc.actualAmount})`);
    }
    if (!plan.categories.some((category) => category.id === alloc.categoryId)) {
      errors.push(`Allocation ${alloc.categoryId} does not reference a known category`);
    }
  }

  const allocationIds = new Set(plan.allocations.map((allocation) => allocation.categoryId));
  if (allocationIds.size !== plan.allocations.length) {
    errors.push('Budget contains duplicate category allocations');
  }

  const hasContingency = plan.categories.some((c) => c.isContingency) &&
    plan.allocations.some((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return cat?.isContingency;
    });
  if (!hasContingency) {
    errors.push('No contingency category found in the plan');
  }

  const contingencyCategory = plan.categories.find((category) => category.isContingency);
  const contingencyAllocation = contingencyCategory
    ? plan.allocations.find((allocation) => allocation.categoryId === contingencyCategory.id)
    : undefined;
  if (
    contingencyAllocation &&
    contingencyAllocation.plannedAmount !== plan.contingencyAmount
  ) {
    errors.push(
      `Contingency allocation (${contingencyAllocation.plannedAmount}) does not match contingencyAmount (${plan.contingencyAmount})`,
    );
  }

  return { isValid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// rebalanceBudget
// ---------------------------------------------------------------------------
export function rebalanceBudget(
  plan: BudgetPlan,
  change: { categoryId: string; newAmount: number; isLocked: boolean },
): BudgetPlan {
  const newPlan = structuredClone(plan);

  const targetAlloc = newPlan.allocations.find((a) => a.categoryId === change.categoryId);
  if (!targetAlloc) return newPlan;
  const targetCategory = newPlan.categories.find((c) => c.id === change.categoryId);
  if (
    !targetCategory ||
    targetCategory.isContingency ||
    !Number.isFinite(change.newAmount) ||
    !Number.isInteger(change.newAmount) ||
    change.newAmount < 0
  ) {
    return newPlan;
  }

  const oldAmount = targetAlloc.plannedAmount;
  const delta = change.newAmount - oldAmount;

  // Apply change to target
  targetAlloc.plannedAmount = change.newAmount;
  if (change.isLocked) {
    targetAlloc.lockedAmount = change.newAmount;
    const cat = newPlan.categories.find((c) => c.id === change.categoryId);
    if (cat) cat.isLocked = true;
  }

  // Rebalance other unlocked, non-contingency categories
  const rebalanceable = newPlan.allocations.filter((a) => {
    if (a.categoryId === change.categoryId) return false;
    const cat = newPlan.categories.find((c) => c.id === a.categoryId);
    if (!cat) return false;
    if (cat.isContingency) return false;
    if (cat.isLocked || a.lockedAmount !== undefined) return false;
    return true;
  });

  const totalRebalanceable = rebalanceable.reduce((s, a) => s + a.plannedAmount, 0);

  if (rebalanceable.length === 0) {
    // Nothing to rebalance — revert to keep total intact
    targetAlloc.plannedAmount = oldAmount;
    if (change.isLocked) targetAlloc.lockedAmount = oldAmount;
    return newPlan;
  }

  // Proportional reduction using largest-remainder
  const newTotal = totalRebalanceable - delta;

  if (newTotal < 0) {
    // Can't absorb delta — revert
    targetAlloc.plannedAmount = oldAmount;
    return newPlan;
  }

  type WithFractional = { alloc: BudgetAllocation; floor: number; fractional: number };
  const withFloors: WithFractional[] = rebalanceable.map((a) => {
    const exact = totalRebalanceable > 0 ? (newTotal * a.plannedAmount) / totalRebalanceable : 0;
    const floor = Math.floor(exact);
    return { alloc: a, floor, fractional: exact - floor };
  });

  let rem = newTotal - withFloors.reduce((s, x) => s + x.floor, 0);
  const sorted = [...withFloors].sort((a, b) => b.fractional - a.fractional);

  for (let i = 0; i < sorted.length && rem > 0; i++) {
    sorted[i].floor += 1;
    rem--;
  }

  for (const item of withFloors) {
    item.alloc.plannedAmount = item.floor;
    item.alloc.percentage =
      newPlan.totalBudget > 0
        ? Math.round((item.floor / newPlan.totalBudget) * 100)
        : 0;
  }

  // Recalculate percentage for changed target
  targetAlloc.percentage =
    newPlan.totalBudget > 0
      ? Math.round((targetAlloc.plannedAmount / newPlan.totalBudget) * 100)
      : 0;

  newPlan.lastValidated = new Date().toISOString();
  return newPlan;
}

// ---------------------------------------------------------------------------
// applyScenario
// ---------------------------------------------------------------------------
export function applyScenario(plan: BudgetPlan, scenario: BudgetScenario): BudgetPlan {
  const newPlan = structuredClone(plan);

  for (const mod of scenario.modifications) {
    const alloc = newPlan.allocations.find((a) => a.categoryId === mod.categoryId);
    if (!alloc) continue;
    const category = newPlan.categories.find((c) => c.id === mod.categoryId);
    if (
      !category ||
      category.isContingency ||
      category.isLocked ||
      alloc.lockedAmount !== undefined ||
      !Number.isFinite(mod.newAmount) ||
      !Number.isInteger(mod.newAmount) ||
      mod.newAmount < 0
    ) {
      continue;
    }
    alloc.plannedAmount = mod.newAmount;
    if (mod.isLocked) alloc.lockedAmount = mod.newAmount;
    alloc.percentage =
      newPlan.totalBudget > 0
        ? Math.round((mod.newAmount / newPlan.totalBudget) * 100)
        : 0;
  }

  // Adjust sum to match totalBudget via largest-remainder on unlocked
  const sum = newPlan.allocations.reduce((s, a) => s + a.plannedAmount, 0);
  const diff = newPlan.totalBudget - sum;

  if (diff !== 0) {
    const unlocked = newPlan.allocations.filter((a) => {
      const cat = newPlan.categories.find((c) => c.id === a.categoryId);
      return !cat?.isContingency && !cat?.isLocked && a.lockedAmount === undefined;
    });
    // distribute diff proportionally (simple: just add to first unlocked)
    if (unlocked.length > 0) {
      if (diff < 0) {
        let remainingReduction = -diff;
        for (const allocation of unlocked) {
          const reduction = Math.min(allocation.plannedAmount, remainingReduction);
          allocation.plannedAmount -= reduction;
          remainingReduction -= reduction;
          if (remainingReduction === 0) break;
        }
        if (remainingReduction > 0) {
          throw new RangeError('Scenario reductions exceed the available unlocked budget.');
        }
      } else {
        unlocked[0].plannedAmount += diff;
      }
      for (const allocation of unlocked) {
      allocation.percentage =
        newPlan.totalBudget > 0
          ? Math.round((allocation.plannedAmount / newPlan.totalBudget) * 100)
          : 0;
      }
    } else {
      throw new RangeError('Scenario changes cannot be reconciled with the locked budget.');
    }
  }

  newPlan.lastValidated = new Date().toISOString();
  return newPlan;
}

// ---------------------------------------------------------------------------
// getBudgetHealth
// ---------------------------------------------------------------------------
export function getBudgetHealth(plan: BudgetPlan): {
  overBudgetCategories: string[];
  totalActual: number;
  totalPlanned: number;
  healthPercent: number;
  isOverBudget: boolean;
} {
  const overBudgetCategories: string[] = [];
  let totalActual = 0;
  let totalPlanned = 0;

  for (const alloc of plan.allocations) {
    totalActual += alloc.actualAmount;
    totalPlanned += alloc.plannedAmount;
    if (alloc.actualAmount > alloc.plannedAmount) {
      overBudgetCategories.push(alloc.categoryId);
    }
  }

  const isOverBudget = totalActual > totalPlanned;
  const healthPercent =
    totalPlanned > 0 ? Math.round(Math.min(100, (1 - (totalActual - totalPlanned) / totalPlanned) * 100)) : 100;

  return { overBudgetCategories, totalActual, totalPlanned, healthPercent: Math.max(0, healthPercent), isOverBudget };
}

// ---------------------------------------------------------------------------
// generateDefaultCategories
// ---------------------------------------------------------------------------
function makeCategory(
  name: string,
  icon: string,
  priority: AllocationPriority,
  isContingency = false,
): BudgetCategory {
  return {
    id: uuidv4(),
    name,
    icon,
    priority,
    isLocked: false,
    isContingency,
  };
}

export function generateDefaultCategories(eventType: EventType): BudgetCategory[] {
  switch (eventType) {
    case 'wedding':
      return [
        makeCategory('Venue', 'building-2', 'essential'),
        makeCategory('Catering', 'utensils', 'essential'),
        makeCategory('Photography', 'camera', 'high'),
        makeCategory('Decor', 'flower', 'medium'),
        makeCategory('Attire', 'shirt', 'high'),
        makeCategory('Entertainment', 'music', 'medium'),
        makeCategory('Transport', 'car', 'low'),
        makeCategory('Invitations', 'mail', 'low'),
        makeCategory('Staffing', 'users', 'medium'),
        makeCategory('Contingency', 'shield', 'essential', true),
      ];
    case 'birthday':
      return [
        makeCategory('Venue', 'building-2', 'essential'),
        makeCategory('Catering', 'utensils', 'essential'),
        makeCategory('Decor', 'flower', 'medium'),
        makeCategory('Entertainment', 'music', 'high'),
        makeCategory('Photography', 'camera', 'medium'),
        makeCategory('Transport', 'car', 'low'),
        makeCategory('Invitations', 'mail', 'low'),
        makeCategory('Contingency', 'shield', 'essential', true),
      ];
    case 'anniversary':
      return [
        makeCategory('Venue', 'building-2', 'essential'),
        makeCategory('Catering', 'utensils', 'essential'),
        makeCategory('Photography', 'camera', 'high'),
        makeCategory('Decor', 'flower', 'medium'),
        makeCategory('Entertainment', 'music', 'medium'),
        makeCategory('Transport', 'car', 'low'),
        makeCategory('Contingency', 'shield', 'essential', true),
      ];
    case 'community':
      return [
        makeCategory('Venue', 'building-2', 'essential'),
        makeCategory('Catering', 'utensils', 'essential'),
        makeCategory('Staffing', 'users', 'high'),
        makeCategory('Entertainment', 'music', 'medium'),
        makeCategory('Decor', 'flower', 'low'),
        makeCategory('Transport', 'car', 'medium'),
        makeCategory('Safety', 'shield-alert', 'essential'),
        makeCategory('Invitations', 'mail', 'low'),
        makeCategory('Audio-Visual', 'monitor-speaker', 'medium'),
        makeCategory('Contingency', 'shield', 'essential', true),
      ];
    default:
      return [makeCategory('Contingency', 'shield', 'essential', true)];
  }
}
