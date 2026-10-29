'use client';

import { useState, useEffect } from 'react';
import type { ShowBlock, BlockCategory } from '@/types/runofshow';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';

const CATEGORIES: BlockCategory[] = [
  'setup','arrival','ceremony','reception','dining','entertainment','activity','departure','breakdown','other',
];

interface Props {
  open: boolean;
  editBlock?: ShowBlock | null;
  allBlocks: ShowBlock[];
  eventId: string;
  onClose: () => void;
  onSubmit: (block: ShowBlock) => void;
}

const EMPTY_FORM = {
  title: '',
  category: 'other' as BlockCategory,
  startTime: '',
  endTime: '',
  location: '',
  responsiblePerson: '',
  description: '',
  backupNotes: '',
  dependencies: [] as string[],
};

type FormState = typeof EMPTY_FORM;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function computeDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? diff : 0;
}

export function AddEditBlockDialog({ open, editBlock, allBlocks, eventId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'time', string>>>({});

  useEffect(() => {
    if (!open) return;
    if (editBlock) {
      setForm({
        title: editBlock.title,
        category: editBlock.category,
        startTime: editBlock.startTime,
        endTime: editBlock.endTime,
        location: editBlock.location ?? '',
        responsiblePerson: editBlock.responsiblePerson ?? '',
        description: editBlock.description ?? '',
        backupNotes: editBlock.backupNotes ?? '',
        dependencies: [...editBlock.dependencies],
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [open, editBlock?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, time: undefined }));
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.startTime) errs.startTime = 'Start time is required.';
    if (!form.endTime) errs.endTime = 'End time is required.';
    if (form.startTime && form.endTime && timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      errs.time = 'End time must be after start time.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const duration = computeDuration(form.startTime, form.endTime);
    const block: ShowBlock = editBlock
      ? {
          ...editBlock,
          title: form.title.trim(),
          category: form.category,
          startTime: form.startTime,
          endTime: form.endTime,
          durationMinutes: duration,
          location: form.location.trim() || undefined,
          responsiblePerson: form.responsiblePerson.trim() || undefined,
          description: form.description.trim() || undefined,
          backupNotes: form.backupNotes.trim() || undefined,
          dependencies: form.dependencies,
        }
      : {
          id: uuidv4(),
          eventId,
          title: form.title.trim(),
          category: form.category,
          startTime: form.startTime,
          endTime: form.endTime,
          durationMinutes: duration,
          location: form.location.trim() || undefined,
          responsiblePerson: form.responsiblePerson.trim() || undefined,
          description: form.description.trim() || undefined,
          backupNotes: form.backupNotes.trim() || undefined,
          dependencies: form.dependencies,
          sortOrder: allBlocks.length,
          notes: undefined,
        };
    onSubmit(block);
    onClose();
  }

  const availableDepBlocks = allBlocks.filter(
    (b) => b.id !== editBlock?.id && !form.dependencies.includes(b.id),
  );

  const inputCls = "rounded-brand border px-3 py-1.5 text-sm outline-none w-full";
  const inputStyle = { borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' };
  const labelCls = "text-xs font-semibold uppercase tracking-wide";
  const labelStyle = { color: '#5A6178' };

  const duration = computeDuration(form.startTime, form.endTime);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div
        className="w-full max-w-[480px] rounded-brand border shadow-xl flex flex-col max-h-[90vh]"
        style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D0D3DC' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
            {editBlock ? 'Edit Block' : 'Add Block'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-midnight-50">
            <X size={16} style={{ color: '#5A6178' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Activity Title <span style={{ color: '#C4613A' }}>*</span></label>
            <input
              className={inputCls}
              style={{ ...inputStyle, borderColor: errors.title ? '#FCA5A5' : '#D0D3DC' }}
              placeholder="e.g. Bride's Entrance"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />
            {errors.title && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.title}</span>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Category</label>
            <select
              className="rounded-brand border px-2 py-1.5 text-sm outline-none"
              style={inputStyle}
              value={form.category}
              onChange={(e) => setField('category', e.target.value as BlockCategory)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Start Time <span style={{ color: '#C4613A' }}>*</span></label>
              <input
                type="time"
                className={inputCls}
                style={{ ...inputStyle, borderColor: errors.startTime ? '#FCA5A5' : '#D0D3DC' }}
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>End Time <span style={{ color: '#C4613A' }}>*</span></label>
              <input
                type="time"
                className={inputCls}
                style={{ ...inputStyle, borderColor: errors.endTime ? '#FCA5A5' : '#D0D3DC' }}
                value={form.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
              />
            </div>
          </div>
          {errors.time && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.time}</span>}
          {duration > 0 && (
            <p className="text-xs -mt-2" style={{ color: '#5A6178' }}>
              Duration: <strong>{duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ''}`}</strong>
            </p>
          )}

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Location / Zone</label>
            <input className={inputCls} style={inputStyle} placeholder="e.g. Main Hall" value={form.location} onChange={(e) => setField('location', e.target.value)} />
          </div>

          {/* Responsible person */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Responsible Person</label>
            <input className={inputCls} style={inputStyle} placeholder="e.g. Wedding coordinator" value={form.responsiblePerson} onChange={(e) => setField('responsiblePerson', e.target.value)} />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Description</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={inputStyle}
              rows={2}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Optional details…"
            />
          </div>

          {/* Backup notes */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Backup Notes</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={inputStyle}
              rows={2}
              value={form.backupNotes}
              onChange={(e) => setField('backupNotes', e.target.value)}
              placeholder="What to do if this block gets disrupted…"
            />
          </div>

          {/* Dependencies */}
          {availableDepBlocks.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Depends On</label>
              <select
                className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                style={inputStyle}
                value=""
                onChange={(e) => {
                  if (e.target.value) setField('dependencies', [...form.dependencies, e.target.value]);
                }}
              >
                <option value="">Add dependency…</option>
                {availableDepBlocks.map((b) => (
                  <option key={b.id} value={b.id}>{b.startTime} — {b.title}</option>
                ))}
              </select>
              {form.dependencies.map((depId) => {
                const dep = allBlocks.find((b) => b.id === depId);
                return dep ? (
                  <div key={depId} className="flex items-center justify-between text-xs rounded-brand border px-2 py-1" style={{ borderColor: '#D0D3DC', background: '#F0F1F4' }}>
                    <span>{dep.startTime} — {dep.title}</span>
                    <button onClick={() => setField('dependencies', form.dependencies.filter((d) => d !== depId))}>
                      <X size={12} style={{ color: '#5A6178' }} />
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: '#D0D3DC' }}>
          <button onClick={onClose} className="rounded-brand border px-4 py-1.5 text-sm" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-brand px-4 py-1.5 text-sm font-medium" style={{ background: '#C4613A', color: '#FDFAF4' }}>
            {editBlock ? 'Save Changes' : 'Add Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
