'use client';

import type { EventType, CurrencyCode } from '@/types/event';
import { formatCurrency, CURRENCY_CODES } from '@/lib/currency';

interface BudgetData {
  totalBudget?: number;
  currency?: CurrencyCode;
  eventType?: EventType;
  guestCount?: number;
}

interface BudgetStepProps {
  data: BudgetData;
  onChange: (updates: Partial<BudgetData>) => void;
}

const BUDGET_HINTS: Record<EventType, { low: number; mid: number; high: number }> = {
  wedding: { low: 500000, mid: 1500000, high: 5000000 },
  birthday: { low: 50000, mid: 200000, high: 1000000 },
  anniversary: { low: 100000, mid: 400000, high: 1500000 },
  community: { low: 200000, mid: 800000, high: 3000000 },
};

export function BudgetStep({ data, onChange }: BudgetStepProps) {
  const currency = data.currency ?? 'INR';
  const budget = data.totalBudget ?? 0;
  const hints = data.eventType ? BUDGET_HINTS[data.eventType] : null;

  const currencySymbols: Record<CurrencyCode, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED', SGD: 'S$',
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Budget
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Set your total event budget. This drives all financial planning.
      </p>

      {/* Currency */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => onChange({ currency: e.target.value as CurrencyCode })}
          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
          style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>

      {/* Total Budget */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
          Total budget
        </label>
        <div className="flex items-center border rounded-lg overflow-hidden"
          style={{ borderColor: '#D0D3DC', background: '#FDFAF4' }}>
          <span
            className="px-3 py-2 text-sm border-r font-medium"
            style={{ borderColor: '#D0D3DC', color: '#5A6178', background: '#F0F1F4' }}
          >
            {currencySymbols[currency]}
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            value={budget || ''}
            onChange={(e) => onChange({ totalBudget: Math.max(0, parseInt(e.target.value) || 0) })}
            placeholder="0"
            className="flex-1 px-3 py-2 text-sm outline-none"
            style={{ background: '#FDFAF4', color: '#1A1F2E' }}
          />
        </div>
        {budget > 0 && (
          <p className="text-xs mt-1" style={{ color: '#5A6178' }}>
            {formatCurrency(budget, currency)}
          </p>
        )}
      </div>

      {/* Budget hints */}
      {hints && (
        <div
          className="rounded-xl p-4 border"
          style={{ borderColor: '#D0D3DC', background: '#FFFFFF' }}
        >
          <div className="text-xs font-medium mb-3" style={{ color: '#5A6178' }}>
            TYPICAL RANGES{data.eventType ? ` FOR ${data.eventType.toUpperCase()}` : ''}{data.guestCount ? ` · ${data.guestCount} GUESTS` : ''}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Budget', amount: hints.low },
              { label: 'Mid-range', amount: hints.mid },
              { label: 'Premium', amount: hints.high },
            ].map(({ label, amount }) => (
              <button
                key={label}
                onClick={() => onChange({ totalBudget: amount })}
                className="rounded-lg p-3 border text-center transition-all hover:border-[#C4613A]"
                style={{
                  borderColor: budget === amount ? '#C4613A' : '#E8E9EE',
                  background: budget === amount ? '#FDF2EC' : '#FAFAFA',
                }}
              >
                <div className="text-xs font-medium mb-0.5" style={{ color: '#1A1F2E' }}>{label}</div>
                <div className="text-xs" style={{ color: '#5A6178' }}>{formatCurrency(amount, currency)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs mt-4" style={{ color: '#5A6178' }}>
        💡 A 10% contingency buffer is automatically included in your plan.
      </p>
    </div>
  );
}
