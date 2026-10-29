'use client';

import type { ScheduleConflict } from '@/types/runofshow';

interface Props {
  conflicts: ScheduleConflict[];
}

export function OverlapWarningBanner({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div
      className="rounded-brand border px-4 py-3 flex flex-col gap-2"
      style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
        ⚠️ Schedule conflicts detected ({conflicts.length})
      </p>
      <ul className="text-xs space-y-1" style={{ color: '#78350F' }}>
        {conflicts.map((c, i) => (
          <li key={i}>
            • Block &ldquo;{c.blockTitle}&rdquo; ({c.blockTitle}) overlaps with &ldquo;{c.conflictingBlockTitle}&rdquo; — {c.details}
          </li>
        ))}
      </ul>
    </div>
  );
}
