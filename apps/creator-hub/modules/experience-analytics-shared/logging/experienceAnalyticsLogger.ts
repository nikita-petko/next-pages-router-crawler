import { RAQIV2ChartResource, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { trackClientAction } from '@modules/clients';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import { TrackerClient } from '@modules/eventStream/tracker';

import { ErrorLoggingMetric } from '@modules/clients/analytics/universePerformanceRaqi';

import { NextRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { LegacyEngagementPayoutsMetric } from '@modules/charts-generic';
import { UIFilters } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';

export type RouterLoggingInfo = {
  router: {
    route: NextRouter['route'];
  };
};

/**
 * NOTE(gperkins@ 20221017): Since logger functions are commonly used in API retrieval hooks,
 * and they all want to log data about the current route, we need to get them
 * data about the current route without causing re-retrieval of data from the API.
 *
 * This memoizes just the information that we want to log -- the route -- without
 * changing every time other router information (e.g. query params) changes.
 */
export const useRouterLoggingInfo = (router: NextRouter): RouterLoggingInfo => {
  return useMemo(() => ({ router: { route: router.route } }), [router.route]);
};

export const useLogChartTooltipViewedCallback = (
  routerInfo: RouterLoggingInfo,
  metric: ErrorLoggingMetric | LegacyEngagementPayoutsMetric,
  universeId: number,
) => {
  const { trackerClient } = useEventTrackerProvider();
  return useCallback(
    (tooltipId: string) => {
      const trackerClientRequest: TrackerClientRequest = {
        eventType: CreatorDashboardEventType.ChartTooltipViewed,
        context: CreatorDashboardContext.Hover,
        additionalProperties: {
          Source: routerInfo.router.route,
          KpiType: metric,
          TooltipId: tooltipId,
          UniverseId: universeId,
        },
      };

      trackerClient.sendEvent(trackerClientRequest);
    },
    [routerInfo, metric, universeId, trackerClient],
  );
};

export const useLogShowVersionAnnotationsToggledCallback = (
  routerInfo: RouterLoggingInfo,
  universeId: number,
) => {
  const { trackerClient } = useEventTrackerProvider();
  return useCallback(
    async (oldShowVersionAnnotations: boolean, newShowVersionAnnotations: boolean) => {
      const trackerClientRequest: TrackerClientRequest = {
        eventType: CreatorDashboardEventType.PageVersionAnnotationsToggled,
        context: CreatorDashboardContext.Click,
        additionalProperties: {
          Source: routerInfo.router.route,
          Current: oldShowVersionAnnotations.toString(),
          Selected: newShowVersionAnnotations.toString(),
          UniverseId: universeId,
        },
      };

      trackerClient.sendEvent(trackerClientRequest);
    },
    [routerInfo, universeId, trackerClient],
  );
};

export const useLogFiltersChangedCallback = (
  routerInfo: RouterLoggingInfo,
  resource: RAQIV2ChartResource,
) => {
  const { trackerClient } = useEventTrackerProvider();
  return useCallback(
    async (oldFilters: UIFilters, newFilters: UIFilters) => {
      const trackerClientRequest: TrackerClientRequest = {
        eventType: CreatorDashboardEventType.PageFiltersChanged,
        context: CreatorDashboardContext.Click,
        additionalProperties: {
          Source: routerInfo.router.route,
          Current: JSON.stringify(oldFilters),
          Selected: JSON.stringify(newFilters),
          UniverseId: resource.type === RAQIV2ChartResourceType.Universe ? resource.type : '', // TODO: jjuang: This is for legacy compatibility. Remove after fully migrated to RAQIV2
          ResourceId: resource.id,
          ResourceType: resource.type.toString(),
        },
      };
      trackerClient.sendEvent(trackerClientRequest);
    },
    [routerInfo.router.route, resource.type, resource.id, trackerClient],
  );
};

export const logLegacyUniverseAggregationsRequest = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getUniverseAnalyticsAggregations',
    200,
    startTimestamp,
  );
};

export const logLegacyUniverseAggregationsResponseError = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  errorCode: number,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getUniverseAnalyticsAggregations',
    errorCode,
    startTimestamp,
  );
};

export const logMonetizationMetricsResponse = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  httpStatusCode: number,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getMonetizationMetrics',
    httpStatusCode,
    startTimestamp,
  );
};

export const logBenchmarksV2ResponseError = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  errorCode: number,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getBenchmarksV2',
    errorCode,
    startTimestamp,
  );
};

export const logBenchmarksV2Request = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getBenchmarksV2',
    200,
    startTimestamp,
  );
};

export const logSimilarBenchmarksResponseError = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  errorCode: number,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getSimilarBenchmarks',
    errorCode,
    startTimestamp,
  );
};

export const logSimilaryBenchmarksRequest = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'developerAnalyticsAggregationsClient',
    'getSimilarBenchmarks',
    200,
    startTimestamp,
  );
};

export const logCloudMetricsResponse = (
  trackerClient: TrackerClient,
  routerInfo: RouterLoggingInfo,
  httpStatusCode: number,
  startTimestamp: number,
) => {
  trackClientAction(
    trackerClient,
    routerInfo.router.route,
    CreatorDashboardContext.Load,
    'cloudMetricsClient',
    'queryUniverseMetrics',
    httpStatusCode,
    startTimestamp,
  );
};
