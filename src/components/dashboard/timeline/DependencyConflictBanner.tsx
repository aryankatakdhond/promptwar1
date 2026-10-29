'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { DependencyConflict } from '@/types/timeline';

interface Props {
  conflicts: DependencyConflict[];
  onViewTask: (taskId: string) => void;
}

export function DependencyConflictBanner({ conflicts, onViewTask }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (conflicts.length === 0) return null;

  return (
    <div
      className="rounded-brand border px-4 py-3 flex flex-col gap-2"
      style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: '#92400E' }} />
          <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
            {conflicts.length} dependency conflict{conflicts.length !== 1 ? 's' : ''} detected
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: '#92400E' }}
        >
          {expanded ? 'Hide' : 'Show'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <ul className="flex flex-col gap-1.5 pt-1">
          {conflicts.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#78350F' }}>
              <span className="mt-0.5">•</span>
              <span className="flex-1">
                &ldquo;{c.taskTitle}&rdquo; is due before &ldquo;{c.conflictingTaskTitle}&rdquo;
                which it depends on.
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onViewTask(c.taskId)}
                  className="underline"
                  style={{ color: '#92400E' }}
                >
                  View task
                </button>
                <button
                  onClick={() => onViewTask(c.conflictingTaskId)}
                  className="underline"
                  style={{ color: '#92400E' }}
                >
                  View dep
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
