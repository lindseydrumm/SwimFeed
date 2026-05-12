/**
 * Derives "starting soon" notifications from followed events using meet-level date_from
 * (and optional date_to from follow meta). Enriches dates from GET /events when meta is missing.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getEvents } from '../api/events';
import type { FollowEntity, SwimEvent } from '../types/domain';

const STORAGE_KEY = 'swimlive_event_notif_dismissed';
/** Notify when meet start is within this many hours (and still in the future). */
const SOON_HOURS = 48;

export type EventNotificationItem = {
  id: string;
  name: string;
  dateFrom: Date;
  dateTo: Date | null;
  /** ms until dateFrom; negative if already started */
  msUntilStart: number;
  /** in_progress = meet window active; soon = starts within SOON_HOURS; upcoming = later future */
  kind: 'soon' | 'in_progress' | 'upcoming';
};

function readDismissed(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeDismissed(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function metaDate(meta: Record<string, unknown> | undefined, key: string): Date | null {
  if (!meta) return null;
  const v = meta[key];
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useFollowedEventNotifications(followedEvents: FollowEntity[] | undefined) {
  const [apiEvents, setApiEvents] = useState<SwimEvent[] | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState(0);

  const list = followedEvents;

  useEffect(() => {
    if (!list?.length) {
      setApiEvents(null);
      return;
    }
    const needsApi = list.some((f) => !metaDate(f.meta as Record<string, unknown> | undefined, 'date_from'));
    if (!needsApi) {
      setApiEvents(null);
      return;
    }
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setApiEvents(data);
      })
      .catch(() => {
        if (!cancelled) setApiEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [list]);

  const resolveDates = useCallback(
    (f: FollowEntity): { from: Date | null; to: Date | null } => {
      const meta = f.meta as Record<string, unknown> | undefined;
      let from = metaDate(meta, 'date_from');
      let to = metaDate(meta, 'date_to');
      if (!from && apiEvents) {
        const match = apiEvents.find(
          (e) => String(e.id) === String(f.id) || String(e.external_id) === String(f.id)
        );
        if (match?.date_from) from = new Date(match.date_from);
        if (match?.date_to) to = match.date_to ? new Date(match.date_to) : null;
      }
      return { from, to };
    },
    [apiEvents]
  );

  const { items } = useMemo(() => {
    const now = Date.now();
    const soonMs = SOON_HOURS * 60 * 60 * 1000;
    let dismissed = readDismissed();
    const cleaned: Record<string, string> = {};
    for (const [eid, iso] of Object.entries(dismissed)) {
      const start = new Date(iso);
      if (Number.isNaN(start.getTime())) continue;
      if (now > start.getTime()) continue;
      cleaned[eid] = iso;
    }
    if (Object.keys(cleaned).length !== Object.keys(dismissed).length) {
      dismissed = cleaned;
      writeDismissed(cleaned);
    }

    const out: EventNotificationItem[] = [];
    if (!list?.length) return { items: out };
    for (const f of list) {
      const { from, to } = resolveDates(f);
      if (!from) continue;
      const msUntilStart = from.getTime() - now;
      const defaultEnd = from.getTime() + 24 * 60 * 60 * 1000;
      const endMs = to ? to.getTime() : defaultEnd;
      // Drop meets that are fully over
      if (now > endMs) continue;

      const inProgress = now >= from.getTime() && now <= endMs;
      const soon = msUntilStart > 0 && msUntilStart <= soonMs;

      let kind: EventNotificationItem['kind'];
      if (inProgress) kind = 'in_progress';
      else if (soon) kind = 'soon';
      else if (msUntilStart > soonMs) kind = 'upcoming';
      else continue;

      const key = f.id;
      if (dismissed[key] === from.toISOString()) continue;

      out.push({
        id: String(f.id),
        name: f.name,
        dateFrom: from,
        dateTo: to,
        msUntilStart,
        kind,
      });
    }
    out.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime());
    return { items: out };
  }, [list, resolveDates, apiEvents, dismissedVersion]);

  const dismiss = useCallback((id: string, dateFrom: Date) => {
    const map = readDismissed();
    map[id] = dateFrom.toISOString();
    writeDismissed(map);
    setDismissedVersion((v) => v + 1);
  }, []);

  const dismissAll = useCallback((entries: EventNotificationItem[]) => {
    const map = readDismissed();
    for (const e of entries) {
      map[e.id] = e.dateFrom.toISOString();
    }
    writeDismissed(map);
    setDismissedVersion((v) => v + 1);
  }, []);

  /** Dot on bell: only when something is imminent or underway (not months-away follows). */
  const hasUnread = items.some((i) => i.kind === 'soon' || i.kind === 'in_progress');

  return { items, hasUnread, dismiss, dismissAll };
}
