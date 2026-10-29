import { z } from 'zod';

export const ChangeOperationTypeSchema = z.enum([
  'update-budget',
  'update-task',
  'update-vendor',
  'update-guest-count',
  'update-event-date',
  'update-dietary',
  'update-theme',
  'add-task',
  'remove-task',
  'update-event-profile',
  'rebalance-budget',
]);

export const ChangeOperationSchema = z.object({
  type: ChangeOperationTypeSchema,
  entityId: z.string().optional(),
  field: z.string().optional(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown(),
  reason: z.string(),
});

export const AffectedEntitySchema = z.object({
  entityType: z.enum([
    'budget',
    'task',
    'vendor',
    'guest',
    'risk',
    'runofshow',
    'event-profile',
  ]),
  entityId: z.string().optional(),
  entityName: z.string(),
  changeDescription: z.string(),
  isHighImpact: z.boolean(),
});

export const ChangeSetSchema = z.object({
  id: z.string(),
  userRequest: z.string(),
  operations: z.array(ChangeOperationSchema),
  summary: z.string(),
  requiresConfirmation: z.boolean(),
  affectedEntities: z.array(AffectedEntitySchema),
  generatedBy: z.enum(['gemini', 'local-engine']),
  timestamp: z.string(),
});

export const CopilotResponseSchema = z.object({
  changeSet: ChangeSetSchema.optional(),
  explanation: z.string(),
  followUpQuestion: z.string().optional(),
  isLocalFallback: z.boolean(),
  error: z.string().optional(),
});

export type ChangeOperationInput = z.input<typeof ChangeOperationSchema>;
export type ChangeSetInput = z.input<typeof ChangeSetSchema>;
export type CopilotResponseInput = z.input<typeof CopilotResponseSchema>;
