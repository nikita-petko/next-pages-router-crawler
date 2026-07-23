import { Tracker, Configuration } from '@rbx/event-stream';
import { BaseEvent } from '../event';
import EventLogger from './EventLogger';
import { version } from '../package.json';
import getWindowSizes from '../utils/getWindowSizes';

const CREATOR_WEB_TARGET = 'CreatorWeb';

export default class CreatorWebEventLogger implements EventLogger {
  private eventStreamTracker: Tracker;

  constructor({ eventBaseUrl }: { eventBaseUrl: string }) {
    this.eventStreamTracker = new Tracker(
      new Configuration({ baseUrl: `${eventBaseUrl}/${CREATOR_WEB_TARGET}` })
    );
  }

  logEvent(event: BaseEvent): void {
    const { url, ...otherFields } = event.toLogEventObject();
    const { viewportWidth, viewportHeight } = getWindowSizes();
    const sanitizedFields: Record<string, string> = {};
    Object.keys(otherFields).forEach((key) => {
      const value = otherFields[key];
      // skip undefined/null values
      if (value != null) {
        sanitizedFields[key] = value.toString();
      }
    });
    this.eventStreamTracker.sendEventViaImg({
      // fixed target, eventType values. used for schema_mapping for new events in event stream forwarder
      target: CREATOR_WEB_TARGET,
      eventType: CREATOR_WEB_TARGET,
      localTime: new Date(),
      context: String(event.eventType),
      currentUrl: String(url),
      additionalProperties: {
        ...sanitizedFields,
        loggerVersion: version,
        viewportWidth,
        viewportHeight,
      },
    });
  }
}
