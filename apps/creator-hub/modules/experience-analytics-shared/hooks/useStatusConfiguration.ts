import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  TRAQIV2APIMetric,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type {
  TAnnotationId,
  TimeSeriesAnnotation,
} from '@modules/charts-generic/charts/types/Annotations';
import { BannerCategory } from '@modules/charts-generic/components/StatusBanner';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { AnnotationType } from '@modules/clients/analytics';
import type {
  AnnotationConfiguration,
  BannerConfiguration,
  ChartWarningConfiguration,
} from '@modules/clients/analytics/analyticsQueryGateway';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TChartWarningConfig } from '../constants/statusConfig';
import {
  annotationConfig,
  AnnotationKey,
  bannerConfig,
  BannerKey,
  chartWarningConfig,
  ChartWarningKey,
} from '../constants/statusConfig';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import { getAllAPIMetricsFromUIMetric } from '../utils/getAPIMetricFromUIMetric';

// Common Status Config
const useStatusConfiguration = (rawUniverseId?: number) => {
  const {
    client: { platformGatewayRAQIClient },
  } = useRAQIV2Client(false);

  const universeId = rawUniverseId && rawUniverseId > 0 ? rawUniverseId : undefined;
  return useQuery({
    queryKey: ['status-configuration', universeId],
    queryFn: async () => platformGatewayRAQIClient.getStatusConfig({ universeId }),
    initialData: {
      bannerConfigurations: [],
      annotationConfigurations: [],
      chartWarningConfigurations: [],
    },
    initialDataUpdatedAt: 0,
    staleTime: 180_000, // 3 minutes
    throwOnError: (error) => {
      logAnalyticsError(`${error}`);
      return false;
    },
  });
};

const getRelevantConfigurations = <
  T extends BannerConfiguration | AnnotationConfiguration | ChartWarningConfiguration,
>(
  currentTargets: string[],
  configs: T[],
): T[] => {
  const relevantConfigs: T[] = [];

  configs?.forEach((config) => {
    const { targets, key } = config;
    if (key && !!targets?.some((target) => currentTargets.includes(target))) {
      relevantConfigs.push({ ...config, key } as T);
    }
  });
  return relevantConfigs;
};

// Banner Configuration
const isValidBannerKey = (key: string | undefined): key is BannerKey => {
  return key !== undefined && isValidEnumValue(BannerKey, key);
};

const isValidBannerCategory = (category: string | undefined): category is BannerCategory => {
  return category !== undefined && isValidEnumValue(BannerCategory, category);
};

const isValidBannerConfigItem = (item: {
  key?: string;
  category?: string;
}): item is { key: BannerKey; category: BannerCategory } => {
  return isValidBannerKey(item.key) && isValidBannerCategory(item.category);
};

export const useBannerConfiguration = (
  pageIncludedTargets: string[],
  universeId?: number,
): BannerConfiguration[] => {
  const {
    data: { bannerConfigurations },
  } = useStatusConfiguration(universeId);

  return getRelevantConfigurations(pageIncludedTargets, bannerConfigurations ?? []);
};

export const useAnalyticsBannerConfiguration = (
  pageVisibleMetrics: (TRAQIV2APIMetric | string)[],
  universeId?: number,
  requiredCategory?: BannerCategory,
) => {
  const data = useBannerConfiguration(pageVisibleMetrics, universeId);

  return useMemo(
    () => ({
      data: data
        .filter(
          ({ category: responseCategory }) =>
            !requiredCategory || responseCategory === requiredCategory,
        )
        .filter(isValidBannerConfigItem)
        .map(({ key, category: responseCategory }) => ({
          key,
          responseCategory,
          ...bannerConfig[key],
        })),
    }),
    [data, requiredCategory],
  );
};

// Annotation Configuration
const isValidAnnotationKey = (key: string | undefined): key is AnnotationKey => {
  return key !== undefined && isValidEnumValue(AnnotationKey, key);
};

const isValidAnnotationMetricTarget = (target: string): target is TRAQIV2APIMetric => {
  return isValidEnumValue(RAQIV2APIMetric, target) || isValidEnumValue(RAQIV2Metric, target);
};

const isValidAnnotationDimensionTarget = (target: string): target is TRAQIV2Dimension => {
  return (
    isValidEnumValue(RAQIV2Dimension, target) || isValidEnumValue(RAQIV2UIPseudoDimension, target)
  );
};

/**
 * Validates and parses a start time string.
 * Supports both Unix timestamps (numeric strings) and ISO date strings.
 */
