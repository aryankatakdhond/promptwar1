'use client';

import { parseISO, isPast, differenceInCalendarDays, format } from 'date-fns';
import { GitBranch, MoreVertical, Check, User } from 'lucide-react';
import { useState } from 'react';
import type { PlanningTask, TaskStatus } from '@/types/timeline';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PHASE_LABELS,
  statusStyle,
} from './timeline-utils';

interface Props {
  task: PlanningTask;
  allTasks: PlanningTask[];
  onEdit: (task: PlanningTask) => void;
  onViewDetails: (task: PlanningTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: PlanningTask, status: TaskStatus) => void;
  onClick: (task: PlanningTask) => void;
}

export function TaskRow({ task, allTasks, onEdit, onViewDetails, onDelete, onStatusChange, onClick }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const due = parseISO(task.dueDate);
  const today = new Date();
  const diffDays = differenceInCalendarDays(due, today);
  const isOverdue = task.status !== 'completed' && isPast(due) && diffDays < 0;

  let dueBg: string;
  let dueText: string;
  let dueLabel: string;
  if (isOverdue) {
    dueBg = '#FEE2E2'; dueText = '#991B1B';
    dueLabel = `Overdue ${Math.abs(diffDays)}d`;
  } else if (diffDays <= 7 && task.status !== 'completed') {
    dueBg = '#FEF3C7'; dueText = '#92400E';
    dueLabel = format(due, 'MMM d');
  } else {
    dueBg = '#F0F1F4'; dueText = '#5A6178';
    dueLabel = format(due, 'MMM d');
  }

  const ss = statusStyle(task.status);
  const priorityStyle = PRIORITY_COLORS[task.priority];
  const CategoryIcon = CATEGORY_ICONS[task.category];
  const isCompleted = task.status === 'completed';

  const depTasks = task.dependencies
    .map((id) => allTasks.find((t) => t.id === id))
    .filter(Boolean) as PlanningTask[];

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const next: TaskStatus = isCompleted ? 'not-started' : 'completed';
    onStatusChange(task, next);
  }

  function handleMenuAction(e: React.MouseEvent, action: () => void) {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-brand border cursor-pointer hover:bg-ivory-50 transition-colors relative"
      style={{ borderColor: ss.border, background: ss.bg }}
      onClick={() => onClick(task)}
    >
      {/* Status toggle */}
      <button
        onClick={handleToggle}
        className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: isCompleted ? '#638268' : ss.border,
          background: isCompleted ? '#638268' : 'transparent',
        }}
        title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {isCompleted && <Check size={11} style={{ color: '#FDFAF4' }} />}
      </button>

      {/* Priority dot */}
      <div
        className="shrink-0 w-2 h-2 rounded-full"
        style={{ background: priorityStyle.text }}
        title={PRIORITY_LABELS[task.priority]}
      />

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium min-w-0 truncate ${isCompleted ? 'line-through' : ''}`}
        style={{ color: isCompleted ? '#9CA3AF' : '#1A1F2E' }}
      >
        {task.title}
      </span>

      {/* Category badge */}
      <span
        className="hidden sm:flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border shrink-0"
        style={{ background: '#F0F1F4', borderColor: '#D0D3DC', color: '#5A6178' }}
      >
        {CategoryIcon && <CategoryIcon size={11} />}
        {CATEGORY_LABELS[task.category]}
      </span>

      {/* Phase label */}
      <span
        className="hidden md:inline text-xs rounded-full px-2 py-0.5 shrink-0"
        style={{ background: '#F0F1F4', color: '#5A6178' }}
      >
        {PHASE_LABELS[task.phase]}
      </span>

      {/* Due date chip */}
      <span
        className="text-xs font-medium rounded-full px-2 py-0.5 shrink-0"
        style={{ background: dueBg, color: dueText }}
      >
        {dueLabel}
      </span>

      {/* Dependencies indicator */}
      {depTasks.length > 0 && (
        <span
          className="hidden sm:flex items-center gap-1 text-xs shrink-0"
          style={{ color: '#5A6178' }}
          title={depTasks.map((d) => d.title).join(', ')}
        >
          <GitBranch size={12} />
          {depTasks.length}
        </span>
      )}

      {/* Assignee chip */}
      {task.assignedTo && (
        <span
          className="hidden md:flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border shrink-0"
          style={{ background: '#EFF5F0', borderColor: '#ABCDB0', color: '#4D6651' }}
        >
          <User size={11} />
          {task.assignedTo}
        </span>
      )}

      {/* Actions menu */}
      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          className="p-1 rounded hover:bg-midnight-50 transition-colors"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          title="Actions"
        >
          <MoreVertical size={14} style={{ color: '#5A6178' }} />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="absolute right-0 top-7 z-20 rounded-brand border shadow-sm min-w-[140px] py-1"
              style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
            >
              <button
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-midnight-50"
                onClick={(e) => handleMenuAction(e, () => onViewDetails(task))}
              >
                View Details
              </button>
              <button
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-midnight-50"
                onClick={(e) => handleMenuAction(e, () => onEdit(task))}
              >
                Edit
              </button>
              <button
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-midnight-50"
                onClick={(e) => handleMenuAction(e, () => onStatusChange(task, isCompleted ? 'not-started' : 'completed'))}
              >
                {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
              <div className="border-t my-1" style={{ borderColor: '#E5E7EB' }} />
              <button
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-red-50"
                style={{ color: '#991B1B' }}
                onClick={(e) => handleMenuAction(e, () => onDelete(task.id))}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
