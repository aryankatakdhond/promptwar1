'use client';

import { useEvent } from '@/hooks/useEvent';
import { Skeleton } from '@/components/ui/skeleton';

export function RSVPCard() {
  const { activeEvent } = useEvent();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const guests = activeEvent.guests;
  const total = guests.length;
  const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length;
  const pending = guests.filter((g) => g.rsvpStatus === 'pending').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'declined').length;

  // Plus-ones
  const plusOnes = guests.filter(
    (g) => g.hasPlusOne && g.plusOneRsvp === 'accepted',
  ).length;

  // Dietary + accessibility
  const dietaryCount = guests.filter((g) => g.dietaryRequirements.length > 0).length;
  const accessibilityCount = guests.filter((g) => g.accessibilityNeeds.length > 0).length;

  const stats = [
    { label: 'Accepted', count: accepted, color: '#7A9E7E', bg: '#EFF5F0' },
    { label: 'Pending', count: pending, color: '#C9A84C', bg: '#FBF6E8' },
    { label: 'Declined', count: declined, color: '#C4613A', bg: '#FAF0EB' },
  ];

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: '#E8E9EE' }}>
      <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Guest RSVPs</h3>

      {/* Large confirmed stat */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold" style={{ color: '#7A9E7E' }}>
          {accepted}
        </span>
        <span className="text-sm pb-1" style={{ color: '#5A6178' }}>
          confirmed of {total}
        </span>
      </div>

      {/* 3 stat cols */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg py-2 px-1"
            style={{ background: s.bg }}
          >
            <div className="font-bold text-base" style={{ color: s.color }}>
              {s.count}
            </div>
            <div style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Plus-ones + dietary */}
      <div className="space-y-1 text-xs" style={{ color: '#5A6178' }}>
        {plusOnes > 0 && (
          <div>+{plusOnes} plus-one{plusOnes !== 1 ? 's' : ''} confirmed</div>
        )}
        {dietaryCount > 0 && (
          <div>🍽 {dietaryCount} with dietary requirements</div>
        )}
        {accessibilityCount > 0 && (
          <div>♿ {accessibilityCount} with accessibility needs</div>
        )}
        {total === 0 && <div>No guests added yet.</div>}
      </div>
    </div>
  );
}
