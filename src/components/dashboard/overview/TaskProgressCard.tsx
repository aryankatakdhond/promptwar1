'use client';

import { format, parseISO, isPast } from 'date-fns';
import { useEvent } from '@/hooks/useEvent';
import { getNextAction, getOverdueTasks } from '@/lib/timeline-engine';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskProgressCard() {
  const { activeEvent } = useEvent();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const tasks = activeEvent.tasks;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const overdue = getOverdueTasks(tasks).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const nextAction = getNextAction(tasks);

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: '#E8E9EE' }}>
      <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Planning Progress</h3>

      {/* Big number */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold" style={{ color: '#1A1F2E' }}>
          {completed}
        </span>
        <span className="text-sm pb-1" style={{ color: '#5A6178' }}>
          of {total} tasks
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: '#5A6178' }}>
          <span>Completion</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: '#F0F1F4' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%`, background: '#C4613A' }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg py-2 px-1" style={{ background: '#EFF5F0' }}>
          <div className="font-bold text-base" style={{ color: '#7A9E7E' }}>{completed}</div>
          <div style={{ color: '#638268' }}>✓ Done</div>
        </div>
        <div className="rounded-lg py-2 px-1" style={{ background: '#FBF6E8' }}>
          <div className="font-bold text-base" style={{ color: '#C9A84C' }}>{inProgress}</div>
          <div style={{ color: '#A88A3E' }}>◑ Active</div>
        </div>
        <div className="rounded-lg py-2 px-1" style={{ background: '#FAF0EB' }}>
          <div className="font-bold text-base" style={{ color: '#C4613A' }}>{overdue}</div>
          <div style={{ color: '#A8522F' }}>⚠ Overdue</div>
        </div>
      </div>

      {/* Next deadline */}
      {nextAction && (
        <div
          className="text-xs rounded-lg px-3 py-2"
          style={{ background: '#F0F1F4' }}
        >
          <span style={{ color: '#5A6178' }}>Next: </span>
          <span className="font-medium" style={{ color: '#1A1F2E' }}>{nextAction.title}</span>
          <span style={{ color: '#5A6178' }}>
            {' '}· due {format(parseISO(nextAction.dueDate), 'dd MMM')}
            {isPast(parseISO(nextAction.dueDate)) ? (
              <span style={{ color: '#C4613A' }}> (overdue)</span>
            ) : null}
          </span>
        </div>
      )}
    </div>
  );
}
