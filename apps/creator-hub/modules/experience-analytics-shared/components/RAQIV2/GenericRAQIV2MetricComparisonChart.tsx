import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { SingleLineSeries, YAxisConfig } from '@rbx/analytics-ui';
import { ChartStyleMode, LineChart, SingleChartCardContainer } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import buildAxisFormattingSpec from '@modules/charts-generic/charts/buildAxisFormattingSpec';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import formatChartUnit from '@modules/charts-generic/charts/formatChartUnit';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import { formatTimestampForChartTooltip } from '@modules/charts-generic/charts/formatters/timeFormatters';
import type { Timestamp, Value } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { integerFormattingSpec } from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import useLocale from '@modules/charts-generic/context/useLocale';
import { isNonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { AnnotationType } from '@modules/clients/analytics';
import { noSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2TimeSeriesSplineChartAdapter from '../../adapters/genericRAQIV2TimeSeriesSplineChartAdapter';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '../../constants/AnalyticsMetricDisplayConfig';
import type { ClientCacheStatus } from '../../context/AnalyticsQueryGatewayProvider';
import { useRAQIV2Client } from '../../context/RAQIV2ClientProvider';
import useExperienceAnalyticsCurrentXAxisGranularity from '../../context/useExperienceAnalyticsCurrentXAxisGranularity';
import getEmptyArray from '../../emptyArray';
import singleToMappedRequest from '../../hooks/singleToMappedRequest';
import useChartLoadTelemetry from '../../hooks/useChartLoadTelemetry';
import { shouldShowConfiguredAlertIncident } from '../../hooks/useChartTimeSeriesAnnotations';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useMappedApiRequest from '../../hooks/useMappedApiRequest';
import useMetricAwareYAxisFormatterEnabled from '../../hooks/useMetricAwareYAxisFormatterEnabled';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useSuccessfulChartRenderCallback from '../../hooks/useSuccessfulChartRenderCallback';
import useTimeSeriesWebbloxAnnotations from '../../hooks/useTimeSeriesWebbloxAnnotations';
import type { GenericRAQIV2MultiMetricChartProps } from '../../types/GenericRAQIV2ChartProps';
import makeRAQIV2Request from '../../utils/makeRAQIV2Request';
import { isLoadingRAQIV2Prerequisites } from '../../utils/RAQIV2InternalException';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';

/**
 * This Chart is for comparing the trends of two metrics only, not supporting breakdowns, benchmarks, or summaries.
 */
const GenericRAQIV2MetricComparisonChart: FC<GenericRAQIV2MultiMetricChartProps> = ({
  spec,
  chartKeyOrConfig,
  titleLabel,
  titleKey,
  definitionTooltipKey,
  footerProps,
  onSelectChartRegion,
  chartControl,
  chartWarnings,
  ignoreCache,
  chartStyleMode = ChartStyleMode.Normal,
  chartUpdatePolicy,
  displayOptions,
  renderWithoutPeripherals,
  chartBanner,
}) => {
  const locale = useLocale();
  const { resource, granularity, timeSpec, metricSpec } = spec;
  const hideTotalSeriesInChart = displayOptions?.hideTotalSeriesInChart ?? false;
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();

  const { getCurrentSupportedAnnotations } = useCurrentAnnotationsBundleProvider(resource.type);

  const { createClientCacheTracking } = useRAQIV2Client(ignoreCache ?? false);
  const cacheStatusByMetric = useRef(new Map<TRAQIV2NumericUIMetric, ClientCacheStatus>());

  /* oxlint-disable react/react-compiler -- cache provenance is request-scoped mutable state updated when each async request settles */
  const makeRAQIRequestForSingleMetric = useCallback(
    async (metric: TRAQIV2NumericUIMetric) => {
      const currentMetricSpec = metricSpec.find((m) => m.metric === metric);
      if (!currentMetricSpec || isLoadingRAQIV2Prerequisites(resource)) {
        return null;
      }
      const cacheTracking = createClientCacheTracking();
      try {
        return await makeRAQIV2Request(
          {
            resource,
            timeSpec,
            granularity,
            metric: currentMetricSpec.metric,
            filter: currentMetricSpec.filter,
          },
          cacheTracking.client,
        );
      } finally {
        const cacheStatus = cacheTracking.getClientCacheStatus();
        if (cacheStatus !== undefined) {
          cacheStatusByMetric.current.set(metric, cacheStatus);
        }
      }
    },
    [createClientCacheTracking, granularity, metricSpec, resource, timeSpec],
  );
  /* oxlint-enable react/react-compiler */

  const makeMappedRequest = useMemo(() => {
    const requestMetrics = singleToMappedRequest(makeRAQIRequestForSingleMetric);
    return (requestedMetrics: TRAQIV2NumericUIMetric[]) => {
      cacheStatusByMetric.current.clear();
      return requestMetrics(requestedMetrics);
    };
  }, [makeRAQIRequestForSingleMetric]);
  const metrics = useMemo(() => metricSpec.map((mSpec) => mSpec.metric), [metricSpec]);
  const announcementTargetingDimensions = useMemo(() => {
    const filterDimensions = metricSpec.flatMap(
      (currentMetricSpec) => currentMetricSpec.filter?.map(({ dimension }) => dimension) ?? [],
    );
    return Array.from(new Set(filterDimensions));
  }, [metricSpec]);

  const timeSeriesAnnotations = useMemo(() => {
    if (!isNonEmptyArray(metrics)) {
      return [];
    }
    const supported = getCurrentSupportedAnnotations(
      metrics,
      (annotationType) => (annotationType === AnnotationType.Benchmark ? false : undefined),
      announcementTargetingDimensions,
    );
    // Apply the per-metric chart-context filter for ConfiguredAlertIncident
    // annotations: this chart shows multiple metrics side-by-side, each with
    // its own filter, so we match each incident against the filter from the
    // metricSpec entry whose metric matches the annotation. Annotations with
    // no metricSpec match are dropped (they belong to a different metric).
    if (
      !supported ||
      !supported.some((ann) => ann.type === AnnotationType.ConfiguredAlertIncident)
    ) {
      return supported;
    }
    return supported.filter((annotation) => {
      if (annotation.type !== AnnotationType.ConfiguredAlertIncident) {
        return true;
      }
      const matchingSpec = metricSpec.find(
        (currentMetricSpec) => currentMetricSpec.metric === annotation.metric,
      );
      // No metricSpec entry for this annotation's metric → it's not on this
      // chart at all, so drop it. This also defends against the no-context
      // short-circuit incorrectly showing a multi-metric incident on a
      // chart that only plots a different metric.
      if (!matchingSpec) {
        return false;
      }
      return shouldShowConfiguredAlertIncident(
        annotation,
        // MetricComparison doesn't support per-metric breakdowns; always
        // pass undefined so the breakdown rule is skipped.
        undefined,
        matchingSpec.filter,
      );
    });
  }, [announcementTargetingDimensions, getCurrentSupportedAnnotations, metricSpec, metrics]);

  const {
    data: raqiResponses,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    requestIdentity,
    requestVersion,
  } = useMappedApiRequest(metrics, makeMappedRequest, true, true);
  const getClientCacheStatus = useCallback((): ClientCacheStatus | undefined => {
    const cacheStatuses = metrics.flatMap((metric) => {
      const status = cacheStatusByMetric.current.get(metric);
      return status === undefined ? [] : [status];
    });
    const firstCacheStatus = cacheStatuses[0];
    if (cacheStatuses.length !== metrics.length || firstCacheStatus === undefined) {
      return undefined;
    }
    return cacheStatuses.every((status) => status === firstCacheStatus)
      ? firstCacheStatus
      : 'mixed';
  }, [metrics]);
  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      requestIdentity,
      requestVersion,
      getClientCacheStatus,
    }),
    [
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      requestIdentity,
      requestVersion,
      getClientCacheStatus,
    ],
  );

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: { isDataLoading, isUserForbidden, isResponseFailed },
        translate: translationDependencies.translate,
        tPendingTranslation: translationDependencies.tPendingTranslation,
      }),
    [isDataLoading, isResponseFailed, isUserForbidden, translationDependencies],
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
        granularity,
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
    granularity,
    spec,
    translate,
    translationDependencies,
  ]);

  const footer = useMemo(
    () => <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />,
    [chartWarnings, footerProps],
  );

  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const { dataForLineChart, seriesIdToSeriesValueFormatters, yAxisConfigs } = useMemo((): {
    dataForLineChart: { series: Array<SingleLineSeries<Timestamp, Value>> };
    seriesIdToSeriesValueFormatters: Map<string, ({ y }: { y: number }) => string>;
    yAxisConfigs: YAxisConfig[];
  } => {
    const results: Array<SingleLineSeries<Timestamp, Value>> = [];

    const valueFormatters = new Map<string, ({ y }: { y: number }) => string>();
    const configs: YAxisConfig[] = [];

    charts.forEach(({ series: givenSeriesData, unit }, specIndex) => {
      // For percent units we keep the long-standing locale-aware percent
      // formatter. For everything else, the DSA-5725 metric-aware formatter
      // is gated behind `isAnalyticsMetricAwareYAxisFormatterEnabled`. When
      // the flag is off (or the unit lacks a `formattingSpec`), we leave
      // `yAxisFormatter` undefined so axes use Highcharts' default formatter.
      const isPercentUnit = unit.formattingSpec?.numberFormatOptions.style === 'percent';
      let yAxisFormatter: ((args: { value: string | number }) => string) | undefined;
      if (isPercentUnit) {
        yAxisFormatter = ({ value }) => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return `${numberFormatter(num, 'percent')}`;
        };
      } else if (enableMetricAwareYAxisFormatter && unit.formattingSpec) {
        const axisFormattingSpec = buildAxisFormattingSpec(unit.formattingSpec);
        yAxisFormatter = ({ value }) => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          if (!Number.isFinite(num)) {
            return '';
          }
          return formatChartUnit(num, axisFormattingSpec, translationDependencies);
        };
      }

      const yAxisId = `${specIndex}`;
      configs.push({ yAxisFormatter, id: yAxisId });

      givenSeriesData.forEach(({ name, dataPoints, type, zones, custom }, idx) => {
        const seriesId = `${specIndex}-${idx}`;
        valueFormatters.set(seriesId, ({ y }) =>
          formatChartUnit(y, unit.formattingSpec ?? integerFormattingSpec, translationDependencies),
        );

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
  }, [charts, enableMetricAwareYAxisFormatter, translationDependencies]);

  const telemetryTimeSpecs = useMemo(() => [timeSpec], [timeSpec]);
  const telemetryBundle = useChartLoadTelemetry({
    metric: metrics,
    componentKeyOrConfig: chartKeyOrConfig,
    timeSpecs: telemetryTimeSpecs,
    granularity,
    resource,
    timeInterval: granularity,
  });
  const hasNoData = dataForLineChart.series.every(({ dataPoints }) => dataPoints.length === 0);

  useEffect(() => {
    telemetryBundle.handleRAQIV2RequestResult({
      ...requestStatus,
      hasNoData: !requestStatus.isDataLoading && hasNoData,
      isClassificationReady: translationDependencies.ready,
    });
  }, [hasNoData, requestStatus, telemetryBundle, translationDependencies.ready]);
  const handleSuccessfulChartRender = useSuccessfulChartRenderCallback(telemetryBundle, {
    ...requestStatus,
    hasNoData,
    isClassificationReady: translationDependencies.ready,
  });

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
        formatTimestampForChartTooltip(granularity, locale, new Date(x), translate),
    };
  }, [locale, granularity, seriesIdToSeriesValueFormatters, translate]);

  const xAxisFormatter = useXAxisFormatter(locale, granularity, xAxisGranularity, chartStyleMode);
  const lineChartUpdateProps = useMemo(
    () => (chartUpdatePolicy ? { chartUpdatePolicy } : {}),
    [chartUpdatePolicy],
  );

  const chartComponent = useMemo(
    () => (
      <LineChart
        {...lineChartUpdateProps}
        data={dataForLineChart}
        tooltipFormatters={tooltipFormatters}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfigs={yAxisConfigs}
        onSelectChartRegion={onSelectChartRegion ?? undefined}
        annotations={annotations}
        onChartRender={handleSuccessfulChartRender}
        onChartDependencyStatus={telemetryBundle.handleChartDependencyStatus}
      />
    ),
    [
      chartStyleMode,
      dataForLineChart,
      lineChartUpdateProps,
      tooltipFormatters,
      xAxisFormatter,
      xAxisType,
      yAxisConfigs,
      onSelectChartRegion,
      annotations,
      handleSuccessfulChartRender,
      telemetryBundle.handleChartDependencyStatus,
    ],
  );

  if (renderWithoutPeripherals) {
    return chartComponent;
  }

  return (
    <SingleChartCardContainer
      titleLabel={titleLabel ?? (titleKey ? translationDependencies.translate(titleKey) : '')}
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
