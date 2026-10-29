'use client';

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';

export function useEvent() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useEvent must be used within AppProvider');
  return {
    activeEvent: ctx.activeEvent,
    events: ctx.state.events,
    activeEventId: ctx.state.activeEventId,
    dispatch: ctx.dispatch,
    getEvent: ctx.getEvent,
  };
}
