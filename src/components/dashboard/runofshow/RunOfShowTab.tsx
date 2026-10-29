'use client';

import { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import type { ShowBlock } from '@/types/runofshow';
import { Plus, Printer } from 'lucide-react';
import { ShowBlockRow } from './ShowBlockRow';
import { OverlapWarningBanner } from './OverlapWarningBanner';
import { AddEditBlockDialog } from './AddEditBlockDialog';
import { detectScheduleConflicts } from '@/lib/timeline-engine';
import { format, parseISO } from 'date-fns';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function RunOfShowTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<ShowBlock | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!activeEvent) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#5A6178' }}>No event selected.</div>;
  }

  const blocks = activeEvent.runOfShow;
  const profile = activeEvent.profile;
  const eventId = profile.id;

  // Sort blocks by startTime
  const sortedBlocks = [...blocks].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  // Detect conflicts
  const conflicts = detectScheduleConflicts(blocks);

  // Total event duration
  const totalMinutes = sortedBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  function formatTotal(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  let eventDateFormatted = profile.date;
  try {
    eventDateFormatted = format(parseISO(profile.date), 'EEEE, d MMMM yyyy');
  } catch { /* keep ISO string */ }

  function handleSave(block: ShowBlock) {
    const isNew = !blocks.find((b) => b.id === block.id);
    const updated = isNew ? [...blocks, block] : blocks.map((b) => b.id === block.id ? block : b);
    dispatch({ type: 'UPDATE_RUN_OF_SHOW', eventId, blocks: updated });
    toast({ title: isNew ? 'Block added' : 'Block updated', variant: 'success' });
  }

  function handleDelete(block: ShowBlock) {
    if (confirmDeleteId !== block.id) {
      setConfirmDeleteId(block.id);
      return;
    }
    dispatch({
      type: 'UPDATE_RUN_OF_SHOW',
      eventId,
      blocks: blocks.filter((b) => b.id !== block.id),
    });
    toast({ title: 'Block deleted', variant: 'default' });
    setConfirmDeleteId(null);
  }

  function openEdit(block: ShowBlock) {
    setEditBlock(block);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditBlock(null);
    setDialogOpen(true);
  }

  return (
    <>
      <style>{`
        @media print {
          .ros-toolbar { display: none !important; }
          .ros-conflict-banner { display: none !important; }
          .ros-action-btns { display: none !important; }
          .ros-container { padding: 0; }
          body { background: white; }
        }
      `}</style>

      <div className="ros-container flex flex-col gap-4">
        {/* Header */}
        <div className="ros-toolbar flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold" style={{ color: '#1A1F2E' }}>Run of Show</h2>
            <p className="text-xs" style={{ color: '#5A6178' }}>{eventDateFormatted}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-brand border px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
              style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={openAdd}
              className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
              style={{ background: '#C4613A', color: '#FDFAF4' }}
            >
              <Plus size={14} /> Add Block
            </button>
          </div>
        </div>

        {/* Conflict warning */}
        <div className="ros-conflict-banner">
          <OverlapWarningBanner conflicts={conflicts} />
        </div>

        {/* Confirm delete banner */}
        {confirmDeleteId && (
          <div className="rounded-brand border px-4 py-3 flex items-center justify-between gap-3" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <span className="text-sm" style={{ color: '#991B1B' }}>Delete this block? This cannot be undone.</span>
            <div className="flex gap-2 shrink-0 ros-action-btns">
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-brand border px-3 py-1 text-xs" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  const block = blocks.find((b) => b.id === confirmDeleteId);
                  if (block) handleDelete(block);
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
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-brand border border-dashed" style={{ borderColor: '#D0D3DC' }}>
            <p className="text-sm font-medium" style={{ color: '#1A1F2E' }}>No schedule blocks yet.</p>
            <p className="text-xs" style={{ color: '#5A6178' }}>Add your first block to build the run of show.</p>
            <button
              onClick={openAdd}
              className="rounded-brand px-3 py-1.5 text-sm font-medium flex items-center gap-1.5"
              style={{ background: '#C4613A', color: '#FDFAF4' }}
            >
              <Plus size={14} /> Add Block
            </button>
          </div>
        )}

        {/* Timeline */}
        {sortedBlocks.length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedBlocks.map((block) => (
              <ShowBlockRow
                key={block.id}
                block={block}
                onEdit={openEdit}
                onDelete={(b) => setConfirmDeleteId(b.id)}
              />
            ))}
          </div>
        )}

        {/* Duration summary */}
        {sortedBlocks.length > 0 && (
          <div className="text-xs pt-2 border-t" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
            <strong style={{ color: '#1A1F2E' }}>{sortedBlocks.length}</strong> blocks ·{' '}
            Total scheduled duration: <strong style={{ color: '#1A1F2E' }}>{formatTotal(totalMinutes)}</strong>
          </div>
        )}

        {/* Add/Edit dialog */}
        <AddEditBlockDialog
          open={dialogOpen}
          editBlock={editBlock}
          allBlocks={blocks}
          eventId={eventId}
          onClose={() => { setDialogOpen(false); setEditBlock(null); }}
          onSubmit={handleSave}
        />
      </div>
    </>
  );
}
