'use client';

import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { useEvent } from '@/hooks/useEvent';
import { Skeleton } from '@/components/ui/skeleton';

const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: '💍',
  birthday: '🎂',
  anniversary: '💑',
  community: '🎪',
};

export function CountdownCard() {
  const { activeEvent } = useEvent();

  if (!activeEvent) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3" style={{ borderColor: '#E8E9EE' }}>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const { profile } = activeEvent;
  const eventDate = parseISO(profile.date);
  const now = new Date();
  const daysUntil = differenceInCalendarDays(eventDate, now);
  const createdAt = parseISO(profile.createdAt);
  const totalDays = differenceInCalendarDays(eventDate, createdAt);
  const daysPassed = differenceInCalendarDays(now, createdAt);
  const progressPercent =
    totalDays > 0 ? Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100))) : 0;

  const icon = EVENT_TYPE_ICONS[profile.type] ?? '🎉';

  let countdownText: string;
  let countdownColor: string;
  if (daysUntil > 0) {
    countdownText = `${daysUntil}`;
    countdownColor = '#C4613A';
  } else if (daysUntil === 0) {
    countdownText = 'TODAY';
    countdownColor = '#7A9E7E';
  } else {
    countdownText = `${Math.abs(daysUntil)}`;
    countdownColor = '#5A6178';
  }

  let sublabel: string;
  if (daysUntil > 0) sublabel = 'days to go';
  else if (daysUntil === 0) sublabel = 'It\'s the big day!';
  else sublabel = 'days ago';

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col gap-3" style={{ borderColor: '#E8E9EE' }}>
      {/* Title + type badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-sm" style={{ color: '#1A1F2E' }}>
          {profile.name}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full capitalize"
          style={{ background: '#FAF0EB', color: '#C4613A' }}
        >
          {profile.type}
        </span>
      </div>

      {/* Big countdown */}
      <div className="flex items-end gap-2">
        <span
          className="text-6xl font-serif font-bold leading-none"
          style={{ color: countdownColor }}
        >
          {countdownText}
        </span>
        <span className="text-sm pb-1.5 font-medium" style={{ color: '#5A6178' }}>
          {sublabel}
        </span>
      </div>

      {/* Date + city */}
      <div className="text-sm space-y-0.5" style={{ color: '#5A6178' }}>
        <div className="font-medium" style={{ color: '#1A1F2E' }}>
          {format(eventDate, 'EEEE, MMMM d, yyyy')} at {profile.time}
        </div>
        <div>{profile.city}</div>
        {profile.venue && <div className="text-xs">{profile.venue}</div>}
      </div>

      {/* Progress ring: days passed / total days */}
      <div className="mt-1">
        <div className="flex justify-between text-xs mb-1" style={{ color: '#5A6178' }}>
          <span>Planning progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: '#F0F1F4' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${progressPercent}%`, background: '#C4613A' }}
          />
        </div>
      </div>
    </div>
  );
}
