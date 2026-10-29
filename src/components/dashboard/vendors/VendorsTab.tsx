'use client';

import { useState, useMemo } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import type { VendorEntry, VendorStatus, VendorCategory } from '@/types/vendor';
import { formatCurrency } from '@/lib/currency';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Plus, Search, LayoutGrid, List, AlertTriangle } from 'lucide-react';
import { VendorBoardView, CATEGORY_LABELS, STATUS_LABELS } from './VendorBoardView';
import { VendorTableView } from './VendorTableView';
import { VendorDetailDrawer } from './VendorDetailDrawer';
import { AddEditVendorDialog } from './AddEditVendorDialog';

type ViewMode = 'board' | 'table';

const ALL_CATEGORIES: VendorCategory[] = [
  'venue','catering','photography','videography','decor','entertainment',
  'transport','staffing','bakery','florist','beauty','attire','invitations','audio-visual','security','other',
];

const ALL_STATUSES: VendorStatus[] = [
  'not-started','researching','contacted','quote-received','booked','cancelled',
];

export function VendorsTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorEntry | null>(null);

  const vendors = useMemo(() => activeEvent?.vendors ?? [], [activeEvent]);
  const currency = activeEvent?.profile.currency ?? 'INR';

  // Filtered list — must be before any conditional return
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vendors.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (q && !v.requirement.toLowerCase().includes(q) && !(v.businessName?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [vendors, categoryFilter, statusFilter, search]);

  if (!activeEvent) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#5A6178' }}>No event selected.</div>;
  }

  // Stats
  const bookedCount = vendors.filter((v) => v.status === 'booked').length;
  const totalCount = vendors.length;
  const bookedPct = totalCount > 0 ? Math.round((bookedCount / totalCount) * 100) : 0;

  // Critical vendors unbooked within 30 days of booking deadline
  const criticalUnbooked = vendors.filter((v) => {
    if (!v.isCritical || v.status === 'booked' || v.status === 'cancelled') return false;
    const daysUntilDeadline = differenceInCalendarDays(parseISO(v.bookingDeadline), new Date());
    return daysUntilDeadline <= 30;
  });

  function handleStatusChange(vendor: VendorEntry, status: VendorStatus) {
    const updated = { ...vendor, status, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_VENDOR', eventId: activeEvent!.profile.id, vendor: updated });
    toast({ title: 'Status updated', description: `${vendor.requirement} → ${STATUS_LABELS[status]}`, variant: 'success' });
  }

  function handleSave(vendor: VendorEntry) {
    const isNew = !vendors.find((v) => v.id === vendor.id);
    if (isNew) {
      dispatch({ type: 'UPDATE_VENDORS', eventId: activeEvent!.profile.id, vendors: [...vendors, vendor] });
      toast({ title: 'Vendor added', variant: 'success' });
    } else {
      dispatch({ type: 'UPDATE_VENDOR', eventId: activeEvent!.profile.id, vendor });
      toast({ title: 'Vendor saved', variant: 'success' });
    }
    setSelectedVendor(null);
  }

  function handleDelete(vendor: VendorEntry) {
    dispatch({
      type: 'UPDATE_VENDORS',
      eventId: activeEvent!.profile.id,
      vendors: vendors.filter((v) => v.id !== vendor.id),
    });
    toast({ title: 'Vendor deleted', variant: 'default' });
    setSelectedVendor(null);
  }

  function openAdd() {
    setEditVendor(null);
    setDialogOpen(true);
  }

  function openEdit(vendor: VendorEntry) {
    setEditVendor(vendor);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded-brand border p-4 flex flex-col gap-2" style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
            {bookedCount} of {totalCount} vendors booked
          </span>
          <span className="text-xs font-medium" style={{ color: '#C4613A' }}>{bookedPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#D0D3DC' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${bookedPct}%`, background: '#4A7C59' }} />
        </div>
      </div>

      {/* Critical warning */}
      {criticalUnbooked.length > 0 && (
        <div className="rounded-brand border px-4 py-3 flex items-start gap-3" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <AlertTriangle size={16} style={{ color: '#991B1B', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>Critical vendor booking deadline approaching!</p>
            <ul className="mt-1 text-xs space-y-0.5" style={{ color: '#7F1D1D' }}>
              {criticalUnbooked.map((v) => (
                <li key={v.id}>• {v.requirement} — deadline {v.bookingDeadline}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#5A6178' }} />
          <input
            className="w-full rounded-brand border pl-8 pr-3 py-1.5 text-sm outline-none"
            style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <select
          className="rounded-brand border px-2 py-1.5 text-sm outline-none"
          style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as VendorCategory | 'all')}
        >
          <option value="all">All Categories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>

        {/* Status filter */}
        <select
          className="rounded-brand border px-2 py-1.5 text-sm outline-none"
          style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VendorStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex rounded-brand border overflow-hidden" style={{ borderColor: '#D0D3DC' }}>
          <button
            className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
            style={{ background: viewMode === 'board' ? '#C4613A' : '#FDFAF4', color: viewMode === 'board' ? '#FDFAF4' : '#5A6178' }}
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid size={13} /> Board
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-l"
            style={{ borderColor: '#D0D3DC', background: viewMode === 'table' ? '#C4613A' : '#FDFAF4', color: viewMode === 'table' ? '#FDFAF4' : '#5A6178' }}
            onClick={() => setViewMode('table')}
          >
            <List size={13} /> Table
          </button>
        </div>

        {/* Add vendor */}
        <button
          onClick={openAdd}
          className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
          style={{ background: '#C4613A', color: '#FDFAF4' }}
        >
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-brand border border-dashed" style={{ borderColor: '#D0D3DC' }}>
          <p className="text-sm" style={{ color: '#5A6178' }}>No vendors found. Add your first vendor to get started.</p>
          <button onClick={openAdd} className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5" style={{ background: '#C4613A', color: '#FDFAF4' }}>
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      )}

      {/* Views */}
      {filtered.length > 0 && viewMode === 'board' && (
        <VendorBoardView
          vendors={filtered}
          currency={currency}
          onSelect={setSelectedVendor}
          onStatusChange={handleStatusChange}
        />
      )}
      {filtered.length > 0 && viewMode === 'table' && (
        <VendorTableView
          vendors={filtered}
          currency={currency}
          onSelect={setSelectedVendor}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Budget summary */}
      {vendors.length > 0 && (
        <div className="text-xs" style={{ color: '#5A6178' }}>
          Total estimated: <strong style={{ color: '#1A1F2E' }}>{formatCurrency(vendors.reduce((s, v) => s + v.estimatedCost, 0), currency)}</strong>
          {' · '}
          Total quoted: <strong style={{ color: '#065F46' }}>{formatCurrency(vendors.reduce((s, v) => s + (v.quotedCost ?? 0), 0), currency)}</strong>
        </div>
      )}

      {/* Detail drawer */}
      <VendorDetailDrawer
        vendor={selectedVendor}
        currency={currency}
        onClose={() => setSelectedVendor(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Add/Edit dialog */}
      <AddEditVendorDialog
        open={dialogOpen}
        editVendor={editVendor}
        eventId={activeEvent.profile.id}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
