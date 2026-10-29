'use client';

import { useState, useEffect } from 'react';
import type { VendorEntry, VendorCategory, VendorStatus } from '@/types/vendor';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS, VENDOR_STATUSES } from './VendorBoardView';

const CATEGORIES: VendorCategory[] = [
  'venue','catering','photography','videography','decor','entertainment',
  'transport','staffing','bakery','florist','beauty','attire','invitations','audio-visual','security','other',
];

interface Props {
  open: boolean;
  editVendor?: VendorEntry | null;
  eventId: string;
  onClose: () => void;
  onSubmit: (vendor: VendorEntry) => void;
}

const EMPTY_FORM = {
  category: 'venue' as VendorCategory,
  requirement: '',
  businessName: '',
  status: 'not-started' as VendorStatus,
  estimatedCost: '',
  researchDeadline: '',
  bookingDeadline: '',
  isCritical: false,
};

type FormState = typeof EMPTY_FORM;

export function AddEditVendorDialog({ open, editVendor, eventId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (editVendor) {
      setForm({
        category: editVendor.category,
        requirement: editVendor.requirement,
        businessName: editVendor.businessName ?? '',
        status: editVendor.status,
        estimatedCost: String(editVendor.estimatedCost),
        researchDeadline: editVendor.researchDeadline,
        bookingDeadline: editVendor.bookingDeadline,
        isCritical: editVendor.isCritical,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [open, editVendor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.requirement.trim()) errs.requirement = 'Requirement is required.';
    if (!form.bookingDeadline) errs.bookingDeadline = 'Booking deadline is required.';
    if (!form.researchDeadline) errs.researchDeadline = 'Research deadline is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const vendor: VendorEntry = editVendor
      ? {
          ...editVendor,
          category: form.category,
          requirement: form.requirement.trim(),
          businessName: form.businessName.trim() || undefined,
          status: form.status,
          estimatedCost: parseInt(form.estimatedCost) || 0,
          researchDeadline: form.researchDeadline,
          bookingDeadline: form.bookingDeadline,
          isCritical: form.isCritical,
          updatedAt: now,
        }
      : {
          id: uuidv4(),
          eventId,
          category: form.category,
          requirement: form.requirement.trim(),
          businessName: form.businessName.trim() || undefined,
          status: form.status,
          estimatedCost: parseInt(form.estimatedCost) || 0,
          quotedCost: undefined,
          researchDeadline: form.researchDeadline,
          bookingDeadline: form.bookingDeadline,
          isCritical: form.isCritical,
          isIllustrative: false,
          questionsToAsk: [],
          redFlags: [],
          contractSigned: false,
          depositPaid: false,
          paymentMilestones: [],
          createdAt: now,
          updatedAt: now,
        };
    onSubmit(vendor);
    onClose();
  }

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
            {editVendor ? 'Edit Vendor' : 'Add Vendor'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-midnight-50">
            <X size={16} style={{ color: '#5A6178' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Category</label>
            <select
              className="rounded-brand border px-2 py-1.5 text-sm outline-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              value={form.category}
              onChange={(e) => setField('category', e.target.value as VendorCategory)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>

          {/* Requirement */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
              Requirement <span style={{ color: '#C4613A' }}>*</span>
            </label>
            <input
              className="rounded-brand border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: errors.requirement ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              placeholder="e.g. Main photographer"
              value={form.requirement}
              onChange={(e) => setField('requirement', e.target.value)}
            />
            {errors.requirement && <span className="text-xs" style={{ color: '#991B1B' }}>{errors.requirement}</span>}
          </div>

          {/* Business Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Business Name (optional)</label>
            <input
              className="rounded-brand border px-3 py-1.5 text-sm outline-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              placeholder="Vendor business name…"
              value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
            />
          </div>

          {/* Status + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Status</label>
              <select
                className="rounded-brand border px-2 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.status}
                onChange={(e) => setField('status', e.target.value as VendorStatus)}
              >
                {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>Estimated Cost</label>
              <input
                type="number"
                className="rounded-brand border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                placeholder="0"
                value={form.estimatedCost}
                onChange={(e) => setField('estimatedCost', e.target.value)}
              />
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
                Research Deadline <span style={{ color: '#C4613A' }}>*</span>
              </label>
              <input
                type="date"
                className="rounded-brand border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: errors.researchDeadline ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.researchDeadline}
                onChange={(e) => setField('researchDeadline', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
                Booking Deadline <span style={{ color: '#C4613A' }}>*</span>
              </label>
              <input
                type="date"
                className="rounded-brand border px-3 py-1.5 text-sm outline-none"
                style={{ borderColor: errors.bookingDeadline ? '#FCA5A5' : '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
                value={form.bookingDeadline}
                onChange={(e) => setField('bookingDeadline', e.target.value)}
              />
            </div>
          </div>

          {/* Critical */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isCritical}
              onChange={(e) => setField('isCritical', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: '#1A1F2E' }}>Mark as Critical Vendor</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: '#D0D3DC' }}>
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
            {editVendor ? 'Save Changes' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
