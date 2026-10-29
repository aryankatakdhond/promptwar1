'use client';

import { useState, useMemo } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/useToast';
import type { IdeaStatus } from '@/types/ideas';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { ConceptCard } from './ConceptCard';

type FilterTab = 'all' | 'saved' | 'pending' | 'rejected';

export function IdeasTab() {
  const { activeEvent, dispatch } = useEvent();
  const { toast } = useToast();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');

  const ideas = useMemo(() => activeEvent?.ideas ?? [], [activeEvent]);

  const filtered = useMemo(() => {
    switch (filterTab) {
      case 'saved': return ideas.filter((c) => c.status === 'saved');
      case 'pending': return ideas.filter((c) => c.status === 'generated');
      case 'rejected': return ideas.filter((c) => c.status === 'rejected');
      default: return ideas;
    }
  }, [ideas, filterTab]);

  if (!activeEvent) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: '#5A6178' }}>No event selected.</div>;
  }

  const savedConcepts = ideas.filter((c) => c.status === 'saved');

  function updateStatus(id: string, status: IdeaStatus) {
    const updated = ideas.map((c) => c.id === id ? { ...c, status } : c);
    dispatch({ type: 'UPDATE_IDEAS', eventId: activeEvent!.profile.id, ideas: updated });
  }

  function handleSave(id: string) {
    const concept = ideas.find((c) => c.id === id);
    if (!concept) return;
    const newStatus: IdeaStatus = concept.status === 'saved' ? 'generated' : 'saved';
    updateStatus(id, newStatus);
    toast({ title: newStatus === 'saved' ? 'Concept saved!' : 'Concept unsaved', variant: newStatus === 'saved' ? 'success' : 'default' });
  }

  function handleReject(id: string) {
    const concept = ideas.find((c) => c.id === id);
    if (!concept) return;
    const newStatus: IdeaStatus = concept.status === 'rejected' ? 'generated' : 'rejected';
    updateStatus(id, newStatus);
    toast({ title: newStatus === 'rejected' ? 'Concept rejected' : 'Concept restored', variant: 'default' });
  }

  function handleRegenerate(id: string) {
    // Mark the specific concept as generated (pending review again)
    updateStatus(id, 'generated');
    toast({ title: 'Concept queued for regeneration', description: 'Use Regenerate All to refresh ideas', variant: 'default' });
  }

  function handleRegenerateAll() {
    // Reset all to generated status so they show as pending review
    const reset = ideas.map((c) => ({ ...c, status: 'generated' as IdeaStatus }));
    dispatch({ type: 'UPDATE_IDEAS', eventId: activeEvent!.profile.id, ideas: reset });
    toast({ title: 'All concepts reset for review', variant: 'default' });
  }

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${ideas.length})` },
    { key: 'saved', label: `Saved (${ideas.filter((c) => c.status === 'saved').length})` },
    { key: 'pending', label: `Pending Review (${ideas.filter((c) => c.status === 'generated').length})` },
    { key: 'rejected', label: `Rejected (${ideas.filter((c) => c.status === 'rejected').length})` },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} style={{ color: '#C4613A' }} />
          <h2 className="text-base font-bold" style={{ color: '#1A1F2E' }}>
            Creative Concepts
            <span className="ml-2 text-xs font-normal" style={{ color: '#5A6178' }}>({ideas.length})</span>
          </h2>
        </div>
        <button
          onClick={handleRegenerateAll}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-brand border transition-colors hover:bg-ivory"
          style={{ borderColor: '#D0D3DC', color: '#5A6178' }}
        >
          <RefreshCw size={13} />
          Regenerate All
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: '#D0D3DC' }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
            style={{
              borderColor: filterTab === tab.key ? '#C4613A' : 'transparent',
              color: filterTab === tab.key ? '#C4613A' : '#5A6178',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-brand border border-dashed" style={{ borderColor: '#D0D3DC' }}>
          <Lightbulb size={32} style={{ color: '#D0D3DC' }} />
          <p className="text-sm font-medium" style={{ color: '#1A1F2E' }}>No concepts generated yet.</p>
          <p className="text-xs" style={{ color: '#5A6178' }}>Start by generating ideas for your event via the AI Copilot.</p>
        </div>
      )}

      {/* Filtered concepts grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered
            .filter((c) => c.status !== 'saved' || filterTab === 'saved' || filterTab === 'all')
            .map((concept) => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                onSave={handleSave}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
              />
            ))}
        </div>
      )}

      {filtered.length === 0 && ideas.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm" style={{ color: '#5A6178' }}>No concepts match this filter.</p>
        </div>
      )}

      {/* Saved concepts pinned section */}
      {filterTab === 'all' && savedConcepts.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: '#D0D3DC' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A6178' }}>
            ♥ Saved Concepts ({savedConcepts.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {savedConcepts.map((concept) => (
              <ConceptCard
                key={`saved-${concept.id}`}
                concept={concept}
                onSave={handleSave}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
