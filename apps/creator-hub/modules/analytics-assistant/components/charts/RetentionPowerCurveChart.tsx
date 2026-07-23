import React, { FC, useMemo } from 'react';
import {
  ChartResourceType,
  DurationBucket,
  DurationSeriesDataPoint,
  DurationBucketType,
  makeDurationFormatter,
  NumberContext,
  useTimeSeriesChartYAxisConfig,
} from '@modules/charts-generic';
import { RAQIV2FilterOperation } from '@modules/clients/analytics';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import {
  useRAQIV2Request,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
  MakeRAQIV2RequestOptions,
  formatAnalyticsNumber,
  genericChartStateToChartAbnormalState,
  genericRAQIV2DurationChartAdapter,
  buildChartUnitOptions,
  TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared';
import {
  ChartStyleMode,
  LineChart,
  SingleChartCardContainer,
  SeriesDataTypes,
  ChartColor,
} from '@rbx/analytics-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import {
  ValidatedRetentionPowerCurveCurveData,
  ValidatedRetentionPowerCurveData,
} from '../../validation/makeValidatedInsightsV2API';

export type RetentionPowerCurveChartProps = {
  startDate: Date;
  endDate: Date;
  universeCurve: ValidatedRetentionPowerCurveCurveData;
  benchmarkCurve: ValidatedRetentionPowerCurveCurveData;
  chartHeight?: number;
  chartStyleMode?: ChartStyleMode;
};

const xAxisType = {
  type: 'linear',
} as const;

// Generate power curve data points using the formula R(d) = c * d^(γ)
const generatePowerCurveData = (
  curve: ValidatedRetentionPowerCurveData['universeCurve'],
  startDay: number,
  endDay: number,
): DurationSeriesDataPoint[] => {
  const dataPoints: DurationSeriesDataPoint[] = [];
  const { coefficient, exponent } = curve;

  for (let day = startDay; day <= endDay; day += 1) {
    if (day > 0) {
      const retention = coefficient * day ** exponent;
      dataPoints.push([day as DurationBucket, retention]);
    }
  }

  return dataPoints;
};

