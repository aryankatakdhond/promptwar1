import { describe, expect, it } from 'vitest';
import { appReducer } from '@/context/AppContext';
import { DEMO_EVENTS } from '@/data/demo-events';
import type { AppState } from '@/types/persistence';

describe('appReducer guest counts', () => {
  it('keeps confirmedGuestCount synchronized with guest RSVP updates', () => {
    const event = structuredClone(DEMO_EVENTS[0]);
    const guest = event.guests[0];
    const state: AppState = {
      version: 1,
      activeEventId: event.profile.id,
      events: [event],
      lastSaved: new Date().toISOString(),
    };

    const updated = appReducer(state, {
      type: 'UPDATE_GUEST',
      eventId: event.profile.id,
      guest: { ...guest, rsvpStatus: 'accepted' },
    });

    const updatedEvent = updated.events[0];
    expect(updatedEvent.profile.confirmedGuestCount).toBe(
      updatedEvent.guests.filter((item) => item.rsvpStatus === 'accepted').length,
    );
  });
});
