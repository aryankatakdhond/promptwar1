'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChangeSet, AffectedEntity } from '@/types/ai';
import {
  DollarSign,
  CheckSquare,
  Building2,
  Users,
  AlertTriangle,
  Clapperboard,
  UserCircle,
  AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Entity icon mapping
// ---------------------------------------------------------------------------

function EntityIcon({ entityType }: { entityType: AffectedEntity['entityType'] }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (entityType) {
    case 'budget':
      return <DollarSign className={cls} style={{ color: '#C0634B' }} />;
    case 'task':
      return <CheckSquare className={cls} style={{ color: '#3B82F6' }} />;
    case 'vendor':
      return <Building2 className={cls} style={{ color: '#7C5CD8' }} />;
    case 'guest':
      return <Users className={cls} style={{ color: '#22C55E' }} />;
    case 'risk':
      return <AlertTriangle className={cls} style={{ color: '#F59E0B' }} />;
    case 'runofshow':
      return <Clapperboard className={cls} style={{ color: '#EC4899' }} />;
    case 'event-profile':
      return <UserCircle className={cls} style={{ color: '#64748B' }} />;
    default:
      return <AlertCircle className={cls} style={{ color: '#64748B' }} />;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChangeImpactPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeSet: ChangeSet;
  onApply: () => void;
  onDiscard: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChangeImpactPreview({
  open,
  onOpenChange,
  changeSet,
  onApply,
  onDiscard,
}: ChangeImpactPreviewProps) {
  const hasHighImpact = changeSet.affectedEntities.some(e => e.isHighImpact);

  function handleApply() {
    onApply();
    onOpenChange(false);
  }

  function handleDiscard() {
    onDiscard();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: '540px' }}
      >
        <DialogHeader>
          <DialogTitle>Review Proposed Changes</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <p className="text-sm mb-4" style={{ color: '#5A6178', lineHeight: '1.6' }}>
          {changeSet.summary}
        </p>

        {/* High-impact warning */}
        {hasHighImpact && (
          <div
            className="flex items-start gap-2 rounded-lg p-3 mb-4 text-sm"
            style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <span>
              This change includes <strong>high-impact modifications</strong> that may significantly affect your event plan. Review carefully before applying.
            </span>
          </div>
        )}

        {/* Affected entities */}
        {changeSet.affectedEntities.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>
              Affected Areas ({changeSet.affectedEntities.length})
            </p>
            <div className="space-y-2">
              {changeSet.affectedEntities.map((entity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg p-3"
                  style={{ backgroundColor: '#F7F8FA', border: '1px solid #E5E7EB' }}
                >
                  <EntityIcon entityType={entity.entityType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: '#1A1F2E' }}>
                        {entity.entityName}
                      </span>
                      {entity.isHighImpact && (
                        <Badge
                          variant="danger"
                          className="text-xs py-0"
                          style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
                        >
                          High Impact
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#5A6178' }}>
                      {entity.changeDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operations count */}
        {changeSet.operations.length > 0 && (
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
            {changeSet.operations.length} operation{changeSet.operations.length !== 1 ? 's' : ''} will be applied to your event data.
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleDiscard}
          >
            Discard
          </Button>
          <Button
            onClick={handleApply}
            style={{ backgroundColor: '#C0634B', color: 'white' }}
            className="hover:opacity-90 transition-opacity"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
