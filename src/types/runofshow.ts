export type BlockCategory =
  | 'setup'
  | 'arrival'
  | 'ceremony'
  | 'reception'
  | 'dining'
  | 'entertainment'
  | 'activity'
  | 'departure'
  | 'breakdown'
  | 'other';

export interface ShowBlock {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  category: BlockCategory;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  location?: string;
  zone?: string;
  responsiblePerson?: string;
  dependencies: string[]; // block IDs
  backupNotes?: string;
  notes?: string;
  sortOrder: number;
}

export interface ScheduleConflict {
  blockId: string;
  blockTitle: string;
  conflictingBlockId: string;
  conflictingBlockTitle: string;
  conflictType: 'overlap' | 'impossible-transition' | 'missing-setup' | 'gap';
  details: string;
}