const parseStartTime = (startTime: string | undefined): Date | null => {
  if (startTime === undefined) {
    return null;
  }

  // Try parsing as a Unix timestamp (numeric string)
  const numericValue = Number(startTime);
  if (!Number.isNaN(numericValue)) {
    return new Date(numericValue);
  }

  // Try parsing as an ISO date string
  const parsedDate = new Date(startTime);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
};

type AnnotationConfigurationResult = {
  announcementAnnotations: TimeSeriesAnnotation[];
  isAnnotationTargetingMetric: (annotationId: TAnnotationId, metric: TRAQIV2UIMetric) => boolean;
  isAnnotationTargetingDimension: (
    annotationId: TAnnotationId,
    dimensions: readonly TRAQIV2Dimension[],
  ) => boolean;
};

export const useAnnotationConfiguration = (universeId?: number): AnnotationConfigurationResult => {
  const {
    data: { annotationConfigurations },
  } = useStatusConfiguration(universeId);

  const { announcementAnnotations, annotationTargetsMap } = useMemo(() => {
    const annotations: TimeSeriesAnnotation[] = [];
    const targetsMap = new Map<
      TAnnotationId,
      {
        metricTargets: Set<TRAQIV2APIMetric>;
        dimensionTargets: Set<TRAQIV2Dimension>;
      }
    >();

    annotationConfigurations?.forEach((config) => {
      const { key, targets, unixStartTime, dimensions: dimensionTargets } = config;

      if (!isValidAnnotationKey(key)) {
        return;
      }

      const parsedStartTime = parseStartTime(unixStartTime);
      if (parsedStartTime === null) {
        return;
      }

      const validMetricTargets = targets?.filter(isValidAnnotationMetricTarget) ?? [];
      const validDimensionTargets =
        dimensionTargets?.filter(isValidAnnotationDimensionTarget) ?? [];
      const validTargets = [...validMetricTargets, ...validDimensionTargets];
      if (validTargets.length === 0) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      const annotationId = `${key}-${validTargets.join('-')}-${unixStartTime}` as TAnnotationId;

      annotations.push({
        id: annotationId,
        type: AnnotationType.Announcement,
        translationKey: annotationConfig[key].translationKey,
        links: annotationConfig[key].links,
        startUtc: parsedStartTime,
      });

      targetsMap.set(annotationId, {
        metricTargets: new Set(validMetricTargets),
        dimensionTargets: new Set(validDimensionTargets),
      });
    });

    return { announcementAnnotations: annotations, annotationTargetsMap: targetsMap };
  }, [annotationConfigurations]);

  const isAnnotationTargetingMetric = useCallback(
    (annotationId: TAnnotationId, metric: TRAQIV2UIMetric): boolean => {
      const targets = annotationTargetsMap.get(annotationId)?.metricTargets;
      if (isValidEnumValue(RAQIV2Metric, metric)) {
        return targets?.has(metric) ?? false;
      }
      const apiMetrics = getAllAPIMetricsFromUIMetric(metric);
      return apiMetrics.some((apiMetric) => targets?.has(apiMetric) ?? false);
    },
    [annotationTargetsMap],
  );

  const isAnnotationTargetingDimension = useCallback(
    (annotationId: TAnnotationId, dimensions: readonly TRAQIV2Dimension[]): boolean => {
      const targets = annotationTargetsMap.get(annotationId)?.dimensionTargets;
      if (!targets || dimensions.length === 0) {
        return false;
      }
      return dimensions.some((dimension) => targets.has(dimension));
    },
    [annotationTargetsMap],
  );

  return useMemo(
    () => ({
      announcementAnnotations,
      isAnnotationTargetingMetric,
      isAnnotationTargetingDimension,
    }),
    [announcementAnnotations, isAnnotationTargetingMetric, isAnnotationTargetingDimension],
  );
};

// Chart warning Configuration
export const useChartWarningConfiguration = (
  metrics: TRAQIV2UIMetric[],
  universeId?: number,
): TChartWarningConfig[] => {
  const {
    data: { chartWarningConfigurations },
  } = useStatusConfiguration(universeId);

  return useMemo(() => {
    const targetedMetrics = metrics.flatMap<TRAQIV2APIMetric>((metric) => {
      if (isValidEnumValue(RAQIV2Metric, metric)) {
        return [metric];
      }
      return getAllAPIMetricsFromUIMetric(metric);
    });

    const configs = getRelevantConfigurations(targetedMetrics, chartWarningConfigurations ?? []);
    return configs
      .filter(
        (config): config is { key: ChartWarningKey } =>
          !!config.key && isValidEnumValue(ChartWarningKey, config.key),
      )
      .map((config) => chartWarningConfig[config.key]);
  }, [metrics, chartWarningConfigurations]);
};
