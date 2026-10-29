'use client';

import type { VendorEntry, VendorStatus } from '@/types/vendor';
import { formatCurrency } from '@/lib/currency';
import type { CurrencyCode } from '@/types/event';
import {
  Building2, UtensilsCrossed, Camera, Video, Sparkles, Music,
  Car, Users, Cake, Flower2, Scissors, Shirt, Mail, Monitor,
  Shield, Package, AlertTriangle, CalendarClock,
} from 'lucide-react';

export const VENDOR_STATUSES: VendorStatus[] = [
  'not-started', 'researching', 'contacted', 'quote-received', 'booked', 'cancelled',
];

export const STATUS_LABELS: Record<VendorStatus, string> = {
  'not-started': 'Not Started',
  'researching': 'Researching',
  'contacted': 'Contacted',
  'quote-received': 'Quote Received',
  'booked': 'Booked',
  'cancelled': 'Cancelled',
};

export const STATUS_COLORS: Record<VendorStatus, { bg: string; text: string; border: string }> = {
  'not-started': { bg: '#F0F1F4', text: '#5A6178', border: '#D0D3DC' },
  'researching': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'contacted': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'quote-received': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'booked': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'cancelled': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
};

export function getCategoryIcon(category: VendorEntry['category'], size = 14) {
  const props = { size, style: { color: '#5A6178' } };
  switch (category) {
    case 'venue': return <Building2 {...props} />;
    case 'catering': return <UtensilsCrossed {...props} />;
    case 'photography': return <Camera {...props} />;
    case 'videography': return <Video {...props} />;
    case 'decor': return <Sparkles {...props} />;
    case 'entertainment': return <Music {...props} />;
    case 'transport': return <Car {...props} />;
    case 'staffing': return <Users {...props} />;
    case 'bakery': return <Cake {...props} />;
    case 'florist': return <Flower2 {...props} />;
    case 'beauty': return <Scissors {...props} />;
    case 'attire': return <Shirt {...props} />;
    case 'invitations': return <Mail {...props} />;
    case 'audio-visual': return <Monitor {...props} />;
    case 'security': return <Shield {...props} />;
    default: return <Package {...props} />;
  }
}

export const CATEGORY_LABELS: Record<VendorEntry['category'], string> = {
  venue: 'Venue', catering: 'Catering', photography: 'Photography',
  videography: 'Videography', decor: 'Decor', entertainment: 'Entertainment',
  transport: 'Transport', staffing: 'Staffing', bakery: 'Bakery',
  florist: 'Florist', beauty: 'Beauty', attire: 'Attire',
  invitations: 'Invitations', 'audio-visual': 'Audio/Visual', security: 'Security', other: 'Other',
};

interface Props {
  vendors: VendorEntry[];
  currency: CurrencyCode;
  onSelect: (vendor: VendorEntry) => void;
  onStatusChange: (vendor: VendorEntry, status: VendorStatus) => void;
}

export function VendorBoardView({ vendors, currency, onSelect, onStatusChange }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
      {VENDOR_STATUSES.map((status) => {
        const col = vendors.filter((v) => v.status === status);
        const colors = STATUS_COLORS[status];
        return (
          <div key={status} className="flex-shrink-0 w-56 flex flex-col gap-2">
            {/* Column header */}
            <div
              className="flex items-center justify-between px-2 py-1.5 rounded-brand border"
              style={{ background: colors.bg, borderColor: colors.border }}
            >
              <span className="text-xs font-semibold" style={{ color: colors.text }}>
                {STATUS_LABELS[status]}
              </span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: colors.border, color: colors.text }}
              >
                {col.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {col.length === 0 && (
                <div className="rounded-brand border border-dashed px-3 py-4 text-center text-xs" style={{ borderColor: '#D0D3DC', color: '#5A6178' }}>
                  None
                </div>
              )}
              {col.map((v) => (
                <div
                  key={v.id}
                  className="rounded-brand border p-2.5 flex flex-col gap-1.5 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ background: '#FDFAF4', borderColor: '#D0D3DC' }}
                  onClick={() => onSelect(v)}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(v.category)}
                    <span className="text-xs font-medium truncate flex-1" style={{ color: '#1A1F2E' }}>
                      {v.businessName || v.requirement}
                    </span>
                  </div>
                  {v.businessName && (
                    <span className="text-xs truncate" style={{ color: '#5A6178' }}>{v.requirement}</span>
                  )}

                  {/* Cost */}
                  <span className="text-xs font-semibold" style={{ color: '#C4613A' }}>
                    {formatCurrency(v.quotedCost ?? v.estimatedCost, currency)}
                  </span>

                  {/* Deadline */}
                  <div className="flex items-center gap-1">
                    <CalendarClock size={11} style={{ color: '#5A6178' }} />
                    <span className="text-xs" style={{ color: '#5A6178' }}>{v.bookingDeadline}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1 flex-wrap">
                    {v.isCritical && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                        Critical
                      </span>
                    )}
                    {v.isIllustrative && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                        Demo
                      </span>
                    )}
                  </div>

                  {/* Status change dropdown */}
                  <select
                    className="text-xs rounded-brand border px-1.5 py-1 mt-0.5 w-full"
                    style={{ borderColor: '#D0D3DC', background: '#F0F1F4', color: '#1A1F2E' }}
                    value={v.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(v, e.target.value as VendorStatus);
                    }}
                  >
                    {VENDOR_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Re-export warning icon helper for use in VendorsTab
export { AlertTriangle };
