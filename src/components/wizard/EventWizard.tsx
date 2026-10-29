'use client';

import { useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '@/context/AppContext';
import { generateTimeline } from '@/lib/timeline-engine';
import { generateDefaultCategories, allocateBudget } from '@/lib/budget-engine';
import { detectRisks, calculateReadinessScore } from '@/lib/risk-engine';
import type {
  EventType,
  CurrencyCode,
  DietaryRequirement,
  AccessibilityNeed,
  EventPriority,
  EventProfile,
} from '@/types/event';
import type { StoredEvent } from '@/types/persistence';

import { EventTypeStep } from './steps/EventTypeStep';
import { EventDetailsStep } from './steps/EventDetailsStep';
import { GuestCountStep } from './steps/GuestCountStep';
import { BudgetStep } from './steps/BudgetStep';
import { ThemeStep } from './steps/ThemeStep';
import { DietaryStep } from './steps/DietaryStep';
import { AccessibilityStep } from './steps/AccessibilityStep';
import { PrioritiesStep } from './steps/PrioritiesStep';
import { TraditionsStep } from './steps/TraditionsStep';
import { ReviewStep } from './steps/ReviewStep';

// ─── Wizard State ─────────────────────────────────────────────────────────────

interface WizardData {
  eventType?: EventType;
  name?: string;
  date?: string;
  time?: string;
  city?: string;
  guestCount?: number;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  totalBudget?: number;
  currency?: CurrencyCode;
  themeStyles?: string[];
  colorPreferences?: string[];
  dietaryRequirements?: DietaryRequirement[];
  accessibilityNeeds?: AccessibilityNeed[];
  priorities?: EventPriority[];
  culturalNotes?: string;
  hasWeatherBackup?: boolean;
}

interface WizardState {
  currentStep: number;
  data: WizardData;
  errors: Record<string, string>;
  isGenerating: boolean;
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE_DATA'; data: Partial<WizardData> }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_GENERATING'; value: boolean };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, errors: {} };
    case 'UPDATE_DATA':
      return { ...state, data: { ...state.data, ...action.data } };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.value };
    default:
      return state;
  }
}

const INITIAL_STATE: WizardState = {
  currentStep: 0,
  data: { currency: 'INR', guestCount: 100 },
  errors: {},
  isGenerating: false,
};

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Event Type', canSkip: false },
  { label: 'Details', canSkip: false },
  { label: 'Guests', canSkip: false },
  { label: 'Budget', canSkip: false },
  { label: 'Theme', canSkip: true },
  { label: 'Dietary', canSkip: true },
  { label: 'Accessibility', canSkip: true },
  { label: 'Priorities', canSkip: true },
  { label: 'Traditions', canSkip: true },
  { label: 'Review', canSkip: false },
];

