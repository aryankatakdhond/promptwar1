'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Unlock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  UtensilsCrossed,
  Camera,
  Flower2,
  Shirt,
  Music,
  Car,
  Mail,
  Users,
  Shield,
  Mic2,
  ShieldCheck,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import type { BudgetCategory, BudgetAllocation, BudgetPlan, AllocationPriority, ConfidenceLevel } from '@/types/budget';
import type { CurrencyCode } from '@/types/event';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  venue: Building2,
  'building-2': Building2,
  catering: UtensilsCrossed,
  utensils: UtensilsCrossed,
  photography: Camera,
  camera: Camera,
  decor: Flower2,
  flower: Flower2,
  attire: Shirt,
  shirt: Shirt,
  entertainment: Music,
  music: Music,
  transport: Car,
  car: Car,
  invitations: Mail,
  mail: Mail,
  staffing: Users,
  users: Users,
  contingency: Shield,
  shield: Shield,
  'audio-visual': Mic2,
  'monitor-speaker': Mic2,
  safety: ShieldCheck,
  'shield-alert': ShieldCheck,
  default: DollarSign,
};

export function getCategoryIcon(icon: string): LucideIcon {
  const key = icon.toLowerCase();
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS['default'];
}

const PRIORITY_BADGE: Record<AllocationPriority, { label: string; variant: 'danger' | 'warning' | 'default' | 'success' | 'info' }> = {
  essential: { label: 'Essential', variant: 'danger' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'default' },
  low: { label: 'Low', variant: 'success' },
  optional: { label: 'Optional', variant: 'info' },
};

const CONFIDENCE_BADGE: Record<ConfidenceLevel, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  confirmed: { label: 'Confirmed', variant: 'success' },
  estimated: { label: 'Estimated', variant: 'warning' },
  'rough-estimate': { label: 'Rough', variant: 'info' },
};

export interface BudgetCategoryRowProps {
  category: BudgetCategory;
  allocation: BudgetAllocation;
  currency: CurrencyCode;
  plan: BudgetPlan;
  onUpdate: (categoryId: string, newPlannedAmount: number, newActualAmount: number, isLocked: boolean) => void;
  onDelete: (categoryId: string) => void;
}

