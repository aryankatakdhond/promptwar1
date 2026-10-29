import { describe, it, expect } from 'vitest';
import { addDays, formatISO, parseISO } from 'date-fns';
import { previewRippleChange, applyRippleChange, identifyAffectedEntities, RippleChange } from '@/lib/ripple-engine';
import { generateDefaultCategories, allocateBudget } from '@/lib/budget-engine';
import { generateTimeline } from '@/lib/timeline-engine';
import type { StoredEvent } from '@/types/persistence';
import type { EventProfile } from '@/types/event';
import type { ReadinessScore } from '@/types/risk';
import type { ChangeSet } from '@/types/ai';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function futureDate(daysFromNow: number): string {
  return formatISO(addDays(new Date(), daysFromNow), { representation: 'date' });
}

function makeEventProfile(overrides: Partial<EventProfile> = {}): EventProfile {
  return {
    id: 'event-1',
    name: 'Test Wedding',
    type: 'wedding',
    status: 'planning',
    date: futureDate(200),
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

function makeReadinessScore(): ReadinessScore {
  return { total: 80, breakdown: [], lastCalculated: new Date().toISOString() };
}

function makeStoredEvent(overrides: Partial<EventProfile> = {}): StoredEvent {
  const profile = makeEventProfile(overrides);
  const categories = generateDefaultCategories('wedding');
  const budget = allocateBudget(
    profile.totalBudget,
    categories,
    profile.contingencyPercent,
    [],
  );
  const tasks = generateTimeline(profile);

  return {
    profile,
    budget: { ...budget, eventId: profile.id },
    tasks,
    vendors: [],
    guests: [],
    runOfShow: [],
    risks: [],
    readinessScore: makeReadinessScore(),
    ideas: [],
    copilotHistory: [],
    undoStack: [],
  };
}

// ---------------------------------------------------------------------------
// identifyAffectedEntities tests
// ---------------------------------------------------------------------------
describe('identifyAffectedEntities', () => {
  it('guest-count change includes catering as affected entity', () => {
    const event = makeStoredEvent();
    const change: RippleChange = {
      type: 'guest-count',
      payload: { confirmedGuestCount: 120 },
    };
    const entities = identifyAffectedEntities(change, event);
    const hasCareting = entities.some(
      (e) => e.entityName.toLowerCase().includes('catering'),
    );
    expect(hasCareting).toBe(true);
  });

  it('date-change includes tasks as affected entity', () => {
    const event = makeStoredEvent();
    const change: RippleChange = {
      type: 'date-change',
      payload: { date: futureDate(250) },
    };
    const entities = identifyAffectedEntities(change, event);
    const hasTaskEntity = entities.some((e) => e.entityType === 'task');
    expect(hasTaskEntity).toBe(true);
  });

  it('theme-change includes risk as affected entity', () => {
    const event = makeStoredEvent();
    const change: RippleChange = {
      type: 'theme-change',
      payload: { theme: { style: [], colorPreferences: [], indoorOutdoor: 'outdoor', hasWeatherBackup: false } },
    };
    const entities = identifyAffectedEntities(change, event);
    const hasRiskEntity = entities.some((e) => e.entityType === 'risk');
    expect(hasRiskEntity).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// previewRippleChange tests
// ---------------------------------------------------------------------------
describe('previewRippleChange', () => {
  it('scales catering and preserves the exact budget when guest count changes', () => {
    const event = makeStoredEvent({ guestCount: 100 });
    const cateringCategory = event.budget.categories.find((category) =>
      category.name.toLowerCase().includes('catering'),
    )!;
    const original = event.budget.allocations.find((allocation) => allocation.categoryId === cateringCategory.id)!;
    const result = previewRippleChange(event, {
      type: 'guest-count',
      payload: { guestCount: 150 },
    });
    const preview = result.preview as StoredEvent;
    const updated = preview.budget.allocations.find((allocation) => allocation.categoryId === cateringCategory.id)!;
    expect(updated.plannedAmount).toBe(Math.round(original.plannedAmount * 1.5));
    expect(preview.budget.allocations.reduce((sum, allocation) => sum + allocation.plannedAmount, 0))
      .toBe(preview.budget.totalBudget);
  });

  it('writes dietary requirements onto the catering vendor during a ripple preview', () => {
    const event = makeStoredEvent({ dietaryRequirements: [] });
    event.vendors = [{
      id: 'caterer',
      eventId: event.profile.id,
      category: 'catering',
      requirement: 'Catering',
      status: 'booked',
      estimatedCost: 10_000,
      researchDeadline: futureDate(20),
      bookingDeadline: futureDate(40),
      questionsToAsk: [],
      redFlags: [],
      contractSigned: false,
      depositPaid: false,
      paymentMilestones: [],
      isCritical: true,
      isIllustrative: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
    const preview = previewRippleChange(event, {
      type: 'dietary-change',
      payload: { dietaryRequirements: ['vegan'] },
    }).preview as StoredEvent;
    expect(preview.vendors[0].notes).toContain('Dietary requirements: vegan.');
    expect(event.vendors[0].notes).toBeUndefined();
  });

  it('executes ChangeSet operations instead of treating the set as a profile patch', () => {
    const event = makeStoredEvent({ guestCount: 100 });
    const changeSet: ChangeSet = {
      id: 'change-1',
      userRequest: 'Add guests',
      operations: [
        {
          type: 'update-guest-count',
          field: 'guestCount',
          newValue: 130,
          reason: 'Increase headcount',
        },
      ],
      summary: 'Increase guest count',
      requiresConfirmation: true,
      affectedEntities: [],
      generatedBy: 'local-engine',
      timestamp: new Date().toISOString(),
    };

    const result = previewRippleChange(event, changeSet);
    expect((result.preview as StoredEvent).profile.guestCount).toBe(130);
    expect(event.profile.guestCount).toBe(100);
  });

  it('applies date operations from a ChangeSet and shifts dependent tasks', () => {
    const event = makeStoredEvent();
    const originalDate = event.profile.date;
    const newDate = futureDate(240);
    const task = event.tasks.find((item) => !item.isPinned)!;
    const originalDueDate = task.dueDate;
    const changeSet: ChangeSet = {
      id: 'change-2',
      userRequest: 'Move event',
      operations: [
        {
          type: 'update-event-date',
          field: 'date',
          newValue: newDate,
          reason: 'Move event date',
        },
      ],
      summary: 'Move event date',
      requiresConfirmation: true,
      affectedEntities: [],
      generatedBy: 'local-engine',
      timestamp: new Date().toISOString(),
    };

    const preview = previewRippleChange(event, changeSet).preview as StoredEvent;
    expect(preview.profile.date).toBe(newDate);
    expect(preview.tasks.find((item) => item.id === task.id)?.dueDate).not.toBe(originalDueDate);
    expect(event.profile.date).toBe(originalDate);
  });

  it('increasing guest count creates affected entities including catering', () => {
    const event = makeStoredEvent();
    const change: RippleChange = {
      type: 'guest-count',
      payload: { confirmedGuestCount: 150 },
    };
    const result = previewRippleChange(event, change);
    const hasCatering = result.affectedEntities.some(
      (e) => e.entityName.toLowerCase().includes('catering'),
    );
    expect(hasCatering).toBe(true);
  });

  it('locked budget categories remain unchanged during ripple budget rebalance', () => {
    const event = makeStoredEvent();

    // Lock the first non-contingency allocation
    const firstUnlocked = event.budget.allocations.find((a) => {
      const cat = event.budget.categories.find((c) => c.id === a.categoryId);
      return cat && !cat.isContingency;
    })!;
    const lockedAmount = firstUnlocked.plannedAmount;
    firstUnlocked.lockedAmount = lockedAmount;
    event.budget.categories.find((c) => c.id === firstUnlocked.categoryId)!.isLocked = true;

    const change: RippleChange = {
      type: 'budget-change',
      payload: {},
    };

    const result = previewRippleChange(event, change);
    const previewStoredEvent = result.preview as StoredEvent;

    const lockedAllocInPreview = previewStoredEvent.budget.allocations.find(
      (a) => a.categoryId === firstUnlocked.categoryId,
    );
    expect(lockedAllocInPreview?.plannedAmount).toBe(lockedAmount);
  });

  it('date change updates non-pinned task due dates', () => {
    const originalDate = futureDate(200);
    const newDate = futureDate(230); // 30 days later
    const event = makeStoredEvent({ date: originalDate });

    // Ensure at least one non-pinned task
    const nonPinnedTask = event.tasks.find((t) => !t.isPinned);
    expect(nonPinnedTask).toBeDefined();
    const originalDueDate = nonPinnedTask!.dueDate;

    const change: RippleChange = {
      type: 'date-change',
      payload: { date: newDate },
    };

    const result = previewRippleChange(event, change);
    const preview = result.preview as StoredEvent;
    const updatedTask = preview.tasks.find((t) => t.id === nonPinnedTask!.id)!;

    // Due date should have shifted by 30 days
    const diffDays = Math.round(
      (parseISO(updatedTask.dueDate).getTime() - parseISO(originalDueDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(30);
  });

  it('date change does NOT update pinned task due dates', () => {
    const event = makeStoredEvent();

    // Pin a task
    const pinnedTask = event.tasks[0];
    pinnedTask.isPinned = true;
    const originalDue = pinnedTask.dueDate;

    const change: RippleChange = {
      type: 'date-change',
      payload: { date: futureDate(300) },
    };

    const result = previewRippleChange(event, change);
    const preview = result.preview as StoredEvent;
    const updatedPinned = preview.tasks.find((t) => t.id === pinnedTask.id)!;
    expect(updatedPinned.dueDate).toBe(originalDue);
  });

  it('does not mutate the original event (immutability check)', () => {
    const event = makeStoredEvent();
    const originalDate = event.profile.date;
    const originalTaskDates = event.tasks.map((t) => t.dueDate);

    previewRippleChange(event, {
      type: 'date-change',
      payload: { date: futureDate(300) },
    });

    // Original must not change
    expect(event.profile.date).toBe(originalDate);
    event.tasks.forEach((t, i) => {
      expect(t.dueDate).toBe(originalTaskDates[i]);
    });
  });
});

// ---------------------------------------------------------------------------
// applyRippleChange tests
// ---------------------------------------------------------------------------
describe('applyRippleChange', () => {
  it('returns a new object (immutability check)', () => {
    const event = makeStoredEvent();
    const result = applyRippleChange(event, {
      type: 'guest-count',
      payload: { confirmedGuestCount: 120 },
    });
    expect(result).not.toBe(event);
  });

  it('the result has an updated profile', () => {
    const event = makeStoredEvent();
    const result = applyRippleChange(event, {
      type: 'guest-count',
      payload: { confirmedGuestCount: 120 },
    });
    expect(result.profile.confirmedGuestCount).toBe(120);
  });

  it('the result has recalculated risks and readinessScore', () => {
    const event = makeStoredEvent();
    const result = applyRippleChange(event, {
      type: 'guest-count',
      payload: { confirmedGuestCount: 120 },
    });
    // Both should be present and correctly shaped
    expect(result.risks).toBeDefined();
    expect(Array.isArray(result.risks)).toBe(true);
    expect(result.readinessScore).toBeDefined();
    expect(typeof result.readinessScore.total).toBe('number');
  });

  it('budget sum stays valid after apply', () => {
    const event = makeStoredEvent();
    const result = applyRippleChange(event, {
      type: 'guest-count',
      payload: { confirmedGuestCount: 120 },
    });
    const sum = result.budget.allocations.reduce((s, a) => s + a.plannedAmount, 0);
    expect(sum).toBe(result.budget.totalBudget);
  });
});
