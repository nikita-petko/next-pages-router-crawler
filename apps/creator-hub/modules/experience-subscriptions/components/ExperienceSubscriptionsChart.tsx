import { useEffect, useCallback, useState, useMemo } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  RAQIResponse,
  validateResponse,
  getComparisonChipSpec,
  getComparisonTimeRange,
  getComparisonChipTooltip,
  XAxisGranularity,
  DailyTimeSeriesAlignedToUTCMidnight,
  useTimeSeriesChartTooltipFormatters,
  useXAxisFormatter,
  TimeSeriesChartExporter,
  useChartSummarySpecs,
  ChartResourceType,
  useDownloadAction,
  wrapNonRAQIMetricAsFormattedTextForExporter,
} from '@modules/charts-generic';
import { TranslationKey, useTranslationWrapper } from '@modules/analytics-translations';
import {
  useExperienceAnalyticsGameDetails,
  useOnSelectChartRegion,
  useUniverseResource,
  genericChartStateToChartAbnormalState,
  useCurrentAnnotationsBundleProvider,
  useTimeSeriesWebbloxAnnotations,
} from '@modules/experience-analytics-shared';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { Grid } from '@rbx/ui';

import {
  GetDeveloperSubscriptionsAnalyticsResponse,
  DeveloperSubscriptionsAnalyticsDimension,
} from '@rbx/clients/developerSubscriptionsApi';
import {
  ChartStyleMode,
  LineChart,
  ColumnChart,
  SingleChartCardContainer,
  SeriesDataTypes,
} from '@rbx/analytics-ui';
import experienceSubscriptionsChartAdapters from '../adapters/experienceSubscriptionsChartAdapters';
import { useExperienceSubscriptionsClientProvider } from '../context/ExperienceSubscriptionsClientProvider';
import {
  ExperienceSubscriptionsChartKey,
  ExperienceSubscriptionsChartSpec,
  ExperienceSubscriptionsChartType,
} from '../types/ExperienceSubscriptionsChartSpec';

