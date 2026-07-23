import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import type CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import type { TrackerClient } from '@modules/eventStream/tracker';

const getDuration = (start: number): number => {
  return Date.now() - start;
};

/*
  Reports client telemetry to the event stream.

  IMPORTANT: Be mindful about using this event tracker on your client calls. Use it to track
  metrics for critical requests for your features only. The metrics are reported to the event stream
  and such no real time visualization is supported, these metrics are purely for business analytics
  purposes.

  Usage:

  import {
    trackClientAction
  } from '@modules/clients';

  import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';

  const start = Date.now();
  try {
      const universeAnalyticsAggregationsResponseNew: UniverseAnalyticsAggregationReadResponse = await developerAnalyticsAggregationsClient.getUniverseAnalyticsAggregations(
        getAggregationsRequest
      );
      trackClientAction(router.route, CreatorDashboardContext.Load, 'developerAnalyticsAggregationsClient', 'getUniverseAnalyticsAggregations', 200, start);

    } catch (e) {
      const errorCode = e?.status ?? 500;
      trackClientAction(router.route, CreatorDashboardContext.Load, 'developerAnalyticsAggregationsClient', 'getUniverseAnalyticsAggregations', errorCode, start);
    }

    source         <--- The source of your request. This can be an eventStream.CreatorDashboardSource or any string.
    context        <--- The context of the request. What action triggered the request.
    caller         <--- The name of the client.
    method         <--- The method on the client being executed.
    statusCode     <--- The http status code on the response.
    startTimestamp <--- The timestamp right before the request started.
*/
export default function trackClientAction(
  trackerClient: Pick<TrackerClient, 'sendEvent'>,
  source: string,
  context: CreatorDashboardContext,
  caller: string,
  method: string,
  statusCode: number,
  startTimestamp: number,
) {
  const trackerClientRequest: TrackerClientRequest = {
    eventType: CreatorDashboardEventType.RbxClientRequest,
    context,
    additionalProperties: {
      Source: source ?? 'unknown',
      Caller: caller,
      Method: method,
      StatusCode: statusCode,
      DurationMs: getDuration(startTimestamp),
    },
  };
  trackerClient.sendEvent(trackerClientRequest);
}
