'use client';

import type { VendorEntry, VendorStatus } from '@/types/vendor';
import { formatCurrency } from '@/lib/currency';
import type { CurrencyCode } from '@/types/event';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getCategoryIcon, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS } from './VendorBoardView';

type SortKey = 'category' | 'requirement' | 'status' | 'estimatedCost' | 'bookingDeadline';

interface Props {
  vendors: VendorEntry[];
  currency: CurrencyCode;
  onSelect: (vendor: VendorEntry) => void;
  onEdit: (vendor: VendorEntry) => void;
  onDelete: (vendor: VendorEntry) => void;
}

export function VendorTableView({ vendors, currency, onSelect, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('bookingDeadline');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = [...vendors].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'category': cmp = a.category.localeCompare(b.category); break;
      case 'requirement': cmp = (a.businessName || a.requirement).localeCompare(b.businessName || b.requirement); break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'estimatedCost': cmp = a.estimatedCost - b.estimatedCost; break;
      case 'bookingDeadline': cmp = a.bookingDeadline.localeCompare(b.bookingDeadline); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  function SortBtn({ col }: { col: SortKey }) {
    return (
      <button onClick={() => toggleSort(col)} className="ml-1 opacity-50 hover:opacity-100">
        <ArrowUpDown size={11} />
      </button>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <span className="text-sm" style={{ color: '#5A6178' }}>No vendors found.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-brand border" style={{ borderColor: '#D0D3DC' }}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: '#F0F1F4' }}>
            {([
              ['Category', 'category'],
              ['Name / Requirement', 'requirement'],
              ['Status', 'status'],
              ['Estimated', 'estimatedCost'],
              ['Quoted', null],
              ['Deadline', 'bookingDeadline'],
              ['Critical', null],
              ['Actions', null],
            ] as [string, SortKey | null][]).map(([label, key]) => (
              <th
                key={label}
                className="px-2.5 py-2 text-left font-semibold border-b"
                style={{ color: '#5A6178', borderColor: '#D0D3DC', whiteSpace: 'nowrap' }}
              >
                {label}
                {key && <SortBtn col={key} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((v) => {
            const sc = STATUS_COLORS[v.status as VendorStatus];
            return (
              <tr
                key={v.id}
                className="border-b hover:bg-ivory/50 cursor-pointer transition-colors"
                style={{ borderColor: '#D0D3DC' }}
                onClick={() => onSelect(v)}
              >
                <td className="px-2.5 py-2">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(v.category)}
                    <span style={{ color: '#5A6178' }}>{CATEGORY_LABELS[v.category]}</span>
                  </div>
                </td>
                <td className="px-2.5 py-2" style={{ color: '#1A1F2E' }}>
                  <div className="flex flex-col">
                    <span className="font-medium">{v.businessName || v.requirement}</span>
                    {v.businessName && <span className="text-xs opacity-60">{v.requirement}</span>}
                    {v.isIllustrative && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full w-fit mt-0.5" style={{ background: '#F5F3FF', color: '#6D28D9' }}>
                        Demo
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2.5 py-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                  >
                    {STATUS_LABELS[v.status]}
                  </span>
                </td>
                <td className="px-2.5 py-2 font-medium" style={{ color: '#1A1F2E' }}>
                  {formatCurrency(v.estimatedCost, currency)}
                </td>
                <td className="px-2.5 py-2" style={{ color: v.quotedCost ? '#065F46' : '#5A6178' }}>
                  {v.quotedCost ? formatCurrency(v.quotedCost, currency) : '—'}
                </td>
                <td className="px-2.5 py-2" style={{ color: '#5A6178' }}>{v.bookingDeadline}</td>
                <td className="px-2.5 py-2 text-center">
                  {v.isCritical ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#991B1B' }}>
                      ✓
                    </span>
                  ) : '—'}
                </td>
                <td className="px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1 rounded hover:bg-midnight-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} style={{ color: '#5A6178' }} />
                    </button>
                    <button
                      onClick={() => onDelete(v)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} style={{ color: '#C4613A' }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
