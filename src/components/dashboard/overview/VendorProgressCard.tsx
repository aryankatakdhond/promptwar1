'use client';

import { useEvent } from '@/hooks/useEvent';
import { Skeleton } from '@/components/ui/skeleton';
import type { VendorStatus } from '@/types/vendor';

const STATUS_LABELS: Record<VendorStatus, string> = {
  'booked': 'Booked',
  'quote-received': 'Quote Received',
  'contacted': 'Contacted',
  'researching': 'Researching',
  'not-started': 'Not Started',
  'cancelled': 'Cancelled',
};

const STATUS_COLORS: Record<VendorStatus, string> = {
  'booked': '#7A9E7E',
  'quote-received': '#C9A84C',
  'contacted': '#3B82F6',
  'researching': '#8A90A4',
  'not-started': '#D0D3DC',
  'cancelled': '#C4613A',
};

const STATUS_BG: Record<VendorStatus, string> = {
  'booked': '#EFF5F0',
  'quote-received': '#FBF6E8',
  'contacted': '#EFF6FF',
  'researching': '#F0F1F4',
  'not-started': '#F7F8FA',
  'cancelled': '#FAF0EB',
};

const STATUS_ORDER: VendorStatus[] = [
  'booked',
  'quote-received',
  'contacted',
  'researching',
  'not-started',
];

export function VendorProgressCard() {
  const { activeEvent } = useEvent();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const vendors = activeEvent.vendors;
  const total = vendors.length;
  const booked = vendors.filter((v) => v.status === 'booked').length;
  const progressPercent = total > 0 ? Math.round((booked / total) * 100) : 0;

  // Count by status
  const statusCounts: Partial<Record<VendorStatus, number>> = {};
  for (const v of vendors) {
    statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1;
  }

  const criticalUnbooked = vendors.filter(
    (v) => v.isCritical && v.status !== 'booked' && v.status !== 'cancelled',
  );

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: '#E8E9EE' }}>
      <h3 className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>Vendor Bookings</h3>

      {/* Big stat */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold" style={{ color: '#1A1F2E' }}>{booked}</span>
        <span className="text-sm pb-1" style={{ color: '#5A6178' }}>of {total} booked</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: '#5A6178' }}>
          <span>Booking rate</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: '#F0F1F4' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%`, background: '#7A9E7E' }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="space-y-1.5">
        {STATUS_ORDER.map((status) => {
          const count = statusCounts[status] ?? 0;
          if (count === 0) return null;
          return (
            <div key={status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STATUS_COLORS[status] }}
                />
                <span style={{ color: '#5A6178' }}>{STATUS_LABELS[status]}</span>
              </div>
              <span
                className="font-medium px-1.5 py-0.5 rounded"
                style={{ background: STATUS_BG[status], color: STATUS_COLORS[status] }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Critical vendors summary */}
      {criticalUnbooked.length > 0 && (
        <div
          className="text-xs rounded-lg px-3 py-2"
          style={{ background: '#FAF0EB', color: '#A8522F' }}
        >
          ⚠ {criticalUnbooked.length} critical vendor{criticalUnbooked.length !== 1 ? 's' : ''} not yet booked
        </div>
      )}

      {total === 0 && (
        <p className="text-xs" style={{ color: '#8A90A4' }}>No vendors added yet.</p>
      )}
    </div>
  );
}
