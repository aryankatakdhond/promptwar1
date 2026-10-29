'use client';

import { useState } from 'react';
import {
  format,
  parseISO,
  isPast,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PlanningTask } from '@/types/timeline';

interface Props {
  tasks: PlanningTask[];
  onViewDetails: (task: PlanningTask) => void;
}

function taskChipStyle(task: PlanningTask): { bg: string; text: string } {
  if (task.status === 'completed') return { bg: '#E5E7EB', text: '#9CA3AF' };
  if (isPast(parseISO(task.dueDate))) return { bg: '#FEE2E2', text: '#991B1B' };
  if (task.priority === 'critical') return { bg: '#F2D5C8', text: '#8C4326' };
  if (task.priority === 'high') return { bg: '#FEF3C7', text: '#92400E' };
  return { bg: '#FDFAF4', text: '#1A1F2E' };
}

export function CalendarView({ tasks, onViewDetails }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [popoverDay, setPopoverDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function tasksForDay(day: Date): PlanningTask[] {
    return tasks.filter((t) => isSameDay(parseISO(t.dueDate), day));
  }

  const popoverTasks = popoverDay ? tasksForDay(popoverDay) : [];

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded hover:bg-midnight-50 transition-colors"
        >
          <ChevronLeft size={16} style={{ color: '#5A6178' }} />
        </button>
        <h3 className="text-base font-semibold" style={{ color: '#1A1F2E' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded hover:bg-midnight-50 transition-colors"
        >
          <ChevronRight size={16} style={{ color: '#5A6178' }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold py-1.5"
            style={{ color: '#5A6178' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7 gap-px rounded-brand overflow-hidden border"
        style={{ borderColor: '#D0D3DC', background: '#D0D3DC' }}
      >
        {days.map((day) => {
          const dayTasks = tasksForDay(day);
          const visible = dayTasks.slice(0, 3);
          const overflow = dayTasks.length - visible.length;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDay = isToday(day);
          const hasPopover = popoverDay ? isSameDay(popoverDay, day) : false;

          return (
            <div
              key={day.toISOString()}
              className="min-h-[88px] p-1.5 flex flex-col gap-1 cursor-pointer transition-colors"
              style={{
                background: isCurrentMonth ? '#FDFAF4' : '#F7F8FA',
                outline: hasPopover ? '2px solid #C4613A' : undefined,
              }}
              onClick={() => dayTasks.length > 0 && setPopoverDay(isSameDay(popoverDay ?? new Date(0), day) ? null : day)}
            >
              {/* Day number */}
              <span
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isTodayDay ? 'font-bold' : ''}`}
                style={{
                  color: !isCurrentMonth ? '#9CA3AF' : isTodayDay ? '#FDFAF4' : '#1A1F2E',
                  background: isTodayDay ? '#C4613A' : 'transparent',
                }}
              >
                {format(day, 'd')}
              </span>

              {/* Task chips */}
              {visible.map((task) => {
                const cs = taskChipStyle(task);
                return (
                  <div
                    key={task.id}
                    className={`text-[10px] px-1 py-0.5 rounded truncate border ${task.status === 'completed' ? 'line-through' : ''}`}
                    style={{ background: cs.bg, color: cs.text, borderColor: cs.bg }}
                    title={task.title}
                    onClick={(e) => { e.stopPropagation(); onViewDetails(task); }}
                  >
                    {task.title}
                  </div>
                );
              })}

              {overflow > 0 && (
                <span className="text-[10px] font-medium" style={{ color: '#5A6178' }}>
                  +{overflow} more
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day popover */}
      {popoverDay && popoverTasks.length > 0 && (
        <div
          className="rounded-brand border shadow-sm p-3 flex flex-col gap-2"
          style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
              {format(popoverDay, 'MMMM d, yyyy')} — {popoverTasks.length} task{popoverTasks.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => setPopoverDay(null)}>
              <X size={14} style={{ color: '#5A6178' }} />
            </button>
          </div>
          {popoverTasks.map((task) => {
            const cs = taskChipStyle(task);
            return (
              <button
                key={task.id}
                className="flex items-center gap-2 text-left"
                onClick={() => { setPopoverDay(null); onViewDetails(task); }}
              >
                <span
                  className={`flex-1 text-xs px-2 py-1 rounded border ${task.status === 'completed' ? 'line-through' : ''}`}
                  style={{ background: cs.bg, color: cs.text, borderColor: cs.bg }}
                >
                  {task.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
