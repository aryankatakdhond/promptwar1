import { v4 as uuidv4 } from 'uuid';
import { subDays, addDays, parseISO, formatISO } from 'date-fns';
import type { StoredEvent } from '@/types/persistence';
import type { ChangeSet, ChangeOperation, AffectedEntity } from '@/types/ai';

export interface LocalEngineResult {
  explanation: string;
  changeSet: ChangeSet;
  isLocalFallback: true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function msg(text: string) {
  return text.toLowerCase();
}

function extractPercent(text: string): number | null {
  const match = text.match(/(\d+)\s*%/);
  return match ? parseInt(match[1], 10) : null;
}

function extractNumber(text: string): number | null {
  const match = text.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function extractWeeks(text: string): number | null {
  const match = text.match(/(\d+)\s*week/i);
  return match ? parseInt(match[1], 10) : null;
}

function makeChangeSet(
  userRequest: string,
  summary: string,
  operations: ChangeOperation[],
  affectedEntities: AffectedEntity[],
  requiresConfirmation = true,
): ChangeSet {
  return {
    id: uuidv4(),
    userRequest,
    operations,
    summary,
    requiresConfirmation,
    affectedEntities,
    generatedBy: 'local-engine',
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Pattern handlers
// ---------------------------------------------------------------------------

function handleBudgetReduction(
  userMessage: string,
  event: StoredEvent,
  keepKeyword: string | null,
): LocalEngineResult | null {
  const lower = msg(userMessage);
  if (
    !lower.includes('reduce budget') &&
    !lower.includes('cut budget') &&
    !lower.includes('save money') &&
    !lower.includes('lower budget')
  ) {
    return null;
  }

  const pct = extractPercent(lower) ?? 10;

  // Find locked category (e.g. "keep photography")
  let lockedCategoryId: string | null = null;
  let lockedCategoryName: string | null = null;
  if (keepKeyword) {
    const found = event.budget.categories.find(c =>
      c.name.toLowerCase().includes(keepKeyword.toLowerCase()),
    );
    if (found) {
      lockedCategoryId = found.id;
      lockedCategoryName = found.name;
    }
  } else {
    // Try to auto-detect "keep X" in message
    const keepMatch = lower.match(/keep\s+(\w+)/);
    if (keepMatch) {
      const kw = keepMatch[1];
      const found = event.budget.categories.find(c =>
        c.name.toLowerCase().includes(kw),
      );
      if (found) {
        lockedCategoryId = found.id;
        lockedCategoryName = found.name;
      }
    }
  }

  const newTotal = Math.round(event.budget.totalBudget * (1 - pct / 100));
  const savings = event.budget.totalBudget - newTotal;

  const operations: ChangeOperation[] = [
    {
      type: 'rebalance-budget',
      field: 'totalBudget',
      newValue: newTotal,
      reason: `Reduce overall budget by ${pct}% (saving ${event.profile.currency} ${savings.toLocaleString()})`,
    },
  ];

  if (lockedCategoryId) {
    const existing = event.budget.allocations.find(a => a.categoryId === lockedCategoryId);
    operations.push({
      type: 'update-budget',
      entityId: lockedCategoryId,
      field: 'lockedAmount',
      newValue: existing?.plannedAmount ?? 0,
      reason: `Lock ${lockedCategoryName} budget at current amount as requested`,
    });
  }

  const affectedEntities: AffectedEntity[] = [
    {
      entityType: 'budget',
      entityName: 'All Budget Categories',
      changeDescription: `Unlocked categories reduced by ${pct}%${lockedCategoryName ? ` (${lockedCategoryName} protected)` : ''}`,
      isHighImpact: pct >= 20,
    },
  ];

  return {
    explanation: `I'll reduce the total budget by ${pct}% from ${event.profile.currency} ${event.budget.totalBudget.toLocaleString()} to ${event.profile.currency} ${newTotal.toLocaleString()}${lockedCategoryName ? `, keeping ${lockedCategoryName} at its current allocation` : ''}. All unlocked categories will be proportionally adjusted.`,
    changeSet: makeChangeSet(userMessage, `Reduce budget by ${pct}%`, operations, affectedEntities),
    isLocalFallback: true,
  };
}

function handleGuestIncrease(userMessage: string, event: StoredEvent): LocalEngineResult | null {
  const lower = msg(userMessage);
  if (
    !lower.includes('add') && !lower.includes('increase') && !lower.includes('more guest')
  ) {
    return null;
  }
  if (!lower.includes('guest')) return null;

  const additional = extractNumber(lower) ?? 20;
  const newCount = event.profile.guestCount + additional;

  // Estimate per-head cost from catering allocation
  const cateringCat = event.budget.categories.find(c => c.name.toLowerCase().includes('cater'));
  const cateringAlloc = cateringCat
    ? event.budget.allocations.find(a => a.categoryId === cateringCat.id)
    : null;
  const perHead = cateringAlloc && event.profile.guestCount > 0
    ? Math.round(cateringAlloc.plannedAmount / event.profile.guestCount)
    : 0;
  const extraCost = perHead * additional;

  const operations: ChangeOperation[] = [
    {
      type: 'update-guest-count',
      field: 'guestCount',
      newValue: newCount,
      reason: `Increasing guest count from ${event.profile.guestCount} to ${newCount}`,
    },
  ];

  if (extraCost > 0 && cateringCat && cateringAlloc) {
    operations.push({
      type: 'update-budget',
      entityId: cateringCat.id,
      field: 'plannedAmount',
      newValue: cateringAlloc.plannedAmount + extraCost,
      reason: `Estimated ${event.profile.currency} ${perHead} per additional guest (catering)`,
    });
  }

  const affectedEntities: AffectedEntity[] = [
    { entityType: 'guest', entityName: 'Guest List', changeDescription: `+${additional} guests (${event.profile.guestCount} → ${newCount})`, isHighImpact: additional > 30 },
    { entityType: 'budget', entityName: 'Catering Budget', changeDescription: `Estimated +${event.profile.currency} ${extraCost.toLocaleString()} for additional guests`, isHighImpact: extraCost > event.budget.totalBudget * 0.1 },
    { entityType: 'risk', entityName: 'Venue Capacity', changeDescription: 'Check venue can accommodate new guest count', isHighImpact: true },
  ];

  return {
    explanation: `Adding ${additional} guests brings the total to ${newCount}. ${extraCost > 0 ? `Estimated catering cost increase: ${event.profile.currency} ${extraCost.toLocaleString()} (based on ${event.profile.currency} ${perHead}/head). ` : ''}Please verify venue capacity can accommodate the new headcount.`,
    changeSet: makeChangeSet(userMessage, `Add ${additional} guests to event`, operations, affectedEntities),
    isLocalFallback: true,
  };
}

function handleDateChange(userMessage: string, event: StoredEvent): LocalEngineResult | null {
  const lower = msg(userMessage);
  if (!lower.includes('move') && !lower.includes('shift') && !lower.includes('earlier') && !lower.includes('later')) {
    return null;
  }

  const weeks = extractWeeks(lower) ?? 2;
  const days = weeks * 7;
  const isEarlier = lower.includes('earlier') || lower.includes('sooner') || lower.includes('forward');
  const currentDate = parseISO(event.profile.date);
  const newDate = isEarlier ? subDays(currentDate, days) : addDays(currentDate, days);
  const newDateStr = formatISO(newDate, { representation: 'date' });

  const operations: ChangeOperation[] = [
    {
      type: 'update-event-date',
      field: 'date',
      newValue: newDateStr,
      reason: `Move event ${weeks} week${weeks !== 1 ? 's' : ''} ${isEarlier ? 'earlier' : 'later'} to ${newDateStr}`,
    },
  ];

  const affectedEntities: AffectedEntity[] = [
    { entityType: 'task', entityName: 'All Planning Tasks', changeDescription: 'Non-pinned task due dates will shift accordingly', isHighImpact: true },
    { entityType: 'vendor', entityName: 'Vendor Deadlines', changeDescription: 'Booking and payment deadlines relative to event date affected', isHighImpact: true },
  ];

  return {
    explanation: `Moving the event ${weeks} week${weeks !== 1 ? 's' : ''} ${isEarlier ? 'earlier' : 'later'} from ${event.profile.date} to ${newDateStr}. All non-pinned task deadlines will be recalculated, and vendor booking deadlines will shift accordingly.`,
    changeSet: makeChangeSet(userMessage, `Move event ${weeks}w ${isEarlier ? 'earlier' : 'later'}`, operations, affectedEntities),
    isLocalFallback: true,
  };
}

function handleDietary(userMessage: string, event: StoredEvent): LocalEngineResult | null {
  const lower = msg(userMessage);
  const dietaryMap: Record<string, string> = {
    vegetarian: 'vegetarian',
    vegan: 'vegan',
    halal: 'halal',
    kosher: 'kosher',
    'nut-free': 'nut-free',
    'gluten-free': 'gluten-free',
    'dairy-free': 'dairy-free',
  };
  const matches = Object.keys(dietaryMap).filter(k => lower.includes(k));
  if (matches.length === 0 && !lower.includes('diet')) return null;

  const newRequirements = Array.from(
    new Set([...event.profile.dietaryRequirements, ...matches]),
  );

  const operations: ChangeOperation[] = [
    {
      type: 'update-dietary',
      field: 'dietaryRequirements',
      newValue: newRequirements,
      reason: `Adding dietary requirements: ${matches.join(', ')}`,
    },
  ];

  const affectedEntities: AffectedEntity[] = [
    { entityType: 'vendor', entityName: 'Catering Requirements', changeDescription: `Caterer must accommodate: ${matches.join(', ')}`, isHighImpact: true },
    { entityType: 'task', entityName: 'Menu Planning', changeDescription: 'Menu options need review for new requirements', isHighImpact: false },
  ];

  return {
    explanation: `Adding dietary requirements: ${matches.length > 0 ? matches.join(', ') : 'updated preferences'}. Your caterer will need to be notified to ensure appropriate menu options are available.`,
    changeSet: makeChangeSet(userMessage, `Update dietary requirements`, operations, affectedEntities, false),
    isLocalFallback: true,
  };
}

function handleTheme(userMessage: string, event: StoredEvent): LocalEngineResult | null {
  const lower = msg(userMessage);
  const isSustainable = lower.includes('sustainab') || lower.includes('eco') || lower.includes('green');
  const isOutdoor = lower.includes('outdoor');
  const isIndoor = lower.includes('indoor');
  const isWeather = lower.includes('weather') || lower.includes('rain') || lower.includes('backup');
  const isChildren = lower.includes('children') || lower.includes('kids') || lower.includes('accessible');

  if (!isSustainable && !isOutdoor && !isIndoor && !isWeather && !isChildren) return null;

  const operations: ChangeOperation[] = [];
  const affectedEntities: AffectedEntity[] = [];
  let explanation = '';

  if (isSustainable) {
    const newStyles = Array.from(
      new Set([...event.profile.theme.style, 'sustainable', 'eco-friendly']),
    );
    operations.push({
      type: 'update-theme',
      field: 'theme.style',
      newValue: newStyles,
      reason: 'Adding sustainable/eco-friendly theme elements',
    });
    affectedEntities.push({ entityType: 'vendor', entityName: 'Vendor Selection', changeDescription: 'Consider eco-certified caterers and décor suppliers', isHighImpact: false });
    explanation = 'Adding sustainable and eco-friendly theme elements. Consider partnering with eco-certified vendors and opting for reusable décor.';
  } else if (isOutdoor || isWeather) {
    operations.push({
      type: 'update-theme',
      field: 'theme.hasWeatherBackup',
      newValue: true,
      reason: 'Enabling weather backup plan for outdoor event',
    });
    affectedEntities.push({ entityType: 'risk', entityName: 'Weather Backup', changeDescription: 'Weather contingency plan activated', isHighImpact: true });
    explanation = 'Activating weather backup plan. Ensure you have an indoor fallback venue or tent hire arranged.';
  } else if (isIndoor) {
    operations.push({
      type: 'update-theme',
      field: 'theme.indoorOutdoor',
      newValue: 'indoor',
      reason: 'Switching to indoor venue setup',
    });
    affectedEntities.push({ entityType: 'vendor', entityName: 'Venue Setup', changeDescription: 'Venue requirements updated to indoor', isHighImpact: false });
    explanation = 'Switching event setup to indoor. Venue and décor arrangements will be updated accordingly.';
  } else if (isChildren) {
    operations.push({
      type: 'update-event-profile',
      field: 'accessibilityNeeds',
      newValue: Array.from(
        new Set([...event.profile.accessibilityNeeds, 'mixed-ages']),
      ),
      reason: 'Adding mixed-ages / children accessibility setting',
    });
    affectedEntities.push({ entityType: 'vendor', entityName: 'Entertainment & Catering', changeDescription: 'Child-friendly options needed', isHighImpact: false });
    explanation = 'Adding child-friendly and accessibility settings. Consider age-appropriate entertainment and catering options.';
  }

  return {
    explanation,
    changeSet: makeChangeSet(userMessage, 'Update event theme/settings', operations, affectedEntities, false),
    isLocalFallback: true,
  };
}

// ---------------------------------------------------------------------------
// Fallback: unrecognized request
// ---------------------------------------------------------------------------

function helpResponse(userMessage: string): LocalEngineResult {
  const changeSet = makeChangeSet(
    userMessage,
    'Supported commands listed',
    [],
    [],
    false,
  );
  return {
    explanation: `I can help you with the following planning requests:\n\n• **Budget**: "Reduce budget by 15%, keep photography" · "Cut budget by 20%"\n• **Guests**: "Add 30 more guests" · "Increase guest count by 50"\n• **Date**: "Move event 2 weeks earlier" · "Shift event 1 week later"\n• **Dietary**: "Add vegetarian and vegan options" · "Include gluten-free menu"\n• **Theme**: "Make it sustainable" · "Add weather backup plan" · "Switch to indoor"\n• **Accessibility**: "Make it child-friendly and accessible"\n\nTry rephrasing your request using one of the patterns above!`,
    changeSet,
    isLocalFallback: true,
  };
}

// ---------------------------------------------------------------------------
// processLocalRequest — main entry point
// ---------------------------------------------------------------------------

export function processLocalRequest(
  userMessage: string,
  event: StoredEvent,
): LocalEngineResult {
  // Try each handler in order; return first match
  const result =
    handleBudgetReduction(userMessage, event, null) ??
    handleGuestIncrease(userMessage, event) ??
    handleDateChange(userMessage, event) ??
    handleDietary(userMessage, event) ??
    handleTheme(userMessage, event) ??
    helpResponse(userMessage);

  return result;
}
