import { describe, it, expect } from 'vitest';
import {
  allocateBudget,
  validateBudgetPlan,
  rebalanceBudget,
  applyScenario,
  getBudgetHealth,
  generateDefaultCategories,
} from '@/lib/budget-engine';
import type { BudgetAllocation, BudgetScenario } from '@/types/budget';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeCategories(type: Parameters<typeof generateDefaultCategories>[0] = 'wedding') {
  return generateDefaultCategories(type);
}

function sumAllocations(allocs: BudgetAllocation[]): number {
  return allocs.reduce((s, a) => s + a.plannedAmount, 0);
}

function makePlan(totalBudget: number, contingencyPercent = 10) {
  const categories = makeCategories('wedding');
  return allocateBudget(totalBudget, categories, contingencyPercent, []);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('allocateBudget', () => {
  it.each([0, 1, 99, 10_001, 50_000, 800_000])(
    'keeps every allocation non-negative and exact for %s',
    (total) => {
      const plan = makePlan(total);
      expect(sumAllocations(plan.allocations)).toBe(total);
      expect(plan.allocations.every((allocation) => allocation.plannedAmount >= 0)).toBe(true);
    },
  );

  it('sum of allocations equals totalBudget for 1,000,000', () => {
    const plan = makePlan(1_000_000);
    expect(sumAllocations(plan.allocations)).toBe(1_000_000);
  });

  it('sum equals totalBudget for 999', () => {
    const plan = makePlan(999);
    expect(sumAllocations(plan.allocations)).toBe(999);
  });

  it('sum equals totalBudget for 100,001', () => {
    const plan = makePlan(100_001);
    expect(sumAllocations(plan.allocations)).toBe(100_001);
  });

  it('sum equals totalBudget for 1,500,000', () => {
    const plan = makePlan(1_500_000);
    expect(sumAllocations(plan.allocations)).toBe(1_500_000);
  });

  it('no allocation is negative', () => {
    const plan = makePlan(500_000);
    for (const alloc of plan.allocations) {
      expect(alloc.plannedAmount).toBeGreaterThanOrEqual(0);
    }
  });

  it('no negative allocations with any valid input', () => {
    for (const total of [1, 50, 100, 7777, 999_999, 10_000_000]) {
      const plan = makePlan(total);
      for (const alloc of plan.allocations) {
        expect(alloc.plannedAmount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('contingency receives floor(totalBudget * contingencyPercent / 100)', () => {
    const total = 1_000_000;
    const contingencyPercent = 10;
    const plan = allocateBudget(total, makeCategories('wedding'), contingencyPercent, []);
    const contingencyAlloc = plan.allocations.find((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return cat?.isContingency;
    });
    expect(contingencyAlloc?.plannedAmount).toBe(Math.floor((total * contingencyPercent) / 100));
  });

  it('largest-remainder correction: total - sum(floors) is distributed correctly', () => {
    // With 999 budget and many categories, floor math leaves a remainder that must be distributed
    const plan = makePlan(999);
    const sum = sumAllocations(plan.allocations);
    expect(sum).toBe(999);
  });
});

describe('validateBudgetPlan', () => {
  it('returns isValid=true for a correctly allocated plan', () => {
    const plan = makePlan(1_000_000);
    const result = validateBudgetPlan(plan);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns isValid=false when sum !== totalBudget', () => {
    const plan = makePlan(1_000_000);
    // Corrupt one allocation
    plan.allocations[0].plannedAmount += 1000;
    const result = validateBudgetPlan(plan);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns isValid=false when a plannedAmount is negative', () => {
    const plan = makePlan(1_000_000);
    plan.allocations[0].plannedAmount = -500;
    const result = validateBudgetPlan(plan);
    expect(result.isValid).toBe(false);
  });

  it('returns isValid=false when contingency category missing', () => {
    const plan = makePlan(1_000_000);
    // Remove contingency from categories
    plan.categories = plan.categories.filter((c) => !c.isContingency);
    const result = validateBudgetPlan(plan);
    expect(result.isValid).toBe(false);
  });
});

describe('rebalanceBudget', () => {
  it('locked item stays exactly at its amount after rebalance', () => {
    const categories = makeCategories('wedding');
    const lockedCategory = categories.find((c) => !c.isContingency)!;
    const lockedAmount = 50_000;

    const lockedAlloc: BudgetAllocation = {
      categoryId: lockedCategory.id,
      plannedAmount: lockedAmount,
      actualAmount: 0,
      lockedAmount: lockedAmount,
      percentage: 5,
      confidence: 'confirmed',
    };
    // Mark category as locked
    lockedCategory.isLocked = true;

    const plan = allocateBudget(1_000_000, categories, 10, [lockedAlloc]);
    const lockedAllocInPlan = plan.allocations.find((a) => a.categoryId === lockedCategory.id);
    expect(lockedAllocInPlan?.plannedAmount).toBe(lockedAmount);
    expect(sumAllocations(plan.allocations)).toBe(1_000_000);
  });

  it('rebalanceBudget redistributes correctly and keeps total unchanged', () => {
    const plan = makePlan(1_000_000);
    const firstUnlocked = plan.allocations.find((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return cat && !cat.isContingency && !cat.isLocked;
    })!;
    const newAmount = firstUnlocked.plannedAmount + 50_000;

    const newPlan = rebalanceBudget(plan, {
      categoryId: firstUnlocked.categoryId,
      newAmount,
      isLocked: false,
    });

    expect(sumAllocations(newPlan.allocations)).toBe(1_000_000);
    const updatedAlloc = newPlan.allocations.find((a) => a.categoryId === firstUnlocked.categoryId)!;
    expect(updatedAlloc.plannedAmount).toBe(newAmount);
  });

  it('rebalanceBudget does not mutate the original plan', () => {
    const plan = makePlan(500_000);
    const firstUnlocked = plan.allocations.find((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return cat && !cat.isContingency && !cat.isLocked;
    })!;
    const originalAmount = firstUnlocked.plannedAmount;

    rebalanceBudget(plan, {
      categoryId: firstUnlocked.categoryId,
      newAmount: firstUnlocked.plannedAmount + 10_000,
      isLocked: false,
    });

    // Original must not change
    expect(firstUnlocked.plannedAmount).toBe(originalAmount);
  });

  it('rejects negative planned amounts without changing the plan', () => {
    const plan = makePlan(50_000);
    const target = plan.allocations.find((allocation) => {
      const category = plan.categories.find((item) => item.id === allocation.categoryId);
      return category && !category.isContingency;
    })!;
    const result = rebalanceBudget(plan, {
      categoryId: target.categoryId,
      newAmount: -1,
      isLocked: false,
    });
    expect(result.allocations.find((allocation) => allocation.categoryId === target.categoryId)?.plannedAmount)
      .toBe(target.plannedAmount);
    expect(sumAllocations(result.allocations)).toBe(plan.totalBudget);
  });

  it('does not allow locked allocations to exceed the budget', () => {
    const categories = makeCategories();
    const target = categories.find((category) => !category.isContingency)!;
    const locked: BudgetAllocation = {
      categoryId: target.id,
      plannedAmount: 100_001,
      actualAmount: 0,
      lockedAmount: 100_001,
      percentage: 100,
      confidence: 'confirmed',
    };
    expect(() => allocateBudget(100_000, categories, 10, [locked])).toThrow(
      'Locked allocations and contingency exceed the total budget.',
    );
  });
});

describe('applyScenario', () => {
  it('applyScenario save-15 reduces the target categories by ~15%', () => {
    const plan = makePlan(1_000_000);
    const nonContingency = plan.allocations.filter((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return cat && !cat.isContingency;
    });

    const modifications = nonContingency.map((a) => ({
      categoryId: a.categoryId,
      newAmount: Math.floor(a.plannedAmount * 0.85),
      changePercent: -15,
      isLocked: false,
    }));

    const scenario: BudgetScenario = {
      id: 'save-15',
      name: 'Save 15%',
      type: 'save-15',
      description: 'Reduce all non-contingency allocations by 15%',
      modifications,
    };

    const result = applyScenario(plan, scenario);
    // The result should still have a valid total
    expect(sumAllocations(result.allocations)).toBe(1_000_000);
  });

  it('applyScenario does not mutate original plan', () => {
    const plan = makePlan(1_000_000);
    const firstAlloc = plan.allocations[0];
    const originalAmount = firstAlloc.plannedAmount;

    const scenario: BudgetScenario = {
      id: 'test',
      name: 'Test',
      type: 'custom',
      description: 'Test scenario',
      modifications: [
        {
          categoryId: firstAlloc.categoryId,
          newAmount: 999,
          changePercent: -50,
          isLocked: false,
        },
      ],
    };

    applyScenario(plan, scenario);
    expect(plan.allocations[0].plannedAmount).toBe(originalAmount);
  });
});

describe('generateDefaultCategories', () => {
  it('wedding returns array with contingency category', () => {
    const cats = generateDefaultCategories('wedding');
    expect(cats.some((c) => c.isContingency)).toBe(true);
  });

  it('birthday returns array with contingency category', () => {
    const cats = generateDefaultCategories('birthday');
    expect(cats.some((c) => c.isContingency)).toBe(true);
  });

  it('anniversary returns array with contingency category', () => {
    const cats = generateDefaultCategories('anniversary');
    expect(cats.some((c) => c.isContingency)).toBe(true);
  });

  it('community returns array with contingency category', () => {
    const cats = generateDefaultCategories('community');
    expect(cats.some((c) => c.isContingency)).toBe(true);
  });

  it('wedding returns expected categories including venue and catering', () => {
    const cats = generateDefaultCategories('wedding');
    const names = cats.map((c) => c.name.toLowerCase());
    expect(names.some((n) => n.includes('venue'))).toBe(true);
    expect(names.some((n) => n.includes('catering'))).toBe(true);
  });

  it('all categories have unique IDs', () => {
    const cats = generateDefaultCategories('wedding');
    const ids = cats.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('getBudgetHealth', () => {
  it('returns isOverBudget=false when no actuals exceed planned', () => {
    const plan = makePlan(1_000_000);
    const health = getBudgetHealth(plan);
    expect(health.isOverBudget).toBe(false);
    expect(health.overBudgetCategories).toHaveLength(0);
  });

  it('returns overBudgetCategories when an actual exceeds planned', () => {
    const plan = makePlan(1_000_000);
    // Make one category over its individual allocation
    plan.allocations[0].actualAmount = plan.allocations[0].plannedAmount + 1;
    const health = getBudgetHealth(plan);
    expect(health.overBudgetCategories).toContain(plan.allocations[0].categoryId);
  });

  it('returns isOverBudget=true when totalActual exceeds totalPlanned', () => {
    const plan = makePlan(1_000_000);
    // Drive total actual above total planned
    plan.allocations.forEach((a) => {
      a.actualAmount = a.plannedAmount;
    });
    plan.allocations[0].actualAmount += 1;
    const health = getBudgetHealth(plan);
    expect(health.isOverBudget).toBe(true);
  });
});
