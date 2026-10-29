import { STORAGE_KEY, STORAGE_VERSION } from '@/types/persistence';
import { AppStateSchema } from '@/schemas/persistence.schema';
import { getDemoEvents } from '@/data/demo-events';
import type { AppState } from '@/types/persistence';

const isBrowser = typeof window !== 'undefined';

export function loadAppState(): AppState | null {
  if (!isBrowser) return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[momentra] Failed to parse stored state — resetting.');
    return null;
  }

  const result = AppStateSchema.safeParse(parsed);
  if (!result.success) {
    console.warn('[momentra] Stored state failed schema validation — resetting.');
    return null;
  }

  if (result.data.version !== STORAGE_VERSION) {
    console.warn('[momentra] Storage version mismatch — resetting.');
    return null;
  }

  return result.data;
}

export function saveAppState(state: AppState): void {
  if (!isBrowser) return;

  const toSave: AppState = { ...state, lastSaved: new Date().toISOString() };

  const validation = AppStateSchema.safeParse(toSave);
  if (!validation.success) {
    console.warn('[momentra] Refusing to save invalid state.');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.data));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('[momentra] localStorage quota exceeded — state not saved.');
    } else {
      throw err;
    }
  }
}

export function resetAppState(): AppState {
  if (isBrowser) {
    localStorage.removeItem(STORAGE_KEY);
  }

  const fresh: AppState = {
    version: STORAGE_VERSION,
    activeEventId: null,
    events: getDemoEvents(),
    lastSaved: new Date().toISOString(),
  };

  saveAppState(fresh);
  return fresh;
}

export function getInitialState(): AppState {
  return loadAppState() ?? resetAppState();
}
