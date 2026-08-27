import { EventType } from '../enums/ActivityFeedEnums';

/**
 * Organization audit log events carry their action type as a string rather than an `EventType`
 * ordinal, so resolve the enum name only when the value is numeric.
 */
export function getEventTypeName(eventType: EventType | string): string {
  return typeof eventType === 'number' ? EventType[eventType] : eventType;
}
