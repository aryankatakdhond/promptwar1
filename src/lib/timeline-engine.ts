import { v4 as uuidv4 } from 'uuid';
import {
  addDays,
  subDays,
  differenceInCalendarDays,
  isPast,
  isBefore,
  isAfter,
  parseISO,
  formatISO,
} from 'date-fns';
import type { EventProfile, EventType } from '@/types/event';
import type { PlanningTask, TaskCategory, TaskPriority, TimelinePhase, DependencyConflict } from '@/types/timeline';
import type { ShowBlock, ScheduleConflict } from '@/types/runofshow';

// ---------------------------------------------------------------------------
// Phase helper
// ---------------------------------------------------------------------------
function phaseFromDays(daysBeforeEvent: number): TimelinePhase {
  if (daysBeforeEvent <= 0) return 'day-of';
  if (daysBeforeEvent <= 3) return 'final';
  if (daysBeforeEvent <= 30) return 'late';
  if (daysBeforeEvent <= 90) return 'mid';
  if (daysBeforeEvent <= 180) return 'early';
  return 'immediate';
}

// ---------------------------------------------------------------------------
// Task template definitions
// ---------------------------------------------------------------------------
interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  daysBeforeEvent: number;
  estimatedDurationDays: number;
  dependencyTitles?: string[]; // resolved to IDs after generation
  relatedBudgetCategoryName?: string;
}

const WEDDING_TASKS: TaskTemplate[] = [
  { title: 'Book Venue', description: 'Research and secure event venue', category: 'venue', priority: 'critical', daysBeforeEvent: 270, estimatedDurationDays: 14 },
  { title: 'Research Caterers', description: 'Get quotes from at least 3 caterers', category: 'catering', priority: 'high', daysBeforeEvent: 240, estimatedDurationDays: 14 },
  { title: 'Book Photographer / Videographer', description: 'Hire photographer and/or videographer', category: 'photography', priority: 'high', daysBeforeEvent: 210, estimatedDurationDays: 14 },
  { title: 'Send Save-the-Dates', description: 'Send digital or physical save-the-dates to guests', category: 'invitations', priority: 'medium', daysBeforeEvent: 180, estimatedDurationDays: 3 },
  { title: 'Book Entertainment', description: 'Hire band, DJ, or other entertainment', category: 'entertainment', priority: 'medium', daysBeforeEvent: 150, estimatedDurationDays: 7 },
  { title: 'Order Attire', description: 'Order wedding attire and accessories', category: 'attire', priority: 'high', daysBeforeEvent: 150, estimatedDurationDays: 7 },
  { title: 'Finalize Guest List', description: 'Confirm all guest names and contact details', category: 'invitations', priority: 'high', daysBeforeEvent: 120, estimatedDurationDays: 7 },
  { title: 'Send Invitations', description: 'Mail formal invitations to all guests', category: 'invitations', priority: 'high', daysBeforeEvent: 90, estimatedDurationDays: 3 },
  { title: 'Book Decor Vendor', description: 'Confirm decor and floral arrangements', category: 'decor', priority: 'medium', daysBeforeEvent: 90, estimatedDurationDays: 7 },
  { title: 'Confirm Catering Menu', description: 'Finalize menu with caterer, confirm dietary needs', category: 'catering', priority: 'high', daysBeforeEvent: 60, estimatedDurationDays: 3 },
  { title: 'Final Headcount to Caterer', description: 'Provide confirmed guest count to caterer', category: 'catering', priority: 'critical', daysBeforeEvent: 14, estimatedDurationDays: 1 },
  { title: 'Final Vendor Confirmations', description: 'Call all vendors to confirm arrangements', category: 'other', priority: 'critical', daysBeforeEvent: 3, estimatedDurationDays: 1 },
  { title: 'Rehearsal', description: 'Run through ceremony and reception order', category: 'other', priority: 'high', daysBeforeEvent: 1, estimatedDurationDays: 1 },
];

