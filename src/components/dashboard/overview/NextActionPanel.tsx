'use client';

import { format, parseISO, isPast, differenceInCalendarDays } from 'date-fns';
import { useEvent } from '@/hooks/useEvent';
import { getNextAction } from '@/lib/timeline-engine';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS: Record<string, string> = {
  venue: '#C4613A',
  catering: '#C9A84C',
  decor: '#7A9E7E',
  photography: '#3B82F6',
  entertainment: '#8B5CF6',
  transport: '#6B7280',
  invitations: '#EC4899',
  attire: '#F59E0B',
  staffing: '#10B981',
  legal: '#EF4444',
  'health-safety': '#EF4444',
  other: '#8A90A4',
};

export function NextActionPanel() {
  const { activeEvent } = useEvent();
  const { dispatch } = useAppContext();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-28 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const nextAction = getNextAction(activeEvent.tasks);

  if (!nextAction) {
    return (
      <div
        className="bg-white rounded-xl border p-6 flex items-center justify-center"
        style={{ borderColor: '#E8E9EE', minHeight: '100px' }}
      >
        <p className="text-base font-medium" style={{ color: '#7A9E7E' }}>
          🎉 All caught up! No urgent tasks right now.
        </p>
      </div>
    );
  }

  const dueDate = parseISO(nextAction.dueDate);
  const isOverdue = isPast(dueDate);
  const daysUntil = differenceInCalendarDays(dueDate, new Date());

  let urgencyColor: string;
  let dueDateLabel: string;
  if (isOverdue) {
    urgencyColor = '#C4613A';
    dueDateLabel = `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
  } else if (daysUntil <= 7) {
    urgencyColor = '#C9A84C';
    dueDateLabel = `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} · ${format(dueDate, 'dd MMM')}`;
  } else {
    urgencyColor = '#5A6178';
    dueDateLabel = `Due ${format(dueDate, 'dd MMM yyyy')}`;
  }

  const categoryColor = CATEGORY_COLORS[nextAction.category] ?? '#8A90A4';

  function handleMarkComplete() {
    if (!activeEvent) return;
    dispatch({
      type: 'UPDATE_TASK',
      eventId: activeEvent.profile.id,
      task: {
        ...nextAction!,
        status: 'completed',
        completedDate: new Date().toISOString(),
      },
    });
  }

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: '#E8E9EE' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#E8E9EE' }}>
        <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Do This Next</h3>
      </div>

      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-l-4"
        style={{ borderLeftColor: '#C4613A' }}
      >
        <div className="flex flex-col gap-2">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
              style={{ background: `${categoryColor}20`, color: categoryColor }}
            >
              {nextAction.category}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
              style={{ background: '#F0F1F4', color: '#5A6178' }}
            >
              {nextAction.priority}
            </span>
          </div>

          {/* Task title */}
          <p className="font-semibold text-base" style={{ color: '#1A1F2E' }}>
            {nextAction.title}
          </p>

          {nextAction.description && (
            <p className="text-sm" style={{ color: '#5A6178' }}>
              {nextAction.description}
            </p>
          )}

          {/* Due date */}
          <p className="text-sm font-medium" style={{ color: urgencyColor }}>
            {dueDateLabel}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleMarkComplete}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#C4613A', color: '#FDFAF4' }}
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
