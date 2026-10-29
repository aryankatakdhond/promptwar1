'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Zap,
  Cpu,
  Activity,
  ArrowRight,
  Brain,
  Sparkles,
  Target,
  FlaskConical,
  UsersRound,
  CalendarClock,
  WalletCards,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import { processLocalRequest } from '@/lib/local-engine';
import { applyRippleChange, previewRippleChange } from '@/lib/ripple-engine';
import { getOverdueTasks } from '@/lib/timeline-engine';
import { ChangeImpactPreview } from './ChangeImpactPreview';
import type { CopilotMessage, ChangeSet } from '@/types/ai';
import type { StoredEvent } from '@/types/persistence';

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  'Reduce budget by 15%, keep photography',
  'Add 30 more guests to our event',
  "What's my biggest planning risk right now?",
  'Move the event two weeks earlier',
  'Make it more sustainable without increasing budget',
];

const COMMAND_CARDS = [
  {
    label: 'Find my blind spot',
    prompt: 'What is the single biggest planning risk right now, and what should I do next?',
    icon: Target,
    tone: '#7C5CD8',
  },
  {
    label: 'Stress-test the plan',
    prompt: 'Stress-test my event for a 20% guest increase and show every ripple effect.',
    icon: Activity,
    tone: '#3B82F6',
  },
  {
    label: 'Unlock savings',
    prompt: 'Find three realistic ways to save 10% without hurting guest experience or photography.',
    icon: Sparkles,
    tone: '#C0634B',
  },
];

function getPulse(event: NonNullable<ReturnType<typeof useEvent>['activeEvent']>) {
  const overdue = getOverdueTasks(event.tasks).length;
  const openRisks = event.risks.filter(risk => !risk.isResolved).length;
  const unbookedVendors = event.vendors.filter(vendor => vendor.status !== 'booked').length;
  const taskCompletion = event.tasks.length
    ? Math.round((event.tasks.filter(task => task.status === 'completed').length / event.tasks.length) * 100)
    : 0;
  const budgetUsed = event.budget.totalBudget
    ? Math.round((event.budget.allocations.reduce((sum, allocation) => sum + allocation.actualAmount, 0) / event.budget.totalBudget) * 100)
    : 0;

  return {
    overdue,
    openRisks,
    unbookedVendors,
    taskCompletion,
    budgetUsed,
    readiness: event.readinessScore.total,
  };
}

