import Papa from 'papaparse';
import type { Guest } from '@/types/guest';
import type { PlanningTask } from '@/types/timeline';

export function exportGuestsCSV(guests: Guest[]): void {
  const data = guests.map((g) => ({
    'First Name': g.firstName,
    'Last Name': g.lastName,
    'Email': g.email ?? '',
    'Phone': g.phone ?? '',
    'RSVP Status': g.rsvpStatus,
    'Invitation Status': g.invitationStatus,
    'Has Plus-One': g.hasPlusOne ? 'Yes' : 'No',
    'Plus-One Name': g.plusOneName ?? '',
    'Plus-One RSVP': g.plusOneRsvp ?? '',
    'Dietary Requirements': g.dietaryRequirements.join(', '),
    'Accessibility Needs': g.accessibilityNeeds.join(', '),
    'Table Number': g.tableNumber ?? '',
    'VIP': g.isVIP ? 'Yes' : 'No',
    'Group': g.householdGroup ?? '',
    'Notes': g.notes ?? '',
  }));
  const csv = Papa.unparse(data);
  downloadFile(csv, `guests-${Date.now()}.csv`, 'text/csv');
}

export function exportTasksCSV(tasks: PlanningTask[]): void {
  const data = tasks.map((t) => ({
    'Title': t.title,
    'Description': t.description,
    'Category': t.category,
    'Priority': t.priority,
    'Status': t.status,
    'Due Date': t.dueDate,
    'Phase': t.phase,
    'Days Before Event': t.daysBeforeEvent,
    'Pinned': t.isPinned ? 'Yes' : 'No',
    'Assigned To': t.assignedTo ?? '',
  }));
  const csv = Papa.unparse(data);
  downloadFile(csv, `tasks-${Date.now()}.csv`, 'text/csv');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
