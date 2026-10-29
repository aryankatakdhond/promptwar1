import { describe, it, expect } from 'vitest';
import { addDays, subDays, formatISO, parseISO, isBefore } from 'date-fns';
import {
  generateTimeline,
  recalculateDueDates,
  detectDependencyConflicts,
  getOverdueTasks,
  getNextAction,
  compressSchedule,
} from '@/lib/timeline-engine';
import type { EventProfile } from '@/types/event';
import type { PlanningTask } from '@/types/timeline';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function futureDate(daysFromNow: number): string {
  return formatISO(addDays(new Date(), daysFromNow), { representation: 'date' });
}

function pastDate(daysAgo: number): string {
  return formatISO(subDays(new Date(), daysAgo), { representation: 'date' });
}

function makeEventProfile(overrides: Partial<EventProfile> = {}): EventProfile {
  return {
    id: 'test-event-1',
    name: 'Test Wedding',
    type: 'wedding',
    status: 'planning',
    date: futureDate(300),
    time: '18:00',
    city: 'Mumbai',
    guestCount: 100,
    confirmedGuestCount: 80,
    venueCapacity: 150,
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('generateTimeline', () => {
  it('produces tasks with due dates before event date', () => {
    const event = makeEventProfile();
    const tasks = generateTimeline(event);

    expect(tasks.length).toBeGreaterThan(0);

    for (const task of tasks) {
      if (task.daysBeforeEvent > 0) {
        const due = parseISO(task.dueDate);
        const eventDate = parseISO(event.date);
        expect(isBefore(due, eventDate)).toBe(true);
      }
    }
  });

  it('all tasks have non-empty IDs and titles', () => {
    const event = makeEventProfile();
    const tasks = generateTimeline(event);
    for (const task of tasks) {
      expect(task.id).toBeTruthy();
      expect(task.title).toBeTruthy();
    }
  });

  it('all task IDs are unique', () => {
    const event = makeEventProfile();
    const tasks = generateTimeline(event);
    const ids = tasks.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('produces tasks for birthday event type', () => {
    const event = makeEventProfile({ type: 'birthday', date: futureDate(120) });
    const tasks = generateTimeline(event);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('generates critical tasks for wedding', () => {
    const event = makeEventProfile();
    const tasks = generateTimeline(event);
    const criticalTasks = tasks.filter((t) => t.priority === 'critical');
    expect(criticalTasks.length).toBeGreaterThan(0);
  });
});

describe('recalculateDueDates', () => {
  it('shifts all non-pinned tasks correctly when event moves 14 days later', () => {
    const originalDate = futureDate(200);
    const newDate = futureDate(214); // 14 days later

    const event = makeEventProfile({ date: originalDate });
    const tasks = generateTimeline(event);

    const rescheduled = recalculateDueDates(tasks, newDate);

    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].isPinned) {
        const originalDue = parseISO(tasks[i].dueDate);
        const newDue = parseISO(rescheduled[i].dueDate);
        // new due date should be 14 days later than original
        const diff = Math.round(
          (newDue.getTime() - originalDue.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(diff).toBe(14);
      }
    }
  });

  it('pinned tasks are not shifted', () => {
    const newDate = futureDate(214);

    const pinnedDue = futureDate(150);
    const tasks: PlanningTask[] = [
      makeTask({ id: 'pinned', isPinned: true, dueDate: pinnedDue, daysBeforeEvent: 50 }),
      makeTask({ id: 'unpinned', isPinned: false, dueDate: futureDate(100), daysBeforeEvent: 100 }),
    ];

    const rescheduled = recalculateDueDates(tasks, newDate);
    const pinnedTask = rescheduled.find((t) => t.id === 'pinned')!;
    expect(pinnedTask.dueDate).toBe(pinnedDue);
  });

  it('returns a new array (immutability check)', () => {
    const tasks: PlanningTask[] = [
      makeTask({ id: 't1', isPinned: false, daysBeforeEvent: 30 }),
    ];
    const result = recalculateDueDates(tasks, futureDate(100));
    expect(result).not.toBe(tasks);
  });
});

describe('detectDependencyConflicts', () => {
  it('finds a conflict when task A depends on task B but A is due before B', () => {
    const taskA: PlanningTask = makeTask({
      id: 'task-a',
      title: 'Task A',
      dueDate: futureDate(10),
      dependencies: ['task-b'],
    });
    const taskB: PlanningTask = makeTask({
      id: 'task-b',
      title: 'Task B',
      dueDate: futureDate(20), // B is due AFTER A — conflict
      dependencies: [],
    });

    const conflicts = detectDependencyConflicts([taskA, taskB]);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].taskId).toBe('task-a');
    expect(conflicts[0].conflictingTaskId).toBe('task-b');
  });

  it('returns no conflicts when dependency order is correct', () => {
    const taskA: PlanningTask = makeTask({
      id: 'task-a',
      dueDate: futureDate(20), // A is after B
      dependencies: ['task-b'],
    });
    const taskB: PlanningTask = makeTask({
      id: 'task-b',
      dueDate: futureDate(10), // B is earlier — correct
      dependencies: [],
    });

    const conflicts = detectDependencyConflicts([taskA, taskB]);
    expect(conflicts).toHaveLength(0);
  });

  it('returns empty array when tasks have no dependencies', () => {
    const tasks = [
      makeTask({ id: 't1', dependencies: [] }),
      makeTask({ id: 't2', dependencies: [] }),
    ];
    expect(detectDependencyConflicts(tasks)).toHaveLength(0);
  });
});

describe('getOverdueTasks', () => {
  it('returns tasks past their due date with status not-completed', () => {
    const overdue = makeTask({ id: 'overdue', dueDate: pastDate(5), status: 'not-started' });
    const completed = makeTask({ id: 'done', dueDate: pastDate(3), status: 'completed' });
    const future = makeTask({ id: 'future', dueDate: futureDate(5), status: 'not-started' });

    const result = getOverdueTasks([overdue, completed, future]);
    expect(result.map((t) => t.id)).toContain('overdue');
    expect(result.map((t) => t.id)).not.toContain('done');
    expect(result.map((t) => t.id)).not.toContain('future');
  });

  it('returns empty array when all tasks are completed', () => {
    const tasks = [
      makeTask({ dueDate: pastDate(5), status: 'completed' }),
      makeTask({ dueDate: pastDate(2), status: 'completed' }),
    ];
    expect(getOverdueTasks(tasks)).toHaveLength(0);
  });
});

describe('getNextAction', () => {
  it('returns the highest-priority overdue/upcoming task', () => {
    const overdueCritical = makeTask({
      id: 'overdue-critical',
      dueDate: pastDate(3),
      priority: 'critical',
      status: 'not-started',
    });
    const futureHigh = makeTask({
      id: 'future-high',
      dueDate: futureDate(5),
      priority: 'high',
      status: 'not-started',
    });
    const futureMedium = makeTask({
      id: 'future-medium',
      dueDate: futureDate(2),
      priority: 'medium',
      status: 'not-started',
    });

    const next = getNextAction([futureHigh, futureMedium, overdueCritical]);
    expect(next?.id).toBe('overdue-critical');
  });

  it('returns undefined when all tasks are completed or skipped', () => {
    const tasks = [
      makeTask({ status: 'completed' }),
      makeTask({ status: 'skipped' }),
    ];
    expect(getNextAction(tasks)).toBeUndefined();
  });

  it('prefers earlier due date when priorities are equal', () => {
    const earlier = makeTask({ id: 'earlier', dueDate: futureDate(3), priority: 'high', status: 'not-started' });
    const later = makeTask({ id: 'later', dueDate: futureDate(10), priority: 'high', status: 'not-started' });
    const next = getNextAction([later, earlier]);
    expect(next?.id).toBe('earlier');
  });
});

describe('compressSchedule', () => {
  it('flags risk when more than 20% of critical tasks are overdue', () => {
    const tasks: PlanningTask[] = [
      makeTask({ id: 'c1', priority: 'critical', dueDate: pastDate(5), status: 'not-started' }),
      makeTask({ id: 'c2', priority: 'critical', dueDate: pastDate(3), status: 'not-started' }),
      makeTask({ id: 'c3', priority: 'critical', dueDate: futureDate(5), status: 'not-started' }),
      makeTask({ id: 'c4', priority: 'critical', dueDate: futureDate(8), status: 'not-started' }),
    ];

    const { isRisky, warnings } = compressSchedule(tasks, futureDate(30));
    expect(isRisky).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('does not flag risk when all critical tasks are on time', () => {
    const tasks: PlanningTask[] = [
      makeTask({ id: 'c1', priority: 'critical', dueDate: futureDate(5), status: 'not-started' }),
      makeTask({ id: 'c2', priority: 'critical', dueDate: futureDate(10), status: 'not-started' }),
    ];

    const { isRisky } = compressSchedule(tasks, futureDate(30));
    expect(isRisky).toBe(false);
  });
});
