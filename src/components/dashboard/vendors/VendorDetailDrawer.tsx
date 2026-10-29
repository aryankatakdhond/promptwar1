'use client';

import { useState, useEffect } from 'react';
import type { VendorEntry, VendorStatus, VendorPaymentMilestone } from '@/types/vendor';
import { formatCurrency } from '@/lib/currency';
import type { CurrencyCode } from '@/types/event';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, ExternalLink } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS, VENDOR_STATUSES } from './VendorBoardView';

interface Props {
  vendor: VendorEntry | null;
  currency: CurrencyCode;
  onClose: () => void;
  onSave: (vendor: VendorEntry) => void;
  onDelete: (vendor: VendorEntry) => void;
}

export function VendorDetailDrawer({ vendor, currency, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<VendorEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (vendor) {
      setForm({ ...vendor, questionsToAsk: [...vendor.questionsToAsk], redFlags: [...vendor.redFlags] });
      setConfirmDelete(false);
    }
  }, [vendor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!vendor || !form) return null;

  function setField<K extends keyof VendorEntry>(key: K, value: VendorEntry[K]) {
    setForm((p) => p ? { ...p, [key]: value } : p);
  }

  function handleSave() {
    if (!form) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(vendor!);
  }

  function addListItem(key: 'questionsToAsk' | 'redFlags') {
    setForm((p) => p ? { ...p, [key]: [...p[key], ''] } : p);
  }

  function updateListItem(key: 'questionsToAsk' | 'redFlags', idx: number, val: string) {
    setForm((p) => {
      if (!p) return p;
      const arr = [...p[key]];
      arr[idx] = val;
      return { ...p, [key]: arr };
    });
  }

  function removeListItem(key: 'questionsToAsk' | 'redFlags', idx: number) {
    setForm((p) => {
      if (!p) return p;
      return { ...p, [key]: p[key].filter((_, i) => i !== idx) };
    });
  }

  function addMilestone() {
    const m: VendorPaymentMilestone = { id: uuidv4(), description: '', amount: 0, dueDate: '', isPaid: false };
    setForm((p) => p ? { ...p, paymentMilestones: [...p.paymentMilestones, m] } : p);
  }

  function updateMilestone<K extends keyof VendorPaymentMilestone>(idx: number, key: K, val: VendorPaymentMilestone[K]) {
    setForm((p) => {
      if (!p) return p;
      const milestones = [...p.paymentMilestones];
      milestones[idx] = { ...milestones[idx], [key]: val };
      return { ...p, paymentMilestones: milestones };
    });
  }

  function removeMilestone(idx: number) {
    setForm((p) => p ? { ...p, paymentMilestones: p.paymentMilestones.filter((_, i) => i !== idx) } : p);
  }

  const inputCls = "rounded-brand border px-3 py-1.5 text-sm outline-none w-full";
  const inputStyle = { borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' };
  const labelCls = "text-xs font-semibold uppercase tracking-wide mb-0.5";
  const labelStyle = { color: '#5A6178' };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col shadow-2xl"
        style={{ width: '480px', maxWidth: '100vw', background: '#FDFAF4', borderLeft: '1px solid #D0D3DC' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b gap-3" style={{ borderColor: '#D0D3DC' }}>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#5A6178' }}>
              {CATEGORY_LABELS[form.category]}
            </span>
            <h2 className="text-sm font-bold truncate" style={{ color: '#1A1F2E' }}>{form.requirement}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded hover:bg-midnight-50">
            <X size={16} style={{ color: '#5A6178' }} />
          </button>
        </div>

        {/* Illustrative banner */}
        {form.isIllustrative && (
          <div className="mx-4 mt-3 px-3 py-2.5 rounded-brand border text-xs" style={{ background: '#FFF7ED', borderColor: '#FED7AA', color: '#92400E' }}>
            📌 <strong>Illustrative Demo Entry</strong> — Not a verified real vendor. Prices are sample estimates only.
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Business name / Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Business Name</label>
              <input className={inputCls} style={inputStyle} value={form.businessName ?? ''} onChange={(e) => setField('businessName', e.target.value || undefined)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Contact Name</label>
              <input className={inputCls} style={inputStyle} value={form.contactName ?? ''} onChange={(e) => setField('contactName', e.target.value || undefined)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Phone</label>
              <input className={inputCls} style={inputStyle} value={form.contactPhone ?? ''} onChange={(e) => setField('contactPhone', e.target.value || undefined)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Email</label>
              <input type="email" className={inputCls} style={inputStyle} value={form.contactEmail ?? ''} onChange={(e) => setField('contactEmail', e.target.value || undefined)} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Website</label>
            <div className="flex gap-2 items-center">
              <input className={inputCls} style={inputStyle} value={form.website ?? ''} onChange={(e) => setField('website', e.target.value || undefined)} placeholder="https://…" />
              {form.website && (
                <a href={form.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} style={{ color: '#5A6178' }} />
                </a>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Status</label>
            <select
              className="rounded-brand border px-2 py-1.5 text-sm outline-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              value={form.status}
              onChange={(e) => setField('status', e.target.value as VendorStatus)}
            >
              {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Estimated Cost</label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={form.estimatedCost}
                onChange={(e) => setField('estimatedCost', parseInt(e.target.value) || 0)}
              />
              <span className="text-xs" style={{ color: '#5A6178' }}>{formatCurrency(form.estimatedCost, currency)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Quoted Cost</label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={form.quotedCost ?? ''}
                placeholder="—"
                onChange={(e) => setField('quotedCost', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              {form.quotedCost !== undefined && (
                <span className="text-xs" style={{ color: '#065F46' }}>{formatCurrency(form.quotedCost, currency)}</span>
              )}
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Research Deadline</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.researchDeadline} onChange={(e) => setField('researchDeadline', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Booking Deadline</label>
              <input type="date" className={inputCls} style={inputStyle} value={form.bookingDeadline} onChange={(e) => setField('bookingDeadline', e.target.value)} />
            </div>
          </div>

          {/* Critical toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isCritical} onChange={(e) => setField('isCritical', e.target.checked)} />
            <span className="text-sm" style={{ color: '#1A1F2E' }}>Critical Vendor</span>
          </label>

          {/* Contract / Deposit */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.contractSigned} onChange={(e) => setField('contractSigned', e.target.checked)} />
              <span className="text-sm" style={{ color: '#1A1F2E' }}>Contract Signed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.depositPaid} onChange={(e) => setField('depositPaid', e.target.checked)} />
              <span className="text-sm" style={{ color: '#1A1F2E' }}>Deposit Paid</span>
            </label>
          </div>

          {/* Comparison Notes */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Comparison Notes</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              rows={2}
              value={form.comparisonNotes ?? ''}
              onChange={(e) => setField('comparisonNotes', e.target.value || undefined)}
            />
          </div>

          {/* Questions to Ask */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className={labelCls} style={labelStyle}>Questions to Ask</label>
              <button onClick={() => addListItem('questionsToAsk')} className="text-xs flex items-center gap-1" style={{ color: '#C4613A' }}>
                <Plus size={12} /> Add
              </button>
            </div>
            {form.questionsToAsk.map((q, i) => (
              <div key={i} className="flex gap-1">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={q}
                  placeholder={`Question ${i + 1}…`}
                  onChange={(e) => updateListItem('questionsToAsk', i, e.target.value)}
                />
                <button onClick={() => removeListItem('questionsToAsk', i)}>
                  <Trash2 size={13} style={{ color: '#C4613A' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Red Flags */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className={labelCls} style={labelStyle}>Red Flags</label>
              <button onClick={() => addListItem('redFlags')} className="text-xs flex items-center gap-1" style={{ color: '#991B1B' }}>
                <Plus size={12} /> Add
              </button>
            </div>
            {form.redFlags.map((r, i) => (
              <div key={i} className="flex gap-1">
                <input
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: '#FECACA' }}
                  value={r}
                  placeholder={`Red flag ${i + 1}…`}
                  onChange={(e) => updateListItem('redFlags', i, e.target.value)}
                />
                <button onClick={() => removeListItem('redFlags', i)}>
                  <Trash2 size={13} style={{ color: '#991B1B' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Cancellation Terms */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Cancellation Terms</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              rows={2}
              value={form.cancellationTerms ?? ''}
              onChange={(e) => setField('cancellationTerms', e.target.value || undefined)}
            />
          </div>

          {/* Payment Milestones */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelCls} style={labelStyle}>Payment Milestones</label>
              <button onClick={addMilestone} className="text-xs flex items-center gap-1" style={{ color: '#C4613A' }}>
                <Plus size={12} /> Add
              </button>
            </div>
            {form.paymentMilestones.map((m, i) => (
              <div key={m.id} className="rounded-brand border p-2.5 flex flex-col gap-2" style={{ borderColor: '#D0D3DC', background: '#F0F1F4' }}>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputCls}
                    style={inputStyle}
                    placeholder="Description"
                    value={m.description}
                    onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    className={inputCls}
                    style={inputStyle}
                    placeholder="Amount"
                    value={m.amount || ''}
                    onChange={(e) => updateMilestone(i, 'amount', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    className="rounded-brand border px-2 py-1 text-xs outline-none"
                    style={inputStyle}
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(i, 'dueDate', e.target.value)}
                  />
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#1A1F2E' }}>
                    <input type="checkbox" checked={m.isPaid} onChange={(e) => updateMilestone(i, 'isPaid', e.target.checked)} />
                    Paid
                  </label>
                  <button onClick={() => removeMilestone(i)} className="ml-auto">
                    <Trash2 size={13} style={{ color: '#C4613A' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Notes</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => setField('notes', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-between gap-2" style={{ borderColor: '#D0D3DC' }}>
          <button
            onClick={handleDelete}
            className="rounded-brand border px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              borderColor: confirmDelete ? '#FECACA' : '#D0D3DC',
              color: confirmDelete ? '#991B1B' : '#C4613A',
              background: confirmDelete ? '#FEF2F2' : 'transparent',
            }}
          >
            {confirmDelete ? 'Confirm Delete?' : 'Delete Vendor'}
          </button>
          <div className="flex gap-2">
            {confirmDelete && (
              <button onClick={() => setConfirmDelete(false)} className="rounded-brand border px-3 py-1.5 text-sm" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              className="rounded-brand px-4 py-1.5 text-sm font-medium"
              style={{ background: '#C4613A', color: '#FDFAF4' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