const getChartTypeFromChartKey = (
  chartKey: ExperienceSubscriptionsChartKey,
): ExperienceSubscriptionsChartType => {
  switch (chartKey) {
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
      return ExperienceSubscriptionsChartType.Spline;
    case ExperienceSubscriptionsChartKey.SalesBySubscriptionType:
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return ExperienceSubscriptionsChartType.Stacked;
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unrecognized chartKey ${exhaustiveCheck}.`);
    }
  }
};

type ExperienceSubscriptionsChartProps = {
  spec: ExperienceSubscriptionsChartSpec;
  titleKey: TranslationKey;
  definitionTooltipKey?: TranslationKey;
};

function ExperienceSubscriptionsChart({
  spec,
  titleKey,
  definitionTooltipKey,
}: ExperienceSubscriptionsChartProps) {
  const { startDate, endDate, chartKey, productFilter } = spec;
  const [apiData, setApiData] =
    useState<RAQIResponse<DeveloperSubscriptionsAnalyticsDimension> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUserForbidden, setIsUserForbidden] = useState<boolean>(false);
  const [isResponseFailed, setIsResponseFailed] = useState<boolean>(false);
  const [comparisonData, setComparisonData] =
    useState<RAQIResponse<DeveloperSubscriptionsAnalyticsDimension> | null>(null);

  const { id: universeId } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());
  const { locale: nullableLocale } = useLocalization();
  const locale = nullableLocale ?? Locale.English;
  const { experienceSubscriptionsClient } = useExperienceSubscriptionsClientProvider();

  const getExperienceSubscriptionsAnalyticsForDateRange = useCallback(
    async (
      iStartDate: Date,
      iEndDate: Date,
    ): Promise<RAQIResponse<DeveloperSubscriptionsAnalyticsDimension> | null> => {
      if (universeId <= 0) {
        return null;
      }

      let response: GetDeveloperSubscriptionsAnalyticsResponse | null = null;
      try {
        setIsResponseFailed(false);
        setIsUserForbidden(false);
        response = await experienceSubscriptionsClient.getChartAnalytics(
          chartKey,
          iStartDate,
          iEndDate,
          universeId,
          productFilter,
        );
      } catch (e) {
        const err = e as { status?: number };
        const errorCode = err?.status ?? 500;
        setIsLoading(false);
        if (errorCode === HttpStatusCodes.FORBIDDEN) {
          setIsUserForbidden(true);
        }
        setIsResponseFailed(true);
        return null;
      }

      if (response) {
        return validateResponse(response, {
          dimensionEnum: DeveloperSubscriptionsAnalyticsDimension,
        });
      }

      return null;
    },
    [universeId, productFilter, chartKey, experienceSubscriptionsClient],
  );

  const setChartData = useCallback(async () => {
    const resData = await getExperienceSubscriptionsAnalyticsForDateRange(startDate, endDate);
    if (resData) {
      setApiData(resData);
      setIsLoading(false);
    }
  }, [startDate, endDate, getExperienceSubscriptionsAnalyticsForDateRange]);

  const { comparisonStartDate, comparisonEndDate } = useMemo(
    () => getComparisonTimeRange(startDate, endDate, DailyTimeSeriesAlignedToUTCMidnight),
    [startDate, endDate],
  );

  const setChartComparisonData = useCallback(async () => {
    const resData = await getExperienceSubscriptionsAnalyticsForDateRange(
      comparisonStartDate,
      comparisonEndDate,
    );
    if (resData) {
      setComparisonData(resData);
    }
  }, [comparisonStartDate, comparisonEndDate, getExperienceSubscriptionsAnalyticsForDateRange]);

  // TODO: Figure out if this is needed
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
    getExperienceSubscriptionsAnalyticsForDateRange,
    setChartData,
    setChartComparisonData,
  ]);

  const { chart, summary } = useMemo(() => {
    return experienceSubscriptionsChartAdapters(apiData, translate, locale, spec);
  }, [apiData, locale, spec, translate]);

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
    return experienceSubscriptionsChartAdapters(comparisonData, translate, locale, spec);
  }, [comparisonData, locale, spec, translate]);

  const comparison = useMemo(() => {
    return summary.map((current) => {
      const previous = comparisonSummary.find(
        (item) => item.specificLabel === current.specificLabel,
      );
      const isPositiveGood =
        chartKey !== ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType;
      return getComparisonChipSpec({
        isPositiveGood,
        current: current.value,
        previous: previous?.value ?? null,
        tooltip: comparisonChipTooltip,
        hasBackground: true,
      });
    });
  }, [summary, comparisonSummary, chartKey, comparisonChipTooltip]);
  const onSelectChartRegion = useOnSelectChartRegion();

  const gameDetails = useExperienceAnalyticsGameDetails();
  const { universeName } = gameDetails;

  const chartType = getChartTypeFromChartKey(chartKey);

  const xAxisFormatter = useXAxisFormatter(
    locale,
    DailyTimeSeriesAlignedToUTCMidnight,
    XAxisGranularity.Day,
    ChartStyleMode.Normal,
  );

  const { timeSeriesAnnotations } = useCurrentAnnotationsBundleProvider(ChartResourceType.Universe);
  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? [],
    timeAxisSpec: spec,
  });

  const xAxisType = useMemo(
    () => ({
      type: 'datetime' as const,
      granularity: XAxisGranularity.Day,
    }),
    [],
  );

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning: DailyTimeSeriesAlignedToUTCMidnight,
    series: chart.series,
    timeAxisSpec: { startDate: spec.startDate, endDate: spec.endDate },
  });

  const dataForColumnChart = useMemo(() => {
    return {
      series: chart.series.map(({ name, dataPoints }) => ({
        name,
        dataPoints,
        type: SeriesDataTypes.Normal as const,
      })),
    };
  }, [chart.series]);

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      wrapNonRAQIMetricAsFormattedTextForExporter(chartType),
      chart,
      translate,
      universeName,
    );
  }, [chart, chartType, translate, universeName]);

  const downloadAction = useDownloadAction({
    kpiType: chartType,
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

  const updatedSummaries = useMemo(
    () =>
      summary.map((item, i) => {
        const comparisonItem = comparison[i];
        if (comparisonItem === null || comparisonItem === undefined) {
          return item;
        }
        return {
          ...item,
          comparisonChipSpec: comparisonItem,
        };
      }),
    [comparison, summary],
  );
  const chartSummarySpecs = useChartSummarySpecs(updatedSummaries);
  const chartComponent = useMemo(() => {
    switch (chartType) {
      case ExperienceSubscriptionsChartType.Spline:
        return (
          <LineChart
            data={chart}
            {...tooltipFormatters}
            xAxisFormatter={xAxisFormatter}
            xAxisType={xAxisType}
            onSelectChartRegion={onSelectChartRegion ?? undefined}
            annotations={annotations}
          />
        );
      case ExperienceSubscriptionsChartType.Stacked:
        return (
          <ColumnChart
            data={dataForColumnChart}
            {...tooltipFormatters}
            xAxisFormatter={xAxisFormatter}
            xAxisType={xAxisType}
            onSelectChartRegion={onSelectChartRegion ?? undefined}
            annotations={annotations}
          />
        );
      default: {
        const exhaustiveCheck: never = chartType;
        throw new Error(`Unrecognized chartType ${exhaustiveCheck}.`);
      }
    }
  }, [
    annotations,
    chart,
    chartType,
    dataForColumnChart,
    onSelectChartRegion,
    tooltipFormatters,
    xAxisFormatter,
    xAxisType,
  ]);

  return (
    <Grid item XSmall={12}>
      <SingleChartCardContainer
        titleLabel={translate(titleKey)}
        titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
        chartSummarySpecs={chartSummarySpecs}
        downloadAction={downloadAction}
        abnormalState={abnormalState}>
        {chartComponent}
      </SingleChartCardContainer>
    </Grid>
  );
}

export default ExperienceSubscriptionsChart;
