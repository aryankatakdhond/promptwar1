'use client';

import type { Guest } from '@/types/guest';

interface Props {
  guests: Guest[];
}

export function GuestTotalsBar({ guests }: Props) {
  const total = guests.length;
  const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length;
  const pending = guests.filter((g) => g.rsvpStatus === 'pending').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'declined').length;

  // Plus-ones
  const plusOnesAccepted = guests.filter((g) => g.hasPlusOne && g.plusOneRsvp === 'accepted').length;

  // Dietary & accessibility
  const dietaryCount = guests.filter((g) => g.dietaryRequirements.length > 0).length;
  const accessibilityCount = guests.filter((g) => g.accessibilityNeeds.length > 0).length;

  const chips = [
    { label: 'Invited', value: total, bg: '#F0F1F4', text: '#1A1F2E', border: '#D0D3DC' },
    { label: 'Accepted', value: accepted, bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    { label: 'Pending', value: pending, bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
    { label: 'Declined', value: declined, bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  ];

  const secondary = [
    { label: 'Plus-ones accepted', value: plusOnesAccepted },
    { label: 'Dietary requirements', value: dietaryCount },
    { label: 'Accessibility needs', value: accessibilityCount },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Main stat chips */}
      <div className="grid grid-cols-4 gap-3">
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-brand border p-3 flex flex-col gap-0.5"
            style={{ background: chip.bg, borderColor: chip.border }}
          >
            <span className="text-2xl font-bold" style={{ color: chip.text }}>{chip.value}</span>
            <span className="text-xs font-medium" style={{ color: chip.text }}>{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="flex gap-4 text-xs" style={{ color: '#5A6178' }}>
        {secondary.map((s) => (
          <span key={s.label}>
            <strong style={{ color: '#1A1F2E' }}>{s.value}</strong> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
