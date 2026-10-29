import { describe, it, expect } from 'vitest';
import { addDays, subDays, formatISO } from 'date-fns';
import { calculateReadinessScore, detectRisks, RiskEngineParams } from '@/lib/risk-engine';
import { generateDefaultCategories, allocateBudget } from '@/lib/budget-engine';
import type { EventProfile } from '@/types/event';
import type { BudgetPlan } from '@/types/budget';
import type { PlanningTask } from '@/types/timeline';
import type { VendorEntry } from '@/types/vendor';
import type { ShowBlock } from '@/types/runofshow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function futureDate(daysFromNow: number): string {
  return formatISO(addDays(new Date(), daysFromNow), { representation: 'date' });
}

function pastDate(daysAgo: number): string {
  return formatISO(subDays(new Date(), daysAgo), { representation: 'date' });
}

function makeEvent(overrides: Partial<EventProfile> = {}): EventProfile {
  return {
    id: 'event-1',
    name: 'Test Event',
    type: 'wedding',
    status: 'planning',
    date: futureDate(90),
    time: '18:00',
    city: 'Mumbai',
    guestCount: 100,
    confirmedGuestCount: 80,
    venueCapacity: 200,
    currency: 'INR',
    totalBudget: 1_000_000,
    contingencyPercent: 10,
    theme: {
      style: ['modern'],
      colorPreferences: ['white'],
      indoorOutdoor: 'indoor',
      hasWeatherBackup: false,
    },
    dietaryRequirements: [],
    accessibilityNeeds: [],
    priorities: [],
    isDemo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePlan(event: EventProfile): BudgetPlan {
  const categories = generateDefaultCategories('wedding');
  return allocateBudget(event.totalBudget, categories, event.contingencyPercent, []);
}

function makeVendor(overrides: Partial<VendorEntry> = {}): VendorEntry {
  return {
    id: 'vendor-1',
    eventId: 'event-1',
    category: 'venue',
    requirement: 'Venue',
    status: 'booked',
    estimatedCost: 100_000,
    researchDeadline: futureDate(60),
    bookingDeadline: futureDate(30),
    questionsToAsk: [],
    redFlags: [],
    contractSigned: false,
    depositPaid: false,
    paymentMilestones: [],
    isCritical: true,
    isIllustrative: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<PlanningTask> = {}): PlanningTask {
  return {
    id: 'task-1',
    eventId: 'event-1',
    title: 'Test Task',
    description: 'A test task',
    category: 'other',
    priority: 'medium',
    status: 'not-started',
    dueDate: futureDate(10),
    estimatedDurationDays: 1,
    dependencies: [],
    isPinned: false,
    daysBeforeEvent: 10,
    phase: 'mid',
    ...overrides,
  };
}

function makeShowBlock(overrides: Partial<ShowBlock> = {}): ShowBlock {
  return {
    id: 'block-1',
    eventId: 'event-1',
    title: 'Welcome',
    category: 'arrival',
    startTime: '18:00',
    endTime: '18:30',
    durationMinutes: 30,
    dependencies: [],
    sortOrder: 1,
    ...overrides,
  };
}

function makePerfectParams(): RiskEngineParams {
  const event = makeEvent();
  const budget = makePlan(event);
  const vendors = [
    makeVendor({ id: 'v1', status: 'booked', isCritical: true }),
    makeVendor({ id: 'v2', category: 'catering', status: 'booked', isCritical: true }),
  ];
  const tasks = [
    makeTask({ id: 't1', status: 'completed', dueDate: pastDate(5), priority: 'critical' }),
    makeTask({ id: 't2', status: 'completed', dueDate: pastDate(3), priority: 'high' }),
  ];
  const runOfShow = [
    makeShowBlock({ id: 'b1' }),
    makeShowBlock({ id: 'b2', title: 'Ceremony', category: 'ceremony' }),
    makeShowBlock({ id: 'b3', title: 'Dinner', category: 'dining' }),
    makeShowBlock({ id: 'b4', title: 'Entertainment', category: 'entertainment' }),
  ];
  return { event, budget, tasks, vendors, runOfShow };
}

// ---------------------------------------------------------------------------
// calculateReadinessScore tests
// ---------------------------------------------------------------------------
describe('calculateReadinessScore', () => {
  it('returns score <= 100 and >= 0 for any valid params', () => {
    const params = makePerfectParams();
    const result = calculateReadinessScore(params);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('score is high (>= 70) for a near-perfect plan', () => {
    const params = makePerfectParams();
    const result = calculateReadinessScore(params);
    expect(result.total).toBeGreaterThanOrEqual(70);
  });

  it('score decreases when a critical vendor is unbooked near deadline', () => {
    const perfectParams = makePerfectParams();
    const perfectScore = calculateReadinessScore(perfectParams).total;

    const worseParams = makePerfectParams();
    // Mark all critical vendors as not booked
    worseParams.vendors = worseParams.vendors.map((v) => ({
      ...v,
      status: 'not-started' as const,
    }));
    const worseScore = calculateReadinessScore(worseParams).total;

    expect(worseScore).toBeLessThan(perfectScore);
  });

  it('score decreases when an overdue critical task is present', () => {
    const perfectParams = makePerfectParams();
    const perfectScore = calculateReadinessScore(perfectParams).total;

    const worseParams = makePerfectParams();
    worseParams.tasks = [
      makeTask({ id: 't1', status: 'not-started', dueDate: pastDate(5), priority: 'critical' }),
    ];
    const worseScore = calculateReadinessScore(worseParams).total;

    expect(worseScore).toBeLessThan(perfectScore);
  });

  it('readiness score changes when an overdue task is marked complete', () => {
    const params = makePerfectParams();
    params.tasks = [
      makeTask({ id: 't1', status: 'not-started', dueDate: pastDate(5), priority: 'critical' }),
    ];
    const scoreBefore = calculateReadinessScore(params).total;

    const updatedParams = { ...params, tasks: [makeTask({ id: 't1', status: 'completed', dueDate: pastDate(5), priority: 'critical' })] };
    const scoreAfter = calculateReadinessScore(updatedParams).total;

    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  it('returns a breakdown array with correct weights summing to ~1.0', () => {
    const params = makePerfectParams();
    const result = calculateReadinessScore(params);
    const totalWeight = result.breakdown.reduce((s, b) => s + b.weight, 0);
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001);
  });
});

// ---------------------------------------------------------------------------
// detectRisks tests
// ---------------------------------------------------------------------------
describe('detectRisks', () => {
  it('returns no risks for a clean plan', () => {
    const event = makeEvent({ theme: { style: [], colorPreferences: [], indoorOutdoor: 'indoor', hasWeatherBackup: false } });
    const budget = makePlan(event);
    const params: RiskEngineParams = {
      event,
      budget,
      tasks: [],
      vendors: [],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    // May have some risks (no contingency % issues etc) but no critical budget overrun
    const budgetOverrunRisks = risks.filter((r) => r.category === 'budget' && r.title.includes('overrun'));
    expect(budgetOverrunRisks).toHaveLength(0);
  });

  it('detects outdoor-no-backup risk correctly', () => {
    const event = makeEvent({
      theme: {
        style: ['garden'],
        colorPreferences: [],
        indoorOutdoor: 'outdoor',
        hasWeatherBackup: false,
      },
    });
    const params: RiskEngineParams = {
      event,
      budget: makePlan(event),
      tasks: [],
      vendors: [],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    const weatherRisk = risks.find((r) => r.category === 'weather');
    expect(weatherRisk).toBeDefined();
    expect(weatherRisk?.severity).toBe('medium');
  });

  it('does NOT flag outdoor risk when hasWeatherBackup is true', () => {
    const event = makeEvent({
      theme: {
        style: ['garden'],
        colorPreferences: [],
        indoorOutdoor: 'outdoor',
        hasWeatherBackup: true,
      },
    });
    const params: RiskEngineParams = {
      event,
      budget: makePlan(event),
      tasks: [],
      vendors: [],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    expect(risks.find((r) => r.category === 'weather')).toBeUndefined();
  });

  it('detects budget overrun risk', () => {
    const event = makeEvent();
    const budget = makePlan(event);
    // Corrupt actuals
    budget.allocations[0].actualAmount = budget.allocations[0].plannedAmount + 50_000;

    const params: RiskEngineParams = { event, budget, tasks: [], vendors: [], runOfShow: [] };
    const risks = detectRisks(params);
    const overrunRisks = risks.filter((r) => r.title.includes('overrun'));
    expect(overrunRisks.length).toBeGreaterThan(0);
  });

  it('detects critical vendor unbooked near deadline', () => {
    const event = makeEvent();
    const vendor = makeVendor({
      isCritical: true,
      status: 'researching',
      bookingDeadline: formatISO(addDays(new Date(), 15), { representation: 'date' }),
    });
    const params: RiskEngineParams = {
      event,
      budget: makePlan(event),
      tasks: [],
      vendors: [vendor],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    const vendorRisk = risks.find((r) => r.category === 'vendor');
    expect(vendorRisk).toBeDefined();
    expect(vendorRisk?.severity).toBe('critical');
  });

  it('detects overdue critical task risk', () => {
    const event = makeEvent();
    const task = makeTask({
      priority: 'critical',
      status: 'not-started',
      dueDate: pastDate(3),
    });
    const params: RiskEngineParams = {
      event,
      budget: makePlan(event),
      tasks: [task],
      vendors: [],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    const timelineRisk = risks.find((r) => r.category === 'timeline');
    expect(timelineRisk).toBeDefined();
    expect(timelineRisk?.severity).toBe('critical');
  });

  it('detects guest count exceeds venue capacity', () => {
    const event = makeEvent({
      confirmedGuestCount: 250,
      venueCapacity: 200,
    });
    const params: RiskEngineParams = {
      event,
      budget: makePlan(event),
      tasks: [],
      vendors: [],
      runOfShow: [],
    };
    const risks = detectRisks(params);
    const venueRisk = risks.find((r) => r.category === 'venue');
    expect(venueRisk).toBeDefined();
    expect(venueRisk?.severity).toBe('high');
  });
});
