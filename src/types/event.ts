export type EventType = 'wedding' | 'birthday' | 'anniversary' | 'community';
export type EventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface EventTheme {
  style: string[]; // e.g. ['garden', 'rustic', 'modern']
  colorPreferences: string[];
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  hasWeatherBackup: boolean;
  weatherBackupDescription?: string;
}

export interface EventProfile {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  date: string; // ISO date string
  time: string; // HH:MM format
  city: string;
  venue?: string;
  guestCount: number;
  confirmedGuestCount: number;
  venueCapacity?: number;
  currency: CurrencyCode;
  totalBudget: number; // integer, whole units of currency
  contingencyPercent: number; // e.g. 10 for 10%
  theme: EventTheme;
  dietaryRequirements: DietaryRequirement[];
  accessibilityNeeds: AccessibilityNeed[];
  priorities: EventPriority[];
  culturalNotes?: string; // optional, user-provided only
  isDemo: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  description?: string;
}

export type DietaryRequirement =
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'nut-free'
  | 'gluten-free'
  | 'dairy-free'
  | 'other';

export type AccessibilityNeed =
  | 'wheelchair'
  | 'hearing-impaired'
  | 'visually-impaired'
  | 'mixed-ages'
  | 'mobility-limited'
  | 'other';

export type EventPriority =
  | 'photography'
  | 'catering'
  | 'venue'
  | 'entertainment'
  | 'decor'
  | 'guest-experience'
  | 'budget'
  | 'sustainability';
