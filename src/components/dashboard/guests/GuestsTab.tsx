'use client';

import { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import type { Guest } from '@/types/guest';
import { Plus, Search, Download } from 'lucide-react';
import { GuestTotalsBar } from './GuestTotalsBar';
import { GuestTable } from './GuestTable';
import { AddEditGuestDialog } from './AddEditGuestDialog';
import { CapacityWarning } from './CapacityWarning';
import { exportGuestsCSV } from '@/lib/export/csv-export';
import { detectRisks, calculateReadinessScore } from '@/lib/risk-engine';

export function GuestsTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!activeEvent) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#5A6178' }}>No event selected.</div>;
  }

  const guests = activeEvent.guests;
  const profile = activeEvent.profile;
  const confirmedCount = guests.filter((g) => g.rsvpStatus === 'accepted').length;

  function refreshRisk(updatedGuests: Guest[]) {
    const confirmedNew = updatedGuests.filter((g) => g.rsvpStatus === 'accepted').length;
    const updatedProfile = { ...profile, confirmedGuestCount: confirmedNew };
    const ev = activeEvent!;
    const risks = detectRisks({
      event: updatedProfile,
      budget: ev.budget,
      tasks: ev.tasks,
      vendors: ev.vendors,
      runOfShow: ev.runOfShow,
    });
    const score = calculateReadinessScore({
      event: updatedProfile,
      budget: ev.budget,
      tasks: ev.tasks,
      vendors: ev.vendors,
      runOfShow: ev.runOfShow,
    });
    dispatch({ type: 'UPDATE_RISKS', eventId: profile.id, risks, score });
  }

  function handleSave(guest: Guest) {
    const isNew = !guests.find((g) => g.id === guest.id);
    let updatedGuests: Guest[];
    if (isNew) {
      updatedGuests = [...guests, guest];
      dispatch({ type: 'UPDATE_GUESTS', eventId: profile.id, guests: updatedGuests });
      toast({ title: 'Guest added', variant: 'success' });
    } else {
      updatedGuests = guests.map((g) => g.id === guest.id ? guest : g);
      dispatch({ type: 'UPDATE_GUEST', eventId: profile.id, guest });
      toast({ title: 'Guest updated', variant: 'success' });
    }
    refreshRisk(updatedGuests);
    setDialogOpen(false);
    setEditGuest(null);
  }

  function handleDelete(guest: Guest) {
    if (confirmDeleteId !== guest.id) {
      setConfirmDeleteId(guest.id);
      return;
    }
    const updatedGuests = guests.filter((g) => g.id !== guest.id);
    dispatch({ type: 'UPDATE_GUESTS', eventId: profile.id, guests: updatedGuests });
    toast({ title: 'Guest removed', variant: 'default' });
    refreshRisk(updatedGuests);
    setConfirmDeleteId(null);
  }

  function openEdit(guest: Guest) {
    setEditGuest(guest);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditGuest(null);
    setDialogOpen(true);
  }

  function handleExport() {
    try {
      exportGuestsCSV(guests);
      toast({ title: 'CSV exported', variant: 'success' });
    } catch {
      toast({ title: 'Export failed', variant: 'error' });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Totals bar */}
      <GuestTotalsBar guests={guests} />

      {/* Capacity warning */}
      {profile.venueCapacity !== undefined && (
        <CapacityWarning confirmedCount={confirmedCount} venueCapacity={profile.venueCapacity} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5A6178' }} />
          <input
            className="w-full rounded-brand border pl-8 pr-3 py-1.5 text-sm outline-none"
            style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
            placeholder="Search guests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExport}
          className="rounded-brand border px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors"
          style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
          disabled={guests.length === 0}
        >
          <Download size={14} /> Export CSV
        </button>

        {/* Add guest */}
        <button
          onClick={openAdd}
          className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
          style={{ background: '#C4613A', color: '#FDFAF4' }}
        >
          <Plus size={14} /> Add Guest
        </button>
      </div>

      {/* Confirm delete inline banner */}
      {confirmDeleteId && (
        <div className="rounded-brand border px-4 py-3 flex items-center justify-between gap-3" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <span className="text-sm" style={{ color: '#991B1B' }}>
            Are you sure you want to remove this guest? This cannot be undone.
          </span>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-brand border px-3 py-1 text-xs" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
              Cancel
            </button>
            <button
              onClick={() => {
                const guest = guests.find((g) => g.id === confirmDeleteId);
                if (guest) handleDelete(guest);
              }}
              className="rounded-brand px-3 py-1 text-xs font-medium"
              style={{ background: '#991B1B', color: '#FDFAF4' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {guests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-brand border border-dashed" style={{ borderColor: '#D0D3DC' }}>
          <p className="text-sm font-medium" style={{ color: '#1A1F2E' }}>No guests yet.</p>
          <p className="text-xs" style={{ color: '#5A6178' }}>Add guests to start tracking RSVPs and dietary requirements.</p>
          <button onClick={openAdd} className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5" style={{ background: '#C4613A', color: '#FDFAF4' }}>
            <Plus size={14} /> Add Guest
          </button>
        </div>
      )}

      {/* Guest table */}
      {guests.length > 0 && (
        <GuestTable
          guests={guests}
          search={search}
          onEdit={openEdit}
          onDelete={(g) => {
            setConfirmDeleteId(g.id);
          }}
        />
      )}

      {/* Add/Edit dialog */}
      <AddEditGuestDialog
        open={dialogOpen}
        editGuest={editGuest}
        eventId={profile.id}
        onClose={() => { setDialogOpen(false); setEditGuest(null); }}
        onSubmit={handleSave}
      />
    </div>
  );
}
