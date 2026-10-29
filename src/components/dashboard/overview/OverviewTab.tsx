'use client';

import { CountdownCard } from './CountdownCard';
import { BudgetRingChart } from './BudgetRingChart';
import { ReadinessScoreCard } from './ReadinessScoreCard';
import { TaskProgressCard } from './TaskProgressCard';
import { VendorProgressCard } from './VendorProgressCard';
import { RSVPCard } from './RSVPCard';
import { NextActionPanel } from './NextActionPanel';

export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Row 1: Countdown | Budget Ring | Readiness Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <CountdownCard />
        <BudgetRingChart />
        <ReadinessScoreCard />
      </div>

      {/* Row 2: Task Progress | Vendor Progress | RSVP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <TaskProgressCard />
        <VendorProgressCard />
        <RSVPCard />
      </div>

      {/* Row 3: Next Action — full width */}
      <NextActionPanel />
    </div>
  );
}
