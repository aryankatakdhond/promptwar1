export type AllocationPriority = 'essential' | 'high' | 'medium' | 'low' | 'optional';
export type ConfidenceLevel = 'confirmed' | 'estimated' | 'rough-estimate';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string; // lucide icon name
  priority: AllocationPriority;
  isLocked: boolean;
  isContingency: boolean;
  description?: string;
}

export interface BudgetAllocation {
  categoryId: string;
  plannedAmount: number; // integer
  actualAmount: number; // integer (0 if no actuals yet)
  lockedAmount?: number; // if set, plannedAmount cannot change during rebalance
  percentage: number; // 0-100, derived
  confidence: ConfidenceLevel;
  savingSuggestion?: string;
  notes?: string;
}

export interface BudgetPlan {
  eventId: string;
  totalBudget: number; // integer, must equal sum of all plannedAmounts
  contingencyAmount: number; // integer
  categories: BudgetCategory[];
  allocations: BudgetAllocation[];
  version: number;
  lastValidated: string; // ISO
}

export type ScenarioType = 'current' | 'save-15' | 'premium' | 'add-guests' | 'custom';

export interface BudgetScenario {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  modifications: ScenarioModification[];
}

export interface ScenarioModification {
  categoryId: string;
  newAmount: number;
  changePercent: number;
  isLocked: boolean;
}

export interface ScenarioResult {
  scenario: BudgetScenario;
  newAllocations: BudgetAllocation[];
  totalBudget: number;
  remainingBudget: number;
  changedCategories: string[]; // categoryIds
}

export interface SpendRecord {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  isConfirmedQuote: boolean;
  vendorId?: string;
}
