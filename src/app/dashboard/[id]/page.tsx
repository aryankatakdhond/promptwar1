'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Skeleton } from '@/components/ui/skeleton';

// Tab components
import { OverviewTab } from '@/components/dashboard/overview/OverviewTab';
import { BudgetTab } from '@/components/dashboard/budget/BudgetTab';
import { TimelineTab } from '@/components/dashboard/timeline/TimelineTab';
import { VendorsTab } from '@/components/dashboard/vendors/VendorsTab';
import { IdeasTab } from '@/components/dashboard/ideas/IdeasTab';
import { GuestsTab } from '@/components/dashboard/guests/GuestsTab';
import { RunOfShowTab } from '@/components/dashboard/runofshow/RunOfShowTab';
import { CopilotTab } from '@/components/dashboard/copilot/CopilotTab';
import { RiskRadarTab } from '@/components/dashboard/risk/RiskRadarTab';

type TabId =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'ideas'
  | 'guests'
  | 'runofshow'
  | 'copilot'
  | 'risks';

const VALID_TABS: TabId[] = [
  'overview',
  'budget',
  'timeline',
  'vendors',
  'ideas',
  'guests',
  'runofshow',
  'copilot',
  'risks',
];

function DashboardPageInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useAppContext();

  const rawTab = searchParams.get('tab') ?? 'overview';
  const activeTab: TabId = VALID_TABS.includes(rawTab as TabId)
    ? (rawTab as TabId)
    : 'overview';

  // Check event exists; redirect to home if not
  useEffect(() => {
    if (!state.activeEventId && state.events.length === 0) return; // still hydrating
    const found = state.events.find((e) => e.profile.id === id);
    if (!found) {
      router.replace('/');
    }
  }, [id, state.events, state.activeEventId, router]);

  // Set active event if different
  useEffect(() => {
    if (state.activeEventId !== id) {
      const found = state.events.find((e) => e.profile.id === id);
      if (found) {
        dispatch({ type: 'SET_ACTIVE_EVENT', eventId: id });
      }
    }
  }, [id, state.activeEventId, state.events, dispatch]);

  const activeEvent =
    state.events.find((e) => e.profile.id === id) ?? null;

  // Show skeleton while hydrating
  if (!activeEvent) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'budget':
        return <BudgetTab />;
      case 'timeline':
        return <TimelineTab />;
      case 'vendors':
        return <VendorsTab />;
      case 'ideas':
        return <IdeasTab />;
      case 'guests':
        return <GuestsTab />;
      case 'runofshow':
        return <RunOfShowTab />;
      case 'copilot':
        return <CopilotTab />;
      case 'risks':
        return <RiskRadarTab />;
      default:
        return <OverviewTab />;
    }
  }

  return <>{renderTab()}</>;
}

export default function DashboardPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      }
    >
      <DashboardPageInner id={params.id} />
    </Suspense>
  );
}
