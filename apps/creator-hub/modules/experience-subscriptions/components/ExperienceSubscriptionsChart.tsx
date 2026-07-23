import { useEffect, useCallback, useState, useMemo } from 'react';
import {
  ChartStyleMode,
  LineChart,
  ColumnChart,
  SingleChartCardContainer,
  SeriesDataTypes,
} from '@rbx/analytics-ui';
import type { GetDeveloperSubscriptionsAnalyticsResponse } from '@rbx/client-developer-subscriptions-api/v1';
import { DeveloperSubscriptionsAnalyticsDimension } from '@rbx/client-developer-subscriptions-api/v1';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { wrapNonRAQIMetricAsFormattedTextForExporter } from '@modules/charts-generic/charts/exporters/GenericChartExporter';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import useTimeSeriesChartTooltipFormatters from '@modules/charts-generic/charts/hooks/useTimeSeriesChartTooltipFormatters';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import XAxisGranularity from '@modules/charts-generic/enums/XAxisGranularity';
import { validateResponse } from '@modules/charts-generic/types/RAQIValidator';
import {
  getComparisonChipSpec,
  getComparisonTimeRange,
  getComparisonChipTooltip,
} from '@modules/charts-generic/utils/comparisonChipUtils';
import type { RAQIResponse } from '@modules/clients/analytics';
import genericChartStateToChartAbnormalState from '@modules/experience-analytics-shared/components/RAQIV2/genericChartStateToChartAbnormalState';
import { useExperienceAnalyticsGameDetails } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsGameDetailsProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useCurrentAnnotationsBundleProvider from '@modules/experience-analytics-shared/hooks/useCurrentAnnotationsBundleProvider';
import useOnSelectChartRegion from '@modules/experience-analytics-shared/hooks/useOnSelectChartRegion';
import useTimeSeriesWebbloxAnnotations from '@modules/experience-analytics-shared/hooks/useTimeSeriesWebbloxAnnotations';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import experienceSubscriptionsChartAdapters from '../adapters/experienceSubscriptionsChartAdapters';
import { useExperienceSubscriptionsClientProvider } from '../context/ExperienceSubscriptionsClientProvider';
import type { ExperienceSubscriptionsChartSpec } from '../types/ExperienceSubscriptionsChartSpec';
import {
  ExperienceSubscriptionsChartKey,
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        const err = e as { status?: number };
        const errorCode = err?.status ?? 500;
        setIsLoading(false);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
    setApiData(null);
    setIsLoading(true);
    const resData = await getExperienceSubscriptionsAnalyticsForDateRange(startDate, endDate);
    if (resData) {
      setApiData(resData);
      setIsLoading(false);
    }
  }, [startDate, endDate, getExperienceSubscriptionsAnalyticsForDateRange]);

  const { comparisonStartDate, comparisonEndDate } = useMemo(
    () => getComparisonTimeRange(startDate, endDate, RAQIV2MetricGranularity.OneDay),
    [startDate, endDate],
  );

  const setChartComparisonData = useCallback(async () => {
    setComparisonData(null);
    const resData = await getExperienceSubscriptionsAnalyticsForDateRange(
      comparisonStartDate,
      comparisonEndDate,
    );
    if (resData) {
      setComparisonData(resData);
    }
  }, [comparisonStartDate, comparisonEndDate, getExperienceSubscriptionsAnalyticsForDateRange]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- chart data is refetched when date/universe inputs change
    void setChartData();
    void setChartComparisonData();
  }, [setChartData, setChartComparisonData]);

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
    RAQIV2MetricGranularity.OneDay,
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
    granularity: RAQIV2MetricGranularity.OneDay,
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
        },
        hasNoData: !isLoading && exporter.hasEmptyData,
        translate,
        tPendingTranslation,
      }),
    [
      isLoading,
      isUserForbidden,
      isResponseFailed,
      exporter.hasEmptyData,
      translate,
      tPendingTranslation,
    ],
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
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
