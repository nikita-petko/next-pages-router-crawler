import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import type {
  TAnnotationId,
  TimeSeriesAnnotation,
} from '@modules/charts-generic/charts/types/Annotations';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { useAnnotationsClient } from '@modules/charts-generic/context/AnnotationsClientProvider';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type {
  AnnotationAlertType,
  RAQIV2ChartResource,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import { AnnotationType, isAnnotationAlertType } from '@modules/clients/analytics';
import { getRecordEntries } from '@modules/miscellaneous/utils/helperUtils';
import { adaptConfiguredAlertIncidentsToRangeAnnotations } from '../adapters/configuredAlertIncidentAdapter';
import { adaptAlertAnnotationSeriesToRange } from '../adapters/customAnnotationAdapter';
import type {
  SourceMetricConfig,
  SourceMetricConfigWithSeverityDimension,
  SourceMetricConfigWithChartSpec,
} from '../constants/annotationConfig';
import {
  AnnotationConfig,
  MetricAnnotationType,
  isAnnotationTypeNotSelectable,
} from '../constants/annotationConfig';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../utils/computeRAQIV2SpecOverride';
import getMetricTooltipWithLinkRenderer from '../utils/getMetricTooltipWithLinkRenderer';
import type { RAQIV2CombinedAPIClientWrapper } from '../utils/makeRAQIV2Request';
import makeRAQIV2Request from '../utils/makeRAQIV2Request';
import useMappedApiRequest from './useMappedApiRequest';
import { useAnnotationConfiguration } from './useStatusConfiguration';

type RequestContextByUniqueKey = Map<
  string,
  {
    supportedMetrics: TRAQIV2UIMetric[];
    sourceMetricConfig: SourceMetricConfigWithSeverityDimension;
  }
>;

function getSourceMetricContextsForAnnotationType(
  annotationType: AnnotationType,
  metricAnnotationType: MetricAnnotationType.AlertMetricWithSeverityDimension,
): SourceMetricConfigWithSeverityDimension[];

function getSourceMetricContextsForAnnotationType(
  annotationType: AnnotationType,
  metricAnnotationType: MetricAnnotationType.AlertMetricWithChartContext,
): SourceMetricConfigWithChartSpec[];

function getSourceMetricContextsForAnnotationType(
  annotationType: AnnotationType,
  metricAnnotationType:
    | MetricAnnotationType.AlertMetricWithSeverityDimension
    | MetricAnnotationType.AlertMetricWithChartContext,
): (SourceMetricConfigWithSeverityDimension | SourceMetricConfigWithChartSpec)[] {
  const { perMetricConfigs } = AnnotationConfig[annotationType];
  const contexts: SourceMetricConfig[] = [];

  getRecordEntries(perMetricConfigs).forEach(([, perMetricConfig]) => {
    if (
      perMetricConfig.type === metricAnnotationType &&
      'sourceMetricContextInPriorityOrder' in perMetricConfig
    ) {
      const { sourceMetricContextInPriorityOrder } = perMetricConfig;
      sourceMetricContextInPriorityOrder.forEach((context, priority) => {
        contexts.push({ ...context, priority });
      });
    }
  });

  return contexts;
}

function buildRequestsContextByUniqueKey(
  annotationType: AnnotationAlertType,
): RequestContextByUniqueKey {
  const contexts = getSourceMetricContextsForAnnotationType(
    annotationType,
    MetricAnnotationType.AlertMetricWithSeverityDimension,
  );

  return contexts.reduce((acc, context) => {
    const { metric: sourceMetric, granularity, breakdown, descriptionLink, priority } = context;
    const key = `${sourceMetric}-${granularity}-${breakdown}-${descriptionLink}`;
    const value = acc.get(key);
    if (value) {
      value.supportedMetrics.push(sourceMetric);
    } else {
      acc.set(key, {
        supportedMetrics: [sourceMetric],
        sourceMetricConfig: {
          metric: sourceMetric,
          granularity,
          breakdown,
          descriptionLink,
          priority,
        },
      });
    }
    return acc;
  }, new Map<string, { supportedMetrics: TRAQIV2UIMetric[]; sourceMetricConfig: SourceMetricConfigWithSeverityDimension }>());
}

async function fetchInitialAnnotationAlerts(
  annotationType: AnnotationAlertType,
  resource: RAQIV2ChartResource,
  startUtc: Date,
  endUtc: Date,
  raqiClient: RAQIV2CombinedAPIClientWrapper,
): Promise<TimeSeriesAnnotation[]> {
  const requestsContextByUniqueKey = buildRequestsContextByUniqueKey(annotationType);

  const requests = Array.from(requestsContextByUniqueKey.values()).map(
    async ({
      sourceMetricConfig: { metric, granularity, breakdown, descriptionLink, priority },
    }) => {
      const response = await makeRAQIV2Request(
        {
          resource,
          metric,
          breakdown: [breakdown],
          timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime: startUtc, endTime: endUtc },
          granularity,
        },
        raqiClient,
      );
      return adaptAlertAnnotationSeriesToRange({
        annotationType,
        response,
        priority,
        descriptionLink,
        fallbackTooltipRenderer: getMetricTooltipWithLinkRenderer(metric, descriptionLink),
      });
    },
  );

  const responses = await Promise.all(requests);
  return responses.flat();
}

