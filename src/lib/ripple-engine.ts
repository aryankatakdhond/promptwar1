import type { EventProfile } from '@/types/event';
import type { StoredEvent } from '@/types/persistence';
import type { AffectedEntity, ChangeOperation, ChangeSet } from '@/types/ai';
import { allocateBudget, rebalanceBudget, validateBudgetPlan } from './budget-engine';
import { recalculateDueDates } from './timeline-engine';
import { calculateReadinessScore, detectRisks } from './risk-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type RippleChangeType =
  | 'guest-count'
  | 'budget-change'
  | 'date-change'
  | 'dietary-change'
  | 'theme-change';

export interface RippleChange {
  type: RippleChangeType;
  payload: Partial<EventProfile>;
}

function operationsAreField(operation: ChangeOperation, field: string): boolean {
  return operation.field === field;
}

export interface RipplePreview {
  preview: Partial<StoredEvent>;
  affectedEntities: AffectedEntity[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// identifyAffectedEntities
// ---------------------------------------------------------------------------
export function identifyAffectedEntities(
  change: RippleChange,
  _event: StoredEvent,
): AffectedEntity[] {
  const entities: AffectedEntity[] = [];

  switch (change.type) {
    case 'guest-count':
      entities.push(
        { entityType: 'budget', entityName: 'Catering Budget', changeDescription: 'Guest count change affects catering allocation', isHighImpact: true },
        { entityType: 'guest', entityName: 'Seating Plan', changeDescription: 'Seating arrangements need updating', isHighImpact: false },
        { entityType: 'budget', entityName: 'Invitations Budget', changeDescription: 'More invitations needed', isHighImpact: false },
        { entityType: 'risk', entityName: 'Venue Capacity Risk', changeDescription: 'Venue capacity check required', isHighImpact: true },
        { entityType: 'budget', entityName: 'Staffing Budget', changeDescription: 'Staffing requirements may change', isHighImpact: false },
      );
      break;

    case 'budget-change':
      entities.push(
        { entityType: 'budget', entityName: 'All Budget Categories', changeDescription: 'Unlocked budget categories will be rebalanced', isHighImpact: true },
      );
      break;

    case 'date-change':
      entities.push(
        { entityType: 'task', entityName: 'All Planning Tasks', changeDescription: 'Non-pinned task due dates will shift', isHighImpact: true },
        { entityType: 'vendor', entityName: 'Vendor Booking Deadlines', changeDescription: 'Booking deadlines relative to event date affected', isHighImpact: true },
      );
      break;

    case 'dietary-change':
      entities.push(
        { entityType: 'vendor', entityName: 'Catering Requirements', changeDescription: 'Caterer must accommodate new dietary requirements', isHighImpact: true },
        { entityType: 'task', entityName: 'Menu Planning', changeDescription: 'Menu ideas may need adjustment', isHighImpact: false },
      );
      break;

    case 'theme-change':
      entities.push(
        { entityType: 'risk', entityName: 'Weather Backup Risk', changeDescription: 'Outdoor/indoor change may create weather risk', isHighImpact: true },
        { entityType: 'vendor', entityName: 'Venue Requirements', changeDescription: 'Venue requirements may change', isHighImpact: false },
      );
      break;
  }

  return entities;
}

// ---------------------------------------------------------------------------
// previewRippleChange
// ---------------------------------------------------------------------------
export function previewRippleChange(
  event: StoredEvent,
  change: Partial<EventProfile> | RippleChange | ChangeSet,
): RipplePreview {
  // Deep clone — never mutate input
  const clone = structuredClone(event) as StoredEvent;
  const warnings: string[] = [];
  let affectedEntities: AffectedEntity[] = [];

  const isOperationSet = isChangeSet(change);

  if (isOperationSet) {
    applyChangeSetOperations(clone, change);
  }

  // Normalize: if it looks like a RippleChange use it directly, else wrap as event-profile update
  const rippleChange = isRippleChange(change)
    ? (change as RippleChange)
    : buildRippleChangeFromPartial(change as Partial<EventProfile>);

  affectedEntities = isOperationSet && change.affectedEntities.length > 0
    ? change.affectedEntities
    : identifyAffectedEntities(rippleChange, clone);

  // Apply changes to clone's profile
  const profilePatch = isOperationSet
    ? {}
    : isRippleChange(change)
    ? (change as RippleChange).payload
    : (change as Partial<EventProfile>);

  Object.assign(clone.profile, profilePatch);
  clone.profile.updatedAt = new Date().toISOString();
  const originalGuestCount = event.profile.guestCount;

  // Cascade effects. A ChangeSet may contain several operations, so run each
  // affected cascade once instead of dropping all but the first operation.
  const cascadeTypes = isOperationSet
    ? getCascadeTypes(change.operations)
    : [rippleChange.type];

  for (const cascadeType of cascadeTypes) {
    switch (cascadeType) {
    case 'guest-count': {
      const cateringCategory = clone.budget.categories.find((category) => {
        const label = `${category.name} ${category.icon}`.toLowerCase();
        return label.includes('cater') || label.includes('utensils');
      });
      const cateringAllocation = cateringCategory
        ? clone.budget.allocations.find((allocation) => allocation.categoryId === cateringCategory.id)
        : undefined;
      if (cateringAllocation && cateringCategory && originalGuestCount > 0 && clone.profile.guestCount !== originalGuestCount) {
        if (cateringCategory.isLocked || cateringAllocation.lockedAmount !== undefined) {
          warnings.push('Catering is locked, so its allocation was not changed with the guest count.');
        } else {
          const targetAmount = Math.max(
            0,
            Math.round(cateringAllocation.plannedAmount * clone.profile.guestCount / originalGuestCount),
          );
          clone.budget = rebalanceBudget(clone.budget, {
            categoryId: cateringAllocation.categoryId,
            newAmount: targetAmount,
            isLocked: false,
          });
        }
      }
      // Warn if venue capacity exceeded
      if (
        clone.profile.venueCapacity !== undefined &&
        clone.profile.confirmedGuestCount > clone.profile.venueCapacity
      ) {
        warnings.push(
          `Guest count (${clone.profile.confirmedGuestCount}) exceeds venue capacity (${clone.profile.venueCapacity}).`,
        );
      }
      break;
    }

    case 'date-change': {
      clone.tasks = recalculateDueDates(clone.tasks, clone.profile.date);
      break;
    }

    case 'theme-change': {
      if (clone.profile.theme.indoorOutdoor !== 'indoor' && !clone.profile.theme.hasWeatherBackup) {
        warnings.push('Outdoor event without weather backup. Consider arranging a contingency plan.');
      }
      break;
    }

    case 'dietary-change': {
      const hasCateringVendor = clone.vendors.some((v) => v.category === 'catering');
      if (!hasCateringVendor) {
        warnings.push('Dietary requirements changed but no catering vendor is booked.');
      } else {
        const requirements = clone.profile.dietaryRequirements.join(', ') || 'none specified';
        clone.vendors = clone.vendors.map((vendor) =>
          vendor.category === 'catering'
            ? {
                ...vendor,
                notes: `${vendor.notes ? `${vendor.notes} ` : ''}Dietary requirements: ${requirements}.`,
                updatedAt: new Date().toISOString(),
              }
            : vendor,
        );
      }
      break;
    }

    case 'budget-change': {
      const lockedAllocs = clone.budget.allocations.filter((a) => a.lockedAmount !== undefined);
      const newPlan = allocateBudget(
        clone.budget.totalBudget,
        clone.budget.categories,
        clone.profile.contingencyPercent,
        lockedAllocs,
      );
      clone.budget = { ...newPlan, eventId: clone.profile.id };
      break;
    }
    }
  }

  // Validate budget
  const validation = validateBudgetPlan(clone.budget);
  if (!validation.isValid) {
    warnings.push(...validation.errors);
  }

  return {
    preview: clone,
    affectedEntities,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// applyRippleChange
// ---------------------------------------------------------------------------
export function applyRippleChange(
  event: StoredEvent,
  change: Partial<EventProfile> | RippleChange | ChangeSet,
): StoredEvent {
  const { preview } = previewRippleChange(event, change);

  // preview is already a full deep clone with changes applied
  const newEvent = preview as StoredEvent;

  // Re-run risk calculation
  const risks = detectRisks({
    event: newEvent.profile,
    budget: newEvent.budget,
    tasks: newEvent.tasks,
    vendors: newEvent.vendors,
    runOfShow: newEvent.runOfShow,
  });
  newEvent.risks = risks;

  // Re-run readiness score
  const readinessScore = calculateReadinessScore({
    event: newEvent.profile,
    budget: newEvent.budget,
    tasks: newEvent.tasks,
    vendors: newEvent.vendors,
    runOfShow: newEvent.runOfShow,
  });
  newEvent.readinessScore = readinessScore;

  return newEvent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isRippleChange(change: unknown): boolean {
  return (
    typeof change === 'object' &&
    change !== null &&
    'type' in change &&
    'payload' in change &&
    typeof (change as RippleChange).type === 'string' &&
    [
      'guest-count',
      'budget-change',
      'date-change',
      'dietary-change',
      'theme-change',
    ].includes((change as RippleChange).type)
  );
}

function isChangeSet(change: unknown): change is ChangeSet {
  return (
    typeof change === 'object' &&
    change !== null &&
    'operations' in change &&
    Array.isArray((change as ChangeSet).operations) &&
    'affectedEntities' in change
  );
}

function getCascadeTypes(operations: ChangeOperation[]): RippleChangeType[] {
  const types = new Set<RippleChangeType>();

  for (const operation of operations) {
    switch (operation.type) {
      case 'update-guest-count':
        types.add('guest-count');
        break;
      case 'update-event-date':
        types.add('date-change');
        break;
      case 'update-dietary':
        types.add('dietary-change');
        break;
      case 'update-theme':
        types.add('theme-change');
        break;
      case 'rebalance-budget':
        types.add('budget-change');
        break;
      case 'update-event-profile':
        if (operationsAreField(operation, 'guestCount')) types.add('guest-count');
        if (operationsAreField(operation, 'date')) types.add('date-change');
        break;
    }
  }

  return Array.from(types);
}

function applyChangeSetOperations(event: StoredEvent, changeSet: ChangeSet): void {
  for (const operation of changeSet.operations) {
    const value = operation.newValue;

    switch (operation.type) {
      case 'update-guest-count':
        if (typeof value === 'number' && value >= 0) {
          event.profile.guestCount = Math.round(value);
        }
        break;

      case 'update-event-date':
        if (typeof value === 'string') event.profile.date = value;
        break;

      case 'update-dietary':
        if (Array.isArray(value)) {
          event.profile.dietaryRequirements = value.filter(
            (item): item is EventProfile['dietaryRequirements'][number] => typeof item === 'string',
          );
        }
        break;

      case 'update-theme':
        applyThemeOperation(event.profile, operation.field, value);
        break;

      case 'update-event-profile':
        applyProfileOperation(event.profile, operation.field, value);
        break;

      case 'rebalance-budget':
        if (typeof value === 'number' && value >= 0) {
          event.budget.totalBudget = Math.round(value);
        }
        break;

      case 'update-budget': {
        const allocation = event.budget.allocations.find(
          (item) => item.categoryId === operation.entityId,
        );
        if (!allocation) break;
        if (operation.field === 'plannedAmount' && typeof value === 'number') {
          allocation.plannedAmount = Math.max(0, Math.round(value));
        } else if (operation.field === 'actualAmount' && typeof value === 'number') {
          allocation.actualAmount = Math.max(0, Math.round(value));
        } else if (operation.field === 'lockedAmount' && typeof value === 'number') {
          allocation.lockedAmount = Math.max(0, Math.round(value));
        }
        break;
      }

      case 'update-task': {
        const task = event.tasks.find((item) => item.id === operation.entityId);
        if (task && operation.field && operation.field in task) {
          const field = operation.field as keyof typeof task;
          if (field === 'title' && typeof value === 'string') task.title = value;
          if (field === 'dueDate' && typeof value === 'string') task.dueDate = value;
          if (field === 'status' && typeof value === 'string') task.status = value as typeof task.status;
        }
        break;
      }

      case 'update-vendor': {
        const vendor = event.vendors.find((item) => item.id === operation.entityId);
        if (vendor && operation.field === 'status' && typeof value === 'string') {
          vendor.status = value as typeof vendor.status;
        }
        break;
      }

      case 'add-task':
      case 'remove-task':
        break;
    }
  }
}

function applyThemeOperation(profile: EventProfile, field: string | undefined, value: unknown): void {
  if (!field) return;
  if (field === 'theme.style' && Array.isArray(value)) {
    profile.theme.style = value.filter((item): item is string => typeof item === 'string');
  } else if (field === 'theme.indoorOutdoor' && (value === 'indoor' || value === 'outdoor' || value === 'both')) {
    profile.theme.indoorOutdoor = value;
  } else if (field === 'theme.hasWeatherBackup' && typeof value === 'boolean') {
    profile.theme.hasWeatherBackup = value;
  }
}

function applyProfileOperation(profile: EventProfile, field: string | undefined, value: unknown): void {
  if (field === 'accessibilityNeeds' && Array.isArray(value)) {
    profile.accessibilityNeeds = value.filter(
      (item): item is EventProfile['accessibilityNeeds'][number] => typeof item === 'string',
    );
  } else if (field === 'venue' && (typeof value === 'string' || value === undefined)) {
    profile.venue = value;
  } else if (field === 'date' && typeof value === 'string') {
    profile.date = value;
  } else if (field === 'guestCount' && typeof value === 'number' && value >= 0) {
    profile.guestCount = Math.round(value);
  }
}

function buildRippleChangeFromPartial(patch: Partial<EventProfile>): RippleChange {
  // Infer ripple type from the patch keys
  if ('guestCount' in patch || 'confirmedGuestCount' in patch) {
    return { type: 'guest-count', payload: patch };
  }
  if ('date' in patch) {
    return { type: 'date-change', payload: patch };
  }
  if ('dietaryRequirements' in patch) {
    return { type: 'dietary-change', payload: patch };
  }
  if ('theme' in patch) {
    return { type: 'theme-change', payload: patch };
  }
  if ('totalBudget' in patch || 'contingencyPercent' in patch) {
    return { type: 'budget-change', payload: patch };
  }
  // Default
  return { type: 'budget-change', payload: patch };
}
