'use client';

import { useState } from 'react';
import type { CreativeConcept } from '@/types/ideas';
import { ChevronDown, ChevronUp, Heart, X, RefreshCw, Cpu, Sparkles } from 'lucide-react';

interface Props {
  concept: CreativeConcept;
  onSave: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
}

const COST_IMPACT_STYLES: Record<CreativeConcept['estimatedCostImpact'], { bg: string; text: string; border: string; label: string }> = {
  'below-budget': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', label: 'Below Budget' },
  'on-budget':    { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', label: 'On Budget' },
  'slight-premium': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', label: 'Slight Premium' },
  'premium':      { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3', label: 'Premium' },
};

const STATUS_STYLES: Record<CreativeConcept['status'], { bg: string; text: string; label: string }> = {
  'generated':  { bg: '#EFF6FF', text: '#1D4ED8', label: 'Generated' },
  'saved':      { bg: '#ECFDF5', text: '#065F46', label: 'Saved' },
  'rejected':   { bg: '#FEF2F2', text: '#991B1B', label: 'Rejected' },
  'applied':    { bg: '#F5F3FF', text: '#6D28D9', label: 'Applied' },
};

type SectionKey = 'decor' | 'menu' | 'activities' | 'budget' | 'sustainable' | 'accessibility';

export function ConceptCard({ concept, onSave, onReject, onRegenerate }: Props) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  function toggleSection(s: SectionKey) {
    setOpenSection((p) => p === s ? null : s);
  }

  const ci = COST_IMPACT_STYLES[concept.estimatedCostImpact];
  const si = STATUS_STYLES[concept.status];
  const isRejected = concept.status === 'rejected';

  return (
    <div
      className="rounded-brand border flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{
        background: '#FDFAF4',
        borderColor: isRejected ? '#FECACA' : '#D0D3DC',
        opacity: isRejected ? 0.65 : 1,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold" style={{ color: '#1A1F2E' }}>{concept.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: si.bg, color: si.text }}>
                {si.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {concept.generatedBy === 'local-engine' ? (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#5A6178' }}>
                  <Cpu size={11} /> Local Engine
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#5A6178' }}>
                  <Sparkles size={11} /> Gemini AI
                </span>
              )}
            </div>
          </div>
          {/* Cost impact badge */}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0"
            style={{ background: ci.bg, color: ci.text, border: `1px solid ${ci.border}` }}
          >
            {ci.label}
          </span>
        </div>

        {/* Creative direction */}
        <p className="text-sm leading-relaxed" style={{ color: '#1A1F2E' }}>{concept.creativeDirection}</p>

        {/* Color palette */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-1.5">
            {concept.colorPalette.colors.slice(0, 4).map((hex, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border"
                style={{ background: hex, borderColor: '#D0D3DC' }}
                title={hex}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: '#5A6178' }}>{concept.colorPalette.name}</span>
        </div>

        {/* Why it fits */}
        <p className="text-xs italic" style={{ color: '#5A6178' }}>{concept.whyItFits}</p>
      </div>

      {/* Collapsible sections */}
      <div className="border-t" style={{ borderColor: '#D0D3DC' }}>
        {([
          { key: 'decor' as SectionKey, label: 'Decor & Atmosphere', content: concept.decorSuggestions, type: 'list' },
          { key: 'menu' as SectionKey, label: 'Menu Direction', content: concept.menuDirection, type: 'text' },
          { key: 'activities' as SectionKey, label: 'Activities & Entertainment', content: [...concept.activities, ...concept.entertainmentIdeas], type: 'list' },
          { key: 'budget' as SectionKey, label: 'Budget Conscious Alternatives', content: concept.budgetConscious, type: 'list' },
          { key: 'sustainable' as SectionKey, label: 'Sustainable Options', content: concept.sustainableOptions, type: 'list' },
          { key: 'accessibility' as SectionKey, label: 'Accessibility Notes', content: concept.accessibilityConsiderations, type: 'text' },
        ] as { key: SectionKey; label: string; content: string | string[]; type: 'list' | 'text' }[]).map((section) => {
          const isOpen = openSection === section.key;
          const isEmpty = Array.isArray(section.content) ? section.content.length === 0 : !section.content;
          if (isEmpty) return null;
          return (
            <div key={section.key} className="border-b last:border-b-0" style={{ borderColor: '#D0D3DC' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold transition-colors hover:bg-ivory"
                style={{ color: '#1A1F2E' }}
                onClick={() => toggleSection(section.key)}
              >
                <span>{section.label}</span>
                {isOpen ? <ChevronUp size={13} style={{ color: '#5A6178' }} /> : <ChevronDown size={13} style={{ color: '#5A6178' }} />}
              </button>
              {isOpen && (
                <div className="px-4 pb-3">
                  {section.type === 'list' && Array.isArray(section.content) && (
                    <ul className="text-xs space-y-1" style={{ color: '#5A6178' }}>
                      {section.content.map((item, i) => (
                        <li key={i} className="flex gap-1.5"><span style={{ color: '#C4613A' }}>•</span> {item}</li>
                      ))}
                    </ul>
                  )}
                  {section.type === 'text' && typeof section.content === 'string' && (
                    <p className="text-xs" style={{ color: '#5A6178' }}>{section.content}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Practical requirements */}
      {concept.practicalRequirements.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-t" style={{ borderColor: '#D0D3DC' }}>
          {concept.practicalRequirements.map((req, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0F1F4', color: '#5A6178' }}>
              {req}
            </span>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3 flex items-center gap-2 border-t" style={{ borderColor: '#D0D3DC' }}>
        <button
          onClick={() => onSave(concept.id)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-brand border transition-colors"
          style={{
            borderColor: concept.status === 'saved' ? '#A7F3D0' : '#D0D3DC',
            background: concept.status === 'saved' ? '#ECFDF5' : '#F0F1F4',
            color: concept.status === 'saved' ? '#065F46' : '#5A6178',
          }}
          disabled={concept.status === 'rejected'}
        >
          <Heart size={13} fill={concept.status === 'saved' ? 'currentColor' : 'none'} />
          {concept.status === 'saved' ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={() => onReject(concept.id)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-brand border transition-colors"
          style={{
            borderColor: concept.status === 'rejected' ? '#FECACA' : '#D0D3DC',
            background: concept.status === 'rejected' ? '#FEF2F2' : '#F0F1F4',
            color: concept.status === 'rejected' ? '#991B1B' : '#5A6178',
          }}
          disabled={concept.status === 'saved'}
        >
          <X size={13} />
          {concept.status === 'rejected' ? 'Rejected' : 'Reject'}
        </button>

        <button
          onClick={() => onRegenerate(concept.id)}
          className="ml-auto flex items-center gap-1.5 text-xs text-terracotta"
          style={{ color: '#C4613A' }}
          title="Regenerate this concept"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