const RetentionPowerCurveChart: FC<RetentionPowerCurveChartProps> = ({
  startDate,
  endDate,
  universeCurve,
  benchmarkCurve,
  chartHeight = 400,
  chartStyleMode = ChartStyleMode.Normal,
}) => {
  const { id: universeId } = useUniverseResource();
  const translationDependencies = useRAQIV2TranslationDependencies();

  // Calculate the day range for generating power curve data
  const { startDay, endDay } = useMemo(() => {
    const timeDiffMs = endDate.getTime() - startDate.getTime();
    const period = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)) + 1;
    return { startDay: 1, endDay: Math.min(period, 28) };
  }, [startDate, endDate]);

  const chartSpec = useMemo(() => {
    return {
      resource: {
        id: universeId,
        type: ChartResourceType.Universe,
      },
      timeSpec: {
        startTime: startDate,
        endTime: endDate,
      },
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [RAQIV2Dimension.CohortDay],
      metric: RAQIV2Metric.DailyRetentionCohortNoDim as TRAQIV2NumericUIMetric,
      filter: [
        {
          dimension: RAQIV2Dimension.CohortDay,
          operation: RAQIV2FilterOperation.Lte,
          values: [endDay.toString()],
        },
      ],
      timeAxisBounds: null,
    };
  }, [universeId, startDate, endDate, endDay]);

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: true,
      fetchComparison: undefined,
    }),
    [],
  );

  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    error,
  } = useRAQIV2Request(chartSpec, RAQIV2RequestOptions);

  // Use the generic adapter to process RAQIV2 data
  const { chart: durationChart } = useMemo(() => {
    if (!raqiData) {
      return { chart: null };
    }

    return genericRAQIV2DurationChartAdapter({
      responses: raqiData,
      durationBucketDimension: RAQIV2Dimension.CohortDay,
      spec: chartSpec,
      translationDependencies,
      showComparisonInChart: false,
      showComparisonChip: false,
    });
  }, [raqiData, chartSpec, translationDependencies]);

  // Extract scatter data from the adapter's processed series
  const scatterData = useMemo(() => {
    if (!durationChart?.series) return [];

    // Find the main series (should be the only one from RAQIV2)
    const mainSeries = durationChart.series.find(
      (series: { type: SeriesDataTypes }) =>
        series.type === SeriesDataTypes.Total || series.type === SeriesDataTypes.Normal,
    );

    if (!mainSeries?.dataPoints) return [];

    // Convert DurationSeriesDataPoint to LineChart format
    return mainSeries.dataPoints.map(
      ([x, y]: DurationSeriesDataPoint) => [x, y] as [number, number | null],
    );
  }, [durationChart]);

  // Generate universe and benchmark curve data
  const { universeCurveData, benchmarkCurveData } = useMemo(() => {
    if (!universeCurve || !benchmarkCurve) {
      return { universeCurveData: [], benchmarkCurveData: [] };
    }

    const universeCurveDataPoints = generatePowerCurveData(universeCurve, startDay, endDay);

    const benchmarkCurveDataPoints = generatePowerCurveData(benchmarkCurve, startDay, endDay);

    return {
      universeCurveData: universeCurveDataPoints.map(([x, y]) => [x, y] as [number, number | null]),
      benchmarkCurveData: benchmarkCurveDataPoints.map(
        ([x, y]) => [x, y] as [number, number | null],
      ),
    };
  }, [universeCurve, benchmarkCurve, startDay, endDay]);

  // Convert data to LineChart format
  const convertedData = useMemo(() => {
    const series = [];

    // Add main scatter plot series
    if (scatterData.length > 0) {
      series.push({
        name: translationDependencies.translate(
          translationKey('Label.ActualRetention', TranslationNamespace.Analytics),
        ),
        type: SeriesDataTypes.Scatter,
        dataPoints: scatterData,
      });
    }

    if (universeCurveData.length > 0) {
      series.push({
        name: translationDependencies.translate(
          translationKey('Label.UniversePowerCurve', TranslationNamespace.Analytics),
        ),
        type: SeriesDataTypes.Normal,
        dataPoints: universeCurveData,
        showMarker: false,
        color: ChartColor.Purple2,
      });
    }

    if (benchmarkCurveData.length > 0) {
      series.push({
        name: translationDependencies.translate(
          translationKey('Label.BenchmarkPowerCurve', TranslationNamespace.Analytics),
        ),
        type: SeriesDataTypes.Benchmark,
        dataPoints: benchmarkCurveData,
        showMarker: false,
      });
    }

    return { series };
  }, [scatterData, universeCurveData, benchmarkCurveData, translationDependencies]);

  const xAxisFormatter = useMemo(() => {
    return makeDurationFormatter(DurationBucketType.CohortDay, translationDependencies);
  }, [translationDependencies]);

  // Use unit spec from the adapter or fallback to building it manually
  const unitSpec =
    durationChart?.unit ||
    buildChartUnitOptions(
      { metric: RAQIV2Metric.DailyRetentionCohortNoDim, filter: [] },
      translationDependencies,
    );
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec,
  });
  const yAxisConfigs = useMemo(() => [yAxisConfig], [yAxisConfig]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => seriesName,
      formatSeriesValueForPoint: ({ y }: { y: number }) =>
        formatAnalyticsNumber(
          y,
          {
            metric: RAQIV2Metric.DailyRetentionCohortNoDim,
            context: NumberContext.DataPoint,
          },
          translationDependencies,
        ),
      formatXForPoint: (x: string | number) =>
        makeDurationFormatter(DurationBucketType.CohortDay, translationDependencies)({ value: x }),
    };
  }, [translationDependencies]);

  const abnormalState = useMemo(() => {
    return genericChartStateToChartAbnormalState({
      state: {
        isDataLoading,
        isResponseFailed,
        isUserForbidden,
        error,
      },
      hasNoData: false,
      translate: translationDependencies.translate,
    });
  }, [isDataLoading, isResponseFailed, isUserForbidden, error, translationDependencies.translate]);

  const chartComponent = useMemo(
    () => (
      <LineChart
        data={convertedData}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfigs={yAxisConfigs}
        tooltipFormatters={tooltipFormatters}
        height={chartHeight}
      />
    ),
    [convertedData, chartStyleMode, xAxisFormatter, yAxisConfigs, tooltipFormatters, chartHeight],
  );

  return (
    <Grid item XSmall={12}>
      <SingleChartCardContainer
        titleLabel={translationDependencies.translate(
          translationKey('Heading.RetentionPowerCurve', TranslationNamespace.Analytics),
        )}
        titleTooltipLabel={translationDependencies.translate(
          translationKey('Description.RetentionPowerCurve', TranslationNamespace.Analytics),
        )}
        abnormalState={abnormalState}
        chartSummarySpecs={[]}>
        {chartComponent}
      </SingleChartCardContainer>
    </Grid>
  );
};

export default RetentionPowerCurveChart;
