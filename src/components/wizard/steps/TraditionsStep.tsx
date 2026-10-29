'use client';

interface TraditionsStepProps {
  culturalNotes?: string;
  onChange: (notes: string) => void;
}

export function TraditionsStep({ culturalNotes, onChange }: TraditionsStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: '#1A1F2E' }}>
        Optional: Cultural &amp; Personal Traditions
      </h2>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: '#5A6178' }}>
        This field is entirely optional. If you have specific cultural, religious, or family traditions
        you&apos;d like incorporated, you can describe them here.
      </p>
      <div
        className="rounded-xl p-3 border mb-5 text-xs leading-relaxed"
        style={{ borderColor: '#D0D3DC', background: '#F0F1F4', color: '#5A6178' }}
      >
        🔒 We never infer traditions from your name, city, or other details. Only what you
        explicitly write here is used.
      </div>

      <textarea
        value={culturalNotes ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. We'd like to incorporate a traditional mehndi ceremony the evening before the wedding..."
        rows={5}
        className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C4613A] resize-none"
        style={{
          borderColor: '#D0D3DC',
          background: '#FDFAF4',
          color: '#1A1F2E',
        }}
      />
      <p className="text-xs mt-2" style={{ color: '#5A6178' }}>
        You can skip this step entirely if it doesn&apos;t apply.
      </p>
    </div>
  );
}
