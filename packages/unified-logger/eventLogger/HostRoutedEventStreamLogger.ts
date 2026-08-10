import { getCookieValueByKey } from '@rbx/core';
import type { TrackerRequest } from '@rbx/event-stream';
import { Configuration, Tracker } from '@rbx/event-stream';

export type HostRoutedEventProperties = Record<string, string | number | boolean | undefined>;

export type HostRoutedEventInput = {
  eventType: string;
  context: string;
  properties: HostRoutedEventProperties;
  sessionId: string | undefined;
  currentUrl: string;
};

const TARGET = 'CreatorDashboard';

/**
 * Forwards a fully-formed, host-routed event envelope to any EventStream table with the CreatorDashboard
 * target.
 *
 * It owns transport, undefined-field filtering, and guest-id enrichment, but never event semantics
 * (event name, context, or property schema). Callers supply the complete event information.
 *
 * This logger should only be used for external packages that need special event logging logic.
 */
export default class HostRoutedEventStreamLogger {
  private eventStreamTracker: Tracker;

  constructor({ eventBaseUrl }: { eventBaseUrl: string }) {
    this.eventStreamTracker = new Tracker(
      new Configuration({ baseUrl: `${eventBaseUrl}/${TARGET}` }),
    );
  }

  log({ eventType, context, properties, sessionId, currentUrl }: HostRoutedEventInput): void {
    const additionalProperties = sanitizeProperties(properties);
    const guestId = readGuestIdFromCookie();

    const request: TrackerRequest = {
      target: TARGET,
      eventType,
      context,
      currentUrl,
      localTime: new Date(),
      // conditionally include sessionId/guestId so they are absent (not `undefined`)
      ...(sessionId !== undefined ? { sessionId } : {}),
      ...(guestId !== undefined ? { guestId } : {}),
      additionalProperties,
    };

    this.eventStreamTracker.sendEventViaImg(request);
  }
}

function sanitizeProperties(
  properties: HostRoutedEventProperties,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) {
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * GuestData cookie format is `GuestData=UserID=<number>`; getCookieValueByKey
 * strips the `GuestData=` prefix, leaving `UserID=<number>` — the user id is
 * the value after the remaining `=`.
 */
function readGuestIdFromCookie(): string | undefined {
  const cookieValue = getCookieValueByKey('GuestData');
  return cookieValue?.split('=')[1];
}
