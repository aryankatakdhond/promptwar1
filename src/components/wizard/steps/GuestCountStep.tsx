'use client';

interface GuestCountData {
  guestCount?: number;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  hasWeatherBackup?: boolean;
}

interface GuestCountStepProps {
  data: GuestCountData;
  onChange: (updates: Partial<GuestCountData>) => void;
}

const VENUE_OPTIONS: { value: 'indoor' | 'outdoor' | 'both'; icon: string; label: string }[] = [
  { value: 'indoor', icon: '🏛️', label: 'Indoor' },
  { value: 'outdoor', icon: '🌿', label: 'Outdoor' },
  { value: 'both', icon: '⛺', label: 'Both' },
];

export function GuestCountStep({ data, onChange }: GuestCountStepProps) {
  const count = data.guestCount ?? 100;
  const showWeatherBackup = data.indoorOutdoor === 'outdoor' || data.indoorOutdoor === 'both';

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Guests & venue style
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        How many guests are you expecting, and where will the event be held?
      </p>

      {/* Guest count */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#1A1F2E' }}>
          Expected guest count
        </label>
        <div className="flex items-center gap-4 mb-3">
          <input
            type="number"
            min={1}
            max={5000}
            value={count}
            onChange={(e) => onChange({ guestCount: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-28 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C4613A]"
            style={{ borderColor: '#D0D3DC', background: '#FDFAF4', color: '#1A1F2E' }}
          />
          <span className="text-sm" style={{ color: '#5A6178' }}>guests</span>
        </div>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={Math.min(count, 1000)}
          onChange={(e) => onChange({ guestCount: parseInt(e.target.value) })}
          className="w-full accent-[#C4613A]"
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: '#5A6178' }}>
          <span>10</span>
          <span>500</span>
          <span>1000+</span>
        </div>
      </div>

      {/* Indoor / Outdoor */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#1A1F2E' }}>
          Venue style
        </label>
        <div className="grid grid-cols-3 gap-3">
          {VENUE_OPTIONS.map(({ value, icon, label }) => {
            const isSelected = data.indoorOutdoor === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ indoorOutdoor: value })}
                className="rounded-xl p-4 border text-center transition-all hover:border-[#C4613A]"
                style={{
                  borderColor: isSelected ? '#C4613A' : '#D0D3DC',
                  background: isSelected ? '#FDF2EC' : '#FFFFFF',
                }}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-medium" style={{ color: '#1A1F2E' }}>{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather backup */}
      {showWeatherBackup && (
        <div
          className="rounded-xl p-4 border"
          style={{ borderColor: '#D0D3DC', background: '#FFFFFF' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: '#1A1F2E' }}>
                Do you have a weather backup plan?
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#5A6178' }}>
                Recommended for outdoor events.
              </div>
            </div>
            <button
              onClick={() => onChange({ hasWeatherBackup: !data.hasWeatherBackup })}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: data.hasWeatherBackup ? '#C4613A' : '#D0D3DC' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: data.hasWeatherBackup ? 'translateX(22px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
