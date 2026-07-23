import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Locale, useLocalization } from '@rbx/intl';
import { HttpStatusCodes } from '@modules/miscellaneous/common';

import {
  ChartFooter,
  getComparisonChipSpec,
  getComparisonChipTooltip,
  getComparisonTimeRange,
  getXAxisGranularity,
  RAQIResponse,
  SeriesIntervalMeaning,
  validateResponse,
  TimeSeriesChartExporter,
  useTimeSeriesChartTooltipFormatters,
  useXAxisFormatter,
  useChartSummarySpecs,
  useDownloadAction,
  wrapNonRAQIMetricAsFormattedTextForExporter,
} from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { TranslationKey } from '@modules/analytics-translations';
import {
  ChartStyleMode,
  LineChart,
  SelectionCallback,
  SingleChartCardContainer,
} from '@rbx/analytics-ui';
import {
  ErrorLoggingDimension,
  ErrorLoggingMetric,
  PerformanceAPIGranularity,
  QueryResponse,
  UniversePerformanceDimension,
} from '@modules/clients/analytics/universePerformanceRaqi';
import {
  useExperienceAnalyticsCurrentAnnotationsBundle,
  useExperienceAnalyticsGameDetails,
  useRAQIV2TranslationDependencies,
  useUniversePerformanceRaqiClientProvider,
  useUniverseResource,
  genericChartStateToChartAbnormalState,
  useTimeSeriesWebbloxAnnotations,
} from '@modules/experience-analytics-shared';

import { getResponseFromError } from '@modules/clients/utils';
import { Grid } from '@rbx/ui';

import {
  ErrorReportChartSpec,
  ErrorReportSupportedGranularities,
} from '../types/ErrorReportChartSpec';
import errorReportChartAdapters from '../adapters/errorReportChartAdapters';

type PerformanceChartProps = {
  spec: ErrorReportChartSpec;
  titleKey: TranslationKey;
  definitionTooltipKey?: TranslationKey;
  onSelectChartRegion: null | SelectionCallback<number>;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};

const pageGranularityToPerformanceAPIGranularity: Record<
  ErrorReportSupportedGranularities,
  PerformanceAPIGranularity
> = {
  [RAQIV2MetricGranularity.OneDay]: PerformanceAPIGranularity.Daily,
  [RAQIV2MetricGranularity.OneHour]: PerformanceAPIGranularity.Hourly,
  [RAQIV2MetricGranularity.HalfHour]: PerformanceAPIGranularity.ThirtyMinutely,
  [RAQIV2MetricGranularity.OneMinute]: PerformanceAPIGranularity.Minutely,
};