const BIRTHDAY_TASKS: TaskTemplate[] = [
  { title: 'Book Venue', description: 'Reserve party venue', category: 'venue', priority: 'critical', daysBeforeEvent: 84, estimatedDurationDays: 7 },
  { title: 'Plan Guest List', description: 'Finalize names and contact details', category: 'invitations', priority: 'high', daysBeforeEvent: 70, estimatedDurationDays: 3 },
  { title: 'Send Invitations', description: 'Send digital or physical invitations', category: 'invitations', priority: 'high', daysBeforeEvent: 56, estimatedDurationDays: 2 },
  { title: 'Book Catering / Order Cake', description: 'Arrange food, beverages, and birthday cake', category: 'catering', priority: 'critical', daysBeforeEvent: 42, estimatedDurationDays: 3 },
  { title: 'Book Entertainment', description: 'Arrange activities or performers', category: 'entertainment', priority: 'high', daysBeforeEvent: 42, estimatedDurationDays: 3 },
  { title: 'Arrange Decor', description: 'Purchase or hire decorations', category: 'decor', priority: 'medium', daysBeforeEvent: 21, estimatedDurationDays: 3 },
  { title: 'Book Photography', description: 'Hire photographer if desired', category: 'photography', priority: 'medium', daysBeforeEvent: 21, estimatedDurationDays: 2 },
  { title: 'Confirm Catering', description: 'Confirm food quantities and dietary requirements', category: 'catering', priority: 'high', daysBeforeEvent: 7, estimatedDurationDays: 1 },
  { title: 'Final Vendor Check', description: 'Confirm all vendors are ready', category: 'other', priority: 'critical', daysBeforeEvent: 2, estimatedDurationDays: 1 },
];

const ANNIVERSARY_TASKS: TaskTemplate[] = [
  { title: 'Book Venue', description: 'Reserve restaurant or event space', category: 'venue', priority: 'critical', daysBeforeEvent: 112, estimatedDurationDays: 7 },
  { title: 'Book Photographer', description: 'Hire photographer for the occasion', category: 'photography', priority: 'high', daysBeforeEvent: 84, estimatedDurationDays: 7 },
  { title: 'Send Invitations', description: 'Invite family and close friends', category: 'invitations', priority: 'medium', daysBeforeEvent: 56, estimatedDurationDays: 2 },
  { title: 'Book Catering', description: 'Arrange special menu or catering', category: 'catering', priority: 'critical', daysBeforeEvent: 42, estimatedDurationDays: 3 },
  { title: 'Book Entertainment', description: 'Arrange live music or activities', category: 'entertainment', priority: 'medium', daysBeforeEvent: 42, estimatedDurationDays: 3 },
  { title: 'Arrange Decor', description: 'Coordinate flowers and decorations', category: 'decor', priority: 'medium', daysBeforeEvent: 28, estimatedDurationDays: 3 },
  { title: 'Confirm Guest Count', description: 'Collect RSVPs and confirm headcount', category: 'invitations', priority: 'high', daysBeforeEvent: 14, estimatedDurationDays: 1 },
  { title: 'Final Vendor Confirmations', description: 'Call all vendors to confirm', category: 'other', priority: 'critical', daysBeforeEvent: 3, estimatedDurationDays: 1 },
];

