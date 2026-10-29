'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { PlanningTask, TaskStatus, TimelinePhase } from '@/types/timeline';
import { PHASE_LABELS, PHASE_ORDER } from './timeline-utils';
import { TaskRow } from './TaskRow';

interface Props {
  tasks: PlanningTask[];
  allTasks: PlanningTask[];
  onEdit: (task: PlanningTask) => void;
  onViewDetails: (task: PlanningTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (task: PlanningTask, status: TaskStatus) => void;
  onRowClick: (task: PlanningTask) => void;
}

export function TaskListView({ tasks, allTasks, onEdit, onViewDetails, onDelete, onStatusChange, onRowClick }: Props) {
  const [collapsed, setCollapsed] = useState<Set<TimelinePhase>>(new Set());

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-40 rounded-brand border"
        style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
      >
        <p className="text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  // Group by phase in order
  const grouped = new Map<TimelinePhase, PlanningTask[]>();
  for (const phase of PHASE_ORDER) grouped.set(phase, []);
  for (const task of tasks) {
    const ph = task.phase as TimelinePhase;
    const arr = grouped.get(ph);
    if (arr) arr.push(task);
  }

  function toggleCollapse(phase: TimelinePhase) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {PHASE_ORDER.map((phase) => {
        const phaseTasks = grouped.get(phase) ?? [];
        if (phaseTasks.length === 0) return null;

        const completedCount = phaseTasks.filter((t) => t.status === 'completed').length;
        const isCollapsed = collapsed.has(phase);

        return (
          <div key={phase} className="flex flex-col gap-1">
            {/* Phase header */}
            <button
              onClick={() => toggleCollapse(phase)}
              className="flex items-center gap-2 py-1 text-left w-full group"
            >
              {isCollapsed
                ? <ChevronRight size={14} style={{ color: '#5A6178' }} />
                : <ChevronDown size={14} style={{ color: '#5A6178' }} />
              }
              <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
                {PHASE_LABELS[phase]}
              </span>
              <span className="text-xs" style={{ color: '#5A6178' }}>
                {completedCount}/{phaseTasks.length} completed
              </span>
              {/* Progress bar */}
              <div
                className="flex-1 h-1 rounded-full overflow-hidden max-w-[80px]"
                style={{ background: '#D0D3DC' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${phaseTasks.length > 0 ? (completedCount / phaseTasks.length) * 100 : 0}%`,
                    background: '#638268',
                  }}
                />
              </div>
            </button>

            {/* Task rows */}
            {!isCollapsed && (
              <div className="flex flex-col gap-1.5 pl-4">
                {phaseTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    allTasks={allTasks}
                    onEdit={onEdit}
                    onViewDetails={onViewDetails}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onClick={onRowClick}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
