import {
  ChartResourceType,
  getCurrentDate,
  NumericChartSummaryItemSpec,
  filterNumericChartSummaryItemSpecs,
} from '@modules/charts-generic';
import { RAQIV2MetricGranularity, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  FetchComparisonSeriesMode,
  genericRAQIV2SeriesSummaryAdapter,
  makeRAQIV2Request,
  RAQIV2ChartSpec,
  type RAQIV2CombinedAPIClientWrapper,
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  RAQIV2QueryResponses,
  RAQIV2TranslationDependencies,
  TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared';
import { utils } from '@modules/miscellaneous/common';
import { subDays } from '@rbx/core';

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

const { dayToMs } = utils;

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

  const metrics: TRAQIV2NumericUIMetric[] = [
    RAQIV2Metric.DailyActiveUsers,
    RAQIV2Metric.D1Retention,
    RAQIV2Metric.AveragePlayTimeMinutesPerDAU,
    RAQIV2Metric.DailyRevenue,
  ];

  const specs: RAQIV2ChartSpec[] = metrics.map((metric) => ({
    resource: {
      type: ChartResourceType.Universe,
      id: universeId,
    },
    metric,
    timeSpec: {
      startTime: startDate,
      endTime: endDate,
    },
    // TODO: https://roblox.atlassian.net/browse/DSA-3817
    // use granularity 'None' once we can get comparison date from it
    granularity: RAQIV2MetricGranularity.OneDay,
    // The home page only shows summarized data so there's no relevant time axis to keep track of
    timeAxisBounds: null,
  }));

  try {
    const [dauResponse, d1RetentionResponse, playTimeResponse, revenueResponse] = await Promise.all(
      specs.reduce<Promise<RAQIV2QueryResponses>[]>((acc, spec) => {
        acc.push(
          makeRAQIV2Request(spec, client, {
            fetchTotalSeries: true,
            fetchComparison: {
              mode: FetchComparisonSeriesMode.Combined,
              seriesIntervalMeaning: RAQIV2MetricGranularityToSeriesIntervalMeaning(
                spec.granularity,
              ),
            },
            allowComputedMetrics: false,
          }),
        );
        return acc;
      }, []),
    );

    const dauSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: dauResponse,
        spec: specs.find((spec) => spec.metric === RAQIV2Metric.DailyActiveUsers)!,
        translationDependencies,
      }),
    );

    const d1RetentionSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: d1RetentionResponse,
        spec: specs.find((spec) => spec.metric === RAQIV2Metric.D1Retention)!,
        translationDependencies,
      }),
    );

    const playTimeSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: playTimeResponse,
        spec: specs.find((spec) => spec.metric === RAQIV2Metric.AveragePlayTimeMinutesPerDAU)!,
        translationDependencies,
      }),
    );

    const revenueSummary = filterNumericChartSummaryItemSpecs(
      genericRAQIV2SeriesSummaryAdapter({
        responses: revenueResponse,
        spec: specs.find((spec) => spec.metric === RAQIV2Metric.DailyRevenue)!,
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
