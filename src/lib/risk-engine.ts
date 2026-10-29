import { v4 as uuidv4 } from 'uuid';
import { isPast, isBefore, addDays, parseISO, differenceInCalendarDays } from 'date-fns';
import type { EventProfile } from '@/types/event';
import type { BudgetPlan } from '@/types/budget';
import type { PlanningTask } from '@/types/timeline';
import type { VendorEntry } from '@/types/vendor';
import type { ShowBlock } from '@/types/runofshow';
import type { RiskItem, RiskSeverity, ReadinessScore, ReadinessBreakdown } from '@/types/risk';

// ---------------------------------------------------------------------------
// Params interface
// ---------------------------------------------------------------------------
export interface RiskEngineParams {
  event: EventProfile;
  budget: BudgetPlan;
  tasks: PlanningTask[];
  vendors: VendorEntry[];
  runOfShow: ShowBlock[];
}

// ---------------------------------------------------------------------------
// calculateReadinessScore
// ---------------------------------------------------------------------------
export function calculateReadinessScore(params: RiskEngineParams): ReadinessScore {
  const { event, budget, tasks, vendors, runOfShow } = params;

  const breakdown: ReadinessBreakdown[] = [];

  // 1. Budget health (0.20)
  let budgetScore = 100;
  const overBudgetCount = budget.allocations.filter(
    (a) => a.actualAmount > a.plannedAmount,
  ).length;
  budgetScore = Math.max(0, 100 - overBudgetCount * 10);
  breakdown.push({
    factor: 'Budget Health',
    score: budgetScore,
    weight: 0.20,
    details: overBudgetCount > 0
      ? `${overBudgetCount} category(ies) over budget`
      : 'No budget overruns',
  });

  // 2. Critical vendor booking (0.25)
  const criticalVendors = vendors.filter((v) => v.isCritical);
  const bookedCritical = criticalVendors.filter((v) => v.status === 'booked').length;
  const vendorScore =
    criticalVendors.length > 0
      ? Math.round((bookedCritical / criticalVendors.length) * 100)
      : 100;
  breakdown.push({
    factor: 'Critical Vendor Booking',
    score: vendorScore,
    weight: 0.25,
    details: `${bookedCritical} of ${criticalVendors.length} critical vendors booked`,
  });

  // 3. Task completion by phase (0.20)
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const taskScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;
  breakdown.push({
    factor: 'Task Completion',
    score: taskScore,
    weight: 0.20,
    details: `${completedTasks} of ${tasks.length} tasks completed`,
  });

  // 4. Overdue tasks (0.15)
  let overdueScore = 100;
  const overdueCritical = tasks.filter(
    (t) => t.priority === 'critical' && t.status !== 'completed' && isPast(parseISO(t.dueDate)),
  ).length;
  const overdueHigh = tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'completed' && isPast(parseISO(t.dueDate)),
  ).length;
  overdueScore = Math.max(0, 100 - overdueCritical * 15 - overdueHigh * 5);
  breakdown.push({
    factor: 'Overdue Tasks',
    score: overdueScore,
    weight: 0.15,
    details: `${overdueCritical} critical overdue, ${overdueHigh} high overdue`,
  });

  // 5. Guest / venue capacity (0.10)
  let capacityScore = 100;
  if (event.venueCapacity !== undefined && event.confirmedGuestCount > event.venueCapacity) {
    capacityScore = 0;
  }
  breakdown.push({
    factor: 'Guest / Venue Capacity',
    score: capacityScore,
    weight: 0.10,
    details:
      event.venueCapacity !== undefined
        ? `${event.confirmedGuestCount} confirmed guests, ${event.venueCapacity} capacity`
        : 'Venue capacity not set',
  });

  // 6. Schedule completeness (0.10)
  const scheduleScore = runOfShow.length > 3 ? 100 : 30;
  breakdown.push({
    factor: 'Schedule Completeness',
    score: scheduleScore,
    weight: 0.10,
    details: `Run of show has ${runOfShow.length} block(s)`,
  });

  const total = Math.round(
    breakdown.reduce((sum, b) => sum + b.score * b.weight, 0),
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown,
    lastCalculated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// detectRisks
// ---------------------------------------------------------------------------
export function detectRisks(params: RiskEngineParams): RiskItem[] {
  const { event, budget, tasks, vendors, runOfShow } = params;
  const now = new Date();
  const risks: RiskItem[] = [];

  // 1. Budget overrun: any category where actualAmount > plannedAmount
  for (const alloc of budget.allocations) {
    if (alloc.actualAmount > alloc.plannedAmount) {
      const overrun = alloc.actualAmount - alloc.plannedAmount;
      const cat = budget.categories.find((c) => c.id === alloc.categoryId);
      const percentage = alloc.plannedAmount > 0
        ? Math.round((overrun / alloc.plannedAmount) * 100)
        : 100;
      const severity: RiskSeverity = percentage >= 25 ? 'high' : 'medium';
      risks.push({
        id: uuidv4(),
        category: 'budget',
        severity,
        title: `Budget overrun: ${cat?.name ?? alloc.categoryId}`,
        explanation: `Actual spend (${alloc.actualAmount}) exceeds planned amount (${alloc.plannedAmount}) by ${percentage}%.`,
        affectedEntities: [alloc.categoryId],
        recommendedAction: 'Review spend and adjust budget or reduce costs.',
        actionTarget: 'budget',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 2. Insufficient contingency
  const contingencyAlloc = budget.allocations.find((a) => {
    const cat = budget.categories.find((c) => c.id === a.categoryId);
    return cat?.isContingency;
  });
  if (contingencyAlloc) {
    const contingencyPercent =
      budget.totalBudget > 0
        ? (contingencyAlloc.plannedAmount / budget.totalBudget) * 100
        : 0;
    if (contingencyPercent < 3) {
      risks.push({
        id: uuidv4(),
        category: 'budget',
        severity: 'critical',
        title: 'Critically low contingency',
        explanation: `Contingency is ${contingencyPercent.toFixed(1)}% of total budget (minimum recommended: 5%).`,
        affectedEntities: [contingencyAlloc.categoryId],
        recommendedAction: 'Increase contingency to at least 5% of total budget.',
        actionTarget: 'budget',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    } else if (contingencyPercent < 5) {
      risks.push({
        id: uuidv4(),
        category: 'budget',
        severity: 'high',
        title: 'Low contingency budget',
        explanation: `Contingency is ${contingencyPercent.toFixed(1)}% of total budget (recommended: 5%+).`,
        affectedEntities: [contingencyAlloc.categoryId],
        recommendedAction: 'Consider increasing contingency to at least 5%.',
        actionTarget: 'budget',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 3. Critical vendor unbooked near deadline
  for (const vendor of vendors) {
    if (
      vendor.isCritical &&
      vendor.status !== 'booked' &&
      vendor.status !== 'cancelled' &&
      isBefore(parseISO(vendor.bookingDeadline), addDays(now, 30))
    ) {
      risks.push({
        id: uuidv4(),
        category: 'vendor',
        severity: 'critical',
        title: `Critical vendor not booked: ${vendor.requirement}`,
        explanation: `Booking deadline is ${vendor.bookingDeadline} (within 30 days) and status is "${vendor.status}".`,
        affectedEntities: [vendor.id],
        recommendedAction: 'Book this vendor immediately.',
        actionTarget: 'vendors',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 4. Overdue critical tasks
  for (const task of tasks) {
    if (task.priority === 'critical' && task.status !== 'completed' && isPast(parseISO(task.dueDate))) {
      risks.push({
        id: uuidv4(),
        category: 'timeline',
        severity: 'critical',
        title: `Overdue critical task: ${task.title}`,
        explanation: `Task was due ${task.dueDate} and is not yet completed.`,
        affectedEntities: [task.id],
        recommendedAction: 'Complete or reschedule this task immediately.',
        actionTarget: 'timeline',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 5. Outdoor without weather backup
  if (event.theme.indoorOutdoor !== 'indoor' && !event.theme.hasWeatherBackup) {
    risks.push({
      id: uuidv4(),
      category: 'weather',
      severity: 'medium',
      title: 'No weather backup plan',
      explanation: 'The event has an outdoor component but no weather backup is configured.',
      affectedEntities: [],
      recommendedAction: 'Arrange a weather backup venue or contingency plan.',
      actionTarget: 'event-profile',
      isResolved: false,
      detectedAt: now.toISOString(),
    });
  }

  // 6. Guest count exceeds venue capacity
  if (event.venueCapacity !== undefined && event.confirmedGuestCount > event.venueCapacity) {
    risks.push({
      id: uuidv4(),
      category: 'venue',
      severity: 'high',
      title: 'Guest count exceeds venue capacity',
      explanation: `${event.confirmedGuestCount} confirmed guests exceeds venue capacity of ${event.venueCapacity}.`,
      affectedEntities: [],
      recommendedAction: 'Reduce guest list or find a larger venue.',
      actionTarget: 'guests',
      isResolved: false,
      detectedAt: now.toISOString(),
    });
  }

  // 7. Incomplete run of show near event date
  const daysToEvent = differenceInCalendarDays(parseISO(event.date), now);
  if (daysToEvent <= 14 && runOfShow.length < 5) {
    risks.push({
      id: uuidv4(),
      category: 'logistics',
      severity: 'high',
      title: 'Incomplete run of show',
      explanation: `Event is in ${daysToEvent} day(s) but the run of show has only ${runOfShow.length} block(s).`,
      affectedEntities: [],
      recommendedAction: 'Complete the run of show with at least 5 blocks.',
      actionTarget: 'runofshow',
      isResolved: false,
      detectedAt: now.toISOString(),
    });
  }

  // 8. No dietary accommodation
  if (event.dietaryRequirements.length > 0) {
    const hasDietaryTask = tasks.some(
      (t) =>
        t.title.toLowerCase().includes('diet') ||
        t.description.toLowerCase().includes('diet') ||
        t.category === 'catering',
    );
    const hasDietaryVendor = vendors.some((v) => v.category === 'catering');
    if (!hasDietaryTask && !hasDietaryVendor) {
      risks.push({
        id: uuidv4(),
        category: 'guest',
        severity: 'medium',
        title: 'Dietary requirements not addressed',
        explanation: `Event has ${event.dietaryRequirements.length} dietary requirement(s) but no catering task or vendor references them.`,
        affectedEntities: [],
        recommendedAction: 'Confirm dietary accommodations with your caterer.',
        actionTarget: 'vendors',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 9. No accessibility plan
  if (event.accessibilityNeeds.length > 0) {
    const hasAccessibilityTask = tasks.some(
      (t) =>
        t.title.toLowerCase().includes('access') ||
        t.description.toLowerCase().includes('access'),
    );
    if (!hasAccessibilityTask) {
      risks.push({
        id: uuidv4(),
        category: 'logistics',
        severity: 'medium',
        title: 'No accessibility plan',
        explanation: `Event has ${event.accessibilityNeeds.length} accessibility need(s) but no tasks reference accessibility.`,
        affectedEntities: [],
        recommendedAction: 'Add tasks to address accessibility requirements.',
        actionTarget: 'timeline',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  // 10. Budget < 70% allocated and event < 60 days away
  if (daysToEvent <= 60) {
    const totalAllocated = budget.allocations.reduce((s, a) => s + a.actualAmount, 0);
    const allocatedPercent =
      budget.totalBudget > 0 ? (totalAllocated / budget.totalBudget) * 100 : 100;
    if (allocatedPercent < 70) {
      risks.push({
        id: uuidv4(),
        category: 'budget',
        severity: 'medium',
        title: 'Budget under-allocated close to event',
        explanation: `Only ${allocatedPercent.toFixed(1)}% of budget has been allocated with ${daysToEvent} day(s) until the event.`,
        affectedEntities: [],
        recommendedAction: 'Review and finalize budget allocations.',
        actionTarget: 'budget',
        isResolved: false,
        detectedAt: now.toISOString(),
      });
    }
  }

  return risks;
}
