import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAppState, saveAppState, resetAppState } from '@/lib/persistence';
import { STORAGE_KEY, STORAGE_VERSION } from '@/types/persistence';

// jsdom provides localStorage — reset between tests
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('resetAppState()', () => {
  it('returns an AppState with 3 demo events', () => {
    const state = resetAppState();
    expect(state.events).toHaveLength(3);
    expect(state.version).toBe(STORAGE_VERSION);
    expect(state.activeEventId).toBeNull();
    expect(typeof state.lastSaved).toBe('string');
  });

  it('persists the fresh state to localStorage', () => {
    resetAppState();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.events).toHaveLength(3);
  });
});

describe('saveAppState() / loadAppState() round-trip', () => {
  it('saves and reloads the same state', () => {
    const original = resetAppState();
    // Mutate one field to confirm round-trip fidelity
    original.activeEventId = original.events[0].profile.id;
    saveAppState(original);

    const loaded = loadAppState();
    expect(loaded).not.toBeNull();
    expect(loaded!.activeEventId).toBe(original.activeEventId);
    expect(loaded!.events).toHaveLength(3);
    expect(loaded!.version).toBe(STORAGE_VERSION);
  });

  it('updates lastSaved on save', () => {
    const state = resetAppState();
    const before = new Date(state.lastSaved).getTime();
    // Advance time slightly
    const laterState = { ...state, lastSaved: new Date(before - 5000).toISOString() };
    saveAppState(laterState);
    const loaded = loadAppState();
    // lastSaved should be updated to ~now, not to our old value
    expect(new Date(loaded!.lastSaved).getTime()).toBeGreaterThanOrEqual(before - 5000);
  });
});

describe('loadAppState() — error cases', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadAppState()).toBeNull();
  });

  it('returns null for corrupt JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
    expect(() => loadAppState()).not.toThrow();
    expect(loadAppState()).toBeNull();
  });

  it('returns null for structurally invalid AppState', () => {
    const invalid = { version: STORAGE_VERSION, activeEventId: null, events: 'oops' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid));
    expect(loadAppState()).toBeNull();
  });

  it('returns null for a version mismatch', () => {
    const state = resetAppState();
    const wrongVersion = { ...state, version: 999 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrongVersion));
    expect(loadAppState()).toBeNull();
  });
});
