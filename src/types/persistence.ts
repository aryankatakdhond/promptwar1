import type { EventProfile } from './event';
import type { BudgetPlan } from './budget';
import type { PlanningTask } from './timeline';
import type { VendorEntry } from './vendor';
import type { Guest } from './guest';
import type { ShowBlock } from './runofshow';
import type { RiskItem, ReadinessScore } from './risk';
import type { CreativeConcept } from './ideas';
import type { CopilotMessage, ChangeSet } from './ai';

export interface StoredEvent {
  profile: EventProfile;
  budget: BudgetPlan;
  tasks: PlanningTask[];
  vendors: VendorEntry[];
  guests: Guest[];
  runOfShow: ShowBlock[];
  risks: RiskItem[];
  readinessScore: ReadinessScore;
  ideas: CreativeConcept[];
  copilotHistory: CopilotMessage[];
  undoStack: ChangeSet[]; // last 5
}

export interface AppState {
  version: number;
  activeEventId: string | null;
  events: StoredEvent[];
  lastSaved: string;
}

export const STORAGE_VERSION = 1;
export const STORAGE_KEY = 'momentra_v1';
