'use client';

import type { AccessibilityNeed } from '@/types/event';

interface AccessibilityStepProps {
  selected: AccessibilityNeed[];
  onChange: (items: AccessibilityNeed[]) => void;
}

const ACCESSIBILITY_OPTIONS: { value: AccessibilityNeed; label: string; emoji: string }[] = [
  { value: 'wheelchair', label: 'Wheelchair accessible', emoji: '♿' },
  { value: 'hearing-impaired', label: 'Hearing accommodations', emoji: '👂' },
  { value: 'visually-impaired', label: 'Visual accommodations', emoji: '👁️' },
  { value: 'mixed-ages', label: 'Mixed ages (children + elderly)', emoji: '👨‍👩‍👧‍👦' },
  { value: 'mobility-limited', label: 'Mobility limited', emoji: '🦽' },
  { value: 'other', label: 'Other', emoji: '➕' },
];

function toggle(arr: AccessibilityNeed[], item: AccessibilityNeed): AccessibilityNeed[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function AccessibilityStep({ selected, onChange }: AccessibilityStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Accessibility needs
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Select any accessibility requirements for your guests. We&apos;ll factor these into venue and vendor recommendations.
      </p>

      <div className="space-y-2">
        {ACCESSIBILITY_OPTIONS.map(({ value, label, emoji }) => {
          const isChecked = selected.includes(value);
          return (
            <label
              key={value}
              className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-[#C4613A]"
              style={{
                borderColor: isChecked ? '#C4613A' : '#D0D3DC',
                background: isChecked ? '#FDF2EC' : '#FFFFFF',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(toggle(selected, value))}
                className="accent-[#C4613A] w-4 h-4"
              />
              <span className="text-base">{emoji}</span>
              <span className="text-sm font-medium" style={{ color: '#1A1F2E' }}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
