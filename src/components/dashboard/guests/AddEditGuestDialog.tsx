'use client';

import { useState, useEffect } from 'react';
import type { Guest, GuestStatus, InvitationStatus, DietaryRequirement, AccessibilityNeed } from '@/types/guest';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';

const RSVP_STATUSES: GuestStatus[] = ['pending', 'accepted', 'declined', 'waitlisted'];
const INVITATION_STATUSES: InvitationStatus[] = ['not-sent', 'sent', 'delivered', 'bounced'];
const DIETARY_OPTIONS: DietaryRequirement[] = ['vegetarian', 'vegan', 'halal', 'kosher', 'nut-free', 'gluten-free', 'dairy-free', 'other'];
const ACCESSIBILITY_OPTIONS: AccessibilityNeed[] = ['wheelchair', 'hearing-impaired', 'visually-impaired', 'mixed-ages', 'mobility-limited', 'other'];

interface Props {
  open: boolean;
  editGuest?: Guest | null;
  eventId: string;
  onClose: () => void;
  onSubmit: (guest: Guest) => void;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  householdGroup: '',
  rsvpStatus: 'pending' as GuestStatus,
  invitationStatus: 'not-sent' as InvitationStatus,
  hasPlusOne: false,
  plusOneName: '',
  plusOneRsvp: 'pending' as GuestStatus,
  dietaryRequirements: [] as DietaryRequirement[],
  accessibilityNeeds: [] as AccessibilityNeed[],
  tableNumber: '',
  isVIP: false,
  notes: '',
};

type FormState = typeof EMPTY_FORM;

