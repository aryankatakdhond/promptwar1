'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import type { CompressWarning } from '@/lib/timeline-engine';

interface Props {
  warnings: CompressWarning[];
  isRisky: boolean;
}

export function CompressScheduleWarning({ warnings, isRisky }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!isRisky || warnings.length === 0) return null;

  return (
    <div
      className="rounded-brand border px-4 py-3 flex flex-col gap-2"
      style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: '#991B1B' }} />
          <span className="text-sm font-semibold" style={{ color: '#991B1B' }}>
            Your schedule needs attention
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: '#991B1B' }}
        >
          {expanded ? 'Hide' : 'Show details'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <ul className="flex flex-col gap-1.5 pt-1">
          {warnings.map((w) => (
            <li key={w.taskId} className="flex items-start gap-2 text-xs" style={{ color: '#7F1D1D' }}>
              <span className="mt-0.5">•</span>
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