const COMMUNITY_TASKS: TaskTemplate[] = [
  { title: 'Book Venue', description: 'Reserve community space or hall', category: 'venue', priority: 'critical', daysBeforeEvent: 112, estimatedDurationDays: 7 },
  { title: 'Obtain Safety Permits', description: 'Apply for required permits and licenses', category: 'health-safety', priority: 'critical', daysBeforeEvent: 98, estimatedDurationDays: 14 },
  { title: 'Recruit Volunteers / Staffing', description: 'Hire or recruit event staff and volunteers', category: 'staffing', priority: 'high', daysBeforeEvent: 84, estimatedDurationDays: 14 },
  { title: 'Book Catering', description: 'Arrange food vendors or catering', category: 'catering', priority: 'critical', daysBeforeEvent: 70, estimatedDurationDays: 7 },
  { title: 'Book Entertainment', description: 'Hire performers or activity coordinators', category: 'entertainment', priority: 'medium', daysBeforeEvent: 70, estimatedDurationDays: 7 },
  { title: 'Send Invitations & Promote', description: 'Distribute invitations and promote the event', category: 'invitations', priority: 'medium', daysBeforeEvent: 56, estimatedDurationDays: 7 },
  { title: 'Arrange AV Setup', description: 'Book audio-visual equipment and technicians', category: 'other', priority: 'medium', daysBeforeEvent: 42, estimatedDurationDays: 7 },
  { title: 'Arrange Decor', description: 'Coordinate decorations and signage', category: 'decor', priority: 'low', daysBeforeEvent: 28, estimatedDurationDays: 3 },
  { title: 'Confirm Staff Assignments', description: 'Brief all staff on roles and responsibilities', category: 'staffing', priority: 'high', daysBeforeEvent: 7, estimatedDurationDays: 1 },
  { title: 'Final Safety Check', description: 'Confirm safety measures are in place', category: 'health-safety', priority: 'critical', daysBeforeEvent: 3, estimatedDurationDays: 1 },
  { title: 'Final Vendor Confirmations', description: 'Confirm all vendor arrangements', category: 'other', priority: 'critical', daysBeforeEvent: 2, estimatedDurationDays: 1 },
];

function selectTemplate(type: EventType): TaskTemplate[] {
  switch (type) {
    case 'wedding': return WEDDING_TASKS;
    case 'birthday': return BIRTHDAY_TASKS;
    case 'anniversary': return ANNIVERSARY_TASKS;
    case 'community': return COMMUNITY_TASKS;
    default: return WEDDING_TASKS;
  }
}

// ---------------------------------------------------------------------------
// generateTimeline
// ---------------------------------------------------------------------------
export function generateTimeline(event: EventProfile): PlanningTask[] {
  const eventDate = parseISO(event.date);
  const templates = selectTemplate(event.type);

  // First pass: assign IDs
  const idByTitle = new Map<string, string>();
  const tasks: PlanningTask[] = templates.map((tmpl) => {
    const id = uuidv4();
    idByTitle.set(tmpl.title, id);

    const dueDate = subDays(eventDate, tmpl.daysBeforeEvent);

    return {
      id,
      eventId: event.id,
      title: tmpl.title,
      description: tmpl.description,
      category: tmpl.category,
      priority: tmpl.priority,
      status: 'not-started',
      dueDate: formatISO(dueDate, { representation: 'date' }),
      estimatedDurationDays: tmpl.estimatedDurationDays,
      dependencies: [],
      isPinned: false,
      daysBeforeEvent: tmpl.daysBeforeEvent,
      phase: phaseFromDays(tmpl.daysBeforeEvent),
    } satisfies PlanningTask;
  });

  return tasks;
}

// ---------------------------------------------------------------------------
// recalculateDueDates
// ---------------------------------------------------------------------------
export function recalculateDueDates(tasks: PlanningTask[], newEventDate: string): PlanningTask[] {
  const eventDate = parseISO(newEventDate);
  return tasks.map((task) => {
    if (task.isPinned) return task;
    const newDueDate = subDays(eventDate, task.daysBeforeEvent);
    return {
      ...task,
      dueDate: formatISO(newDueDate, { representation: 'date' }),
    };
  });
}

