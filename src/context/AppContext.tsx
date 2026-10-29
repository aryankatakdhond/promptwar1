'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getInitialState, saveAppState, resetAppState } from '@/lib/persistence';
import type {
  AppState,
  StoredEvent,
} from '@/types/persistence';
import type {
  EventProfile,
  BudgetPlan,
  PlanningTask,
  VendorEntry,
  Guest,
  ShowBlock,
  RiskItem,
  ReadinessScore,
  CreativeConcept,
  CopilotMessage,
  ChangeSet,
} from '@/types';

// ─── Action union ─────────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'SET_ACTIVE_EVENT'; eventId: string }
  | { type: 'UPDATE_EVENT_PROFILE'; eventId: string; profile: Partial<EventProfile> }
  | { type: 'UPDATE_BUDGET'; eventId: string; budget: BudgetPlan }
  | { type: 'UPDATE_TASKS'; eventId: string; tasks: PlanningTask[] }
  | { type: 'UPDATE_TASK'; eventId: string; task: PlanningTask }
  | { type: 'UPDATE_VENDORS'; eventId: string; vendors: VendorEntry[] }
  | { type: 'UPDATE_VENDOR'; eventId: string; vendor: VendorEntry }
  | { type: 'UPDATE_GUESTS'; eventId: string; guests: Guest[] }
  | { type: 'UPDATE_GUEST'; eventId: string; guest: Guest }
  | { type: 'UPDATE_RUN_OF_SHOW'; eventId: string; blocks: ShowBlock[] }
  | { type: 'UPDATE_RISKS'; eventId: string; risks: RiskItem[]; score: ReadinessScore }
  | { type: 'UPDATE_IDEAS'; eventId: string; ideas: CreativeConcept[] }
  | { type: 'ADD_COPILOT_MESSAGE'; eventId: string; message: CopilotMessage }
  | { type: 'PUSH_UNDO'; eventId: string; changeSet: ChangeSet }
  | { type: 'POP_UNDO'; eventId: string }
  | { type: 'APPLY_CHANGESET'; eventId: string; event: StoredEvent }
  | { type: 'ADD_EVENT'; event: StoredEvent }
  | { type: 'DELETE_EVENT'; eventId: string }
  | { type: 'RESET_ALL' }
  | { type: '_HYDRATE'; state: AppState };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_UNDO = 5;

function updateEvent(
  state: AppState,
  eventId: string,
  updater: (ev: StoredEvent) => StoredEvent,
): AppState {
  return {
    ...state,
    events: state.events.map((ev) =>
      ev.profile.id === eventId ? updater(ev) : ev,
    ),
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case '_HYDRATE':
      return action.state;

    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventId: action.eventId };

    case 'UPDATE_EVENT_PROFILE':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        profile: { ...ev.profile, ...action.profile },
      }));

    case 'UPDATE_BUDGET':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        budget: action.budget,
      }));

    case 'UPDATE_TASKS':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        tasks: action.tasks,
      }));

    case 'UPDATE_TASK':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        tasks: ev.tasks.map((t) =>
          t.id === action.task.id ? action.task : t,
        ),
      }));

    case 'UPDATE_VENDORS':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        vendors: action.vendors,
      }));

    case 'UPDATE_VENDOR':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        vendors: ev.vendors.map((v) =>
          v.id === action.vendor.id ? action.vendor : v,
        ),
      }));

    case 'UPDATE_GUESTS':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        guests: action.guests,
        profile: {
          ...ev.profile,
          confirmedGuestCount: action.guests.filter((guest) => guest.rsvpStatus === 'accepted').length,
        },
      }));

    case 'UPDATE_GUEST':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        guests: ev.guests.map((g) =>
          g.id === action.guest.id ? action.guest : g,
        ),
        profile: {
          ...ev.profile,
          confirmedGuestCount: ev.guests
            .map((guest) => guest.id === action.guest.id ? action.guest : guest)
            .filter((guest) => guest.rsvpStatus === 'accepted').length,
        },
      }));

    case 'UPDATE_RUN_OF_SHOW':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        runOfShow: action.blocks,
      }));

    case 'UPDATE_RISKS':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        risks: action.risks,
        readinessScore: action.score,
      }));

    case 'UPDATE_IDEAS':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        ideas: action.ideas,
      }));

    case 'ADD_COPILOT_MESSAGE':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        copilotHistory: [...ev.copilotHistory, action.message],
      }));

    case 'PUSH_UNDO':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        undoStack: [action.changeSet, ...ev.undoStack].slice(0, MAX_UNDO),
      }));

    case 'POP_UNDO':
      return updateEvent(state, action.eventId, (ev) => ({
        ...ev,
        undoStack: ev.undoStack.slice(1),
      }));

    case 'APPLY_CHANGESET':
      return updateEvent(state, action.eventId, () => action.event);

    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.event],
        activeEventId: action.event.profile.id,
      };

    case 'DELETE_EVENT': {
      const remaining = state.events.filter(
        (ev) => ev.profile.id !== action.eventId,
      );
      const newActiveId =
        state.activeEventId === action.eventId
          ? (remaining[0]?.profile.id ?? null)
          : state.activeEventId;
      return { ...state, events: remaining, activeEventId: newActiveId };
    }

    case 'RESET_ALL':
      return resetAppState();

    default:
      return state;
  }
}

// ─── SSR-safe skeleton state ──────────────────────────────────────────────────

const SSR_INITIAL: AppState = {
  version: 1,
  activeEventId: null,
  events: [],
  lastSaved: new Date().toISOString(),
};

// ─── Context ──────────────────────────────────────────────────────────────────

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activeEvent: StoredEvent | null;
  getEvent: (id: string) => StoredEvent | undefined;
}

export const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, SSR_INITIAL);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after first client render to avoid SSR mismatch
  useEffect(() => {
    dispatch({ type: '_HYDRATE', state: getInitialState() });
    setHydrated(true);
  }, []);

  // Debounced auto-save — only after hydration so we don't overwrite with SSR skeleton
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => saveAppState(state), 500);
    return () => clearTimeout(timer);
  }, [state, hydrated]);

  const activeEvent =
    state.events.find((e) => e.profile.id === state.activeEventId) ?? null;
  const getEvent = (id: string) =>
    state.events.find((e) => e.profile.id === id);

  return (
    <AppContext.Provider value={{ state, dispatch, activeEvent, getEvent }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
