import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { TrackerClient } from '@modules/eventStream/tracker';

declare type TEventsAnalyticsEvent = {
  eventType: CreatorDashboardEventType;
  virtualEventId?: string;
  universeId?: string;
  newEventCorrelationId?: string;
  errorString?: string;
};

const virtualEventsContext = 'virtualEvents';

const sendEventsAnalyticsEvent = (
  trackerClient: TrackerClient,
  {
    eventType,
    virtualEventId,
    universeId,
    newEventCorrelationId,
    errorString,
  }: TEventsAnalyticsEvent,
): void => {
  const analyticsEvent = {
    eventType,
    context: virtualEventsContext,
    additionalProperties: {
      virtualEventId: virtualEventId || '',
      universeId: universeId || '',
      newEventCorrelationId: newEventCorrelationId || '',
      errorString: errorString || '',
    },
  };

  try {
    trackerClient.sendEvent(analyticsEvent);
    // eslint-disable-next-line no-empty -- fire-and-forget analytics
  } catch {}
};

export default sendEventsAnalyticsEvent;
