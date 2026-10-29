'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { PlanningTask, TaskCategory, TaskPriority, TimelinePhase } from '@/types/timeline';
import {
  CATEGORY_LABELS,
  PHASE_LABELS,
  PRIORITY_LABELS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
} from './timeline-utils';

interface Props {
  open: boolean;
  editTask?: PlanningTask | null;
  allTasks: PlanningTask[];
  eventId: string;
  eventDate: string; // ISO date string
  onClose: () => void;
  onSubmit: (task: PlanningTask) => void;
}

function phaseFromDays(days: number): TimelinePhase {
  if (days <= 0) return 'day-of';
  if (days <= 3) return 'final';
  if (days <= 30) return 'late';
  if (days <= 90) return 'mid';
  if (days <= 180) return 'early';
  return 'immediate';
}

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'other' as TaskCategory,
  priority: 'medium' as TaskPriority,
  dueDate: '',
  phase: 'mid' as TimelinePhase,
  dependencies: [] as string[],
  assignedTo: '',
};

type FormState = typeof EMPTY_FORM;

export function AddEditTaskDialog({ open, editTask, allTasks, eventId, eventDate, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description,
        category: editTask.category,
        priority: editTask.priority,
        dueDate: editTask.dueDate,
        phase: editTask.phase,
        dependencies: [...editTask.dependencies],
        assignedTo: editTask.assignedTo ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [open, editTask?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-compute phase when due date changes
      if (key === 'dueDate' && typeof value === 'string' && value) {
        const days = differenceInCalendarDays(parseISO(eventDate), parseISO(value));
        next.phase = phaseFromDays(days);
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function daysBeforeEvent(): number {
    if (!form.dueDate) return 0;
    return differenceInCalendarDays(parseISO(eventDate), parseISO(form.dueDate));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.dueDate) errs.dueDate = 'Due date is required.';
    if (form.dueDate && form.dependencies.length > 0) {
      // Simple circular check: dep due date must be before this task
      for (const depId of form.dependencies) {
        const dep = allTasks.find((t) => t.id === depId);
        if (!dep) continue;
        if (dep.dueDate >= form.dueDate) {
          errs.dependencies = `Dependency "${dep.title}" is due on or after this task's due date.`;
          break;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const days = daysBeforeEvent();
    const task: PlanningTask = editTask
      ? {
          ...editTask,
          title: form.title.trim(),
          description: form.description,
          category: form.category,
          priority: form.priority,
          dueDate: form.dueDate,
          phase: form.phase,
          dependencies: form.dependencies,
          assignedTo: form.assignedTo || undefined,
          daysBeforeEvent: days,
        }
      : {
          id: uuidv4(),
          eventId,
          title: form.title.trim(),
          description: form.description,
          category: form.category,
          priority: form.priority,
          status: 'not-started',
          dueDate: form.dueDate,
          estimatedDurationDays: 1,
          dependencies: form.dependencies,
          isPinned: false,
          daysBeforeEvent: days,
          phase: form.phase,
          assignedTo: form.assignedTo || undefined,
        };

    onSubmit(task);
    onClose();
  }

  const availableDepTasks = allTasks.filter(
    (t) => t.id !== editTask?.id && !form.dependencies.includes(t.id),
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
        {/* Dialog */}
        <div
          className="w-full max-w-[520px] rounded-brand border shadow-xl flex flex-col max-h-[90vh]"
          style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: '#D0D3DC' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
              {editTask ? 'Edit Task' : 'Add Task'}
            </h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-midnight-50 transition-colors">
              <X size={16} style={{ color: '#5A6178' }} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
                Title <span style={{ color: '#C4613A' }}>*</span>
              </label>
              <input
                className="rounded-brand border px-3 py-1.5 text-sm outline-none focus:border-terracotta"
                style={{ borderColor: errors.title ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                placeholder="Task title…"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
              {errors.title && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Description</label>
              <textarea
                className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                rows={2}
                placeholder="Optional description…"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>

            {/* Category / Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Category</label>
                <select
                  className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                  style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value as TaskCategory)}
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Priority</label>
                <select
                  className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                  style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value={form.priority}
                  onChange={(e) => setField('priority', e.target.value as TaskPriority)}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due date / Phase / Days before */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
                  Due Date <span style={{ color: '#C4613A' }}>*</span>
                </label>
                <input
                  type="date"
                  className="rounded-brand border px-3 py-1.5 text-sm outline-none"
                  style={{ borderColor: errors.dueDate ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value={form.dueDate}
                  onChange={(e) => setField('dueDate', e.target.value)}
                />
                {errors.dueDate && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.dueDate}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Phase</label>
                <select
                  className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                  style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value={form.phase}
                  onChange={(e) => setField('phase', e.target.value as TimelinePhase)}
                >
                  {(Object.keys(PHASE_LABELS) as TimelinePhase[]).map((ph) => (
                    <option key={ph} value={ph}>{PHASE_LABELS[ph]}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.dueDate && (
              <p className="text-xs" style={{ color: '#5A6178' }}>
                {daysBeforeEvent() >= 0
                  ? `${daysBeforeEvent()} days before the event`
                  : `${Math.abs(daysBeforeEvent())} days after the event`
                }
              </p>
            )}

            {/* Dependencies */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Dependencies</label>
              {form.dependencies.length > 0 && (
                <div className="flex flex-col gap-1 mb-1">
                  {form.dependencies.map((depId) => {
                    const dep = allTasks.find((t) => t.id === depId);
                    return dep ? (
                      <div
                        key={depId}
                        className="flex items-center justify-between text-xs rounded-brand border px-2 py-1"
                        style={{ borderColor: '#D0D3DC', background: '#F0F1F4', color: '#1A1F2E' }}
                      >
                        <span className="truncate">{dep.title}</span>
                        <button
                          onClick={() => setField('dependencies', form.dependencies.filter((d) => d !== depId))}
                          className="ml-2"
                        >
                          <X size={12} style={{ color: '#5A6178' }} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {availableDepTasks.length > 0 && (
                <select
                  className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                  style={{ borderColor: errors.dependencies ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setField('dependencies', [...form.dependencies, e.target.value]);
                  }}
                >
                  <option value="">Add dependency…</option>
                  {availableDepTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
              {errors.dependencies && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.dependencies}</span>}
            </div>

            {/* Assigned to */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Assigned To</label>
              <input
                className="rounded-brand border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                placeholder="Person or team (optional)…"
                value={form.assignedTo}
                onChange={(e) => setField('assignedTo', e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 border-t flex justify-end gap-2"
            style={{ borderColor: '#D0D3DC' }}
          >
            <button
              onClick={onClose}
              className="rounded-brand border px-4 py-1.5 text-sm"
              style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-brand px-4 py-1.5 text-sm font-medium"
              style={{ background: '#C4613A', color: '#FDFAF4' }}
            >
              {editTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