export function BudgetCategoryRow({
  category,
  allocation,
  currency,
  plan,
  onUpdate,
  onDelete,
}: BudgetCategoryRowProps) {
  const [editingPlanned, setEditingPlanned] = useState(false);
  const [editingActual, setEditingActual] = useState(false);
  const [plannedInput, setPlannedInput] = useState(String(allocation.plannedAmount));
  const [actualInput, setActualInput] = useState(String(allocation.actualAmount));
  const [plannedError, setPlannedError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const plannedInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = useRef<HTMLInputElement>(null);

  const IconComponent = getCategoryIcon(category.icon);
  const remaining = allocation.plannedAmount - allocation.actualAmount;
  const pctOfTotal =
    plan.totalBudget > 0
      ? Math.round((allocation.plannedAmount / plan.totalBudget) * 100)
      : 0;

  useEffect(() => {
    setPlannedInput(String(allocation.plannedAmount));
    setActualInput(String(allocation.actualAmount));
  }, [allocation.plannedAmount, allocation.actualAmount]);

  useEffect(() => {
    if (editingPlanned) plannedInputRef.current?.select();
  }, [editingPlanned]);

  useEffect(() => {
    if (editingActual) actualInputRef.current?.select();
  }, [editingActual]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function commitPlanned() {
    const value = parseInt(plannedInput, 10);
    if (isNaN(value) || value < 0) {
      setPlannedError('Must be a non-negative integer');
      setPlannedInput(String(allocation.plannedAmount));
      setEditingPlanned(false);
      setPlannedError('');
      return;
    }
    setPlannedError('');
    setEditingPlanned(false);
    if (value !== allocation.plannedAmount) {
      onUpdate(category.id, value, allocation.actualAmount, !!allocation.lockedAmount);
    }
  }

  function commitActual() {
    const value = parseInt(actualInput, 10);
    if (isNaN(value) || value < 0) {
      setActualInput(String(allocation.actualAmount));
      setEditingActual(false);
      return;
    }
    setEditingActual(false);
    if (value !== allocation.actualAmount) {
      onUpdate(category.id, allocation.plannedAmount, value, !!allocation.lockedAmount);
    }
  }

  function toggleLock() {
    onUpdate(category.id, allocation.plannedAmount, allocation.actualAmount, !allocation.lockedAmount);
  }

  const priorityInfo = PRIORITY_BADGE[category.priority];
  const confidenceInfo = CONFIDENCE_BADGE[allocation.confidence];

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#E5E7EB' }}>
      {/* Icon + Name */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 shrink-0" style={{ color: '#5A6178' }} />
          <span className="text-sm font-medium" style={{ color: '#1A1F2E' }}>
            {category.name}
          </span>
        </div>
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5">
        <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
      </td>

      {/* Planned Amount */}
      <td className="px-3 py-2.5">
        {editingPlanned ? (
          <div className="flex flex-col gap-0.5">
            <input
              ref={plannedInputRef}
              type="number"
              className="w-28 h-8 rounded border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-midnight"
              style={{ borderColor: '#1A1F2E' }}
              value={plannedInput}
              onChange={(e) => setPlannedInput(e.target.value)}
              onBlur={commitPlanned}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPlanned();
                if (e.key === 'Escape') {
                  setPlannedInput(String(allocation.plannedAmount));
                  setEditingPlanned(false);
                  setPlannedError('');
                }
              }}
            />
            {plannedError && <span className="text-xs text-red-600">{plannedError}</span>}
          </div>
        ) : (
          <button
            className="text-sm tabular-nums text-left hover:underline focus:outline-none focus:ring-1 focus:ring-midnight rounded"
            style={{ color: '#1A1F2E' }}
            onClick={() => {
              if (!category.isContingency) setEditingPlanned(true);
            }}
            title={category.isContingency ? 'Contingency cannot be edited here' : 'Click to edit'}
          >
            {formatCurrency(allocation.plannedAmount, currency)}
          </button>
        )}
      </td>

      {/* Actual Amount */}
      <td className="px-3 py-2.5">
        {editingActual ? (
          <input
            ref={actualInputRef}
            type="number"
            className="w-28 h-8 rounded border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-midnight"
            style={{ borderColor: '#1A1F2E' }}
            value={actualInput}
            onChange={(e) => setActualInput(e.target.value)}
            onBlur={commitActual}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitActual();
              if (e.key === 'Escape') {
                setActualInput(String(allocation.actualAmount));
                setEditingActual(false);
              }
            }}
          />
        ) : (
          <button
            className="text-sm tabular-nums text-left hover:underline focus:outline-none focus:ring-1 focus:ring-midnight rounded"
            style={{ color: '#5A6178' }}
            onClick={() => setEditingActual(true)}
            title="Click to edit actual spend"
          >
            {allocation.actualAmount > 0
              ? formatCurrency(allocation.actualAmount, currency)
              : <span style={{ color: '#B0B7C3' }}>—</span>}
          </button>
        )}
      </td>

      {/* Remaining */}
      <td className="px-3 py-2.5">
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: remaining < 0 ? '#C0392B' : '#2D7D6E' }}
        >
          {remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining), currency)}
        </span>
      </td>

      {/* % of Total */}
      <td className="px-3 py-2.5">
        <span className="text-sm tabular-nums" style={{ color: '#5A6178' }}>
          {pctOfTotal}%
        </span>
      </td>

      {/* Confidence */}
      <td className="px-3 py-2.5">
        <Badge variant={confidenceInfo.variant}>{confidenceInfo.label}</Badge>
      </td>

      {/* Lock toggle */}
      <td className="px-3 py-2.5">
        {!category.isContingency && (
          <button
            onClick={toggleLock}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title={allocation.lockedAmount !== undefined ? 'Unlock amount' : 'Lock amount'}
            aria-label={allocation.lockedAmount !== undefined ? 'Unlock' : 'Lock'}
          >
            {allocation.lockedAmount !== undefined ? (
              <Lock className="h-4 w-4" style={{ color: '#1A1F2E' }} />
            ) : (
              <Unlock className="h-4 w-4" style={{ color: '#B0B7C3' }} />
            )}
          </button>
        )}
      </td>

      {/* More actions */}
      <td className="px-3 py-2.5">
        {!category.isContingency && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" style={{ color: '#5A6178' }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-20 mt-1 w-36 rounded-brand border bg-white shadow-lg py-1"
                style={{ borderColor: '#E5E7EB' }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditingPlanned(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-midnight"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(category.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
