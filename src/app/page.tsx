'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import { DEMO_EVENTS } from '@/data/demo-events';
import { formatCurrency } from '@/lib/currency';
import { EventWizard } from '@/components/wizard/EventWizard';

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: '💍',
  birthday: '🎂',
  anniversary: '💑',
  community: '🎪',
};

const FEATURES = [
  {
    icon: '🎯',
    title: 'Ripple Replanning',
    description: 'Change one thing, update everything. Watch your plan adapt intelligently.',
  },
  {
    icon: '💰',
    title: 'Exact Budget Engine',
    description: 'Every rupee accounted for. Zero rounding errors. Complete financial clarity.',
  },
  {
    icon: '📅',
    title: 'Smart Timeline',
    description: 'Reverse-planned from your event date. Never miss a critical deadline.',
  },
  {
    icon: '🤖',
    title: 'AI Copilot',
    description: 'Natural language planning. Powered by Gemini, grounded in real data.',
  },
];

export default function HomePage() {
  const { dispatch, state } = useAppContext();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);

  function handleOpenDemo(eventId: string) {
    const alreadyAdded = state.events.some((e) => e.profile.id === eventId);
    if (!alreadyAdded) {
      const demoEvent = DEMO_EVENTS.find((e) => e.profile.id === eventId);
      if (demoEvent) dispatch({ type: 'ADD_EVENT', event: demoEvent });
    }
    dispatch({ type: 'SET_ACTIVE_EVENT', eventId });
    router.push(`/dashboard/${eventId}`);
  }

  function handleExploreDemoEvent() {
    const first = DEMO_EVENTS[0];
    if (first) handleOpenDemo(first.profile.id);
  }

  function handleWizardComplete(eventId: string) {
    setShowWizard(false);
    router.push(`/dashboard/${eventId}`);
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDFAF4', color: '#1A1F2E' }}>
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div>
          <span
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: '#1A1F2E', letterSpacing: '0.2em' }}
          >
            MOMENTRA
          </span>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: '#C4613A', color: '#FDFAF4' }}
        >
          Start Planning
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <h1
          className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6"
          style={{ color: '#1A1F2E' }}
        >
          Big moments.<br />Brilliantly orchestrated.
        </h1>
        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: '#5A6178' }}
        >
          From first idea to unforgettable day — MOMENTRA keeps every detail, every deadline,
          and every rupee perfectly in place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowWizard(true)}
            className="px-8 py-3 rounded-xl text-base font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#C4613A', color: '#FDFAF4' }}
          >
            Start New Celebration
          </button>
          <button
            onClick={handleExploreDemoEvent}
            className="px-8 py-3 rounded-xl text-base font-semibold border transition-colors hover:bg-white"
            style={{ borderColor: '#D0D3DC', color: '#1A1F2E' }}
          >
            Explore Demo Event →
          </button>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 border bg-white"
              style={{ borderColor: '#E8E9EE' }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-base mb-2" style={{ color: '#1A1F2E' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5A6178' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Events */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-serif font-semibold mb-2 text-center" style={{ color: '#1A1F2E' }}>
          Explore Demo Events
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: '#5A6178' }}>
          See MOMENTRA in action with three fully-planned sample events.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {DEMO_EVENTS.map((ev) => {
            const p = ev.profile;
            const icon = EVENT_TYPE_ICONS[p.type] ?? '🎉';
            let formattedDate = p.date;
            try {
              formattedDate = format(parseISO(p.date), 'dd MMM yyyy');
            } catch {
              /* ignore */
            }
            return (
              <div
                key={p.id}
                className="rounded-xl p-6 border bg-white flex flex-col gap-3"
                style={{ borderColor: '#E8E9EE' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>
                      {p.name}
                    </div>
                    <div className="text-xs capitalize" style={{ color: '#5A6178' }}>
                      {p.type}
                    </div>
                  </div>
                </div>
                <div className="text-sm space-y-1" style={{ color: '#5A6178' }}>
                  <div>📅 {formattedDate}</div>
                  <div>💰 {formatCurrency(p.totalBudget, p.currency)}</div>
                  <div>👥 {p.guestCount} guests</div>
                </div>
                <button
                  onClick={() => handleOpenDemo(p.id)}
                  className="mt-auto w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#C4613A', color: '#FDFAF4' }}
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t text-xs" style={{ borderColor: '#E8E9EE', color: '#5A6178' }}>
        MOMENTRA — The Celebration Command Center. Made with care.
      </footer>

      {/* Wizard Overlay */}
      {showWizard && (
        <EventWizard onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />
      )}
    </div>
  );
}
