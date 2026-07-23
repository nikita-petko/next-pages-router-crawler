import { AnnotationType } from '@modules/clients/analytics';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2Metric,
  TRAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dateUtils, logAnalyticsError } from '@modules/charts-generic';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { urls } from '@modules/miscellaneous/common';
import { getRecordEntries } from '@modules/miscellaneous/common/utils/helperUtils';
import { TAlertAnnotationSeverityDimension } from './alertAnnotationConfigs';
import { SpecOverride } from '../utils/computeRAQIV2SpecOverride';

export enum MetricAnnotationType {
  DateRangeShifted = 'date-range-shifted',
  DateRangeWithLatestDataTimestampToTimeAxisEnd = 'date-range-with-latest-data-timestamp-to-time-axis-end',
  AlertMetricWithSeverityDimension = 'alert-metric-with-severity-dimension',
  AlertMetricWithChartContext = 'alert-metric-with-chart-context',
}

export type SourceMetricConfig = {
  metric: TRAQIV2UIMetric;
  priority: number;
  descriptionLink?: string;
};

export type SourceMetricConfigWithSeverityDimension = SourceMetricConfig & {
  granularity: RAQIV2MetricGranularity;
  breakdown: TAlertAnnotationSeverityDimension;
};

export type SourceMetricConfigWithChartSpec = SourceMetricConfig & SpecOverride;

type PerMetricAnnotationConfig =
  | {
      type: MetricAnnotationType.DateRangeShifted;
      shiftValue: number;
    }
  | {
      type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd;
      annotationTooltipKey?: TranslationKey;
    }
  | {
      type: MetricAnnotationType.AlertMetricWithSeverityDimension;
      sourceMetricContextInPriorityOrder: Array<{
        metric: TRAQIV2UIMetric;
        granularity: RAQIV2MetricGranularity;
        breakdown: TAlertAnnotationSeverityDimension;
        descriptionLink?: string;
      }>;
    }
  | {
      type: MetricAnnotationType.AlertMetricWithChartContext;
      requiredBreakdown?: readonly TRAQIV2Dimension[];
      sourceMetricContextInPriorityOrder: Array<
        {
          metric: TRAQIV2UIMetric;
          descriptionLink?: string;
        } & SpecOverride
      >;
    };

type PageAnnotationConfig = Record<
  AnnotationType,
  {
    labelKey: TranslationKey;
    /* If a category is specified, the category will be shown in place of this annotation type in the global menu.
       If the category is 'NotSelectableCategory', displaying this annotation depends on its associated metric, dimension, or other targeting criteria. */
    category: AnnotationSelectableCategory | null | 'NotSelectableCategory';
    perMetricConfigs: Partial<Record<TRAQIV2UIMetric, PerMetricAnnotationConfig>>;
    showForUnconfiguredMetrics: boolean;
  }
>;

export enum AnnotationSelectableCategory {
  Insights = 'Insights',
  Version = 'Version',
}

export const AnnotationCategoryLabelKey: Record<AnnotationSelectableCategory, TranslationKey> = {
  [AnnotationSelectableCategory.Insights]: translationKey(
    'Label.AnnotationCategory.Insights',
    TranslationNamespace.Analytics,
  ),
  [AnnotationSelectableCategory.Version]: translationKey(
    'Label.AnnotationCategory.Version',
    TranslationNamespace.Analytics,
  ),
};

