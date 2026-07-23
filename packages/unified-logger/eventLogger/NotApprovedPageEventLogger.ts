import { getCookieValueByKey } from '@rbx/core';
import type { TrackerRequest } from '@rbx/event-stream';
import { Configuration, Tracker } from '@rbx/event-stream';
import type { NotApprovedPageEventProperties } from '@rbx/not-approved-page-events';
import { EVENT_NAME, EventContext } from '@rbx/not-approved-page-events';

type LogInput = {
  properties: NotApprovedPageEventProperties;
  sessionId: string | undefined;
  currentUrl: string;
};

const TARGET = 'CreatorDashboard';

/**
 * Dedicated logger for `NotApprovedPageEvent` (T&S not-approved-page telemetry).
 *
 * Intentionally does NOT implement the shared `EventLogger` interface — this logger
 * is purpose-built for a single event shape and is called directly by
 * `UnifiedLogger.logNotApprovedPageEvent`, not fanned out through `eventLoggers[]`.
 */
export default class NotApprovedPageEventLogger {
  private eventStreamTracker: Tracker;

  constructor({ eventBaseUrl }: { eventBaseUrl: string }) {
    this.eventStreamTracker = new Tracker(
      new Configuration({ baseUrl: `${eventBaseUrl}/${TARGET}` }),
    );
  }

  logNotApprovedPageEvent({ properties, sessionId, currentUrl }: LogInput): void {
    const additionalProperties = sanitizeProperties(properties);
    const guestId = readGuestIdFromCookie();

    const request: TrackerRequest = {
      target: TARGET,
      eventType: EVENT_NAME,
      context: EventContext.NotApprovedPage,
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
  properties: NotApprovedPageEventProperties,
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

function readGuestIdFromCookie(): string | undefined {
  // GuestData cookie format is `GuestData=UserID=<number>`; getCookieValueByKey
  // strips the `GuestData=` prefix, leaving `UserID=<number>` — the user id is
  // the value after the remaining `=`.
  const cookieValue = getCookieValueByKey('GuestData');
  return cookieValue?.split('=')[1];
}
