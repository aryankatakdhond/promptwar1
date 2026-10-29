'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Plus, ExternalLink } from 'lucide-react';
import type { PlanningTask, TaskStatus, TaskPriority } from '@/types/timeline';
import {
  CATEGORY_LABELS,
  PHASE_LABELS,
  PRIORITY_LABELS,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  STATUS_LABELS,
} from './timeline-utils';

interface Props {
  task: PlanningTask | null;
  allTasks: PlanningTask[];
  onClose: () => void;
  onSave: (task: PlanningTask) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailDrawer({ task, allTasks, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<PlanningTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addDepId, setAddDepId] = useState('');

  useEffect(() => {
    setForm(task ? { ...task } : null);
    setConfirmDelete(false);
    setAddDepId('');
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task || !form) return null;

  function handleField<K extends keyof PlanningTask>(key: K, value: PlanningTask[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function handleAddDep() {
    if (!addDepId || form!.dependencies.includes(addDepId)) return;
    handleField('dependencies', [...form!.dependencies, addDepId]);
    setAddDepId('');
  }

  function handleRemoveDep(depId: string) {
    handleField('dependencies', form!.dependencies.filter((d) => d !== depId));
  }

  function handleSave() {
    if (form) onSave(form);
  }

  function handleDelete() {
    if (!task) return;
    if (confirmDelete) {
      onDelete(task.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  }

  const availableDeps = allTasks.filter(
    (t) => t.id !== task.id && !form.dependencies.includes(t.id),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 z-40 h-full w-full max-w-[480px] overflow-y-auto flex flex-col shadow-xl"
        style={{ background: '#FDFAF4', borderLeft: '1px solid #D0D3DC' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>Task Details</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-midnight-50 transition-colors">
            <X size={16} style={{ color: '#5A6178' }} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5 flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Title</label>
            <input
              className="rounded-brand border px-3 py-1.5 text-sm font-medium w-full outline-none focus:border-terracotta"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              value={form.title}
              onChange={(e) => handleField('title', e.target.value)}
            />
          </div>

          {/* Status / Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Status</label>
              <select
                className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.status}
                onChange={(e) => handleField('status', e.target.value as TaskStatus)}
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Priority</label>
              <select
                className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.priority}
                onChange={(e) => handleField('priority', e.target.value as TaskPriority)}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Due Date</label>
            <input
              type="date"
              className="rounded-brand border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              value={form.dueDate}
              onChange={(e) => handleField('dueDate', e.target.value)}
            />
          </div>

          {/* Category / Phase row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Category</label>
              <select
                className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.category}
                onChange={(e) => handleField('category', e.target.value as PlanningTask['category'])}
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Phase</label>
              <div
                className="rounded-brand border px-2 py-1.5 text-sm"
                style={{ borderColor: '#D0D3DC', background: '#F0F1F4', color: '#5A6178' }}
              >
                {PHASE_LABELS[form.phase]}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Description</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              rows={3}
              value={form.description}
              onChange={(e) => handleField('description', e.target.value)}
            />
          </div>

          {/* Dependencies */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Dependencies</label>
            {form.dependencies.length === 0 && (
              <p className="text-xs" style={{ color: '#5A6178' }}>No dependencies.</p>
            )}
            {form.dependencies.map((depId) => {
              const dep = allTasks.find((t) => t.id === depId);
              return dep ? (
                <div
                  key={depId}
                  className="flex items-center justify-between text-xs rounded-brand border px-2 py-1"
                  style={{ borderColor: '#D0D3DC', background: '#F0F1F4', color: '#1A1F2E' }}
                >
                  <span className="truncate">{dep.title}</span>
                  <button onClick={() => handleRemoveDep(depId)} className="ml-2 shrink-0">
                    <X size={12} style={{ color: '#5A6178' }} />
                  </button>
                </div>
              ) : null;
            })}
            {availableDeps.length > 0 && (
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-brand border px-2 py-1 text-xs outline-none"
                  style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                  value={addDepId}
                  onChange={(e) => setAddDepId(e.target.value)}
                >
                  <option value="">Select a task…</option>
                  {availableDeps.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddDep}
                  disabled={!addDepId}
                  className="rounded-brand border px-2 py-1 text-xs disabled:opacity-40"
                  style={{ borderColor: '#D0D3DC' }}
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Assigned to */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Assigned To</label>
            <input
              className="rounded-brand border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              placeholder="Person or team…"
              value={form.assignedTo ?? ''}
              onChange={(e) => handleField('assignedTo', e.target.value || undefined)}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Notes</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              rows={2}
              placeholder="Additional notes…"
              value={form.notes ?? ''}
              onChange={(e) => handleField('notes', e.target.value || undefined)}
            />
          </div>

          {/* Related links */}
          {task.relatedVendorId && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#5A6178' }}>
              <ExternalLink size={13} />
              <span>Related Vendor ID: {task.relatedVendorId}</span>
            </div>
          )}
          {task.relatedBudgetCategoryId && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#5A6178' }}>
              <ExternalLink size={13} />
              <span>Related Budget Category: {task.relatedBudgetCategoryId}</span>
            </div>
          )}

          {/* Danger zone */}
          <div
            className="rounded-brand border px-4 py-3 flex flex-col gap-2 mt-2"
            style={{ borderColor: '#FCA5A5', background: '#FEF2F2' }}
          >
            <span className="text-xs font-semibold" style={{ color: '#991B1B' }}>Danger Zone</span>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#7F1D1D' }}>Are you sure?</span>
                <button
                  onClick={handleDelete}
                  className="text-xs font-medium rounded-brand px-3 py-1"
                  style={{ background: '#991B1B', color: '#FDFAF4' }}
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs font-medium rounded-brand px-3 py-1 border"
                  style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: '#991B1B' }}
              >
                <Trash2 size={13} />
                Delete Task
              </button>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div
          className="sticky bottom-0 px-5 py-4 border-t flex justify-end gap-2"
          style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
        >
          <button
            onClick={onClose}
            className="rounded-brand border px-4 py-1.5 text-sm"
            style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-brand px-4 py-1.5 text-sm font-medium"
            style={{ background: '#C4613A', color: '#FDFAF4' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
