import type { DietaryRequirement, AccessibilityNeed } from './event';
export type { DietaryRequirement, AccessibilityNeed };

export type GuestStatus = 'pending' | 'accepted' | 'declined' | 'waitlisted';
export type InvitationStatus = 'not-sent' | 'sent' | 'delivered' | 'bounced';

export interface Guest {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  householdGroup?: string;
  rsvpStatus: GuestStatus;
  invitationStatus: InvitationStatus;
  hasPlusOne: boolean;
  plusOneName?: string;
  plusOneRsvp?: GuestStatus;
  dietaryRequirements: DietaryRequirement[];
  accessibilityNeeds: AccessibilityNeed[];
  tableNumber?: string;
  notes?: string;
  isVIP: boolean;
  createdAt: string;
  updatedAt: string;
}
