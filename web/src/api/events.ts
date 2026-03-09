// web/src/api/events.ts
import { apiGet } from './client';
import type { SwimEvent } from '../types/domain';

export function getEvents() {
  return apiGet<SwimEvent[]>('/events');
}