export function AddEditGuestDialog({ open, editGuest, eventId, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (editGuest) {
      setForm({
        firstName: editGuest.firstName,
        lastName: editGuest.lastName,
        email: editGuest.email ?? '',
        phone: editGuest.phone ?? '',
        householdGroup: editGuest.householdGroup ?? '',
        rsvpStatus: editGuest.rsvpStatus,
        invitationStatus: editGuest.invitationStatus,
        hasPlusOne: editGuest.hasPlusOne,
        plusOneName: editGuest.plusOneName ?? '',
        plusOneRsvp: editGuest.plusOneRsvp ?? 'pending',
        dietaryRequirements: [...editGuest.dietaryRequirements],
        accessibilityNeeds: [...editGuest.accessibilityNeeds],
        tableNumber: editGuest.tableNumber ?? '',
        isVIP: editGuest.isVIP,
        notes: editGuest.notes ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [open, editGuest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleArray<T>(key: 'dietaryRequirements' | 'accessibilityNeeds', val: T) {
    setForm((p) => {
      const arr = p[key] as T[];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...p, [key]: next };
    });
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const guest: Guest = editGuest
      ? {
          ...editGuest,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          householdGroup: form.householdGroup.trim() || undefined,
          rsvpStatus: form.rsvpStatus,
          invitationStatus: form.invitationStatus,
          hasPlusOne: form.hasPlusOne,
          plusOneName: form.hasPlusOne ? (form.plusOneName.trim() || undefined) : undefined,
          plusOneRsvp: form.hasPlusOne ? form.plusOneRsvp : undefined,
          dietaryRequirements: form.dietaryRequirements,
          accessibilityNeeds: form.accessibilityNeeds,
          tableNumber: form.tableNumber.trim() || undefined,
          isVIP: form.isVIP,
          notes: form.notes.trim() || undefined,
          updatedAt: now,
        }
      : {
          id: uuidv4(),
          eventId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          householdGroup: form.householdGroup.trim() || undefined,
          rsvpStatus: form.rsvpStatus,
          invitationStatus: form.invitationStatus,
          hasPlusOne: form.hasPlusOne,
          plusOneName: form.hasPlusOne ? (form.plusOneName.trim() || undefined) : undefined,
          plusOneRsvp: form.hasPlusOne ? form.plusOneRsvp : undefined,
          dietaryRequirements: form.dietaryRequirements,
          accessibilityNeeds: form.accessibilityNeeds,
          tableNumber: form.tableNumber.trim() || undefined,
          isVIP: form.isVIP,
          notes: form.notes.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        };
    onSubmit(guest);
    onClose();
  }

  const inputCls = "rounded-brand border px-3 py-1.5 text-sm outline-none w-full";
  const inputStyle = { borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' };
  const labelCls = "text-xs font-semibold uppercase tracking-wide";
  const labelStyle = { color: '#5A6178' };
  const errStyle = { color: '#991B1B' };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div
        className="w-full max-w-[520px] rounded-brand border shadow-xl flex flex-col max-h-[90vh]"
        style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D0D3DC' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
            {editGuest ? 'Edit Guest' : 'Add Guest'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-midnight-50">
            <X size={16} style={{ color: '#5A6178' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>First Name <span style={{ color: '#C4613A' }}>*</span></label>
              <input className={inputCls} style={{ ...inputStyle, borderColor: errors.firstName ? '#FCA5A5' : '#D0D3DC' }} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="First name" />
              {errors.firstName && <span className="text-xs" style={errStyle}>{errors.firstName}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Last Name <span style={{ color: '#C4613A' }}>*</span></label>
              <input className={inputCls} style={{ ...inputStyle, borderColor: errors.lastName ? '#FCA5A5' : '#D0D3DC' }} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Last name" />
              {errors.lastName && <span className="text-xs" style={errStyle}>{errors.lastName}</span>}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Email</label>
              <input type="email" className={inputCls} style={{ ...inputStyle, borderColor: errors.email ? '#FCA5A5' : '#D0D3DC' }} value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="email@example.com" />
              {errors.email && <span className="text-xs" style={errStyle}>{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Phone</label>
              <input className={inputCls} style={inputStyle} value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 99999 99999" />
            </div>
          </div>

          {/* Group / Table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Household Group</label>
              <input className={inputCls} style={inputStyle} value={form.householdGroup} onChange={(e) => setField('householdGroup', e.target.value)} placeholder="e.g. Family – Bride's Side" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Table Number</label>
              <input className={inputCls} style={inputStyle} value={form.tableNumber} onChange={(e) => setField('tableNumber', e.target.value)} placeholder="e.g. 5" />
            </div>
          </div>

          {/* RSVP / Invitation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>RSVP Status</label>
              <select className="rounded-brand border px-2 py-1.5 text-sm outline-none" style={inputStyle} value={form.rsvpStatus} onChange={(e) => setField('rsvpStatus', e.target.value as GuestStatus)}>
                {RSVP_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={labelStyle}>Invitation Status</label>
              <select className="rounded-brand border px-2 py-1.5 text-sm outline-none" style={inputStyle} value={form.invitationStatus} onChange={(e) => setField('invitationStatus', e.target.value as InvitationStatus)}>
                {INVITATION_STATUSES.map((s) => <option key={s} value={s}>{s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Plus-one */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasPlusOne} onChange={(e) => setField('hasPlusOne', e.target.checked)} />
              <span className="text-sm" style={{ color: '#1A1F2E' }}>Has Plus-One</span>
            </label>
            {form.hasPlusOne && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="flex flex-col gap-1">
                  <label className={labelCls} style={labelStyle}>Plus-One Name</label>
                  <input className={inputCls} style={inputStyle} value={form.plusOneName} onChange={(e) => setField('plusOneName', e.target.value)} placeholder="Guest's plus-one…" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls} style={labelStyle}>Plus-One RSVP</label>
                  <select className="rounded-brand border px-2 py-1.5 text-sm outline-none" style={inputStyle} value={form.plusOneRsvp} onChange={(e) => setField('plusOneRsvp', e.target.value as GuestStatus)}>
                    {RSVP_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Dietary requirements */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={labelStyle}>Dietary Requirements</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#1A1F2E' }}>
                  <input
                    type="checkbox"
                    checked={form.dietaryRequirements.includes(d)}
                    onChange={() => toggleArray('dietaryRequirements', d)}
                  />
                  {d.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                </label>
              ))}
            </div>
          </div>

          {/* Accessibility needs */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={labelStyle}>Accessibility Needs</label>
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_OPTIONS.map((a) => (
                <label key={a} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#1A1F2E' }}>
                  <input
                    type="checkbox"
                    checked={form.accessibilityNeeds.includes(a)}
                    onChange={() => toggleArray('accessibilityNeeds', a)}
                  />
                  {a.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </label>
              ))}
            </div>
          </div>

          {/* VIP */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isVIP} onChange={(e) => setField('isVIP', e.target.checked)} />
            <span className="text-sm" style={{ color: '#1A1F2E' }}>VIP Guest</span>
          </label>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={labelStyle}>Notes</label>
            <textarea
              className="rounded-brand border px-3 py-2 text-sm outline-none resize-none"
              style={inputStyle}
              rows={2}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Any additional notes…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: '#D0D3DC' }}>
          <button onClick={onClose} className="rounded-brand border px-4 py-1.5 text-sm" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded-brand px-4 py-1.5 text-sm font-medium" style={{ background: '#C4613A', color: '#FDFAF4' }}>
            {editGuest ? 'Save Changes' : 'Add Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}
