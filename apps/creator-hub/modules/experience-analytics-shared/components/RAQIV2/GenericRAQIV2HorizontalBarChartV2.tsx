import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { BarChart, ChartStyleMode } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import { RobuxIcon } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import SingleDateChartExporter from '@modules/charts-generic/charts/exporters/SingleDateChartExporter';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import { NumberContext, NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import { ChartUnit } from '@modules/charts-generic/charts/types/ChartTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  buildBreakdownColumnNames,
  buildChartUnitOptions,
} from '../../adapters/genericRAQIV2ChartAdapter';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2HorizontalBarChartAdapter from '../../adapters/genericRAQIV2HorizontalBarChartAdapter';
import type { BarChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import getEmptyArray from '../../emptyArray';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard, { downloadOnlyChartActionLayout } from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

const GenericRAQIV2HorizontalBarChartV2: FC<
  GenericRAQIV2ChartProps & Omit<BarChartConfig, 'chartType'>
> = ({
  spec,
  titleLabel,
  titleKey = translationKey('Label.Default', TranslationNamespace.Analytics),
  definitionTooltipKey,
  chartWarnings,
  footerProps,
  ignoreCache,
  displayOptions,
  chartHeight,
  sort,
  breakdownLimit,
  chartStyleMode = ChartStyleMode.Normal,
  chartKeyOrConfig,
  summarySpec,
  renderWithoutPeripherals,
  onChartDataUpdated,
  chartBanner,
  chartLocation,
}) => {
  const { breakdown, timeSpec, metric } = spec;
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(spec);
  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate, tPendingTranslation } = translationDependencies;
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(metric, translationDependencies),
    [metric, translationDependencies],
  );
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? false;

  const unit = buildChartUnitOptions(spec, translationDependencies);

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(() => ({ fetchTotalSeries: true }), []);

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Remove in DSA-4491
    isNoDataAvailable,
    error,
  } = useRAQIV2Request(spec, requestOptions, ignoreCache);
  // Memoize so the `onChartDataUpdated` effect below (which lifts the
  // exporter into Explore Mode) only re-fires on real status changes,
  // not on every render. `useApiRequest` returns a fresh object each
  // render, so spreading it directly would churn the dependency array.
  const requestStatus = useMemo(
    () => ({ isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error }),
    [isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error],
  );
  sentryBundle.handleRAQIV2RequestResult(requestStatus);
  const { seriesWithBreakdowns, summary } = useMemo(() => {
    if (
      !requestStatus.isDataLoading &&
      raqiData &&
      raqiData.response !== null &&
      translationDependencies.ready
    ) {
      const adapted = genericRAQIV2HorizontalBarChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        labelDataAsPercent,
        sort,
        breakdownLimit,
        summarySpec: summarySpecOrDefault,
      });
      return { seriesWithBreakdowns: adapted.series, summary: adapted.summary };
    }
    return { seriesWithBreakdowns: [], summary: getEmptyArray<ChartSummaryItemSpec>() };
  }, [
    requestStatus.isDataLoading,
    labelDataAsPercent,
    breakdownLimit,
    raqiData,
    sort,
    spec,
    translationDependencies,
    summarySpecOrDefault,
  ]);

  const series = useMemo(
    () => seriesWithBreakdowns.map(({ breakdownValues: _, ...entry }) => entry),
    [seriesWithBreakdowns],
  );

  const exporter = useMemo(() => {
    // Plumb each bar's breakdownValues into the exporter so a multi-
    // dimension breakdown gets one CSV column per dimension. Each bar
    // becomes a single output series in the exporter spec because the
    // existing render rolls all the bars under a single metric name.
    const breakdownDims = breakdown ?? [];
    const breakColumnHeaderKeys =
      breakdownDims.length > 0 ? breakdownDims.map((d) => getDimensionRenderer(d).name) : [];
    const exporterSeries = seriesWithBreakdowns.map(
      ({ breakdownValues, data, name: barSeriesName }) => ({
        name: barSeriesName,
        data: data.map((point) => ({
          names: buildBreakdownColumnNames(
            point.name,
            breakdownValues,
            breakdownDims,
            translationDependencies,
          ),
          y: point.y,
        })),
      }),
    );
    return new SingleDateChartExporter(
      metricLabel,
      {
        series: exporterSeries,
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKeys,
      },
      translate,
    );
  }, [
    seriesWithBreakdowns,
    breakdown,
    metricLabel,
    spec,
    timeSpec.startTime,
    translate,
    translationDependencies,
  ]);

  // Surface the freshly built exporter and request state to embedders that
  // own the download affordance themselves (e.g. Explore Mode's overflow
  // menu, which lifts the action out of the chart card so it can stay in
  // sync across chart-type changes). Without this hook, switching to bar
  // mid-session leaves the parent's exporter ref pointing at the previous
  // chart's exporter, and on a fresh page load the download CTA stays
  // disabled because the parent never sees the bar chart's data.
  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: summary,
      exporter,
    });
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate,
        tPendingTranslation,
      }),
    [exporter.hasEmptyData, requestStatus, translate, tPendingTranslation],
  );

  const { seriesInfo, orderedCategories } = useMemo(() => {
    const categories = new Set<string>();
    const barSeries = new Map<
      string,
      { percentage: number | undefined; y: number; category: string }[]
    >();
    series.forEach(({ name, data }) => {
      const singleSeriesInfo = barSeries.get(name) ?? [];
      singleSeriesInfo.push(
        ...data.map((point) => ({
          percentage: point.percentage,
          y: point.y,
          category: point.name,
        })),
      );
      barSeries.set(name, singleSeriesInfo);
      data.forEach((point) => {
        categories.add(point.name);
      });
    });
    return {
      seriesInfo: barSeries,
      orderedCategories: Array.from(categories.values()),
    };
  }, [series]);

  const data = useMemo(() => {
    const result = Array.from(seriesInfo.entries()).map(([seriesName, points]) => {
      const dataPoints: Array<[string, number]> = points.map(({ category, y }) => [category, y]);
      return {
        name: seriesName,
        dataPoints,
      };
    });

    return {
      orderedCategories,
      series: result,
    };
  }, [orderedCategories, seriesInfo]);

  const tooltipFormatters = useMemo(() => {
    return {
      formatSeriesKeyForPoint({ x }: { x: string }): string {
        return x;
      },
      formatSeriesValueForPoint({ y }: { y: number }): string {
        return formatAnalyticsNumber(
          y,
          {
            metric,
            context: NumberContext.DataPoint,
            numberContextMetadata: { chartSpec: spec },
          },
          translationDependencies,
        );
      },
    };
  }, [metric, spec, translationDependencies]);

  const dataLabelsFormatter = useCallback(
    ({ y, category, seriesName }: { y: number; category: string; seriesName: string }) => {
      if (labelDataAsPercent) {
        const oneDecimalDigit: Intl.NumberFormatOptions = {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        };
        const percentage =
          seriesInfo.get(seriesName)?.find((point) => point.category === category)?.percentage ?? 0;
        return numberFormatter(percentage, { style: 'percent', ...oneDecimalDigit });
      }
      return formatAnalyticsNumber(
        y,
        {
          metric,
          context: NumberContext.DataPoint,
          numberContextMetadata: { chartSpec: spec },
        },
        translationDependencies,
      );
    },
    [labelDataAsPercent, metric, spec, seriesInfo, translationDependencies],
  );

  const chartSummarySpecs = useChartSummarySpecs(summary);

  const chartComponent = useMemo(
    () => (
      <BarChart
        data={data}
        chartStyleMode={chartStyleMode}
        height={chartHeight}
        tooltipFormatters={tooltipFormatters}
        dataLabelsFormatter={dataLabelsFormatter}
        forceHideLegends
        DataLabelLeadingIcon={
          // eslint-disable-next-line deprecation/deprecation, @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660.
          unit.unit === ChartUnit.Robux || unit.formattingSpec?.icon === NumberIcon.Robux
            ? RobuxIcon
            : undefined
        }
      />
    ),
    [chartHeight, chartStyleMode, data, dataLabelsFormatter, tooltipFormatters, unit],
  );

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <RAQIV2SingleChartCard
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- Empty titleLabel should fall back to the translated title.
      titleLabel={titleLabel || translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      // If the user explicitly passes in no summarySpec, we don't want to show any summaries.
      // chartSummarySpecs is always non-empty since tabbed charts rely on passing in summarySpec=undefined and getting the default summary spec
      chartSummarySpecs={summarySpec ? chartSummarySpecs : getEmptyArray()}
      chartKeyOrConfig={chartKeyOrConfig}
      spec={spec}
      kpiType={metricLabel}
      exporter={exporter}
      chartLocation={chartLocation}
      chartBanner={chartBanner}
      chartWarnings={chartWarnings}
      footerProps={footerProps}
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}
      actionLayout={downloadOnlyChartActionLayout}>
      {chartComponent}
    </RAQIV2SingleChartCard>
  );
};

export default GenericRAQIV2HorizontalBarChartV2;
