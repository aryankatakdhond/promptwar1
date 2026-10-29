import { z } from 'zod';
import { EventProfileSchema } from './event.schema';
import { BudgetPlanSchema } from './budget.schema';
import { ChangeSetSchema } from './ai.schema';

// ─── Inline sub-schemas for entities not given their own schema file ──────────

const TaskStatusSchema = z.enum([
  'not-started',
  'in-progress',
  'completed',
  'overdue',
  'blocked',
  'skipped',
]);

const TaskCategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'transport',
  'invitations',
  'attire',
  'staffing',
  'legal',
  'health-safety',
  'other',
]);

const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

const TimelinePhaseSchema = z.enum([
  'immediate',
  'early',
  'mid',
  'late',
  'final',
  'day-of',
]);

const PlanningTaskSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string(),
  category: TaskCategorySchema,
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dueDate: z.string(),
  completedDate: z.string().optional(),
  estimatedDurationDays: z.number().int().nonnegative(),
  dependencies: z.array(z.string()),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  isPinned: z.boolean(),
  daysBeforeEvent: z.number().int(),
  phase: TimelinePhaseSchema,
  relatedVendorId: z.string().optional(),
  relatedBudgetCategoryId: z.string().optional(),
});

const VendorPaymentMilestoneSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number().int().nonnegative(),
  dueDate: z.string(),
  isPaid: z.boolean(),
});

const VendorEntrySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  category: z.enum([
    'venue',
    'catering',
    'photography',
    'videography',
    'decor',
    'entertainment',
    'transport',
    'staffing',
    'bakery',
    'florist',
    'beauty',
    'attire',
    'invitations',
    'audio-visual',
    'security',
    'other',
  ]),
  requirement: z.string(),
  businessName: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  status: z.enum([
    'not-started',
    'researching',
    'contacted',
    'quote-received',
    'booked',
    'cancelled',
  ]),
  estimatedCost: z.number().int().nonnegative(),
  quotedCost: z.number().int().nonnegative().optional(),
  researchDeadline: z.string(),
  bookingDeadline: z.string(),
  comparisonNotes: z.string().optional(),
  questionsToAsk: z.array(z.string()),
  redFlags: z.array(z.string()),
  contractSigned: z.boolean(),
  depositPaid: z.boolean(),
  cancellationTerms: z.string().optional(),
  paymentMilestones: z.array(VendorPaymentMilestoneSchema),
  isCritical: z.boolean(),
  isIllustrative: z.boolean(),
  relatedTaskId: z.string().optional(),
  relatedBudgetCategoryId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const GuestSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  householdGroup: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined', 'waitlisted']),
  invitationStatus: z.enum(['not-sent', 'sent', 'delivered', 'bounced']),
  hasPlusOne: z.boolean(),
  plusOneName: z.string().optional(),
  plusOneRsvp: z.enum(['pending', 'accepted', 'declined', 'waitlisted']).optional(),
  dietaryRequirements: z.array(
    z.enum([
      'vegetarian',
      'vegan',
      'halal',
      'kosher',
      'nut-free',
      'gluten-free',
      'dairy-free',
      'other',
    ])
  ),
  accessibilityNeeds: z.array(
    z.enum([
      'wheelchair',
      'hearing-impaired',
      'visually-impaired',
      'mixed-ages',
      'mobility-limited',
      'other',
    ])
  ),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  isVIP: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ShowBlockSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'setup',
    'arrival',
    'ceremony',
    'reception',
    'dining',
    'entertainment',
    'activity',
    'departure',
    'breakdown',
    'other',
  ]),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().nonnegative(),
  location: z.string().optional(),
  zone: z.string().optional(),
  responsiblePerson: z.string().optional(),
  dependencies: z.array(z.string()),
  backupNotes: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().nonnegative(),
});

const RiskItemSchema = z.object({
  id: z.string(),
  category: z.enum([
    'budget',
    'timeline',
    'vendor',
    'venue',
    'guest',
    'logistics',
    'weather',
    'legal',
    'other',
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  explanation: z.string(),
  affectedEntities: z.array(z.string()),
  recommendedAction: z.string(),
  actionTarget: z.string().optional(),
  isResolved: z.boolean(),
  detectedAt: z.string(),
});

const ReadinessBreakdownSchema = z.object({
  factor: z.string(),
  score: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  details: z.string(),
});

const ReadinessScoreSchema = z.object({
  total: z.number().nonnegative(),
  breakdown: z.array(ReadinessBreakdownSchema),
  lastCalculated: z.string(),
});

const ColorPaletteSchema = z.object({
  name: z.string(),
  colors: z.array(z.string()),
  description: z.string(),
});

const CreativeConceptSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string(),
  creativeDirection: z.string(),
  whyItFits: z.string(),
  colorPalette: ColorPaletteSchema,
  decorSuggestions: z.array(z.string()),
  invitationIdeas: z.array(z.string()),
  menuDirection: z.string(),
  activities: z.array(z.string()),
  entertainmentIdeas: z.array(z.string()),
  budgetConscious: z.array(z.string()),
  sustainableOptions: z.array(z.string()),
  accessibilityConsiderations: z.string(),
  estimatedCostImpact: z.enum([
    'below-budget',
    'on-budget',
    'slight-premium',
    'premium',
  ]),
  practicalRequirements: z.array(z.string()),
  status: z.enum(['generated', 'saved', 'rejected', 'applied']),
  generatedBy: z.enum(['gemini', 'local-engine']),
  createdAt: z.string(),
});

const CopilotMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
  changeSet: ChangeSetSchema.optional(),
});

// ─── Top-level schemas ────────────────────────────────────────────────────────

export const StoredEventSchema = z.object({
  profile: EventProfileSchema,
  budget: BudgetPlanSchema,
  tasks: z.array(PlanningTaskSchema),
  vendors: z.array(VendorEntrySchema),
  guests: z.array(GuestSchema),
  runOfShow: z.array(ShowBlockSchema),
  risks: z.array(RiskItemSchema),
  readinessScore: ReadinessScoreSchema,
  ideas: z.array(CreativeConceptSchema),
  copilotHistory: z.array(CopilotMessageSchema),
  undoStack: z.array(ChangeSetSchema),
});

export const AppStateSchema = z.object({
  version: z.number().int().nonnegative(),
  activeEventId: z.string().nullable(),
  events: z.array(StoredEventSchema),
  lastSaved: z.string(),
});

export type StoredEventInput = z.input<typeof StoredEventSchema>;
export type AppStateInput = z.input<typeof AppStateSchema>;
