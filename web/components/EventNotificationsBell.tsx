import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useFollowedEventNotifications, type EventNotificationItem } from '../src/hooks/useFollowedEventNotifications';
import type { FollowEntity } from '../src/types/domain';

function formatStartsIn(ms: number): string {
  if (ms <= 0) return 'Starting now';
  const mins = Math.floor(ms / (1000 * 60));
  if (mins < 60) return `Starts in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Starts in ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `Starts in ${days} day${days === 1 ? '' : 's'}`;
}

function rowSubtitle(item: EventNotificationItem): string {
  if (item.kind === 'in_progress') return 'Meet in progress';
  return formatStartsIn(item.msUntilStart);
}

export function EventNotificationsBell({ followedEvents }: { followedEvents: FollowEntity[] | undefined }) {
  const { isSignedIn } = useAuth();
  const { items, hasUnread, dismiss, dismissAll } = useFollowedEventNotifications(
    isSignedIn ? followedEvents : undefined
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDot = isSignedIn && hasUnread;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors"
        aria-label="Event notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {showDot && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-hidden flex flex-col rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50">
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Event reminders</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Followed meets that haven&apos;t ended yet. The bell highlights when one starts within 48 hours or is underway.
            </p>
          </div>

          {!isSignedIn ? (
            <div className="p-4 text-sm text-slate-400">
              Sign in and follow events to get reminders when meets are about to start.
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-slate-400">No upcoming followed meets. Follow an event to track it here.</div>
          ) : (
            <>
              <ul className="overflow-y-auto flex-1 divide-y divide-slate-700/80">
                {items.map((item) => (
                  <li key={`${item.id}-${item.dateFrom.toISOString()}`} className="flex gap-2 items-start p-3 hover:bg-slate-700/40">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/events/${item.id}`}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-white hover:text-cyan-300 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-cyan-400/90 mt-0.5">{rowSubtitle(item)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(item.id, item.dateFrom)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-700 p-2">
                <button
                  type="button"
                  onClick={() => dismissAll(items)}
                  className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60"
                >
                  Clear all
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