const AnnotationConfigInternal = {
  [AnnotationType.PlaceIcon]: {
    labelKey: translationKey('Label.Annotation.PlaceIcon', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.PlaceThumbnail]: {
    labelKey: translationKey('Label.Annotation.PlaceThumbnail', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.PlaceVideo]: {
    labelKey: translationKey('Label.Annotation.PlaceVideo', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.PlaceVersion]: {
    labelKey: translationKey('Label.Annotation.PlaceVersion', TranslationNamespace.Analytics),
    category: AnnotationSelectableCategory.Version,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.Benchmark]: {
    labelKey: translationKey('Label.Annotation.Benchmark', TranslationNamespace.Analytics),
    category: AnnotationSelectableCategory.Insights,
    perMetricConfigs: {
      [RAQIV2Metric.ForwardD1Retention]: {
        type: MetricAnnotationType.DateRangeShifted,
        shiftValue: -1 * dateUtils.hourInMilliseconds * 24, // 1 day
      },
      [RAQIV2Metric.L7AverageForwardD1Retention]: {
        type: MetricAnnotationType.DateRangeShifted,
        shiftValue: -1 * dateUtils.hourInMilliseconds * 24, // 1 day
      },
      [RAQIV2Metric.ForwardD7Retention]: {
        type: MetricAnnotationType.DateRangeShifted,
        shiftValue: -7 * dateUtils.hourInMilliseconds * 24, // 7 days
      },
      [RAQIV2Metric.L7AverageForwardD7Retention]: {
        type: MetricAnnotationType.DateRangeShifted,
        shiftValue: -7 * dateUtils.hourInMilliseconds * 24, // 7 days
      },
      [RAQIV2Metric.ForwardD30Retention]: {
        type: MetricAnnotationType.DateRangeShifted,
        shiftValue: -30 * dateUtils.hourInMilliseconds * 24, // 30 days
      },
    },
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.FunnelStepNameChange]: {
    labelKey: translationKey(
      'Label.Annotation.FunnelStepNameChange',
      TranslationNamespace.Analytics,
    ),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: false,
  },
  [AnnotationType.LiveEvent]: {
    labelKey: translationKey('Label.Annotation.Events', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.CustomMatchmaking]: {
    labelKey: translationKey('Label.Annotation.CustomMatchmaking', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.EngineRelease]: {
    labelKey: translationKey('Label.Annotation.EngineRelease', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.MemoryStoreRequestsAlert]: {
    labelKey: translationKey('Label.Annotation.MemoryStoreAlerts', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {
      [RAQIV2Metric.MemoryStoreRequestsByStatus]: {
        type: MetricAnnotationType.AlertMetricWithSeverityDimension,
        sourceMetricContextInPriorityOrder: [
          {
            metric: RAQIV2Metric.MemoryStoreThrottlingAlert,
            granularity: RAQIV2MetricGranularity.HalfHour,
            breakdown: RAQIV2Dimension.MemoryStoreThrottlingAlertSeverity,
            descriptionLink: urls.creatorHub.docs.getCloudServicesMemoryStoresMemoryUsageUrl(),
          },
          {
            metric: RAQIV2Metric.MemoryStoreErrorRateAlert,
            granularity: RAQIV2MetricGranularity.HalfHour,
            breakdown: RAQIV2Dimension.MemoryStoreErrorRateAlertSeverity,
            descriptionLink: urls.creatorHub.docs.getCloudServicesMemoryStoresMemoryUsageUrl(),
          },
        ],
      },
    },
    showForUnconfiguredMetrics: false,
  },
  [AnnotationType.MemoryStoreMemoryUsageAlert]: {
    labelKey: translationKey('Label.Annotation.MemoryStoreAlerts', TranslationNamespace.Analytics),
    category: null,
    perMetricConfigs: {
      [RAQIV2Metric.MemoryStoreMemoryUsageBytes]: {
        type: MetricAnnotationType.AlertMetricWithSeverityDimension,
        sourceMetricContextInPriorityOrder: [
          {
            metric: RAQIV2Metric.MemoryStoreMemoryUsageAlert,
            granularity: RAQIV2MetricGranularity.HalfHour,
            breakdown: RAQIV2Dimension.MemoryStoreMemoryUsageAlertSeverity,
            descriptionLink: urls.creatorHub.docs.getCloudServicesMemoryStoresMemoryUsageUrl(),
          },
        ],
      },
    },
    showForUnconfiguredMetrics: false,
  },
  [AnnotationType.ClientCrashRateNotStableAlert]: {
    labelKey: translationKey(
      'Label.Annotation.ClientCrashRateNotStableAlert',
      TranslationNamespace.Analytics,
    ),
    category: null,
    perMetricConfigs: {
      [RAQIV2Metric.ClientCrashRate15m]: {
        type: MetricAnnotationType.AlertMetricWithChartContext,
        requiredBreakdown: [
          RAQIV2Dimension.PlaceVersion,
          RAQIV2UIPseudoDimension.LatestPlaceVersion,
          RAQIV2UIPseudoDimension.LatestPlaceVersionOnly,
        ],
        sourceMetricContextInPriorityOrder: [
          {
            metric: RAQIV2Metric.ClientCrashRateNotStableAlert,
            breakdown: { override: [RAQIV2UIPseudoDimension.LatestPlaceVersionOnly] },
          },
        ],
      },
    },
    showForUnconfiguredMetrics: false,
  },
  [AnnotationType.RetentionCorhortDisclaimer]: {
    labelKey: translationKey(
      'Label.Annotation.ForwardLookingRetention',
      TranslationNamespace.Analytics,
    ),
    category: AnnotationSelectableCategory.Insights,
    perMetricConfigs: {
      [RAQIV2Metric.ForwardD1Retention]: {
        type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd,
        annotationTooltipKey: translationKey(
          'Description.RetentionCohortDisclaimer.D1Retention',
          TranslationNamespace.Analytics,
        ),
      },
      [RAQIV2Metric.L7AverageForwardD1Retention]: {
        type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd,
        annotationTooltipKey: translationKey(
          'Description.RetentionCohortDisclaimer.D1Retention',
          TranslationNamespace.Analytics,
        ),
      },
      [RAQIV2Metric.ForwardD7Retention]: {
        type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd,
        annotationTooltipKey: translationKey(
          'Description.RetentionCohortDisclaimer.D7Retention',
          TranslationNamespace.Analytics,
        ),
      },
      [RAQIV2Metric.L7AverageForwardD7Retention]: {
        type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd,
        annotationTooltipKey: translationKey(
          'Description.RetentionCohortDisclaimer.D7Retention',
          TranslationNamespace.Analytics,
        ),
      },
      [RAQIV2Metric.ForwardD30Retention]: {
        type: MetricAnnotationType.DateRangeWithLatestDataTimestampToTimeAxisEnd,
        annotationTooltipKey: translationKey(
          'Description.RetentionCohortDisclaimer.D30Retention',
          TranslationNamespace.Analytics,
        ),
      },
    },
    showForUnconfiguredMetrics: false,
  },
  [AnnotationType.ConfigVersion]: {
    labelKey: translationKey('Label.Annotation.ConfigVersion', TranslationNamespace.Analytics),
    category: AnnotationSelectableCategory.Version,
    perMetricConfigs: {},
    showForUnconfiguredMetrics: true,
  },
  [AnnotationType.Announcement]: {
    labelKey: translationKey('Label.Annotation.GlobalAnnouncement', TranslationNamespace.Analytics),
    category: 'NotSelectableCategory',
    perMetricConfigs: {},
    // Metric filtering done upstream in useTimeSeriesAnnotations.getCurrentSupportedAnnotations
    // via isAnnotationTargetingMetric because it's controlled by API instead of FE perMetricConfigs,
    // so we don't need to filter again at the visualization layer
    showForUnconfiguredMetrics: true,
  },
} as const satisfies PageAnnotationConfig;

// Export a standard typed version for runtime use
export const AnnotationConfig: PageAnnotationConfig = AnnotationConfigInternal;

// Derive types automatically from the config - no manual maintenance needed
type ExtractTypesWithCategory = {
  [K in AnnotationType]: (typeof AnnotationConfigInternal)[K]['category'] extends AnnotationSelectableCategory
    ? K
    : never;
}[AnnotationType];

export type AnnotationTypeWithoutCategory = Exclude<AnnotationType, ExtractTypesWithCategory>;

export type AnnotationOptions =
  | 'None'
  | AnnotationSelectableCategory
  | AnnotationTypeWithoutCategory;

const isAnnotationTypeWithoutCategory = (
  annotationType: AnnotationType,
): annotationType is AnnotationTypeWithoutCategory => {
  return !AnnotationConfig[annotationType].category;
};

export const isAnnotationTypeNotSelectable = (annotationType: AnnotationType): boolean => {
  return AnnotationConfig[annotationType].category === 'NotSelectableCategory';
};

export const getAnnotationOptionsFromAnnotationTypes = (
  annotationTypes: Array<AnnotationType | 'None'>,
): AnnotationOptions[] => {
  const uniqueOptions = new Set<AnnotationOptions>();

  annotationTypes.forEach((type) => {
    if (type === 'None') {
      uniqueOptions.add('None');
      return;
    }

    if (isAnnotationTypeWithoutCategory(type)) {
      uniqueOptions.add(type);
      return;
    }

    const { category } = AnnotationConfig[type];
    if (!category) {
      logAnalyticsError(`Annotation type ${type} is supposed to have a category`);
      uniqueOptions.add('None');
      return;
    }

    if (category !== 'NotSelectableCategory') {
      uniqueOptions.add(category);
    }
  });

  return Array.from(uniqueOptions);
};

export const getAnnotationTypesFromAnnotationOptions = (
  annotationOptions: AnnotationOptions[],
): Array<AnnotationType | 'None'> => {
  const types: Set<AnnotationType | 'None'> = new Set();
  annotationOptions.forEach((option) => {
    if (option === 'None') {
      types.add('None');
    } else if (isValidEnumValue(AnnotationSelectableCategory, option)) {
      getRecordEntries(AnnotationConfig).forEach(([type, { category }]) => {
        if (category === option) {
          types.add(type);
        }
      });
    } else {
      types.add(option);
    }
  });
  return Array.from(types);
};
