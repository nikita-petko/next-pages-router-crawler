import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';
import type { AxisType, NonCategoricalSingleColumnSeries } from '@rbx/analytics-ui';
import { ColumnChart, SingleChartCardContainer } from '@rbx/analytics-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TimeComparatorChartExporter from '@modules/charts-generic/charts/exporters/TimeComparatorChartExporter';
import { formatDurationInDay } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import type { TLabeledExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RAQIV2TimeComparatorQueryResult } from '../../adapters/genericRAQIV2TimeComparatorChartAdapter';
import genericRAQIV2TimeComparatorChartAdapter, {
  formatTimeComparatorDataForColumnChart,
} from '../../adapters/genericRAQIV2TimeComparatorChartAdapter';
import type { ColumnChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import { useRAQIV2Client } from '../../context/RAQIV2ClientProvider';
import getEmptyArray from '../../emptyArray';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import type { GenericRAQIV2TimeComparatorChartProps } from '../../types/GenericRAQIV2ChartProps';
import type {
  RAQIV2MultiTimeSpecUIQueryRequest,
  RAQIV2UIQueryRequest,
} from '../../types/RAQIV2UIQueryRequest';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import makeRAQIV2Request from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

/**
 * Note: This chart is a work in progress and may be subject to change.  It currently does not support as robust a set of use
 * cases as other RAQIV2 generic charts
 *
 * Column chart that displays data from a set of arbitrary time ranges, overlayed and anchored on the
 * first day.
 *
 * @param spec A RAQIV2 chart spec containing an array of date ranges
 * @param ignoreCache currently must be set to true until caching is set up properly for this chart in the analytics gateway
 * @param chartHeight The chart height in pixels
 * @returns a column chart React component comparing the specified date ranges for the specified metric
 */
const GenericRAQIV2TimeComparatorColumnChart: FC<
  GenericRAQIV2TimeComparatorChartProps & Omit<ColumnChartConfig, 'chartType'>
> = ({
  spec,
  chartKeyOrConfig,
  ignoreCache,
  chartHeight,
  renderWithoutPeripherals,
  onChartDataUpdated,
  chartBanner,
}) => {
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(spec);
  const sentryBundle = useSentryChartTracers({
    metric: spec.metric,
    componentKeyOrConfig: chartKeyOrConfig,
    numExpectedPoints: 0,
  });

  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(spec.metric, translationDependencies),
    [spec.metric, translationDependencies],
  );

  const queryRequest: RAQIV2MultiTimeSpecUIQueryRequest = spec;
  const { client } = useRAQIV2Client(ignoreCache ?? false);

  const makeLabeledRAQIV2Request = useCallback(
    async (
      labeledTimeSpec: TLabeledExplicitTimeRangeSpec,
    ): Promise<RAQIV2TimeComparatorQueryResult> => {
      const { labeledTimeSpecs: _timeSpecs, ...requestWithoutTimeSpecs } = queryRequest;
      const parsedRequest: RAQIV2UIQueryRequest = {
        timeSpec: labeledTimeSpec.timeSpec,
        ...requestWithoutTimeSpecs,
      };
      const result = await makeRAQIV2Request(parsedRequest, client);
      return { ...labeledTimeSpec, ...result };
    },
    [client, queryRequest],
  );

  const combine = useCallback((results: UseQueryResult<RAQIV2TimeComparatorQueryResult>[]) => {
    return {
      orderedData: results.map((result) => result.data ?? null),
      isDataLoading: results.some((result) => result.isPending),
      isResponseFailed: results.some((result) => result.isError),
      isUserForbidden: results.some(
        (result) =>
          result.isError &&
          getResponseFromError(result.error)?.status === HttpStatusCodes.FORBIDDEN,
      ),
    };
  }, []);

  sentryBundle.startDataLoading();
  const {
    orderedData: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
  } = useQueries({
    queries: spec.labeledTimeSpecs.map((timeSpec) => {
      return {
        queryKey: [
          'TimeComparatorColumnChart',
          timeSpec.timeSpec.startTime.getTime(),
          timeSpec.timeSpec.endTime.getTime(),
          timeSpec.timeSpec.snapGranularity,
          [...(queryRequest.breakdown ?? [])].sort((a, b) => a.localeCompare(b)).join(','),
          [...(queryRequest.filter ?? [])]
            .sort((a, b) => a.dimension.localeCompare(b.dimension))
            .map((filter) => ({
              ...filter,
              values: [...filter.values].sort((a, b) => a.localeCompare(b)),
            })),
          queryRequest.limit,
          queryRequest.granularity,
          queryRequest.resource.id,
          queryRequest.resource.type,
          queryRequest.metric,
        ],
        queryFn: () => makeLabeledRAQIV2Request(timeSpec),
        gcTime: 0,
      };
    }),
    combine,
  });

  const requestStatus = useMemo(() => {
    return { isDataLoading, isResponseFailed, isUserForbidden };
  }, [isDataLoading, isResponseFailed, isUserForbidden]);
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  const chart = genericRAQIV2TimeComparatorChartAdapter(
    raqiData ?? { response: null },
    spec,
    translationDependencies,
  );
  const { timeAnnotatedSeries: series } = chart;

  const exporter = useMemo(
    () => new TimeComparatorChartExporter(metricLabel, chart, translate, locale),
    [metricLabel, chart, translate, locale],
  );

  const formattedData: {
    series: NonCategoricalSingleColumnSeries<number, number>[];
  } = useMemo(() => formatTimeComparatorDataForColumnChart(series, locale), [locale, series]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatXForPoint: (x: string | number) => formatDurationInDay(x, translationDependencies),
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => {
        return seriesName;
      },
      formatSeriesValueForPoint({ y }: { y: number }): string {
        return formatAnalyticsNumber(
          y,
          {
            metric: spec.metric,
            context: NumberContext.DataPoint,
          },
          translationDependencies,
        );
      },
    };
  }, [spec.metric, translationDependencies]);

  // Converts X-axis into format 'Day N.' At the moment, this is the only format we support
  const xAxisFormatter = useCallback(
    ({ value }: { value: string | number }) => {
      return formatDurationInDay(value, translationDependencies);
    },
    [translationDependencies],
  );

  const xAxisType: AxisType = useMemo(
    () => ({
      // This can never be datetime since we're explicitly comparing different datetimes
      type: 'linear',
    }),
    [],
  );

  const downloadAction = useDownloadAction({ kpiType: metricLabel, exporter });

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate: translationDependencies.translate,
        tPendingTranslation: translationDependencies.tPendingTranslation,
      }),
    [
      exporter.hasEmptyData,
      requestStatus,
      translationDependencies.translate,
      translationDependencies.tPendingTranslation,
    ],
  );

  const chartComponent = (
    <ColumnChart
      data={formattedData}
      height={chartHeight}
      tooltipFormatters={tooltipFormatters}
      xAxisFormatter={xAxisFormatter}
      xAxisType={xAxisType}
      stacking={false}
    />
  );

  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: [],
      exporter,
    });
  }, [exporter, onChartDataUpdated, requestStatus]);

  // We use the basic chart card here because the time comparator column chart has no summary spec.
  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <SingleChartCardContainer
      titleLabel={translate(translationKey('Heading.Compare', TranslationNamespace.Analytics))}
      downloadAction={downloadAction}
      chartSummarySpecs={getEmptyArray()}
      chartBanner={chartBanner}
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2TimeComparatorColumnChart;
