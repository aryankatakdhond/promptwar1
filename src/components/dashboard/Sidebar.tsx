'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Building2,
  Lightbulb,
  Users,
  ClipboardList,
  Bot,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

interface NavItem {
  label: string;
  tab: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', tab: 'overview', icon: LayoutDashboard },
  { label: 'Budget', tab: 'budget', icon: DollarSign },
  { label: 'Timeline', tab: 'timeline', icon: Calendar },
  { label: 'Vendors', tab: 'vendors', icon: Building2 },
  { label: 'Ideas', tab: 'ideas', icon: Lightbulb },
  { label: 'Guests', tab: 'guests', icon: Users },
  { label: 'Run of Show', tab: 'runofshow', icon: ClipboardList },
  { label: 'AI Copilot', tab: 'copilot', icon: Bot },
  { label: 'Risks', tab: 'risks', icon: ShieldAlert },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useAppContext();

  const activeTab = searchParams.get('tab') ?? 'overview';
  const activeEventId = state.activeEventId;

  function navigate(tab: string) {
    if (activeEventId) {
      router.push(`/dashboard/${activeEventId}?tab=${tab}`);
    }
    onMobileClose?.();
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: '#1A1F2E' }}
    >
      {/* Wordmark */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-midnight-400">
        {!collapsed && (
          <span
            className="text-lg font-bold tracking-widest uppercase"
            style={{ color: '#FDFAF4', letterSpacing: '0.18em' }}
          >
            MOMENTRA
          </span>
        )}
        {collapsed && (
          <span
            className="text-lg font-bold tracking-widest uppercase mx-auto"
            style={{ color: '#FDFAF4' }}
          >
            M
          </span>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded text-midnight-200 hover:text-ivory transition-colors"
          style={{ color: '#8A90A4' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.tab;
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => navigate(item.tab)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-ivory'
                  : 'text-midnight-200 hover:text-ivory hover:bg-midnight-400',
              )}
              style={
                isActive
                  ? {
                      color: '#FDFAF4',
                      background: 'rgba(196, 97, 58, 0.15)',
                      borderLeft: '3px solid #C4613A',
                    }
                  : { color: '#8A90A4' }
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="p-4 border-t border-midnight-400" style={{ borderColor: '#3D4459' }}>
        {!collapsed && (
          <p className="text-xs" style={{ color: '#5A6178' }}>
            {state.events.length} event{state.events.length !== 1 ? 's' : ''} saved
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
        )}
        style={{ background: '#1A1F2E' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <aside
            className="relative flex flex-col w-64 flex-shrink-0 z-50"
            style={{ background: '#1A1F2E' }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
