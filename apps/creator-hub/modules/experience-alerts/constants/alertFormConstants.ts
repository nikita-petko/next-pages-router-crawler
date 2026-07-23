import {
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricGranularity,
  RAQIV2MetricUnit,
  RAQIV2MetricToAlertingEligibleDimensions,
  RAQIV2UIPseudoDimension,
  type TRAQIV2APIMetric,
  type TRAQIV2Dimension,
  type TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  getAPIMetricFromUIMetric,
  getFilterBarDimensionForRAQIV2Dimension,
  MetricUnitDefaultSuffix,
  TRAQIV2NumericUIMetric,
  isNumericUIMetric,
} from '@modules/experience-analytics-shared';
import { isSupportedBreakdownDimension } from '@modules/clients/analytics';
import type { TranslationKey } from '@modules/analytics-translations';
import {
  AlertConditionOperation,
  ExperienceAlertSeverity,
  type ExperienceAlertFormValues,
  type TAlertConditionMetric,
} from './types';

/** Sentinel value for Foundation Dropdown when no dimension is selected */
export const ALERT_FORM_NONE_DIMENSION = '$__NONE__$';

/** Length of one data bucket for each granularity, in minutes (month uses a 30-day estimate). */
export function getAlertGranularityStepMinutes(granularity: RAQIV2MetricGranularity): number {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMinute:
      return 1;
    case RAQIV2MetricGranularity.HalfHour:
      return 30;
    case RAQIV2MetricGranularity.OneHour:
      return 60;
    case RAQIV2MetricGranularity.OneDay:
      return 1440; // 24 * 60
    case RAQIV2MetricGranularity.OneWeek:
      return 10080; // 7 * 24 * 60
    case RAQIV2MetricGranularity.OneMonth:
      return 43200; // 30 * 24 * 60
    case RAQIV2MetricGranularity.None:
      return 0;
    default: {
      const exhaustive: never = granularity;
      throw new Error(`Unhandled granularity ${exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const defaultExperienceAlertFormValues = (): ExperienceAlertFormValues => ({
  name: '',
  description: '',
  metric: null,
  operation: AlertConditionOperation.Gt,
  value: '',
  filters: [],
  breakdownDimension: null,
  breakdownCategories: [],
  timeGranularity: '',
  durationMinutes: '',
  severity: ExperienceAlertSeverity.Medium,
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export const getAlertEligibleMetrics = (): TRAQIV2NumericUIMetric[] =>
  (Object.keys(RAQIV2MetricDisplayConfig) as TRAQIV2Metric[])
    .filter(
      (m): m is TRAQIV2NumericUIMetric =>
        RAQIV2MetricDisplayConfig[m].isEligibleForAlerting === true && isNumericUIMetric(m),
    )
    .sort((a, b) => a.localeCompare(b));

export const uiAlertMetricToApiMetrics = (metric: TAlertConditionMetric): TRAQIV2APIMetric[] => {
  if (isValidEnumValue(RAQIV2Metric, metric)) {
    return [metric];
  }
  return [getAPIMetricFromUIMetric(metric, { percentileType: null, aggregationType: null })];
};

export const getConditionValueUnitDisplay = (
  metric: TAlertConditionMetric | null,
  translate: (key: TranslationKey) => string,
): string => {
  if (!metric) return '';
  const metricDisplayConfig = RAQIV2MetricDisplayConfig[metric];
  const { unit } = metricDisplayConfig;
  if (unit === RAQIV2MetricUnit.Percentage01 || unit === RAQIV2MetricUnit.Percentage0100) {
    return '%';
  }
  const suffixKey =
    metricDisplayConfig.suffix?.short ??
    MetricUnitDefaultSuffix[metricDisplayConfig.unit]?.defaultSuffix;
  return suffixKey ? translate(suffixKey) : '';
};

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export const isPseudoAlertDimension = (dimension: TRAQIV2Dimension): boolean =>
  isValidEnumValue(RAQIV2UIPseudoDimension, dimension);

const getAlertEligibleDimensionsForMetric = (metric: TAlertConditionMetric): TRAQIV2Dimension[] =>
  RAQIV2MetricToAlertingEligibleDimensions[metric] ?? [];

export const getAlertFilterDimensionsForMetric = (
  metric: TAlertConditionMetric,
): TRAQIV2Dimension[] =>
  getAlertEligibleDimensionsForMetric(metric).filter(
    (d) => getFilterBarDimensionForRAQIV2Dimension(d) != null,
  );

export const getAlertBreakdownDimensionsForMetric = (
  metric: TAlertConditionMetric,
): TRAQIV2Dimension[] =>
  getAlertEligibleDimensionsForMetric(metric).filter(
    (d) => isSupportedBreakdownDimension(d) && !isPseudoAlertDimension(d),
  );
