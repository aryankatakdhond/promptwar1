import { z } from 'zod';

export const EventTypeSchema = z.enum(['wedding', 'birthday', 'anniversary', 'community']);

export const EventStatusSchema = z.enum(['planning', 'confirmed', 'completed', 'cancelled']);

export const CurrencyCodeSchema = z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']);

export const DietaryRequirementSchema = z.enum([
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'nut-free',
  'gluten-free',
  'dairy-free',
  'other',
]);

export const AccessibilityNeedSchema = z.enum([
  'wheelchair',
  'hearing-impaired',
  'visually-impaired',
  'mixed-ages',
  'mobility-limited',
  'other',
]);

export const EventPrioritySchema = z.enum([
  'photography',
  'catering',
  'venue',
  'entertainment',
  'decor',
  'guest-experience',
  'budget',
  'sustainability',
]);

export const EventThemeSchema = z.object({
  style: z.array(z.string()),
  colorPreferences: z.array(z.string()),
  indoorOutdoor: z.enum(['indoor', 'outdoor', 'both']),
  hasWeatherBackup: z.boolean(),
  weatherBackupDescription: z.string().optional(),
});

export const EventProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EventTypeSchema,
  status: EventStatusSchema,
  date: z.string(),
  time: z.string(),
  city: z.string(),
  venue: z.string().optional(),
  guestCount: z.number().int().nonnegative(),
  confirmedGuestCount: z.number().int().nonnegative(),
  venueCapacity: z.number().int().nonnegative().optional(),
  currency: CurrencyCodeSchema,
  totalBudget: z.number().int().nonnegative(),
  contingencyPercent: z.number().nonnegative(),
  theme: EventThemeSchema,
  dietaryRequirements: z.array(DietaryRequirementSchema),
  accessibilityNeeds: z.array(AccessibilityNeedSchema),
  priorities: z.array(EventPrioritySchema),
  culturalNotes: z.string().optional(),
  isDemo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string().optional(),
});

export type EventProfileInput = z.input<typeof EventProfileSchema>;
export type EventProfileOutput = z.output<typeof EventProfileSchema>;
