export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'overdue'
  | 'blocked'
  | 'skipped';

export type TaskCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'entertainment'
  | 'transport'
  | 'invitations'
  | 'attire'
  | 'staffing'
  | 'legal'
  | 'health-safety'
  | 'other';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TimelinePhase =
  | 'immediate'
  | 'early'
  | 'mid'
  | 'late'
  | 'final'
  | 'day-of';

export interface PlanningTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date
  completedDate?: string;
  estimatedDurationDays: number;
  dependencies: string[]; // task IDs
  assignedTo?: string;
  notes?: string;
  isPinned: boolean; // if true, date doesn't shift during event date change
  daysBeforeEvent: number; // for recalculation when event date changes
  phase: TimelinePhase;
  relatedVendorId?: string;
  relatedBudgetCategoryId?: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface DependencyConflict {
  taskId: string;
  taskTitle: string;
  conflictingTaskId: string;
  conflictingTaskTitle: string;
  reason: string;
}
