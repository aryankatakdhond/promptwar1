'use client';

// Re-export the toast hook and types from the UI component so consumers can
// import from '@/hooks/useToast' as a stable, location-agnostic path.
export { useToast } from '@/components/ui/toast';
export type { Toast } from '@/components/ui/toast';
