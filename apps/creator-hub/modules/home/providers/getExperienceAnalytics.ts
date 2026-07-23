import { subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import type { NumericChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import { filterNumericChartSummaryItemSpecs } from '@modules/charts-generic/charts/ChartSummaryItem';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import genericRAQIV2SeriesSummaryAdapter from '@modules/experience-analytics-shared/adapters/genericRAQIV2SeriesSummaryAdapter';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared/types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import makeRAQIV2Request, {
  FetchComparisonSeriesMode,
  type RAQIV2CombinedAPIClientWrapper,
} from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { dayToMs } from '@modules/miscellaneous/utils';

export type TExperienceMetricAnalytics = {
  oldValue: number;
  newValue: number;
};
export type TExperienceAnalytics = {
  dailyActiveUser?: TExperienceMetricAnalytics;
  d1Retention?: TExperienceMetricAnalytics;
  robux?: TExperienceMetricAnalytics;
  playtime?: TExperienceMetricAnalytics;
};
export type TExperienceAnalyticsResult = {
  data: TExperienceAnalytics | null;
  hasAnalyticsPermission: boolean;
};

/**
 * Calculate the date range for analytics based on the window size.
 * Returns both the current period and the comparison period (previous period of same length).
 */
export const getAnalyticsDateRange = (numDays: number) => {
  const endDate = getCurrentDate();
  endDate.setTime(endDate.getTime() - dayToMs(1));
  const startDate = subDays(endDate, numDays);
  // Comparison period is the previous period of the same length
  const comparisonEndDate = subDays(startDate, 1);
  const comparisonStartDate = subDays(comparisonEndDate, numDays);

  return {
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
  };
};

const adaptSummaryToExperienceMetricAnalytics = (
  summary: NumericChartSummaryItemSpec | undefined,
): TExperienceMetricAnalytics | undefined => {
  // Handle case where summary is undefined (no data available yet) - return undefined to show "--"
  if (!summary) {
    return undefined;
  }

  const { value, comparisonChipSpec } = summary;
  const percentage = comparisonChipSpec?.percentage;

  if (!percentage) {
    return {
      oldValue: value,
      newValue: value,
    };
  }

  // calculate oldValue using percentage from newValue
  const { isUp } = comparisonChipSpec; // newValue > oldValue
  const oldValue = isUp ? value / (1 + percentage) : value / (1 - percentage);

  return {
    oldValue,
    newValue: value,
  };
};

export const getRAQIV2ExperienceAnalytics = async (
  universeId: number,
  numDays: number,
  client: RAQIV2CombinedAPIClientWrapper,
  translationDependencies: RAQIV2TranslationDependencies,
): Promise<TExperienceAnalyticsResult> => {
  const { startDate, endDate } = getAnalyticsDateRange(numDays);

  const makeSpec = (metric: TRAQIV2NumericUIMetric): RAQIV2ChartSpec => ({
    resource: {
      type: ChartResourceType.Universe,
      id: universeId,
    },
    metric,
    timeSpec: {
      rangeType: RAQIV2DateRangeType.Custom,
      startTime: startDate,
      endTime: endDate,
    },
    // TODO: https://roblox.atlassian.net/browse/DSA-3817
    // use granularity 'None' once we can get comparison date from it
    granularity: RAQIV2MetricGranularity.OneDay,
    // The home page only shows summarized data so there's no relevant time axis to keep track of
    timeAxisBounds: null,
  });
  const dauSpec = makeSpec(RAQIV2Metric.DailyActiveUsers);
  const d1RetentionSpec = makeSpec(RAQIV2Metric.D1Retention);
  const playTimeSpec = makeSpec(RAQIV2Metric.AveragePlayTimeMinutesPerDAU);
  const revenueSpec = makeSpec(RAQIV2Metric.DailyRevenue);
  const specs = [dauSpec, d1RetentionSpec, playTimeSpec, revenueSpec];

  try {
    const [dauResponse, d1RetentionResponse, playTimeResponse, revenueResponse] = await Promise.all(
      specs.reduce<Promise<RAQIV2QueryResponses>[]>((acc, spec) => {
        acc.push(
          makeRAQIV2Request(spec, client, {
            fetchTotalSeries: true,
            fetchComparison: {
              mode: FetchComparisonSeriesMode.Combined,
              granularity: spec.granularity,
            },
          }),
        );
        return acc;
      }, []),
    );

    const dauSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: dauResponse,
        spec: dauSpec,
        translationDependencies,
      }),
    );

    const d1RetentionSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: d1RetentionResponse,
        spec: d1RetentionSpec,
        translationDependencies,
      }),
    );

    const playTimeSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: playTimeResponse,
        spec: playTimeSpec,
        translationDependencies,
      }),
    );

    const revenueSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: revenueResponse,
        spec: revenueSpec,
        translationDependencies,
      }),
    );

    return {
      data: {
        dailyActiveUser: adaptSummaryToExperienceMetricAnalytics(dauSummary[0]),
        d1Retention: adaptSummaryToExperienceMetricAnalytics(d1RetentionSummary[0]),
        playtime: adaptSummaryToExperienceMetricAnalytics(playTimeSummary[0]),
        robux: adaptSummaryToExperienceMetricAnalytics(revenueSummary[0]),
      },
      hasAnalyticsPermission: true,
    };
  } catch {
    return {
      data: null,
      hasAnalyticsPermission: false,
    };
  }
};
