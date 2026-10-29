export type ChangeOperationType =
  | 'update-budget'
  | 'update-task'
  | 'update-vendor'
  | 'update-guest-count'
  | 'update-event-date'
  | 'update-dietary'
  | 'update-theme'
  | 'add-task'
  | 'remove-task'
  | 'update-event-profile'
  | 'rebalance-budget';

export interface ChangeOperation {
  type: ChangeOperationType;
  entityId?: string;
  field?: string;
  oldValue?: unknown;
  newValue: unknown;
  reason: string;
}

export interface ChangeSet {
  id: string;
  userRequest: string;
  operations: ChangeOperation[];
  summary: string;
  requiresConfirmation: boolean;
  affectedEntities: AffectedEntity[];
  generatedBy: 'gemini' | 'local-engine';
  timestamp: string;
}

export interface AffectedEntity {
  entityType:
    | 'budget'
    | 'task'
    | 'vendor'
    | 'guest'
    | 'risk'
    | 'runofshow'
    | 'event-profile';
  entityId?: string;
  entityName: string;
  changeDescription: string;
  isHighImpact: boolean;
}

export interface CopilotRequest {
  eventState: unknown; // serialized relevant event state
  userMessage: string;
  conversationHistory: CopilotMessage[];
}

export interface CopilotResponse {
  changeSet?: ChangeSet;
  explanation: string;
  followUpQuestion?: string;
  isLocalFallback: boolean;
  error?: string;
}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changeSet?: ChangeSet;
}
