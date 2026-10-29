'use client';

import type { ShowBlock, BlockCategory } from '@/types/runofshow';
import { Pencil, Trash2, ClipboardList } from 'lucide-react';

const CATEGORY_COLORS: Record<BlockCategory, { bg: string; text: string; border: string }> = {
  setup:          { bg: '#F0F1F4', text: '#5A6178', border: '#D0D3DC' },
  arrival:        { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  ceremony:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  reception:      { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  dining:         { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  entertainment:  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  activity:       { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  departure:      { bg: '#F4F4F5', text: '#52525B', border: '#D4D4D8' },
  breakdown:      { bg: '#F4F4F5', text: '#52525B', border: '#D4D4D8' },
  other:          { bg: '#FDFAF4', text: '#5A6178', border: '#D0D3DC' },
};

const CATEGORY_ICONS: Record<BlockCategory, string> = {
  setup: '🔧', arrival: '🚪', ceremony: '💍', reception: '🎉',
  dining: '🍽️', entertainment: '🎵', activity: '🎯',
  departure: '🚗', breakdown: '📦', other: '📋',
};

interface Props {
  block: ShowBlock;
  onEdit: (block: ShowBlock) => void;
  onDelete: (block: ShowBlock) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ShowBlockRow({ block, onEdit, onDelete }: Props) {
  const colors = CATEGORY_COLORS[block.category];
  const icon = CATEGORY_ICONS[block.category];

  return (
    <div
      className="rounded-brand border flex items-start gap-3 px-4 py-3"
      style={{ background: '#FDFAF4', borderColor: colors.border, borderLeft: `4px solid ${colors.border}` }}
    >
      {/* Time column */}
      <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
        <span className="text-xs font-bold" style={{ color: '#1A1F2E' }}>
          {block.startTime} – {block.endTime}
        </span>
        <span className="text-xs" style={{ color: '#5A6178' }}>
          {formatDuration(block.durationMinutes)}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>{block.title}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {block.category}
          </span>
        </div>

        {block.description && (
          <p className="text-xs mt-1" style={{ color: '#5A6178' }}>{block.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {(block.location || block.zone) && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0F1F4', color: '#5A6178' }}>
              📍 {block.location || block.zone}
            </span>
          )}
          {block.responsiblePerson && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
              👤 {block.responsiblePerson}
            </span>
          )}
          {block.backupNotes && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#5A6178' }} title="Has backup notes">
              <ClipboardList size={12} /> Backup plan
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(block)}
          className="p-1 rounded hover:bg-midnight-50 transition-colors"
          title="Edit block"
        >
          <Pencil size={14} style={{ color: '#5A6178' }} />
        </button>
        <button
          onClick={() => onDelete(block)}
          className="p-1 rounded hover:bg-red-50 transition-colors"
          title="Delete block"
        >
          <Trash2 size={14} style={{ color: '#C4613A' }} />
        </button>
      </div>
    </div>
  );
}
