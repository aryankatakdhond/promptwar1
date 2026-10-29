'use client';

interface Props {
  confirmedCount: number;
  venueCapacity: number;
}

export function CapacityWarning({ confirmedCount, venueCapacity }: Props) {
  if (confirmedCount <= venueCapacity) return null;

  const over = confirmedCount - venueCapacity;

  return (
    <div
      className="rounded-brand border px-4 py-3 flex items-start gap-3"
      style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
    >
      <span className="text-base" style={{ flexShrink: 0 }}>⚠️</span>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>Venue capacity exceeded!</p>
        <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>
          You have <strong>{confirmedCount}</strong> confirmed guests but your venue capacity is{' '}
          <strong>{venueCapacity}</strong>. That&apos;s <strong>{over}</strong> over capacity.
        </p>
      </div>
    </div>
  );
}
