'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Bell, Menu, FileDown, Plus, ChevronDown } from 'lucide-react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import { detectRisks } from '@/lib/risk-engine';
import { cn } from '@/lib/utils';
import { exportEventPDF } from '@/lib/export/event-pdf';
import { useToast } from '@/hooks/useToast';

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeEvent =
    state.events.find((e) => e.profile.id === state.activeEventId) ?? null;

  // Countdown
  let countdownLabel = '';
  if (activeEvent) {
    const days = differenceInCalendarDays(
      parseISO(activeEvent.profile.date),
      new Date(),
    );
    if (days > 0) {
      countdownLabel = `${activeEvent.profile.name} in ${days} day${days !== 1 ? 's' : ''}`;
    } else if (days === 0) {
      countdownLabel = `${activeEvent.profile.name} is today!`;
    } else {
      countdownLabel = `${activeEvent.profile.name} was ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    }
  }

  // Risk count
  let criticalRiskCount = 0;
  if (activeEvent) {
    try {
      const risks = detectRisks({
        event: activeEvent.profile,
        budget: activeEvent.budget,
        tasks: activeEvent.tasks,
        vendors: activeEvent.vendors,
        runOfShow: activeEvent.runOfShow,
      });
      criticalRiskCount = risks.filter((r) => r.severity === 'critical' && !r.isResolved).length;
    } catch {
      criticalRiskCount = activeEvent.risks?.filter(
        (r) => r.severity === 'critical' && !r.isResolved,
      ).length ?? 0;
    }
  }

  function switchEvent(eventId: string) {
    dispatch({ type: 'SET_ACTIVE_EVENT', eventId });
    const tab = searchParams.get('tab') ?? 'overview';
    router.push(`/dashboard/${eventId}?tab=${tab}`);
    setSwitcherOpen(false);
  }

  function handleRiskClick() {
    if (state.activeEventId) {
      router.push(`/dashboard/${state.activeEventId}?tab=risks`);
    }
  }

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b bg-white flex-shrink-0"
      style={{ borderColor: '#E8E9EE', minHeight: '56px' }}
    >
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — toggling a local state here; Sidebar listens via context is complex,
            so we use a simple approach: pass state up. For simplicity, use a global body class */}
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded hover:bg-ivory transition-colors"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Open menu"
        >
          <Menu size={20} style={{ color: '#1A1F2E' }} />
        </button>

        {activeEvent ? (
          <div>
            <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
              {activeEvent.profile.name}
            </span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: '#FAF0EB', color: '#C4613A' }}
            >
              {activeEvent.profile.type}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>
            MOMENTRA
          </span>
        )}
      </div>

      {/* Center: countdown chip (desktop) */}
      {countdownLabel && (
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: '#FAF0EB', color: '#C4613A' }}
        >
          <CalendarDays size={14} />
          <span>{countdownLabel}</span>
        </div>
      )}

      {/* Right: event switcher, risk bell, export */}
      <div className="flex items-center gap-2">
        {/* Event switcher */}
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen((v) => !v)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-ivory"
            style={{ borderColor: '#D0D3DC', color: '#1A1F2E' }}
          >
            <span className="max-w-[140px] truncate">
              {activeEvent?.profile.name ?? 'Select Event'}
            </span>
            <ChevronDown size={14} />
          </button>

          {switcherOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 rounded-lg border bg-white shadow-lg z-50 py-1"
              style={{ borderColor: '#D0D3DC' }}
            >
              {state.events.map((ev) => (
                <button
                  key={ev.profile.id}
                  onClick={() => switchEvent(ev.profile.id)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-ivory',
                    ev.profile.id === state.activeEventId
                      ? 'font-semibold'
                      : 'font-normal',
                  )}
                  style={{ color: '#1A1F2E' }}
                >
                  <div className="font-medium">{ev.profile.name}</div>
                  <div className="text-xs" style={{ color: '#5A6178' }}>
                    {ev.profile.type} · {format(parseISO(ev.profile.date), 'dd MMM yyyy')}
                  </div>
                </button>
              ))}
              <div className="border-t my-1" style={{ borderColor: '#E8E9EE' }} />
              <button
                onClick={() => {
                  setSwitcherOpen(false);
                  router.push('/');
                }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-ivory flex items-center gap-2"
                style={{ color: '#C4613A' }}
              >
                <Plus size={14} />
                New Event
              </button>
            </div>
          )}
        </div>

        {/* Risk bell */}
        <button
          onClick={handleRiskClick}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors hover:bg-ivory"
          style={{ borderColor: '#D0D3DC' }}
          aria-label="View risks"
        >
          <Bell size={16} style={{ color: '#1A1F2E' }} />
          {criticalRiskCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold"
              style={{ background: '#C4613A', fontSize: '10px' }}
            >
              {criticalRiskCount > 9 ? '9+' : criticalRiskCount}
            </span>
          )}
        </button>

        {/* Export PDF */}
        <button
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-ivory"
          style={{ borderColor: '#D0D3DC', color: '#1A1F2E' }}
          onClick={() => {
            if (!activeEvent) return;
            try {
              exportEventPDF(activeEvent);
              toast({ title: 'PDF exported', description: 'Your event brief is ready.', variant: 'success' });
            } catch {
              toast({ title: 'Export failed', description: 'Could not generate the event PDF.', variant: 'error' });
            }
          }}
          disabled={!activeEvent}
          aria-label="Export event PDF"
        >
          <FileDown size={14} />
          Export
        </button>
      </div>

      {/* Mobile drawer (simple toggle — no portal needed) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-black/40" />
          <nav
            className="relative w-64 flex flex-col py-6 px-4 gap-1 z-50"
            style={{ background: '#1A1F2E' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="text-lg font-bold tracking-widest uppercase mb-6"
              style={{ color: '#FDFAF4', letterSpacing: '0.18em' }}
            >
              MOMENTRA
            </div>
            {state.events.map((ev) => (
              <button
                key={ev.profile.id}
                onClick={() => {
                  switchEvent(ev.profile.id);
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded text-sm"
                style={{ color: '#FDFAF4' }}
              >
                {ev.profile.name}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
