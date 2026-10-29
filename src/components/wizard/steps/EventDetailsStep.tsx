'use client';

interface EventDetailsData {
  name?: string;
  date?: string;
  time?: string;
  city?: string;
}

interface EventDetailsStepProps {
  data: EventDetailsData;
  errors: Record<string, string>;
  onChange: (field: keyof EventDetailsData, value: string) => void;
}

export function EventDetailsStep({ data, errors, onChange }: EventDetailsStepProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Event details
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Tell us the basics about your event.
      </p>
      <div className="space-y-4">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
            Event name <span style={{ color: '#C4613A' }}>*</span>
          </label>
          <input
            type="text"
            value={data.name ?? ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. Priya & Arjun's Wedding"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
            style={{
              borderColor: errors.name ? '#E53935' : '#D0D3DC',
              background: '#FDFAF4',
              color: '#1A1F2E',
            }}
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: '#E53935' }}>{errors.name}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
            Event date <span style={{ color: '#C4613A' }}>*</span>
          </label>
          <input
            type="date"
            value={data.date ?? ''}
            min={today}
            onChange={(e) => onChange('date', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
            style={{
              borderColor: errors.date ? '#E53935' : '#D0D3DC',
              background: '#FDFAF4',
              color: '#1A1F2E',
            }}
          />
          {errors.date && (
            <p className="text-xs mt-1" style={{ color: '#E53935' }}>{errors.date}</p>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
            Event time <span style={{ color: '#C4613A' }}>*</span>
          </label>
          <input
            type="time"
            value={data.time ?? ''}
            onChange={(e) => onChange('time', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
            style={{
              borderColor: errors.time ? '#E53935' : '#D0D3DC',
              background: '#FDFAF4',
              color: '#1A1F2E',
            }}
          />
          {errors.time && (
            <p className="text-xs mt-1" style={{ color: '#E53935' }}>{errors.time}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1A1F2E' }}>
            City <span style={{ color: '#C4613A' }}>*</span>
          </label>
          <input
            type="text"
            value={data.city ?? ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
            style={{
              borderColor: errors.city ? '#E53935' : '#D0D3DC',
              background: '#FDFAF4',
              color: '#1A1F2E',
            }}
          />
          {errors.city && (
            <p className="text-xs mt-1" style={{ color: '#E53935' }}>{errors.city}</p>
          )}
        </div>
      </div>
    </div>
  );
}
