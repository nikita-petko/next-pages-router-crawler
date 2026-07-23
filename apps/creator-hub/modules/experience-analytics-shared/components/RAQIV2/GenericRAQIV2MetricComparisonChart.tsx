import React, { FC, useCallback, useMemo } from 'react';
import {
  ChartFooter,
  ChartUnit,
  DailyTimeSeriesAlignedToUTCMidnight,
  Timestamp,
  Value,
  formatChartUnit,
  formatTimestampForChartTooltip,
  isNonEmptyArray,
  useLocale,
  useXAxisFormatter,
} from '@modules/charts-generic';
import {
  ChartStyleMode,
  LineChart,
  SingleChartCardContainer,
  SingleLineSeries,
  YAxisConfig,
} from '@rbx/analytics-ui';
import { AnnotationType } from '@modules/clients/analytics';
import { numberFormatter } from '@rbx/core';
import getEmptyArray from '../../emptyArray';
import { GenericRAQIV2MultiMetricChartProps } from '../../types/GenericRAQIV2ChartProps';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import { noSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import useMappedApiRequest from '../../hooks/useMappedApiRequest';
import { isLoadingRAQIV2Prerequisites } from '../../utils/RAQIV2InternalException';
import makeRAQIV2Request from '../../utils/makeRAQIV2Request';
import { useRAQIV2Client } from '../../context/RAQIV2ClientProvider';
import singleToMappedRequest from '../../hooks/singleToMappedRequest';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '../../constants/AnalyticsMetricDisplayConfig';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';

/**
 * This Chart is for comparing the trends of two metrics only, not supporting breakdowns, benchmarks, or summaries.
 */
const GenericRAQIV2MetricComparisonChart: FC<GenericRAQIV2MultiMetricChartProps> = ({
  spec,
  titleKey,
  definitionTooltipKey,
  footerProps,
  onSelectChartRegion,
  chartControl,
  chartWarnings,
  ignoreCache,
  chartStyleMode = ChartStyleMode.Normal,
  displayOptions,
  renderWithoutPeripherals,
  chartBanner,
}) => {
  const locale = useLocale();
  const { resource, granularity, timeSpec, metricSpec } = spec;
  const hideTotalSeriesInChart = displayOptions?.hideTotalSeriesInChart ?? false;
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const seriesIntervalMeaning = granularity
    ? RAQIV2MetricGranularityToSeriesIntervalMeaning(granularity)
    : DailyTimeSeriesAlignedToUTCMidnight;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();

  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(resource.type);

  const { client } = useRAQIV2Client(ignoreCache ?? false);

  const makeRAQIRequestForSingleMetric = useCallback(
    async (metric: TRAQIV2NumericUIMetric) => {
      const currentMetricSpec = metricSpec.find((m) => m.metric === metric);
      if (!currentMetricSpec || isLoadingRAQIV2Prerequisites(resource)) {
        return null;
      }
      return makeRAQIV2Request(
        {
          resource,
          timeSpec,
          granularity,
          metric: currentMetricSpec.metric,
          filter: currentMetricSpec.filter,
        },
        client,
        {
          // metricSpec only accepts atomic TRAQIV2NumericUIMetric values
          allowComputedMetrics: false,
        },
      );
    },
    [client, granularity, metricSpec, resource, timeSpec],
  );

  const makeMappedRequest = useMemo(
    () => singleToMappedRequest(makeRAQIRequestForSingleMetric),
    [makeRAQIRequestForSingleMetric],
  );
  const metrics = useMemo(() => metricSpec.map((mSpec) => mSpec.metric), [metricSpec]);

  const timeSeriesAnnotations = useMemo(() => {
    if (!isNonEmptyArray(metrics)) {
      return [];
    }
    return getCurrentSupportedAnnotations(metrics, (annotationType) =>
      annotationType === AnnotationType.Benchmark ? false : undefined,
    );
  }, [getCurrentSupportedAnnotations, metrics]);

  const {
    data: raqiResponses,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
    isNoDataAvailable,
  } = useMappedApiRequest(metrics, makeMappedRequest);

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: { isDataLoading, isUserForbidden, isResponseFailed, isNoDataAvailable },
        translate: translationDependencies.translate,
      }),
    [isDataLoading, isNoDataAvailable, isResponseFailed, isUserForbidden, translationDependencies],
  );
  const charts = useMemo(() => {
    return metricSpec.map((m) => {
      const currentSpec = { ...spec, metric: m.metric, filter: m.filter };
      const {
        chart: { series, ...others },
      } = genericRAQIV2TimeSeriesSplineChartAdapter({
        responses: raqiResponses.get(m.metric) ?? { response: null },
        spec: currentSpec,
        translationDependencies,
        seriesIntervalMeaning,
        summarySpec: noSummarySpec,
        hideTotalSeriesInChart,
        numberContextMetadata: { chartSpec: currentSpec },
      });

      const seriesWithMetricNames = series.map((s) => {
        return {
          ...s,
          name: translate(getAnalyticsMetricDisplayConfig(m.metric).localizedName),
        };
      });

      return { series: seriesWithMetricNames, ...others };
    });
  }, [
    hideTotalSeriesInChart,
    metricSpec,
    raqiResponses,
    seriesIntervalMeaning,
    spec,
    translate,
    translationDependencies,
  ]);

  const footer = useMemo(
    () => <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />,
    [chartWarnings, footerProps],
  );

  const { dataForLineChart, seriesIdToSeriesValueFormatters, yAxisConfigs } = useMemo((): {
    dataForLineChart: { series: Array<SingleLineSeries<Timestamp, Value>> };
    seriesIdToSeriesValueFormatters: Map<string, ({ y }: { y: number }) => string>;
    yAxisConfigs: YAxisConfig[];
  } => {
    const results: Array<SingleLineSeries<Timestamp, Value>> = [];

    const valueFormatters = new Map<string, ({ y }: { y: number }) => string>();
    const configs: YAxisConfig[] = [];

    charts.forEach(({ series: givenSeriesData, unit }, specIndex) => {
      const yAxisFormatter =
        // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
        unit.unit === ChartUnit.Percentage ||
        unit.formattingSpec?.numberFormatOptions.style === 'percent'
          ? ({ value }: { value: string | number }) => {
              const num = typeof value === 'string' ? parseFloat(value) : value;
              return `${numberFormatter(num, 'percent')}`;
            }
          : undefined;

      const yAxisId = `${specIndex}`;
      configs.push({ yAxisFormatter, id: yAxisId });

      return givenSeriesData.forEach(({ name, dataPoints, type, zones, custom }, idx) => {
        const seriesId = `${specIndex}-${idx}`;
        valueFormatters.set(seriesId, ({ y }) => formatChartUnit(y, unit, translationDependencies));

        const result: SingleLineSeries<Timestamp, Value> = {
          id: seriesId,
          name,
          dataPoints,
          type,
          zones,
          custom,
          yAxisId,
        };
        results.push(result);
      });
    });

    return {
      dataForLineChart: { series: results },
      seriesIdToSeriesValueFormatters: valueFormatters,
      yAxisConfigs: configs,
    };
  }, [charts, translationDependencies]);

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? getEmptyArray(),
    timeAxisSpec: {
      startDate: timeSpec.startTime,
      endDate: timeSpec.endTime,
    },
  });

  const xAxisType = useMemo(
    () =>
      ({
        type: 'datetime',
        granularity: xAxisGranularity,
      }) as const,
    [xAxisGranularity],
  );

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => {
        return seriesName;
      },
      formatSeriesValueForPoint: ({ y, seriesId = '' }: { y: number; seriesId?: string }) => {
        return seriesIdToSeriesValueFormatters.get(seriesId)?.({ y }) ?? '';
      },
      formatXForPoint: (x: string | number) =>
        formatTimestampForChartTooltip(seriesIntervalMeaning, locale, new Date(x), translate),
    };
  }, [locale, seriesIntervalMeaning, seriesIdToSeriesValueFormatters, translate]);

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    chartStyleMode,
  );

  const chartComponent = useMemo(
    () => (
      <LineChart
        data={dataForLineChart}
        tooltipFormatters={tooltipFormatters}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfigs={yAxisConfigs}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        annotations={annotations}
      />
    ),
    [
      chartStyleMode,
      dataForLineChart,
      tooltipFormatters,
      xAxisFormatter,
      xAxisType,
      yAxisConfigs,
      onSelectChartRegion,
      annotations,
    ],
  );

  if (renderWithoutPeripherals) {
    return chartComponent;
  }

  return (
    <SingleChartCardContainer
      titleLabel={titleKey ? translationDependencies.translate(titleKey) : ''}
      titleTooltipLabel={
        definitionTooltipKey ? translationDependencies.translate(definitionTooltipKey) : undefined
      }
      chartSummarySpecs={getEmptyArray()}
      chartControl={chartControl}
      chartBanner={chartBanner}
      footerContent={chartWarnings?.length || footerProps?.actionLink ? footer : undefined}
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2MetricComparisonChart;
