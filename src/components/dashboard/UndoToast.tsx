'use client';

import { useEffect, useState, useCallback } from 'react';
import { Undo2, X } from 'lucide-react';
import { useEvent } from '@/hooks/useEvent';

const UNDO_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// UndoToast
// ---------------------------------------------------------------------------
// Watches the undo stack. When a new entry appears, shows a floating toast
// for UNDO_TIMEOUT_MS. If the user clicks "Undo", dispatches POP_UNDO and
// re-applies the previous snapshot via APPLY_CHANGESET semantics.
//
// Note: The actual undo action (restoring the previous StoredEvent) is handled
// by POP_UNDO in the reducer — the undo stack only stores ChangeSets as
// breadcrumbs; the full event restoration is done by the parent context.
// ---------------------------------------------------------------------------

export function UndoToast() {
  const { activeEvent, dispatch } = useEvent();
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('Changes applied');

  const undoStack = activeEvent?.undoStack ?? [];
  const hasUndo = undoStack.length > 0;

  // Show toast whenever a new undo entry is pushed
  useEffect(() => {
    if (!hasUndo) {
      setVisible(false);
      return;
    }
    const latest = undoStack[0];
    setLabel(
      latest.summary.length > 48
        ? latest.summary.slice(0, 48) + '…'
        : latest.summary,
    );
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoStack.length]);

  const handleUndo = useCallback(() => {
    if (!activeEvent) return;
    dispatch({ type: 'POP_UNDO', eventId: activeEvent.profile.id });
    setVisible(false);
  }, [activeEvent, dispatch]);

  const handleDismiss = useCallback(() => setVisible(false), []);

  if (!visible || !hasUndo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg pointer-events-auto"
      style={{
        backgroundColor: '#1A1F2E',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.12)',
        minWidth: '280px',
        maxWidth: '420px',
      }}
    >
      <span className="flex-1 text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {label}
      </span>
      <button
        onClick={handleUndo}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
        style={{ backgroundColor: '#C0634B', color: 'white', whiteSpace: 'nowrap' }}
        aria-label="Undo last change"
      >
        <Undo2 className="h-3.5 w-3.5" />
        Undo
      </button>
      <button
        onClick={handleDismiss}
        className="opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
