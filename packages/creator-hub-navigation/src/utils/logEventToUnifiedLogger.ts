import { UnifiedLogger } from '@rbx/unified-logger';
import { EventContext, TrackerClientRequest } from '../event/eventConstants';
import { TProductKey } from '../types';

// double log legacy event stream events to unified logger setup
function logEventToUnifiedLogger(
  unifiedLoggerClient: UnifiedLogger,
  currentProduct: TProductKey,
  clientRequest: TrackerClientRequest,
) {
  const { eventValue, eventType, context, parameters } = clientRequest;

  let composedEventType = `${currentProduct}.${eventType}`;
  if (eventValue) {
    composedEventType = `${composedEventType}.${eventValue}`;
  }
  if (context === EventContext.Load || context === EventContext.Impression) {
    unifiedLoggerClient.logImpressionEvent({ eventName: composedEventType, parameters });
  } else if (context === EventContext.Hover) {
    unifiedLoggerClient.logHoverEvent({ eventName: composedEventType, parameters });
  } else if (context === EventContext.Error) {
    unifiedLoggerClient.logErrorEvent({ eventName: composedEventType, parameters });
  } else {
    unifiedLoggerClient.logClickEvent({ eventName: composedEventType, parameters });
  }
}

export default logEventToUnifiedLogger;
