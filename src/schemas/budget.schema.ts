import { z } from 'zod';

export const AllocationPrioritySchema = z.enum([
  'essential',
  'high',
  'medium',
  'low',
  'optional',
]);

export const ConfidenceLevelSchema = z.enum(['confirmed', 'estimated', 'rough-estimate']);

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  priority: AllocationPrioritySchema,
  isLocked: z.boolean(),
  isContingency: z.boolean(),
  description: z.string().optional(),
});

export const BudgetAllocationSchema = z.object({
  categoryId: z.string(),
  plannedAmount: z.number().int().nonnegative(),
  actualAmount: z.number().int().nonnegative(),
  lockedAmount: z.number().int().nonnegative().optional(),
  percentage: z.number().nonnegative(),
  confidence: ConfidenceLevelSchema,
  savingSuggestion: z.string().optional(),
  notes: z.string().optional(),
});

export const BudgetPlanSchema = z.object({
  eventId: z.string(),
  totalBudget: z.number().int().nonnegative(),
  contingencyAmount: z.number().int().nonnegative(),
  categories: z.array(BudgetCategorySchema),
  allocations: z.array(BudgetAllocationSchema),
  version: z.number().int().nonnegative(),
  lastValidated: z.string(),
});

export type BudgetCategoryInput = z.input<typeof BudgetCategorySchema>;
export type BudgetAllocationInput = z.input<typeof BudgetAllocationSchema>;
export type BudgetPlanInput = z.input<typeof BudgetPlanSchema>;