const ErrorReportChart: FC<PerformanceChartProps> = ({
  spec,
  titleKey,
  definitionTooltipKey,
  onSelectChartRegion,
  seriesIntervalMeaning,
}) => {
  const {
    startDate,
    endDate,
    placeId,
    placeVersionFilter,
    textFilter,
    logSeverityFilter,
    logSourceFilter,
    granularity,
  } = spec;
  const [apiData, setApiData] = useState<RAQIResponse<UniversePerformanceDimension> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUserForbidden, setIsUserForbidden] = useState<boolean>(false);
  const [isResponseFailed, setIsResponseFailed] = useState<boolean>(false);
  const [comparisonData, setComparisonData] =
    useState<RAQIResponse<UniversePerformanceDimension> | null>(null);

  const { id: universeId } = useUniverseResource();
  const { translate } = useRAQIV2TranslationDependencies();
  const { locale: nullableLocale } = useLocalization();
  const locale = nullableLocale ?? Locale.English;
  const { universePerformanceRaqiClient } = useUniversePerformanceRaqiClientProvider();
  const gameDetails = useExperienceAnalyticsGameDetails();
  const { universeName } = gameDetails;

  const xAxisGranularity = useMemo(() => {
    return getXAxisGranularity(startDate, endDate);
  }, [startDate, endDate]);

  const { comparisonStartDate, comparisonEndDate } = useMemo(
    () => getComparisonTimeRange(startDate, endDate, seriesIntervalMeaning),
    [startDate, endDate, seriesIntervalMeaning],
  );

  const { timeSeriesAnnotations } = useExperienceAnalyticsCurrentAnnotationsBundle();

  const fetchGetPerformanceMetricsForDate = useCallback(
    async (
      iStartDate: Date,
      iEndDate: Date,
    ): Promise<RAQIResponse<UniversePerformanceDimension> | null> => {
      let response: QueryResponse | null = null;
      const raqiBaseArgs = {
        startDate: iStartDate,
        endDate: iEndDate,
        universeId,
        placeId,
        granularity: pageGranularityToPerformanceAPIGranularity[granularity],
      };
      if (universeId <= 0) {
        return null;
      }
      try {
        setIsResponseFailed(false);
        setIsUserForbidden(false);
        const errorReportArgs = {
          ...raqiBaseArgs,
          textFilter,
          placeVersionFilter,
          logSeverityFilter,
          logSourceFilter,
        };
        const [byPlatformResponse, totalResponse] = await Promise.all([
          universePerformanceRaqiClient.getErrorMetricsBySource(errorReportArgs),
          universePerformanceRaqiClient.getErrorMetricsTotal(errorReportArgs),
        ]);
        response = {
          values: [...(totalResponse.values || []), ...(byPlatformResponse.values || [])],
        };
      } catch (e) {
        const err = getResponseFromError(e);
        const errorCode = err?.status ?? 500;
        setIsLoading(false);
        if (errorCode === HttpStatusCodes.FORBIDDEN) {
          setIsUserForbidden(true);
        }
        setIsResponseFailed(true);
        return null;
      }

      return validateResponse(response, { dimensionEnum: ErrorLoggingDimension });
    },
    [
      universeId,
      placeId,
      granularity,
      textFilter,
      placeVersionFilter,
      logSeverityFilter,
      logSourceFilter,
      universePerformanceRaqiClient,
    ],
  );

  const setChartData = useCallback(async () => {
    const resData = await fetchGetPerformanceMetricsForDate(startDate, endDate);
    if (resData) {
      setApiData(resData);
      setIsLoading(false);
    }
  }, [startDate, endDate, fetchGetPerformanceMetricsForDate]);

  const setChartComparisonData = useCallback(async () => {
    const resData = await fetchGetPerformanceMetricsForDate(comparisonStartDate, comparisonEndDate);
    if (resData) {
      setComparisonData(resData);
    }
  }, [comparisonStartDate, comparisonEndDate, fetchGetPerformanceMetricsForDate]);

  useEffect(() => {
    setApiData(null);
    setComparisonData(null);
    setIsLoading(true);
    setChartData();
    setChartComparisonData();
  }, [
    startDate,
    endDate,
    universeId,
    fetchGetPerformanceMetricsForDate,
    setChartData,
    setChartComparisonData,
  ]);

  const { chart, summary } = useMemo(() => {
    return errorReportChartAdapters({
      response: apiData,
      translate,
      locale,
      spec,
      seriesIntervalMeaning,
    });
  }, [apiData, locale, seriesIntervalMeaning, spec, translate]);

  const comparisonChipTooltip = useMemo(
    () =>
      getComparisonChipTooltip({
        translate,
        startDate,
        endDate,
        comparisonStartDate,
        comparisonEndDate,
      }),
    [comparisonEndDate, comparisonStartDate, endDate, startDate, translate],
  );

  const { summary: comparisonSummary } = useMemo(() => {
    return errorReportChartAdapters({
      response: comparisonData,
      translate,
      locale,
      spec,
      seriesIntervalMeaning,
    });
  }, [comparisonData, locale, seriesIntervalMeaning, spec, translate]);

  const comparison = useMemo(() => {
    return summary.map((current, i) => {
      const previous = comparisonSummary[i];
      const isPositiveGood = false;
      return getComparisonChipSpec({
        isPositiveGood,
        current: current.value,
        previous: previous?.value,
        tooltip: comparisonChipTooltip,
        hasBackground: true,
      });
    });
  }, [summary, comparisonSummary, comparisonChipTooltip]);

  const chartWarnings = useMemo(() => [], []);

  const metric = ErrorLoggingMetric.TotalLogCount;

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    ChartStyleMode.Normal,
  );

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? [],
    timeAxisSpec: spec,
  });

  const timeAxisSpec = useMemo(
    () => ({ startDate: spec.startDate, endDate: new Date(Math.max(...chart.timestamps)) }),
    [spec.startDate, chart.timestamps],
  );

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning,
    series: chart.series,
    timeAxisSpec,
  });

  const xAxisType = useMemo(
    () => ({
      type: 'datetime' as const,
      granularity: xAxisGranularity,
    }),
    [xAxisGranularity],
  );

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      wrapNonRAQIMetricAsFormattedTextForExporter(metric),
      chart,
      translate,
      universeName,
    );
  }, [chart, metric, translate, universeName]);

  const downloadAction = useDownloadAction({
    kpiType: metric,
    exporter,
  });

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: {
          isDataLoading: isLoading,
          isUserForbidden,
          isResponseFailed,
          isNoDataAvailable: exporter.hasEmptyData,
        },
        translate,
      }),
    [isLoading, isUserForbidden, isResponseFailed, exporter.hasEmptyData, translate],
  );

  const chartSummarySpecs = useChartSummarySpecs(
    summary.map((item, i) => ({
      ...item,
      comparisonChipSpec: comparison[i],
    })),
  );

  return (
    <Grid item XSmall={12}>
      <SingleChartCardContainer
        titleLabel={translate(titleKey)}
        titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
        chartSummarySpecs={chartSummarySpecs}
        downloadAction={downloadAction}
        footerContent={chartWarnings.length ? <ChartFooter warnings={chartWarnings} /> : undefined}
        abnormalState={abnormalState}>
        <LineChart
          data={chart}
          {...tooltipFormatters}
          xAxisFormatter={xAxisFormatter}
          xAxisType={xAxisType}
          onSelectChartRegion={onSelectChartRegion ?? undefined}
          annotations={annotations}
        />
      </SingleChartCardContainer>
    </Grid>
  );
};

export default ErrorReportChart;