async function fetchAlertAnnotationsForChartContext(
  annotationType: AnnotationAlertType,
  context: RAQIV2ChartContext,
  raqiClient: RAQIV2CombinedAPIClientWrapper,
): Promise<TimeSeriesAnnotation[]> {
  const contexts = getSourceMetricContextsForAnnotationType(
    annotationType,
    MetricAnnotationType.AlertMetricWithChartContext,
  );

  const requests = contexts.map(async (sourceContext) => {
    const { metric, descriptionLink, priority, ...specOverride } = sourceContext;
    const requestSpec = computeRAQIV2SpecOverride(
      {
        breakdown: context.breakdown,
        filter: context.filter,
        granularity: context.granularity,
        timeSpec: context.timeSpec,
        limit: context.limit,
      },
      specOverride,
    );

    const response = await makeRAQIV2Request(
      {
        resource: context.resource,
        metric,
        breakdown: requestSpec.breakdown,
        filter: requestSpec.filter,
        timeSpec: requestSpec.timeSpec ?? context.timeSpec,
        granularity: requestSpec.granularity ?? context.granularity,
        limit: requestSpec.limit,
      },
      raqiClient,
    );

    return adaptAlertAnnotationSeriesToRange({
      annotationType,
      response,
      priority,
      descriptionLink,
      fallbackTooltipRenderer: getMetricTooltipWithLinkRenderer(metric, descriptionLink),
    });
  });

  const annotationArrays = await Promise.all(requests);
  return annotationArrays.flat();
}

const isValidAlertRAQIRequest = (
  breakdowns: readonly TRAQIV2Dimension[] | undefined,
  filters: readonly RAQIV2QueryFilter[] | undefined,
): boolean => {
  const hasPlaceVersionBreakdown =
    breakdowns?.some(
      (dim) =>
        dim === RAQIV2Dimension.PlaceVersion ||
        dim === RAQIV2UIPseudoDimension.LatestPlaceVersion ||
        dim === RAQIV2UIPseudoDimension.LatestPlaceVersionOnly,
    ) ?? false;
  const hasPlaceVersionFilter =
    filters?.some((filter) => filter.dimension === RAQIV2Dimension.PlaceVersion) ?? false;
  const hasPlaceFilter =
    filters?.some((filter) => filter.dimension === RAQIV2Dimension.Place) ?? false;
  const hasPlaceVersion = hasPlaceVersionBreakdown || hasPlaceVersionFilter;
  return !hasPlaceVersion || hasPlaceFilter;
};

const hasRequiredBreakdown = (
  contextBreakdowns: readonly TRAQIV2Dimension[] | undefined,
  requiredBreakdowns: readonly TRAQIV2Dimension[] | undefined,
): boolean => {
  if (!requiredBreakdowns || requiredBreakdowns.length === 0) {
    return true;
  }
  if (!contextBreakdowns || contextBreakdowns.length === 0) {
    return false;
  }
  return requiredBreakdowns.some((required) => contextBreakdowns.includes(required));
};

/**
 * Handles fetching and formatting of annotation data.
 */
