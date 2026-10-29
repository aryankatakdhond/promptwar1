import {
  MapPin,
  UtensilsCrossed,
  Flower2,
  Camera,
  Music,
  Car,
  Mail,
  Shirt,
  Users,
  Scale,
  ShieldCheck,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaskCategory, TaskPriority, TimelinePhase } from '@/types/timeline';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photography: 'Photography',
  entertainment: 'Entertainment',
  transport: 'Transport',
  invitations: 'Invitations',
  attire: 'Attire',
  staffing: 'Staffing',
  legal: 'Legal',
  'health-safety': 'Health & Safety',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<TaskCategory, LucideIcon> = {
  venue: MapPin,
  catering: UtensilsCrossed,
  decor: Flower2,
  photography: Camera,
  entertainment: Music,
  transport: Car,
  invitations: Mail,
  attire: Shirt,
  staffing: Users,
  legal: Scale,
  'health-safety': ShieldCheck,
  other: MoreHorizontal,
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  high: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  medium: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  low: { bg: '#F0F1F4', text: '#5A6178', border: '#D0D3DC' },
};

export const PHASE_LABELS: Record<TimelinePhase, string> = {
  immediate: 'Immediate',
  early: 'Early Planning',
  mid: 'Mid Planning',
  late: 'Final Prep',
  final: 'Final Week',
  'day-of': 'Day Of',
};

export const PHASE_ORDER: TimelinePhase[] = [
  'immediate',
  'early',
  'mid',
  'late',
  'final',
  'day-of',
];

export const STATUS_LABELS: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  blocked: 'Blocked',
  skipped: 'Skipped',
};

export function statusStyle(status: string): { border: string; bg: string; text: string } {
  switch (status) {
    case 'not-started': return { border: '#D0D3DC', bg: '#FDFAF4', text: '#5A6178' };
    case 'in-progress':  return { border: '#93C5FD', bg: '#EFF6FF', text: '#1E40AF' };
    case 'completed':    return { border: '#ABCDB0', bg: '#EFF5F0', text: '#4D6651' };
    case 'overdue':      return { border: '#FCA5A5', bg: '#FEF2F2', text: '#991B1B' };
    case 'blocked':      return { border: '#FDE68A', bg: '#FFFBEB', text: '#92400E' };
    case 'skipped':      return { border: '#E5E7EB', bg: '#F9FAFB', text: '#9CA3AF' };
    default:             return { border: '#D0D3DC', bg: '#FDFAF4', text: '#5A6178' };
  }
}

export const TASK_CATEGORIES: TaskCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'transport',
  'invitations',
  'attire',
  'staffing',
  'legal',
  'health-safety',
  'other',
];

export const TASK_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
