'use client';

import type { EventPriority } from '@/types/event';

interface PrioritiesStepProps {
  selected: EventPriority[];
  onChange: (items: EventPriority[]) => void;
}

const PRIORITY_OPTIONS: { value: EventPriority; icon: string; label: string }[] = [
  { value: 'photography', icon: '📸', label: 'Photography' },
  { value: 'catering', icon: '🍽️', label: 'Catering' },
  { value: 'venue', icon: '🏛️', label: 'Venue' },
  { value: 'entertainment', icon: '🎵', label: 'Entertainment' },
  { value: 'decor', icon: '🌸', label: 'Décor' },
  { value: 'guest-experience', icon: '⭐', label: 'Guest Experience' },
];

const MAX_PRIORITIES = 3;

export function PrioritiesStep({ selected, onChange }: PrioritiesStepProps) {
  function togglePriority(value: EventPriority) {
    if (selected.includes(value)) {
      onChange(selected.filter((p) => p !== value));
    } else if (selected.length < MAX_PRIORITIES) {
      onChange([...selected, value]);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Top priorities
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Select your top {MAX_PRIORITIES} priorities. Budget allocation will favour these areas.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PRIORITY_OPTIONS.map(({ value, icon, label }) => {
          const rank = selected.indexOf(value);
          const isSelected = rank !== -1;
          const isDisabled = !isSelected && selected.length >= MAX_PRIORITIES;

          return (
            <button
              key={value}
              onClick={() => togglePriority(value)}
              disabled={isDisabled}
              className="rounded-xl p-4 border text-left flex items-center gap-3 transition-all"
              style={{
                borderColor: isSelected ? '#C4613A' : '#D0D3DC',
                background: isSelected ? '#FDF2EC' : isDisabled ? '#F8F8F8' : '#FFFFFF',
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: '#1A1F2E' }}>{label}</div>
              </div>
              {isSelected && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: '#C4613A' }}
                >
                  {rank + 1}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div
          className="rounded-xl p-4 border"
          style={{ borderColor: '#C4613A', background: '#FDF2EC' }}
        >
          <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#C4613A' }}>
            Your Top Priorities
          </div>
          <ol className="space-y-1">
            {selected.map((p, i) => {
              const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
              return (
                <li key={p} className="text-sm flex items-center gap-2" style={{ color: '#1A1F2E' }}>
                  <span className="font-bold" style={{ color: '#C4613A' }}>{i + 1}.</span>
                  <span>{opt?.icon}</span>
                  <span>{opt?.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
