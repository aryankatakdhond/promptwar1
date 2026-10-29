'use client';

import type { EventType } from '@/types/event';

interface EventTypeStepProps {
  selected?: EventType;
  onSelect: (type: EventType) => void;
}

const EVENT_TYPES: { type: EventType; icon: string; label: string; description: string }[] = [
  {
    type: 'wedding',
    icon: '💍',
    label: 'Wedding',
    description: 'A beautiful ceremony and celebration of love with family and friends.',
  },
  {
    type: 'birthday',
    icon: '🎂',
    label: 'Birthday',
    description: 'A joyful milestone celebration — from intimate gatherings to grand parties.',
  },
  {
    type: 'anniversary',
    icon: '💑',
    label: 'Anniversary',
    description: 'Honour a special bond with a heartfelt, memorable occasion.',
  },
  {
    type: 'community',
    icon: '🎪',
    label: 'Community Event',
    description: 'Bring people together for festivals, fairs, and large-scale gatherings.',
  },
];

export function EventTypeStep({ selected, onSelect }: EventTypeStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        What are you celebrating?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Select the type of event you&apos;re planning.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {EVENT_TYPES.map(({ type, icon, label, description }) => {
          const isSelected = selected === type;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="rounded-xl p-5 border text-left transition-all hover:border-[#C4613A]"
              style={{
                borderColor: isSelected ? '#C4613A' : '#D0D3DC',
                background: isSelected ? '#FDF2EC' : '#FFFFFF',
                boxShadow: isSelected ? '0 0 0 2px #C4613A33' : 'none',
              }}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#1A1F2E' }}>
                {label}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#5A6178' }}>
                {description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
