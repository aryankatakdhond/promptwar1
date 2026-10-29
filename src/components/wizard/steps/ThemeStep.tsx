'use client';

interface ThemeData {
  themeStyles?: string[];
  colorPreferences?: string[];
}

interface ThemeStepProps {
  data: ThemeData;
  onChange: (updates: Partial<ThemeData>) => void;
}

const STYLE_OPTIONS = [
  'garden', 'modern', 'rustic', 'traditional',
  'minimalist', 'bohemian', 'glamorous', 'cultural',
];

const COLOR_OPTIONS = [
  { label: 'Ivory + Gold', value: 'ivory-gold', bg: '#FFFFF0', accent: '#D4AF37' },
  { label: 'Deep Green + Gold', value: 'green-gold', bg: '#1B4332', accent: '#D4AF37' },
  { label: 'Terracotta + Ivory', value: 'terracotta-ivory', bg: '#C4613A', accent: '#FDFAF4' },
  { label: 'Midnight + Silver', value: 'midnight-silver', bg: '#1A1F2E', accent: '#C0C0C0' },
  { label: 'Blush + White', value: 'blush-white', bg: '#FFB6C1', accent: '#FFFFFF' },
  { label: 'Royal Blue + Gold', value: 'royal-gold', bg: '#1034A6', accent: '#D4AF37' },
  { label: 'Sage + Cream', value: 'sage-cream', bg: '#8FAF84', accent: '#FFF8E7' },
  { label: 'Monochrome', value: 'monochrome', bg: '#555555', accent: '#FFFFFF' },
];

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export function ThemeStep({ data, onChange }: ThemeStepProps) {
  const styles = data.themeStyles ?? [];
  const colors = data.colorPreferences ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Theme & style
      </h2>
      <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
        Optionally choose styles and colour palettes that match your vision.
      </p>

      {/* Style chips */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: '#1A1F2E' }}>
          Style preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = styles.includes(style);
            return (
              <button
                key={style}
                onClick={() => onChange({ themeStyles: toggleItem(styles, style) })}
                className="px-4 py-1.5 rounded-full text-sm border capitalize transition-all"
                style={{
                  borderColor: isSelected ? '#C4613A' : '#D0D3DC',
                  background: isSelected ? '#FDF2EC' : '#FFFFFF',
                  color: isSelected ? '#C4613A' : '#1A1F2E',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color swatches */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#1A1F2E' }}>
          Colour palette
        </label>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_OPTIONS.map(({ label, value, bg, accent }) => {
            const isSelected = colors.includes(value);
            return (
              <button
                key={value}
                onClick={() => onChange({ colorPreferences: toggleItem(colors, value) })}
                className="rounded-xl border overflow-hidden transition-all"
                style={{
                  borderColor: isSelected ? '#C4613A' : '#D0D3DC',
                  boxShadow: isSelected ? '0 0 0 2px #C4613A' : 'none',
                }}
                title={label}
              >
                <div
                  className="h-10 flex items-center justify-center gap-1"
                  style={{ background: bg }}
                >
                  <div className="w-3 h-3 rounded-full border border-white/30" style={{ background: bg }} />
                  <div className="w-3 h-3 rounded-full border border-white/30" style={{ background: accent }} />
                </div>
                <div
                  className="px-1 py-1 text-xs text-center truncate"
                  style={{ background: '#FFFFFF', color: '#5A6178' }}
                >
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
