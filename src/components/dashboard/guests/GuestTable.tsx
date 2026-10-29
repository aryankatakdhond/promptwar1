'use client';

import { useState } from 'react';
import type { Guest, GuestStatus } from '@/types/guest';
import { ArrowUpDown, Pencil, Trash2, Crown } from 'lucide-react';

type SortKey = 'name' | 'group' | 'rsvpStatus' | 'invitationStatus';

const RSVP_COLORS: Record<GuestStatus, { bg: string; text: string; border: string }> = {
  accepted:   { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  pending:    { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  declined:   { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  waitlisted: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
};

const RSVP_LABELS: Record<GuestStatus, string> = {
  accepted: 'Accepted', pending: 'Pending', declined: 'Declined', waitlisted: 'Waitlisted',
};

interface Props {
  guests: Guest[];
  search: string;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestTable({ guests, search, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  const q = search.toLowerCase();
  const filtered = guests.filter((g) => {
    if (!q) return true;
    const name = `${g.firstName} ${g.lastName}`.toLowerCase();
    return name.includes(q) || (g.householdGroup?.toLowerCase().includes(q) ?? false) || (g.email?.toLowerCase().includes(q) ?? false);
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
      case 'group': cmp = (a.householdGroup ?? '').localeCompare(b.householdGroup ?? ''); break;
      case 'rsvpStatus': cmp = a.rsvpStatus.localeCompare(b.rsvpStatus); break;
      case 'invitationStatus': cmp = a.invitationStatus.localeCompare(b.invitationStatus); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function SortBtn({ col }: { col: SortKey }) {
    return (
      <button onClick={() => toggleSort(col)} className="ml-1 opacity-50 hover:opacity-100">
        <ArrowUpDown size={11} />
      </button>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-sm" style={{ color: '#5A6178' }}>No guests found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-brand border" style={{ borderColor: '#D0D3DC' }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: '#F0F1F4' }}>
            {([
              ['Name', 'name'],
              ['Group', 'group'],
              ['RSVP Status', 'rsvpStatus'],
              ['Dietary', null],
              ['Accessibility', null],
              ['Plus-One', null],
              ['Invitation', 'invitationStatus'],
              ['VIP', null],
              ['Actions', null],
            ] as [string, SortKey | null][]).map(([label, key]) => (
              <th
                key={label}
                className="px-2.5 py-2 text-left font-semibold border-b whitespace-nowrap"
                style={{ color: '#5A6178', borderColor: '#D0D3DC' }}
              >
                {label}{key && <SortBtn col={key} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((g) => {
            const rc = RSVP_COLORS[g.rsvpStatus];
            return (
              <tr
                key={g.id}
                className="border-b hover:bg-ivory/50 cursor-pointer transition-colors"
                style={{ borderColor: '#D0D3DC' }}
                onClick={() => onEdit(g)}
              >
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    {g.isVIP && <Crown size={12} style={{ color: '#B45309' }} />}
                    <span className="font-medium" style={{ color: '#1A1F2E' }}>
                      {g.firstName} {g.lastName}
                    </span>
                  </div>
                  {g.email && <div className="text-xs opacity-60" style={{ color: '#5A6178' }}>{g.email}</div>}
                </td>
                <td className="px-2.5 py-2" style={{ color: '#5A6178' }}>{g.householdGroup || '—'}</td>
                <td className="px-2.5 py-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
                  >
                    {RSVP_LABELS[g.rsvpStatus]}
                  </span>
                </td>
                <td className="px-2.5 py-2" style={{ color: '#5A6178' }}>
                  {g.dietaryRequirements.length > 0 ? g.dietaryRequirements.join(', ') : '—'}
                </td>
                <td className="px-2.5 py-2" style={{ color: '#5A6178' }}>
                  {g.accessibilityNeeds.length > 0 ? g.accessibilityNeeds.join(', ') : '—'}
                </td>
                <td className="px-2.5 py-2">
                  {g.hasPlusOne ? (
                    <div className="flex flex-col">
                      <span style={{ color: '#1A1F2E' }}>Yes{g.plusOneName ? ` — ${g.plusOneName}` : ''}</span>
                      {g.plusOneRsvp && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full w-fit mt-0.5"
                          style={{ background: RSVP_COLORS[g.plusOneRsvp].bg, color: RSVP_COLORS[g.plusOneRsvp].text }}>
                          {RSVP_LABELS[g.plusOneRsvp]}
                        </span>
                      )}
                    </div>
                  ) : <span style={{ color: '#5A6178' }}>—</span>}
                </td>
                <td className="px-2.5 py-2" style={{ color: '#5A6178' }}>{g.invitationStatus.replace('-', ' ')}</td>
                <td className="px-2.5 py-2 text-center">
                  {g.isVIP ? <Crown size={13} style={{ color: '#B45309' }} /> : '—'}
                </td>
                <td className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(g)} className="p-1 rounded hover:bg-midnight-50" title="Edit">
                      <Pencil size={13} style={{ color: '#5A6178' }} />
                    </button>
                    <button onClick={() => onDelete(g)} className="p-1 rounded hover:bg-red-50" title="Delete">
                      <Trash2 size={13} style={{ color: '#C4613A' }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