export const useTimeSeriesAnnotations = ({
  resource,
  placeId,
  rootPlaceId,
  funnelName,
  annotationTypes: givenAnnotationTypes,
  startUtc,
  endUtc,
}: {
  resource: RAQIV2ChartResource;
  placeId?: number;
  rootPlaceId?: number;
  funnelName?: string;
  annotationTypes: AnnotationType[];
  startUtc: Date;
  endUtc: Date;
}): {
  timeSeriesAnnotations: TimeSeriesAnnotation[] | null;
  getCurrentSupportedAnnotations: (
    metrics: NonEmptyArray<TRAQIV2UIMetric>,
    isSupportedOverride?: (annotationType: AnnotationType) => boolean | undefined,
    targetingDimensions?: readonly TRAQIV2Dimension[],
  ) => TimeSeriesAnnotation[] | undefined;
  updateTimeSeriesAnnotationsGivenChartContext: (context: RAQIV2ChartContext) => void;
} & GenericChartState => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { client: raqiClient } = useRAQIV2Client(false);
  const { annotationsClient } = useAnnotationsClient(resource.type);
  const [timeSeriesAnnotations, setTimeSeriesAnnotations] = useState<TimeSeriesAnnotation[] | null>(
    null,
  );
  const lastChartContextRef = useRef<string>('');
  // status-config endpoint is universe-scoped; only forward the id when the resource is a Universe.
  // For Group/User resources, passing the id would be treated as a universeId and 403.
  const statusConfigUniverseId =
    resource.type === ChartResourceType.Universe ? resource.id : undefined;
  const { announcementAnnotations, isAnnotationTargetingMetric, isAnnotationTargetingDimension } =
    useAnnotationConfiguration(statusConfigUniverseId);

  const annotationTypes = useMemo(() => {
    // Collect all annotation types from AnnotationType that are classified as NotSelectableCategory
    const notSelectableAnnotationTypes = Object.values(AnnotationType).filter((annotationType) => {
      return isAnnotationTypeNotSelectable(annotationType);
    });
    return Array.from(new Set([...givenAnnotationTypes, ...notSelectableAnnotationTypes]));
  }, [givenAnnotationTypes]);

  const fetchAnnotationsByTypes = useCallback(
    async (types: AnnotationType[]): Promise<Map<AnnotationType, TimeSeriesAnnotation[]>> => {
      const results = await Promise.all(
        types.map(async (annotationType): Promise<[AnnotationType, TimeSeriesAnnotation[]]> => {
          // Remaining `AnnotationType` values use the default branch (`getAnnotations` + hydrate).
          // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- default handles all non-alert/non-announcement types
          switch (annotationType) {
            case AnnotationType.RetentionCorhortDisclaimer:
              return [
                annotationType,
                [
                  {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- synthetic disclaimer row uses same id shape as server annotations
                    id: `${annotationType}-${startUtc.getTime()}-${endUtc.getTime()}` as TAnnotationId,
                    type: annotationType,
                    startUtc,
                    endUtc,
                  },
                ],
              ];
            case AnnotationType.ClientCrashRateNotStableAlert:
            case AnnotationType.MemoryStoreRequestsAlert:
            case AnnotationType.MemoryStoreMemoryUsageAlert: {
              const annotations = await fetchInitialAnnotationAlerts(
                annotationType,
                resource,
                startUtc,
                endUtc,
                raqiClient,
              );
              return [annotationType, annotations];
            }
            case AnnotationType.Announcement: {
              return [annotationType, announcementAnnotations];
            }
            case AnnotationType.ConfiguredAlertIncident: {
              const items = await annotationsClient.getCustomAlertAnnotation({
                resource,
                startUtc,
                endUtc,
              });
              return [annotationType, adaptConfiguredAlertIncidentsToRangeAnnotations(items)];
            }
            default: {
              const annotations = await annotationsClient.getAnnotations({
                annotationType,
                resource,
                placeId,
                rootPlaceId,
                funnelName,
                startUtc,
                endUtc,
              });
              const hydrated = await annotationsClient.hydrateAnnotations(
                annotations,
                annotationType,
                translate,
              );
              return [annotationType, hydrated];
            }
          }
        }),
      );

      return new Map(results);
    },
    [
      annotationsClient,
      endUtc,
      funnelName,
      placeId,
      raqiClient,
      resource,
      rootPlaceId,
      startUtc,
      translate,
      announcementAnnotations,
    ],
  );

  const {
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    orderedData: initialAnnotationData,
  } = useMappedApiRequest(annotationTypes, fetchAnnotationsByTypes);

  useEffect(() => {
    // Dedupe by content. `initialAnnotationData` can be a fresh array on every
    // upstream re-render even when the annotation contents are unchanged, and
    // `flatMap` always allocates. Without this guard, every upstream tick would
    // schedule a new annotations state, fan out a new context value, and force
    // every chart consumer to recompute — which, on first-load with computed
    // metrics, drives a synchronous re-render cascade (DSA-5737 follow-up).
    if (annotationTypes.length === 0) {
      setTimeSeriesAnnotations((prev) => (prev !== null && prev.length === 0 ? prev : []));
      return;
    }
    const next = initialAnnotationData.flatMap((annotations) => annotations ?? []);
    setTimeSeriesAnnotations((prev) => {
      if (prev && prev.length === next.length && prev.every((ann, i) => ann === next[i])) {
        return prev;
      }
      return next;
    });
  }, [initialAnnotationData, annotationTypes]);

  const getCurrentSupportedAnnotations = useCallback(
    (
      metrics: NonEmptyArray<TRAQIV2UIMetric>,
      isSupportedOverride?: (annotationType: AnnotationType) => boolean | undefined,
      targetingDimensions?: readonly TRAQIV2Dimension[],
    ) => {
      return timeSeriesAnnotations?.filter((annotation) => {
        const overide = isSupportedOverride?.(annotation.type);
        if (overide !== undefined) {
          return overide;
        }

        if (annotation.type === AnnotationType.Announcement) {
          const matchesMetricTarget = metrics.some((metric) =>
            isAnnotationTargetingMetric(annotation.id, metric),
          );
          if (!targetingDimensions) {
            return matchesMetricTarget;
          }
          const matchesDimensionTarget = isAnnotationTargetingDimension(
            annotation.id,
            targetingDimensions,
          );
          return matchesMetricTarget && matchesDimensionTarget;
        }

        if (annotation.type === AnnotationType.ConfiguredAlertIncident) {
          // Metric match is enforced here; full chart-context filtering
          // (filter / breakdown overlap with the annotation's alert config)
          // is layered on top by `shouldShowConfiguredAlertIncident` inside
          // `useChartTimeSeriesAnnotations` once the per-chart breakdown /
          // filter are in scope.
          return metrics.some((metric) => metric === annotation.metric);
        }

        const { showForUnconfiguredMetrics, perMetricConfigs } = AnnotationConfig[annotation.type];

        if (!showForUnconfiguredMetrics && !metrics.some((metric) => perMetricConfigs[metric])) {
          // if showForUnconfiguredMetrics is false,
          // and no per-metric config is found
          return false;
        }

        return true;
      });
    },
    [timeSeriesAnnotations, isAnnotationTargetingMetric, isAnnotationTargetingDimension],
  );

  const updateTimeSeriesAnnotationsGivenChartContext = useCallback(
    async (context: RAQIV2ChartContext) => {
      const contextHash = JSON.stringify({
        resource: context.resource,
        breakdown: context.breakdown,
        filter: context.filter,
        granularity: context.granularity,
        timeSpec: context.timeSpec,
        limit: context.limit,
      });

      if (
        lastChartContextRef.current === contextHash ||
        !isValidAlertRAQIRequest(context.breakdown, context.filter)
      ) {
        return;
      }

      const allChartContextAnnotationTypes = annotationTypes.filter(
        (annotationType): annotationType is AnnotationAlertType =>
          getSourceMetricContextsForAnnotationType(
            annotationType,
            MetricAnnotationType.AlertMetricWithChartContext,
          ).length > 0,
      );

      const chartContextAnnotationTypesToFetch = allChartContextAnnotationTypes.filter(
        (annotationType) => {
          const { perMetricConfigs } = AnnotationConfig[annotationType];
          const perMetricConfigEntries = getRecordEntries(perMetricConfigs);

          return perMetricConfigEntries.some(([, perMetricConfig]) => {
            if (perMetricConfig.type === MetricAnnotationType.AlertMetricWithChartContext) {
              return hasRequiredBreakdown(context.breakdown, perMetricConfig.requiredBreakdown);
            }
            return false;
          });
        },
      );

      if (allChartContextAnnotationTypes.length === 0) {
        return;
      }

      try {
        const updatedAnnotationsMap = await Promise.allSettled(
          chartContextAnnotationTypesToFetch.map(async (annotationType) => {
            const annotations = await fetchAlertAnnotationsForChartContext(
              annotationType,
              context,
              raqiClient,
            );
            return { annotationType, annotations };
          }),
        );

        setTimeSeriesAnnotations((prevAnnotations) => {
          if (!prevAnnotations) {
            return prevAnnotations;
          }

          const filteredAnnotations = prevAnnotations.filter(
            (ann) =>
              !isAnnotationAlertType(ann.type) ||
              !allChartContextAnnotationTypes.includes(ann.type),
          );
          const newAnnotations: TimeSeriesAnnotation[] = updatedAnnotationsMap
            .flatMap((item) => {
              if (item.status === 'rejected') {
                logAnalyticsError(`Fail to get annotation with chart context. ${item.reason}`);
                return null;
              }
              return item.value.annotations;
            })
            .filter((item) => item !== null);

          return [...filteredAnnotations, ...newAnnotations];
        });

        lastChartContextRef.current = contextHash;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        logAnalyticsError(`Fail to get annotation with chart context. ${detail}`);
      }
    },
    [annotationTypes, raqiClient],
  );

  return useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      timeSeriesAnnotations,
      getCurrentSupportedAnnotations,
      updateTimeSeriesAnnotationsGivenChartContext,
    }),
    [
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      timeSeriesAnnotations,
      getCurrentSupportedAnnotations,
      updateTimeSeriesAnnotationsGivenChartContext,
    ],
  );
};

export default useTimeSeriesAnnotations;