// ---------------------------------------------------------------------------
// detectDependencyConflicts
// ---------------------------------------------------------------------------
export function detectDependencyConflicts(tasks: PlanningTask[]): DependencyConflict[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const conflicts: DependencyConflict[] = [];

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      const dep = taskMap.get(depId);
      if (!dep) continue;
      // If dependency is due AFTER the task that depends on it — conflict
      if (isAfter(parseISO(dep.dueDate), parseISO(task.dueDate))) {
        conflicts.push({
          taskId: task.id,
          taskTitle: task.title,
          conflictingTaskId: dep.id,
          conflictingTaskTitle: dep.title,
          reason: `"${task.title}" (due ${task.dueDate}) depends on "${dep.title}" (due ${dep.dueDate}), but the dependency is scheduled later.`,
        });
      }
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// getOverdueTasks
// ---------------------------------------------------------------------------
export function getOverdueTasks(tasks: PlanningTask[]): PlanningTask[] {
  return tasks.filter(
    (t) => t.status !== 'completed' && isPast(parseISO(t.dueDate)),
  );
}

// ---------------------------------------------------------------------------
// getDueSoonTasks
// ---------------------------------------------------------------------------
export function getDueSoonTasks(tasks: PlanningTask[], windowDays = 7): PlanningTask[] {
  const now = new Date();
  const cutoff = addDays(now, windowDays);

  return tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'skipped') return false;
    const due = parseISO(t.dueDate);
    return !isBefore(due, now) && isBefore(due, cutoff);
  });
}

// ---------------------------------------------------------------------------
// getNextAction
// ---------------------------------------------------------------------------
export function getNextAction(tasks: PlanningTask[]): PlanningTask | undefined {
  const candidates = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'skipped',
  );

  if (candidates.length === 0) return undefined;

  const priorityOrder: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  candidates.sort((a, b) => {
    const aOverdue = isPast(parseISO(a.dueDate)) ? 0 : 1;
    const bOverdue = isPast(parseISO(b.dueDate)) ? 0 : 1;

    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const prioA = priorityOrder[a.priority];
    const prioB = priorityOrder[b.priority];
    if (prioA !== prioB) return prioA - prioB;
    return differenceInCalendarDays(parseISO(a.dueDate), parseISO(b.dueDate));
  });

  return candidates[0];
}

// ---------------------------------------------------------------------------
// CompressWarning & compressSchedule
// ---------------------------------------------------------------------------
export interface CompressWarning {
  taskId: string;
  taskTitle: string;
  message: string;
}

export function compressSchedule(
  tasks: PlanningTask[],
  _eventDate: string,
): { warnings: CompressWarning[]; isRisky: boolean } {
  const warnings: CompressWarning[] = [];

  const criticalTasks = tasks.filter((t) => t.priority === 'critical');
  const overdueCount = criticalTasks.filter(
    (t) => t.status !== 'completed' && isPast(parseISO(t.dueDate)),
  ).length;

  if (criticalTasks.length > 0 && overdueCount / criticalTasks.length > 0.2) {
    for (const t of criticalTasks.filter(
      (t) => t.status !== 'completed' && isPast(parseISO(t.dueDate)),
    )) {
      warnings.push({
        taskId: t.id,
        taskTitle: t.title,
        message: `Critical task "${t.title}" is overdue (was due ${t.dueDate}). The schedule is compressed.`,
      });
    }
  }

  const isRisky = overdueCount / Math.max(criticalTasks.length, 1) > 0.2;

  return { warnings, isRisky };
}

// ---------------------------------------------------------------------------
// detectScheduleConflicts
// ---------------------------------------------------------------------------

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function detectScheduleConflicts(blocks: ShowBlock[]): ScheduleConflict[] {
  const sorted = [...blocks].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = timeToMins(current.endTime);
    const nextStart = timeToMins(next.startTime);

    if (nextStart < currentEnd) {
      conflicts.push({
        blockId: current.id,
        blockTitle: current.title,
        conflictingBlockId: next.id,
        conflictingBlockTitle: next.title,
        conflictType: 'overlap',
        details: `"${current.title}" ends at ${current.endTime} but "${next.title}" starts at ${next.startTime}`,
      });
    }
  }

  return conflicts;
}
