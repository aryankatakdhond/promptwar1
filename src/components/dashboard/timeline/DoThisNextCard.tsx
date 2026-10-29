'use client';

import { parseISO, isPast, differenceInCalendarDays } from 'date-fns';
import type { PlanningTask } from '@/types/timeline';
import { CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_LABELS, PRIORITY_COLORS } from './timeline-utils';

interface Props {
  task: PlanningTask | undefined;
  onMarkComplete: (task: PlanningTask) => void;
  onViewDetails: (task: PlanningTask) => void;
}

export function DoThisNextCard({ task, onMarkComplete, onViewDetails }: Props) {
  if (!task) {
    return (
      <div
        className="rounded-brand border px-4 py-3 flex items-center gap-2"
        style={{ borderColor: '#D5E6D7', background: '#EFF5F0' }}
      >
        <span className="text-sage-600 font-medium text-sm">✓ You&apos;re all caught up! No urgent tasks pending.</span>
      </div>
    );
  }

  const due = parseISO(task.dueDate);
  const today = new Date();
  const diffDays = differenceInCalendarDays(due, today);
  const isOverdue = isPast(due) && diffDays < 0;
  const isDueToday = diffDays === 0;

  let dueBadge: { text: string; color: string; bg: string };
  if (isOverdue) {
    const absDays = Math.abs(diffDays);
    dueBadge = {
      text: `OVERDUE by ${absDays} day${absDays !== 1 ? 's' : ''}`,
      color: '#991B1B',
      bg: '#FEE2E2',
    };
  } else if (isDueToday) {
    dueBadge = { text: 'Due today', color: '#92400E', bg: '#FEF3C7' };
  } else {
    dueBadge = {
      text: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      color: '#1A1F2E',
      bg: '#F0F1F4',
    };
  }

  const CategoryIcon = CATEGORY_ICONS[task.category];
  const priorityStyle = PRIORITY_COLORS[task.priority];

  return (
    <div
      className="rounded-brand border-l-4 border border-l-terracotta px-4 py-3 flex flex-col gap-2"
      style={{ borderColor: '#E5E7EB', borderLeftColor: '#C4613A', background: '#FDFAF4' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#5A6178' }}
        >
          Do This Next
        </span>
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5"
          style={{ color: dueBadge.color, background: dueBadge.bg }}
        >
          {dueBadge.text}
        </span>
      </div>

      <div className="text-base font-bold" style={{ color: '#1A1F2E' }}>{task.title}</div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Category badge */}
        <span
          className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border"
          style={{ background: '#F0F1F4', borderColor: '#D0D3DC', color: '#5A6178' }}
        >
          {CategoryIcon && <CategoryIcon size={11} />}
          {CATEGORY_LABELS[task.category]}
        </span>
        {/* Priority badge */}
        <span
          className="text-xs rounded-full px-2 py-0.5 font-medium"
          style={{ background: priorityStyle.bg, color: priorityStyle.text }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onMarkComplete(task)}
          className="text-xs font-medium rounded-brand px-3 py-1.5 transition-colors"
          style={{ background: '#C4613A', color: '#FDFAF4' }}
        >
          Mark Complete
        </button>
        <button
          onClick={() => onViewDetails(task)}
          className="text-xs font-medium underline"
          style={{ color: '#C4613A' }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