function EventPulse({ event, onAsk }: {
  event: NonNullable<ReturnType<typeof useEvent>['activeEvent']>;
  onAsk: (prompt: string) => void;
}) {
  const pulse = useMemo(() => getPulse(event), [event]);
  const domains = [
    { label: 'Momentum', value: pulse.taskCompletion, detail: `${pulse.overdue} overdue`, color: '#3B82F6' },
    { label: 'Budget', value: Math.min(pulse.budgetUsed, 100), detail: `${pulse.budgetUsed}% committed`, color: '#C0634B' },
    { label: 'Coverage', value: Math.max(0, 100 - pulse.unbookedVendors * 15), detail: `${pulse.unbookedVendors} vendor gaps`, color: '#7C5CD8' },
    { label: 'Safety', value: Math.max(0, 100 - pulse.openRisks * 12), detail: `${pulse.openRisks} open risks`, color: '#22C55E' },
  ];

  return (
    <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #1A1F2E 0%, #272D42 100%)' }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]" style={{ color: '#AEB5C8' }}>
            <Brain className="h-3.5 w-3.5" style={{ color: '#F6B7A7' }} />
            Event intelligence
          </div>
          <h2 className="text-lg font-semibold mt-1" style={{ color: '#FDFAF4' }}>Your plan has a pulse.</h2>
          <p className="text-xs mt-1" style={{ color: '#AEB5C8' }}>
            Readiness is {pulse.readiness}/100. Ask MOMENTRA to move from signal to action.
          </p>
        </div>
        <div className="rounded-xl px-3 py-2 text-right" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="text-2xl font-bold" style={{ color: '#FDFAF4' }}>{pulse.readiness}</div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: '#AEB5C8' }}>readiness</div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {domains.map(domain => (
          <div key={domain.label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: '#D5D9E5' }}>
              <span>{domain.label}</span>
              <span>{domain.value}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="h-full rounded-full" style={{ width: `${domain.value}%`, background: domain.color }} />
            </div>
            <div className="text-[10px] mt-1.5 truncate" style={{ color: '#8F97AD' }}>{domain.detail}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto mt-3 pb-0.5">
        {COMMAND_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onAsk(card.prompt)}
              className="flex items-center gap-2 shrink-0 rounded-lg px-3 py-2 text-xs transition-transform hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FDFAF4', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: card.tone }} />
              {card.label}
              <ArrowRight className="h-3 w-3" style={{ color: '#8F97AD' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

type LabScenario = 'guests' | 'budget' | 'date';

const LAB_SCENARIOS: Array<{
  id: LabScenario;
  label: string;
  description: string;
  prompt: string;
  icon: typeof UsersRound;
  color: string;
}> = [
  {
    id: 'guests',
    label: 'More guests',
    description: '+20 guests',
    prompt: 'Add 20 more guests to our event',
    icon: UsersRound,
    color: '#3B82F6',
  },
  {
    id: 'budget',
    label: 'Tighter budget',
    description: 'Reduce by 10%',
    prompt: 'Reduce budget by 10%',
    icon: WalletCards,
    color: '#C0634B',
  },
  {
    id: 'date',
    label: 'Earlier date',
    description: 'Move 2 weeks earlier',
    prompt: 'Move the event two weeks earlier',
    icon: CalendarClock,
    color: '#7C5CD8',
  },
];

function DecisionLab({
  event,
  onApplyProposal,
}: {
  event: StoredEvent;
  onApplyProposal: (changeSet: ChangeSet) => void;
}) {
  const [activeScenario, setActiveScenario] = useState<LabScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ changeSet: ChangeSet; preview: StoredEvent } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  function runScenario(scenario: LabScenario) {
    const config = LAB_SCENARIOS.find(item => item.id === scenario);
    if (!config) return;
    setActiveScenario(scenario);
    setIsRunning(true);
    window.setTimeout(() => {
      const localResult = processLocalRequest(config.prompt, event);
      const preview = previewRippleChange(event, localResult.changeSet).preview as StoredEvent;
      setResult({ changeSet: localResult.changeSet, preview });
      setIsRunning(false);
    }, 350);
  }

  function reset() {
    setActiveScenario(null);
    setResult(null);
  }

  const scenario = LAB_SCENARIOS.find(item => item.id === activeScenario);
  const guestDelta = result ? result.preview.profile.guestCount - event.profile.guestCount : 0;
  const budgetDelta = result ? result.preview.budget.totalBudget - event.budget.totalBudget : 0;
  const taskDelta = result ? result.preview.tasks.filter(task => task.dueDate !== event.tasks.find(current => current.id === task.id)?.dueDate).length : 0;

  return (
    <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB', background: 'white' }}>
      <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ background: '#FBF7F1' }}>
        <div className="flex gap-2.5">
          <div className="rounded-lg p-2" style={{ background: '#FCE8E2', color: '#C0634B' }}>
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: '#1A1F2E' }}>Decision Lab</h3>
              <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: '#E8F4F0', color: '#2D7D6E' }}>no-risk simulation</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#5A6178' }}>Explore a future before you commit to it.</p>
          </div>
        </div>
        {result && (
          <button onClick={reset} className="p-1 rounded hover:bg-white" aria-label="Close Decision Lab">
            <X className="h-4 w-4" style={{ color: '#8A90A4' }} />
          </button>
        )}
        {!result && (
          <button
            onClick={() => setIsExpanded(value => !value)}
            className="text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors hover:bg-white"
            style={{ color: '#C0634B' }}
          >
            {isExpanded ? 'Hide lab' : 'Open lab'}
          </button>
        )}
      </div>

      {isExpanded && <div className="p-3">
        {!result && !isRunning && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LAB_SCENARIOS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => runScenario(item.id)}
                  className="flex items-center gap-2.5 rounded-lg p-2.5 text-left transition-all hover:-translate-y-0.5"
                  style={{ border: '1px solid #E5E7EB', background: '#FFFFFF' }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                  <span>
                    <span className="block text-xs font-semibold" style={{ color: '#1A1F2E' }}>{item.label}</span>
                    <span className="block text-[11px]" style={{ color: '#8A90A4' }}>{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-xs py-2" style={{ color: '#5A6178' }}>
            <span className="h-3 w-3 rounded-full border-2 border-[#C0634B] border-t-transparent animate-spin" />
            Mapping second-order effects across your plan...
          </div>
        )}

        {result && scenario && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: '#1A1F2E' }}>{scenario.label} simulation</p>
                <p className="text-[11px]" style={{ color: '#8A90A4' }}>{result.changeSet.affectedEntities.length} areas potentially affected</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide" style={{ color: '#2D7D6E' }}>preview only</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg p-2" style={{ background: '#F7F8FA' }}>
                <span className="block text-[10px]" style={{ color: '#8A90A4' }}>Guests</span>
                <strong className="text-sm" style={{ color: guestDelta > 0 ? '#3B82F6' : '#1A1F2E' }}>{guestDelta > 0 ? `+${guestDelta}` : guestDelta}</strong>
              </div>
              <div className="rounded-lg p-2" style={{ background: '#F7F8FA' }}>
                <span className="block text-[10px]" style={{ color: '#8A90A4' }}>Budget</span>
                <strong className="text-sm" style={{ color: budgetDelta < 0 ? '#2D7D6E' : '#1A1F2E' }}>{budgetDelta === 0 ? '—' : `${budgetDelta > 0 ? '+' : ''}${budgetDelta.toLocaleString()}`}</strong>
              </div>
              <div className="rounded-lg p-2" style={{ background: '#F7F8FA' }}>
                <span className="block text-[10px]" style={{ color: '#8A90A4' }}>Tasks shifted</span>
                <strong className="text-sm" style={{ color: taskDelta > 0 ? '#7C5CD8' : '#1A1F2E' }}>{taskDelta}</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {result.changeSet.affectedEntities.slice(0, 4).map((entity, index) => (
                <span key={`${entity.entityName}-${index}`} className="rounded-full px-2 py-1 text-[10px]" style={{ background: entity.isHighImpact ? '#FEF3C7' : '#F1F3F7', color: entity.isHighImpact ? '#92400E' : '#5A6178' }}>
                  {entity.entityName}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onApplyProposal(result.changeSet)} style={{ background: '#C0634B', color: 'white' }}>
                Review proposal
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>Try another</Button>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="rounded-full flex items-center justify-center shrink-0 h-7 w-7 text-xs font-bold"
        style={{ backgroundColor: '#C0634B', color: 'white' }}
      >
        AI
      </div>
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block h-2 w-2 rounded-full"
            style={{
              backgroundColor: '#9CA3AF',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: CopilotMessage;
  onShowChanges: (changeSet: ChangeSet) => void;
}

function MessageBubble({ message, onShowChanges }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm"
          style={{ backgroundColor: '#C0634B', color: 'white', lineHeight: '1.6' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="rounded-full flex items-center justify-center shrink-0 h-7 w-7 text-xs font-bold"
        style={{ backgroundColor: '#C0634B', color: 'white' }}
      >
        AI
      </div>
      <div className="max-w-[85%] flex flex-col gap-2">
        <div
          className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm"
          style={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            color: '#1A1F2E',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
        {message.changeSet && message.changeSet.operations.length > 0 && (
          <button
            onClick={() => onShowChanges(message.changeSet!)}
            className="self-start text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
            style={{
              backgroundColor: '#FEF0EC',
              color: '#C0634B',
              border: '1px solid #F8C4B8',
            }}
          >
            → {message.changeSet.operations.length} change{message.changeSet.operations.length !== 1 ? 's' : ''} proposed — Review
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CopilotTab
// ---------------------------------------------------------------------------

export function CopilotTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveAI, setIsLiveAI] = useState<boolean | null>(null);
  const [previewChangeSet, setPreviewChangeSet] = useState<ChangeSet | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages: CopilotMessage[] = useMemo(
    () => activeEvent?.copilotHistory ?? [],
    [activeEvent?.copilotHistory],
  );

  // Check AI status on first message attempt (lightweight)
  useEffect(() => {
    // We'll infer from the first response; initialize as null (unknown)
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!activeEvent || !userText.trim() || isLoading) return;

    const trimmed = userText.trim();
    setInput('');
    setIsLoading(true);

    const userMsg: CopilotMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COPILOT_MESSAGE', eventId: activeEvent.profile.id, message: userMsg });

    // Build serialized event state (summary only)
    const eventState = {
      profile: {
        id: activeEvent.profile.id,
        name: activeEvent.profile.name,
        type: activeEvent.profile.type,
        date: activeEvent.profile.date,
        guestCount: activeEvent.profile.guestCount,
        totalBudget: activeEvent.profile.totalBudget,
        currency: activeEvent.profile.currency,
        city: activeEvent.profile.city,
      },
      budgetSummary: {
        totalBudget: activeEvent.budget.totalBudget,
        allocations: activeEvent.budget.allocations.map(a => ({
          categoryId: a.categoryId,
          plannedAmount: a.plannedAmount,
          actualAmount: a.actualAmount,
        })),
      },
      taskSummary: {
        totalTasks: activeEvent.tasks.length,
        completedTasks: activeEvent.tasks.filter(t => t.status === 'completed').length,
        overdueTasks: getOverdueTasks(activeEvent.tasks).length,
      },
    };

    // Keep last 10 messages as conversation history (exclude last user msg we just added)
    const history: CopilotMessage[] = messages.slice(-10);

    try {
      let assistantContent = '';
      let changeSet: ChangeSet | undefined;
      let localFallback = false;

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventState, userMessage: trimmed, conversationHistory: history }),
      });

      if (res.status === 429) {
        assistantContent = 'Rate limit reached. Please wait 30 seconds before trying again.';
        localFallback = false;
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      } else {
        const data = await res.json();
        localFallback = data.isLocalFallback === true;
        setIsLiveAI(!localFallback);

        if (localFallback) {
          // Call local engine client-side
          const localResult = processLocalRequest(trimmed, activeEvent);
          assistantContent = localResult.explanation;
          changeSet = localResult.changeSet;
        } else {
          assistantContent = data.explanation ?? 'Done.';
          changeSet = data.changeSet ?? undefined;
          if (data.followUpQuestion) {
            assistantContent += `\n\n${data.followUpQuestion}`;
          }
        }
      }

      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        changeSet,
      };

      dispatch({ type: 'ADD_COPILOT_MESSAGE', eventId: activeEvent.profile.id, message: assistantMsg });

      // Auto-show preview if changeset has operations and requires confirmation
      if (changeSet && changeSet.operations.length > 0 && changeSet.requiresConfirmation) {
        setPreviewChangeSet(changeSet);
        setPreviewOpen(true);
      }

    } catch (err) {
      console.error('Copilot send error:', err instanceof Error ? err.message : err);

      // Graceful fallback: use local engine
      const localResult = processLocalRequest(trimmed, activeEvent);
      setIsLiveAI(false);

      const assistantMsg: CopilotMessage = {
        role: 'assistant',
        content: localResult.explanation,
        timestamp: new Date().toISOString(),
        changeSet: localResult.changeSet,
      };

      dispatch({ type: 'ADD_COPILOT_MESSAGE', eventId: activeEvent.profile.id, message: assistantMsg });

      if (localResult.changeSet.operations.length > 0 && localResult.changeSet.requiresConfirmation) {
        setPreviewChangeSet(localResult.changeSet);
        setPreviewOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeEvent, dispatch, isLoading, messages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleApplyChanges() {
    if (!previewChangeSet || !activeEvent) return;

    // Push current state to undo stack before applying
    dispatch({ type: 'PUSH_UNDO', eventId: activeEvent.profile.id, changeSet: previewChangeSet });

    // Apply via ripple engine
    const newEvent = applyRippleChange(activeEvent, previewChangeSet);

    dispatch({ type: 'APPLY_CHANGESET', eventId: activeEvent.profile.id, event: newEvent });
    setPreviewChangeSet(null);

    toast({ title: 'Changes applied', variant: 'success', duration: 5000 });
  }

  function handleDiscardChanges() {
    setPreviewChangeSet(null);
    toast({ title: 'Changes discarded', variant: 'default', duration: 3000 });
  }

  function showChangeSetFromMessage(changeSet: ChangeSet) {
    setPreviewChangeSet(changeSet);
    setPreviewOpen(true);
  }

  if (!activeEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: '#5A6178' }}>No event selected.</p>
      </div>
    );
  }

  const isLiveKnown = isLiveAI !== null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border shadow-sm" style={{ minHeight: 'calc(100vh - 112px)', borderColor: '#E8E9EE', background: '#FFFFFF' }}>
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: '#E8E9EE', background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFAF7 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl" style={{ background: '#FCE8E2', color: '#C0634B' }}>
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold" style={{ color: '#1A1F2E' }}>MOMENTRA Copilot</h1>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ background: '#E8F4F0', color: '#2D7D6E' }}>planning intelligence</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#7A8194' }}>A calm second brain for every decision behind your event.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: isLiveAI ? '#2D7D6E' : '#7A8194' }}>
          {isLiveAI ? <Zap className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5" />}
          {isLiveKnown ? (isLiveAI ? 'Gemini live' : 'Local engine') : 'Ready to think'}
        </div>
      </div>

      <EventPulse event={activeEvent} onAsk={sendMessage} />

      <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b text-xs" style={{ borderColor: '#E8E9EE', backgroundColor: '#FAFBFC' }}>
        <div className="flex items-center gap-2" style={{ color: '#7A8194' }}>
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#2D7D6E' }} />
          Every change is simulated and reviewed before it touches your plan.
        </div>
        <span className="hidden md:inline" style={{ color: '#A0A6B4' }}>Ctrl + Enter to send</span>
      </div>

      <DecisionLab
        event={activeEvent}
        onApplyProposal={showChangeSetFromMessage}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5" style={{ minHeight: 0, background: '#FCFCFD' }}>

        {/* Suggested prompts (shown when history is empty) */}
        {messages.length === 0 && !isLoading && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>
              Try asking...
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: '#F7F8FA',
                    border: '1px solid #E5E7EB',
                    color: '#1A1F2E',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            onShowChanges={showChangeSetFromMessage}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="border-t px-5 py-4"
        style={{ borderColor: '#E8E9EE', backgroundColor: 'white' }}
      >
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ border: '1px solid #E5E7EB', backgroundColor: '#F7F8FA' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to update your plan..."
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-gray-400 py-1 px-1"
            style={{ color: '#1A1F2E', minHeight: '2.5rem', maxHeight: '8rem' }}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            style={{ backgroundColor: '#C0634B', color: 'white', flexShrink: 0 }}
            className="hover:opacity-90 transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: '#9CA3AF' }}>
          MOMENTRA never applies AI suggestions automatically. You stay in control.
        </p>
      </div>

      {/* Change impact preview modal */}
      {previewChangeSet && (
        <ChangeImpactPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          changeSet={previewChangeSet}
          onApply={handleApplyChanges}
          onDiscard={handleDiscardChanges}
        />
      )}

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
