'use client';

import type { DietaryRequirement } from '@/types/event';

interface DietaryStepProps {
  selected: DietaryRequirement[];
  onChange: (items: DietaryRequirement[]) => void;
}

const DIETARY_OPTIONS: { value: DietaryRequirement; label: string; emoji: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'halal', label: 'Halal', emoji: '🌙' },
  { value: 'kosher', label: 'Kosher', emoji: '✡️' },
  { value: 'nut-free', label: 'Nut-free', emoji: '🥜' },
  { value: 'gluten-free', label: 'Gluten-free', emoji: '🌾' },
  { value: 'dairy-free', label: 'Dairy-free', emoji: '🥛' },
  { value: 'other', label: 'Other', emoji: '➕' },
];

function toggle(arr: DietaryRequirement[], item: DietaryRequirement): DietaryRequirement[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function DietaryStep({ selected, onChange }: DietaryStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Dietary requirements
      </h2>
      <p className="text-sm mb-2" style={{ color: '#5A6178' }}>
        Select all that apply for your guests.
      </p>
      <p className="text-xs mb-6 p-3 rounded-lg" style={{ color: '#5A6178', background: '#F0F1F4' }}>
        We&apos;ll plan catering and vendor requirements to accommodate these needs.
      </p>

      <div className="space-y-2">
        {DIETARY_OPTIONS.map(({ value, label, emoji }) => {
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
