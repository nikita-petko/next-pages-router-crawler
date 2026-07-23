import { Tracker, Configuration, TrackerRequest } from '@rbx/event-stream';
import { getCookieValueByKey } from '@rbx/core';
import { UnifiedLogger } from '@rbx/unified-logger';
import { TrackerClientRequest } from './constants/eventConstants';
import CreatorDashboardEventType from './enum/CreatorDashboardEventType';

export const eventStreamBaseUrl = `https://ecsv2.${process.env.robloxSiteDomain}`;
const eventStreamUrlWithNamespace = `${eventStreamBaseUrl}/CreatorDashboard`;

/** Event types that still use EventStream but skip UnifiedLogger double-write. */
const EVENT_TYPES_SKIP_UNIFIED_LOGGER_DOUBLE_WRITE: string[] = [
  'loadPage',
  CreatorDashboardEventType.AssetPrivacyOptOutSurveySubmitted,
];
export class TrackerClient {
  private tracker: Tracker;

  private unifiedLoggerClient?: UnifiedLogger;

  constructor() {
    const defaultConfiguration = new Configuration({
      baseUrl: eventStreamUrlWithNamespace,
    });

    this.tracker = new Tracker(defaultConfiguration);
  }

  setUnifiedLoggerClient(unifiedLogger: UnifiedLogger) {
    this.unifiedLoggerClient = unifiedLogger;
  }

  shouldDoubleWriteToUnifiedLogger(request: TrackerRequest) {
    if (!this.unifiedLoggerClient) {
      return false;
    }
    if (EVENT_TYPES_SKIP_UNIFIED_LOGGER_DOUBLE_WRITE.includes(request.eventType)) {
      return false;
    }
    return true;
  }

  sendEventToUnifiedLogger(request: TrackerRequest) {
    if (!this.unifiedLoggerClient) {
      return;
    }
    const parameters: Record<string, string> = {};
    const additionalProperties = request.additionalProperties || {};
    Object.keys(additionalProperties).forEach((key) => {
      const value = additionalProperties[key];
      // skip undefined/null values
      if (value != null) {
        parameters[key] = value.toString();
      }
    });
    const event = { eventName: request.eventType, parameters };
    if (request.context === 'load') {
      this.unifiedLoggerClient.logImpressionEvent(event);
    } else if (request.context === 'hover') {
      this.unifiedLoggerClient.logHoverEvent(event);
    } else if (request.context === 'click') {
      this.unifiedLoggerClient.logClickEvent(event);
    }
  }

  sendEvent(clientRequest: TrackerClientRequest) {
    const cookieValue = getCookieValueByKey('GuestData');
    const guestId = cookieValue?.split('=')[1];

    const request: TrackerRequest = {
      target: 'CreatorDashboard',
      localTime: new Date(),
      eventType: clientRequest.eventType,
      context: clientRequest.context,
      guestId,
      additionalProperties: clientRequest.additionalProperties,
    };
    if (this.shouldDoubleWriteToUnifiedLogger(request)) {
      this.sendEventToUnifiedLogger(request);
    }
    return this.tracker.sendEventViaImg(request);
  }
}

const trackerClient = new TrackerClient();

export default trackerClient;
