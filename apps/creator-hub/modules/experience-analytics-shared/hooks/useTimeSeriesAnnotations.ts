import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GenericChartState,
  NonEmptyArray,
  TAnnotationId,
  TimeSeriesAnnotation,
  useAnnotationsClient,
  logAnalyticsError,
} from '@modules/charts-generic';
import {
  AnnotationAlertType,
  AnnotationType,
  isAnnotationAlertType,
  RAQIV2ChartResource,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import { uuidService } from '@rbx/core';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import { getRecordEntries } from '@modules/miscellaneous/common/utils/helperUtils';
import { useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import useMappedApiRequest from './useMappedApiRequest';
import {
  AnnotationConfig,
  MetricAnnotationType,
  SourceMetricConfig,
  SourceMetricConfigWithSeverityDimension,
  SourceMetricConfigWithChartSpec,
  isAnnotationTypeNotSelectable,
} from '../constants/annotationConfig';
import makeRAQIV2Request, { RAQIV2CombinedAPIClientWrapper } from '../utils/makeRAQIV2Request';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import { adaptAlertAnnotationSeriesToRange } from '../adapters/customAnnotationAdapter';
import getMetricTooltipWithLinkRenderer from '../utils/getMetricTooltipWithLinkRenderer';
import RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../utils/computeRAQIV2SpecOverride';
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
          timeSpec: { startTime: startUtc, endTime: endUtc },
          granularity,
        },
        raqiClient,
        {
          allowComputedMetrics: false,
        },
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
      {
        allowComputedMetrics: false,
      },
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
  const hasPlaceVersion =
    (breakdowns &&
      breakdowns.some(
        (dim) =>
          dim === RAQIV2Dimension.PlaceVersion ||
          dim === RAQIV2UIPseudoDimension.LatestPlaceVersion ||
          dim === RAQIV2UIPseudoDimension.LatestPlaceVersionOnly,
      )) ||
    (filters && filters.some((filter) => filter.dimension === RAQIV2Dimension.PlaceVersion));
  const hasPlaceFilter =
    filters && filters.some((filter) => filter.dimension === RAQIV2Dimension.Place);
  return (hasPlaceVersion && hasPlaceFilter) || !hasPlaceVersion;
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
  const { announcementAnnotations, isAnnotationTargetingMetric } = useAnnotationConfiguration(
    resource.id,
  );

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
          switch (annotationType) {
            case AnnotationType.RetentionCorhortDisclaimer:
              return [
                annotationType,
                [
                  {
                    id: uuidService.generateRandomUuid() as TAnnotationId,
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
    if (annotationTypes.length === 0) {
      setTimeSeriesAnnotations([]);
    } else {
      setTimeSeriesAnnotations(initialAnnotationData.flatMap((annotations) => annotations ?? []));
    }
  }, [initialAnnotationData, annotationTypes]);

  const getCurrentSupportedAnnotations = useCallback(
    (
      metrics: NonEmptyArray<TRAQIV2UIMetric>,
      isSupportedOverride?: (annotationType: AnnotationType) => boolean | undefined,
    ) => {
      return timeSeriesAnnotations?.filter((annotation) => {
        const overide = isSupportedOverride?.(annotation.type);
        if (overide !== undefined) {
          return overide;
        }

        if (annotation.type === AnnotationType.Announcement) {
          return metrics.some((metric) => isAnnotationTargetingMetric(annotation.id, metric));
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
    [timeSeriesAnnotations, isAnnotationTargetingMetric],
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
          if (!prevAnnotations) return prevAnnotations;

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
        logAnalyticsError(`Fail to get annotation with chart context. ${error}`);
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
