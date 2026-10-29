'use client';

import { format, parseISO } from 'date-fns';
import type { EventType, CurrencyCode, DietaryRequirement, AccessibilityNeed, EventPriority } from '@/types/event';
import { formatCurrency } from '@/lib/currency';

interface ReviewData {
  eventType?: EventType;
  name?: string;
  date?: string;
  time?: string;
  city?: string;
  guestCount?: number;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  totalBudget?: number;
  currency?: CurrencyCode;
  themeStyles?: string[];
  colorPreferences?: string[];
  dietaryRequirements?: DietaryRequirement[];
  accessibilityNeeds?: AccessibilityNeed[];
  priorities?: EventPriority[];
  culturalNotes?: string;
  hasWeatherBackup?: boolean;
}

interface ReviewStepProps {
  data: ReviewData;
  onGoToStep: (step: number) => void;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: '💍', birthday: '🎂', anniversary: '💑', community: '🎪',
};

function Section({
  label,
  step,
  onEdit,
  children,
}: {
  label: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 border mb-3"
      style={{ borderColor: '#E8E9EE', background: '#FFFFFF' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
          {label}
        </span>
        <button
          onClick={() => onEdit(step)}
          className="text-xs font-medium hover:underline"
          style={{ color: '#C4613A' }}
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export function ReviewStep({ data, onGoToStep }: ReviewStepProps) {
  const currency = data.currency ?? 'INR';

  let formattedDate = data.date ?? '—';
  try {
    if (data.date) formattedDate = format(parseISO(data.date), 'EEEE, dd MMMM yyyy');
  } catch { /* ignore */ }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Review your event
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Everything look right? You can edit any section before generating your plan.
      </p>

      {/* Event type */}
      <Section label="Event type" step={0} onEdit={onGoToStep}>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#1A1F2E' }}>
          <span>{data.eventType ? EVENT_TYPE_ICONS[data.eventType] : '🎉'}</span>
          <span className="capitalize">{data.eventType ?? '—'}</span>
        </div>
      </Section>

      {/* Details */}
      <Section label="Event details" step={1} onEdit={onGoToStep}>
        <div className="space-y-1 text-sm" style={{ color: '#1A1F2E' }}>
          <div><strong>Name:</strong> {data.name || '—'}</div>
          <div><strong>Date:</strong> {formattedDate}</div>
          <div><strong>Time:</strong> {data.time || '—'}</div>
          <div><strong>City:</strong> {data.city || '—'}</div>
        </div>
      </Section>

      {/* Guests */}
      <Section label="Guests & venue" step={2} onEdit={onGoToStep}>
        <div className="space-y-1 text-sm" style={{ color: '#1A1F2E' }}>
          <div><strong>Guest count:</strong> {data.guestCount ?? '—'}</div>
          <div><strong>Venue style:</strong> <span className="capitalize">{data.indoorOutdoor ?? '—'}</span></div>
          {(data.indoorOutdoor === 'outdoor' || data.indoorOutdoor === 'both') && (
            <div><strong>Weather backup:</strong> {data.hasWeatherBackup ? 'Yes' : 'No'}</div>
          )}
        </div>
      </Section>

      {/* Budget */}
      <Section label="Budget" step={3} onEdit={onGoToStep}>
        <div className="text-sm" style={{ color: '#1A1F2E' }}>
          {data.totalBudget ? formatCurrency(data.totalBudget, currency) : '—'}
          {' '}({currency})
        </div>
      </Section>

      {/* Theme */}
      <Section label="Theme" step={4} onEdit={onGoToStep}>
        {(data.themeStyles && data.themeStyles.length > 0) || (data.colorPreferences && data.colorPreferences.length > 0) ? (
          <div className="text-sm space-y-1" style={{ color: '#1A1F2E' }}>
            {data.themeStyles && data.themeStyles.length > 0 && (
              <div><strong>Styles:</strong> {data.themeStyles.join(', ')}</div>
            )}
            {data.colorPreferences && data.colorPreferences.length > 0 && (
              <div><strong>Colours:</strong> {data.colorPreferences.join(', ')}</div>
            )}
          </div>
        ) : (
          <span className="text-sm" style={{ color: '#5A6178' }}>Not specified</span>
        )}
      </Section>

      {/* Dietary */}
      <Section label="Dietary requirements" step={5} onEdit={onGoToStep}>
        {data.dietaryRequirements && data.dietaryRequirements.length > 0 ? (
          <div className="text-sm capitalize" style={{ color: '#1A1F2E' }}>
            {data.dietaryRequirements.join(', ')}
          </div>
        ) : (
          <span className="text-sm" style={{ color: '#5A6178' }}>None specified</span>
        )}
      </Section>

      {/* Accessibility */}
      <Section label="Accessibility" step={6} onEdit={onGoToStep}>
        {data.accessibilityNeeds && data.accessibilityNeeds.length > 0 ? (
          <div className="text-sm capitalize" style={{ color: '#1A1F2E' }}>
            {data.accessibilityNeeds.join(', ')}
          </div>
        ) : (
          <span className="text-sm" style={{ color: '#5A6178' }}>None specified</span>
        )}
      </Section>

      {/* Priorities */}
      <Section label="Priorities" step={7} onEdit={onGoToStep}>
        {data.priorities && data.priorities.length > 0 ? (
          <ol className="text-sm space-y-0.5" style={{ color: '#1A1F2E' }}>
            {data.priorities.map((p, i) => (
              <li key={p}>{i + 1}. <span className="capitalize">{p.replace('-', ' ')}</span></li>
            ))}
          </ol>
        ) : (
          <span className="text-sm" style={{ color: '#5A6178' }}>None specified</span>
        )}
      </Section>

      {/* Traditions */}
      {data.culturalNotes && (
        <Section label="Cultural & traditions" step={8} onEdit={onGoToStep}>
          <p className="text-sm" style={{ color: '#1A1F2E' }}>{data.culturalNotes}</p>
        </Section>
      )}

      <p className="text-xs text-center mt-4" style={{ color: '#5A6178' }}>
        ⏱️ This takes about 2 seconds
      </p>
    </div>
  );
}
