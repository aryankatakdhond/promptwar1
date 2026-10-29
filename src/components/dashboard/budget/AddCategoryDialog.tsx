'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import type { BudgetPlan, AllocationPriority } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { rebalanceBudget, validateBudgetPlan } from '@/lib/budget-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddCategoryDialogProps {
  plan: BudgetPlan;
  currency: CurrencyCode;
  onAdd: (newPlan: BudgetPlan) => void;
}

const PRIORITY_OPTIONS: { value: AllocationPriority; label: string }[] = [
  { value: 'essential', label: 'Essential' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'optional', label: 'Optional' },
];

interface FormState {
  name: string;
  priority: AllocationPriority;
  amount: string;
  description: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  priority: 'medium',
  amount: '',
  description: '',
};

export function AddCategoryDialog({ plan, currency, onAdd }: AddCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitError, setSubmitError] = useState('');

  function validate(): boolean {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    const amount = parseInt(form.amount, 10);
    if (isNaN(amount) || amount <= 0) newErrors.amount = 'Amount must be a positive integer';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    setSubmitError('');
    if (!validate()) return;

    const amount = parseInt(form.amount, 10);

    // Add the new category to the plan
    const newCategory = {
      id: uuidv4(),
      name: form.name.trim(),
      icon: 'default',
      priority: form.priority,
      isLocked: false,
      isContingency: false,
      description: form.description.trim() || undefined,
    };

    const newPlan = structuredClone(plan);
    newPlan.categories = [...newPlan.categories, newCategory];
    // Add a minimal allocation for the new category (0 initially)
    newPlan.allocations = [
      ...newPlan.allocations,
      {
        categoryId: newCategory.id,
        plannedAmount: 0,
        actualAmount: 0,
        lockedAmount: undefined,
        percentage: 0,
        confidence: 'rough-estimate' as const,
      },
    ];

    // Now use rebalanceBudget to properly set the amount
    const rebalanced = rebalanceBudget(newPlan, {
      categoryId: newCategory.id,
      newAmount: amount,
      isLocked: false,
    });

    const validation = validateBudgetPlan(rebalanced);
    if (!validation.isValid) {
      setSubmitError(
        `Cannot add category: ${validation.errors[0] ?? 'Validation failed'}. The amount may be too large.`,
      );
      return;
    }

    onAdd(rebalanced);
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError('');
    setOpen(false);
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitError('');
    setOpen(false);
  }

  const unlockedTotal = plan.allocations
    .filter((a) => {
      const cat = plan.categories.find((c) => c.id === a.categoryId);
      return !cat?.isContingency && !cat?.isLocked && a.lockedAmount === undefined;
    })
    .reduce((s, a) => s + a.plannedAmount, 0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={handleClose}>
          <DialogHeader>
            <DialogTitle>Add Budget Category</DialogTitle>
            <DialogDescription>
              New category amount will be absorbed from unlocked categories (
              {formatCurrency(unlockedTotal, currency)} available).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Category Name"
              placeholder="e.g. Florist, DJ, Photographer"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />

            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value as AllocationPriority }))
              }
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Input
              label="Estimated Amount"
              type="number"
              placeholder="e.g. 50000"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              error={errors.amount}
            />

            <Textarea
              label="Description (optional)"
              placeholder="Any notes about this category..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {submitError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSubmit}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
