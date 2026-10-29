'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  List,
  CalendarDays,
  Plus,
  Search,
} from 'lucide-react';
import { isPast, parseISO } from 'date-fns';
import { useEvent } from '@/hooks/useEvent';
import {
  getNextAction,
  detectDependencyConflicts,
  compressSchedule,
} from '@/lib/timeline-engine';
import type { PlanningTask, TaskStatus, TaskCategory, TaskPriority } from '@/types/timeline';
import { CATEGORY_LABELS, PRIORITY_LABELS, TASK_CATEGORIES, TASK_PRIORITIES } from './timeline-utils';
import { DoThisNextCard } from './DoThisNextCard';
import { DependencyConflictBanner } from './DependencyConflictBanner';
import { CompressScheduleWarning } from './CompressScheduleWarning';
import { TaskListView } from './TaskListView';
import { CalendarView } from './CalendarView';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { AddEditTaskDialog } from './AddEditTaskDialog';

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed' | 'overdue';

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

export function TimelineTab() {
  const { activeEvent, dispatch } = useEvent();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('list');
  const [drawerTask, setDrawerTask] = useState<PlanningTask | null>(null);
  const [editDialogTask, setEditDialogTask] = useState<PlanningTask | null | undefined>(undefined); // undefined = closed, null = new
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Status filter from URL param
  const urlFilter = searchParams.get('filter') as StatusFilter | null;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    urlFilter && urlFilter in STATUS_FILTER_LABELS ? urlFilter : 'all',
  );

  // Sync status filter to URL
  function changeStatusFilter(f: StatusFilter) {
    setStatusFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f === 'all') params.delete('filter');
    else params.set('filter', f);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Derive data safely (hooks must all be above the early return)
  const activeTasks = activeEvent?.tasks;
  const tasks = useMemo(() => activeTasks ?? [], [activeTasks]);
  const eventId = activeEvent?.profile.id ?? '';
  const eventDate = activeEvent?.profile.date ?? '';

  // ── Engine computations (safe on empty arrays) ────────────────────────────
  const nextAction = getNextAction(tasks);
  const conflicts = detectDependencyConflicts(tasks);
  const { warnings: compressWarnings, isRisky } = compressSchedule(tasks, eventDate);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          if (t.status === 'completed' || t.status === 'skipped') return false;
          if (!isPast(parseISO(t.dueDate))) return false;
        } else {
          if (t.status !== statusFilter) return false;
        }
      }
      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, priorityFilter, search]);

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm" style={{ color: '#5A6178' }}>No active event selected.</p>
      </div>
    );
  }

  // ── Mutations ────────────────────────────────────────────────────────────────
  function dispatchTaskUpdate(task: PlanningTask) {
    dispatch({ type: 'UPDATE_TASK', eventId, task });
  }

  function handleStatusChange(task: PlanningTask, status: TaskStatus) {
    const updated: PlanningTask = {
      ...task,
      status,
      completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
    };
    dispatchTaskUpdate(updated);
  }

  function handleMarkNextComplete(task: PlanningTask) {
    handleStatusChange(task, 'completed');
  }

  function handleSaveTask(task: PlanningTask) {
    if (tasks.find((t) => t.id === task.id)) {
      // Existing task — update
      dispatchTaskUpdate(task);
    } else {
      // New task — add
      dispatch({ type: 'UPDATE_TASKS', eventId, tasks: [...tasks, task] });
    }
    setDrawerTask(null);
  }

  function handleAddTask(task: PlanningTask) {
    dispatch({ type: 'UPDATE_TASKS', eventId, tasks: [...tasks, task] });
  }

  function handleDeleteTask(taskId: string) {
    dispatch({
      type: 'UPDATE_TASKS',
      eventId,
      tasks: tasks.filter((t) => t.id !== taskId),
    });
    if (drawerTask?.id === taskId) setDrawerTask(null);
  }

  function handleViewTaskInConflict(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    if (t) setDrawerTask(t);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Top row: view toggle + add + search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div
            className="flex items-center rounded-brand border overflow-hidden"
            style={{ borderColor: '#D0D3DC' }}
          >
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === 'list' ? '#C4613A' : '#FDFAF4',
                color: view === 'list' ? '#FDFAF4' : '#5A6178',
              }}
              onClick={() => setView('list')}
            >
              <List size={13} /> List
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === 'calendar' ? '#C4613A' : '#FDFAF4',
                color: view === 'calendar' ? '#FDFAF4' : '#5A6178',
              }}
              onClick={() => setView('calendar')}
            >
              <CalendarDays size={13} /> Calendar
            </button>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-brand border px-3 py-1.5"
            style={{ borderColor: '#D0D3DC', background: '#FDFAF4' }}
          >
            <Search size={13} style={{ color: '#5A6178' }} />
            <input
              className="text-xs outline-none bg-transparent w-36"
              style={{ color: '#1A1F2E' }}
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Add task button */}
          <button
            className="flex items-center gap-1.5 rounded-brand px-3 py-1.5 text-xs font-medium"
            style={{ background: '#C4613A', color: '#FDFAF4' }}
            onClick={() => setEditDialogTask(null)}
          >
            <Plus size={13} /> Add Task
          </button>
        </div>

        {/* Second row: status chips + category + priority */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter chips */}
          {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((f) => (
            <button
              key={f}
              className="rounded-full px-3 py-1 text-xs font-medium border transition-colors"
              style={{
                background: statusFilter === f ? '#1A1F2E' : '#F0F1F4',
                color: statusFilter === f ? '#FDFAF4' : '#5A6178',
                borderColor: statusFilter === f ? '#1A1F2E' : '#D0D3DC',
              }}
              onClick={() => changeStatusFilter(f)}
            >
              {STATUS_FILTER_LABELS[f]}
            </button>
          ))}

          <div className="flex-1" />

          {/* Category dropdown */}
          <div className="relative">
            <select
              className="rounded-brand border px-2 py-1.5 text-xs pr-6 outline-none appearance-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#5A6178' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'all')}
            >
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Priority dropdown */}
          <div className="relative">
            <select
              className="rounded-brand border px-2 py-1.5 text-xs outline-none appearance-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#5A6178' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            >
              <option value="all">All Priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Do This Next */}
      <DoThisNextCard
        task={nextAction}
        onMarkComplete={handleMarkNextComplete}
        onViewDetails={(t) => setDrawerTask(t)}
      />

      {/* Conflict banner */}
      <DependencyConflictBanner
        conflicts={conflicts}
        onViewTask={handleViewTaskInConflict}
      />

      {/* Compress warning */}
      <CompressScheduleWarning warnings={compressWarnings} isRisky={isRisky} />

      {/* Main view */}
      {view === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          allTasks={tasks}
          onEdit={(t) => setEditDialogTask(t)}
          onViewDetails={(t) => setDrawerTask(t)}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onRowClick={(t) => setDrawerTask(t)}
        />
      ) : (
        <CalendarView
          tasks={filteredTasks}
          onViewDetails={(t) => setDrawerTask(t)}
        />
      )}

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={drawerTask}
        allTasks={tasks}
        onClose={() => setDrawerTask(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Add / Edit dialog */}
      <AddEditTaskDialog
        open={editDialogTask !== undefined}
        editTask={editDialogTask ?? undefined}
        allTasks={tasks}
        eventId={eventId}
        eventDate={eventDate}
        onClose={() => setEditDialogTask(undefined)}
        onSubmit={handleAddTask}
      />
    </div>
  );
}