const TOTAL_STEPS = STEPS.length;
const REVIEW_STEP = TOTAL_STEPS - 1;

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(step: number, data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0 && !data.eventType) {
    errors.eventType = 'Please select an event type.';
  }
  if (step === 1) {
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Event name must be at least 2 characters.';
    }
    if (!data.date) {
      errors.date = 'Please select an event date.';
    } else if (new Date(data.date) <= new Date()) {
      errors.date = 'Event date must be in the future.';
    }
    if (!data.time) {
      errors.time = 'Please enter an event time.';
    }
    if (!data.city || data.city.trim().length < 2) {
      errors.city = 'Please enter a city.';
    }
  }
  if (step === 2) {
    if (!data.guestCount || data.guestCount < 1) {
      errors.guestCount = 'Please enter a valid guest count.';
    }
    if (!data.indoorOutdoor) {
      errors.indoorOutdoor = 'Please select a venue style.';
    }
  }
  if (step === 3) {
    if (!data.totalBudget || data.totalBudget < 1) {
      errors.totalBudget = 'Please enter a total budget.';
    }
  }
  return errors;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventWizardProps {
  onClose: () => void;
  onComplete: (eventId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventWizard({ onClose, onComplete }: EventWizardProps) {
  const { dispatch: appDispatch } = useAppContext();
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const { currentStep, data, errors, isGenerating } = state;

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const stepConfig = STEPS[currentStep];

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goNext() {
    const errs = validate(currentStep, data);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs });
      return;
    }
    if (currentStep < REVIEW_STEP) {
      dispatch({ type: 'SET_STEP', step: currentStep + 1 });
    }
  }

  function goBack() {
    if (currentStep > 0) {
      dispatch({ type: 'SET_STEP', step: currentStep - 1 });
    }
  }

  function goToStep(step: number) {
    dispatch({ type: 'SET_STEP', step });
  }

  function skipStep() {
    if (currentStep < REVIEW_STEP) {
      dispatch({ type: 'SET_STEP', step: currentStep + 1 });
    }
  }

  // ── Auto-advance from EventTypeStep ─────────────────────────────────────────

  function handleEventTypeSelect(type: EventType) {
    dispatch({ type: 'UPDATE_DATA', data: { eventType: type } });
    setTimeout(() => dispatch({ type: 'SET_STEP', step: 1 }), 200);
  }

  // ── Generate ─────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    dispatch({ type: 'SET_GENERATING', value: true });

    await new Promise((r) => setTimeout(r, 50)); // let UI re-render

    try {
      const eventId = uuidv4();
      const now = new Date().toISOString();

      const profile: EventProfile = {
        id: eventId,
        name: data.name!,
        type: data.eventType!,
        status: 'planning',
        date: data.date!,
        time: data.time!,
        city: data.city!,
        guestCount: data.guestCount!,
        confirmedGuestCount: 0,
        currency: data.currency ?? 'INR',
        totalBudget: data.totalBudget!,
        contingencyPercent: 10,
        theme: {
          style: data.themeStyles ?? [],
          colorPreferences: data.colorPreferences ?? [],
          indoorOutdoor: data.indoorOutdoor ?? 'indoor',
          hasWeatherBackup: data.hasWeatherBackup ?? false,
        },
        dietaryRequirements: data.dietaryRequirements ?? [],
        accessibilityNeeds: data.accessibilityNeeds ?? [],
        priorities: data.priorities ?? [],
        culturalNotes: data.culturalNotes,
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      };

      const tasks = generateTimeline(profile);
      const categories = generateDefaultCategories(data.eventType!);
      const budget = allocateBudget(data.totalBudget!, categories, 10, []);
      budget.eventId = eventId;

      const riskParams = {
        event: profile,
        budget,
        tasks,
        vendors: [],
        runOfShow: [],
      };

      const risks = detectRisks(riskParams);
      const readinessScore = calculateReadinessScore(riskParams);

      const storedEvent: StoredEvent = {
        profile,
        budget,
        tasks,
        vendors: [],
        guests: [],
        runOfShow: [],
        risks,
        readinessScore,
        ideas: [],
        copilotHistory: [],
        undoStack: [],
      };

      appDispatch({ type: 'ADD_EVENT', event: storedEvent });
      appDispatch({ type: 'SET_ACTIVE_EVENT', eventId });

      onComplete(eventId);
    } catch {
      dispatch({ type: 'SET_GENERATING', value: false });
    }
  }

  // ── Render step content ──────────────────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <EventTypeStep
            selected={data.eventType}
            onSelect={handleEventTypeSelect}
          />
        );
      case 1:
        return (
          <EventDetailsStep
            data={{ name: data.name, date: data.date, time: data.time, city: data.city }}
            errors={errors}
            onChange={(field, value) => dispatch({ type: 'UPDATE_DATA', data: { [field]: value } })}
          />
        );
      case 2:
        return (
          <GuestCountStep
            data={{
              guestCount: data.guestCount,
              indoorOutdoor: data.indoorOutdoor,
              hasWeatherBackup: data.hasWeatherBackup,
            }}
            onChange={(updates) => dispatch({ type: 'UPDATE_DATA', data: updates })}
          />
        );
      case 3:
        return (
          <BudgetStep
            data={{
              totalBudget: data.totalBudget,
              currency: data.currency,
              eventType: data.eventType,
              guestCount: data.guestCount,
            }}
            onChange={(updates) => dispatch({ type: 'UPDATE_DATA', data: updates })}
          />
        );
      case 4:
        return (
          <ThemeStep
            data={{ themeStyles: data.themeStyles, colorPreferences: data.colorPreferences }}
            onChange={(updates) => dispatch({ type: 'UPDATE_DATA', data: updates })}
          />
        );
      case 5:
        return (
          <DietaryStep
            selected={data.dietaryRequirements ?? []}
            onChange={(items) => dispatch({ type: 'UPDATE_DATA', data: { dietaryRequirements: items } })}
          />
        );
      case 6:
        return (
          <AccessibilityStep
            selected={data.accessibilityNeeds ?? []}
            onChange={(items) => dispatch({ type: 'UPDATE_DATA', data: { accessibilityNeeds: items } })}
          />
        );
      case 7:
        return (
          <PrioritiesStep
            selected={data.priorities ?? []}
            onChange={(items) => dispatch({ type: 'UPDATE_DATA', data: { priorities: items } })}
          />
        );
      case 8:
        return (
          <TraditionsStep
            culturalNotes={data.culturalNotes}
            onChange={(notes) => dispatch({ type: 'UPDATE_DATA', data: { culturalNotes: notes } })}
          />
        );
      case 9:
        return (
          <ReviewStep
            data={data}
            onGoToStep={goToStep}
          />
        );
      default:
        return null;
    }
  }

  // ── Generating screen ────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(26,31,46,0.7)' }}
      >
        <div
          className="rounded-2xl p-10 text-center max-w-sm w-full mx-4"
          style={{ background: '#FDFAF4' }}
        >
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#1A1F2E' }}>
            Building your event plan…
          </h2>
          <p className="text-sm mb-6" style={{ color: '#5A6178' }}>
            Generating timeline, budget, and risk analysis.
          </p>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: '#E8E9EE' }}
          >
            <div
              className="h-full rounded-full"
              style={{ background: '#C4613A', width: '70%', transition: 'width 1s ease' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main overlay ─────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,31,46,0.7)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#FDFAF4', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-0">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg hover:bg-black/10 transition-colors"
            style={{ color: '#5A6178' }}
            aria-label="Close wizard"
          >
            ×
          </button>

          {/* Wordmark */}
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: '#C4613A' }}
          >
            MOMENTRA
          </div>

          {/* Progress bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden mb-2"
            style={{ background: '#E8E9EE' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: '#C4613A', width: `${progress}%` }}
            />
          </div>

          {/* Step label */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ color: '#5A6178' }}>
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium" style={{ color: '#1A1F2E' }}>
              {stepConfig?.label}
            </span>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {renderStep()}
        </div>

        {/* Footer nav */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: '#E8E9EE', background: '#FDFAF4' }}
        >
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: currentStep === 0 ? 'transparent' : '#F0F1F4',
              color: currentStep === 0 ? 'transparent' : '#1A1F2E',
              cursor: currentStep === 0 ? 'default' : 'pointer',
            }}
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            {stepConfig?.canSkip && currentStep < REVIEW_STEP && (
              <button
                onClick={skipStep}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#5A6178', background: 'transparent' }}
              >
                Skip
              </button>
            )}

            {currentStep < REVIEW_STEP ? (
              // On step 0 (EventTypeStep) the card click auto-advances, but show Next too
              currentStep === 0 ? (
                <button
                  onClick={goNext}
                  disabled={!data.eventType}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
                  style={{
                    background: data.eventType ? '#C4613A' : '#D0D3DC',
                    color: '#FDFAF4',
                    opacity: data.eventType ? 1 : 0.6,
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: '#C4613A', color: '#FDFAF4' }}
                >
                  Next →
                </button>
              )
            ) : (
              <button
                onClick={handleGenerate}
                className="px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#C4613A', color: '#FDFAF4' }}
              >
                Generate My Event Plan 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
