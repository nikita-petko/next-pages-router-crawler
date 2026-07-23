import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import clone from 'just-clone';
import { MapChart, BarChart, ChartStyleMode } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import { Grid, RobuxIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import SingleDateChartExporter from '@modules/charts-generic/charts/exporters/SingleDateChartExporter';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import {
  formatNumberWithSpec,
  NumberContext,
  NumberIcon,
  type TFormattingSpec,
} from '@modules/charts-generic/charts/numberFormatters';
import type {
  BarSeriesEntry,
  BarSeriesNamedDatapoint,
} from '@modules/charts-generic/charts/types/HorizontalBarChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import topoJSON from '../../../../public/assets/analytics/world-highres.topo.json';
import {
  buildBreakdownColumnNames,
  buildChartUnitOptions,
} from '../../adapters/genericRAQIV2ChartAdapter';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import genericRAQIV2HorizontalBarChartAdapter from '../../adapters/genericRAQIV2HorizontalBarChartAdapter';
import type { MapAndBarChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import getEmptyArray from '../../emptyArray';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '../../utils/metricLikeSemantics';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard, { downloadOnlyChartActionLayout } from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

const wholePercentageFormattingSpec = {
  abbreviate: false,
  numberFormatOptions: {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
} satisfies TFormattingSpec;

const adaptBarSeriesForWebbloxChart = (genericSeries: BarSeriesEntry[]) => {
  const categories = new Set<string>();
  const seriesInfo = new Map<
    string,
    { percentage: number | undefined; y: number; category: string }[]
  >();
  genericSeries.forEach(({ name, data }) => {
    const singleSeriesInfo = seriesInfo.get(name) ?? [];
    singleSeriesInfo.push(
      ...data.map((point) => ({
        percentage: point.percentage,
        y: point.y,
        category: point.name,
      })),
    );
    seriesInfo.set(name, singleSeriesInfo);
    data.forEach((point) => {
      categories.add(point.name);
    });
  });

  const orderedCategories = Array.from(categories.values());

  const series = Array.from(seriesInfo.entries()).map(([seriesName, points]) => {
    const dataPoints: Array<[string, number]> = points.map(({ category, y }) => [category, y]);
    return {
      name: seriesName,
      dataPoints,
    };
  });

  return {
    series,
    orderedCategories,
    seriesInfo,
  };
};

const adaptBarSeriesToMapSeriesForWebbloxChart = (
  genericSeries: BarSeriesEntry[],
  name: FormattedText,
  legendSplits: number[] = [],
  labelDataAsPercent = false,
) => {
  const dataPoints: Array<[string, number]> = genericSeries.map((series) => {
    const point = clone(series.data[0]);
    return [point['hc-key'] ?? '', labelDataAsPercent ? (point.percentage ?? 0) : point.y];
  });
  return {
    singleSeries: {
      name,
      dataPoints,
    },
    topoJSON,
    colorAxisSplit: legendSplits.map((split) => split / 100),
  };
};

const GenericRAQIV2MapAndBarChartV2: FC<
  GenericRAQIV2ChartProps & Omit<MapAndBarChartConfig, 'chartType'>
> = ({
  spec,
  titleLabel,
  titleKey,
  definitionTooltipKey,
  chartWarnings,
  footerProps,
  ignoreCache,
  displayOptions,
  chartHeight,
  sort,
  breakdownLimit,
  mapLegendSplits,
  summarySpec,
  onChartDataUpdated,
  renderWithoutPeripherals,
  chartStyleMode = ChartStyleMode.Normal,
  chartBanner,
  chartLocation,
}) => {
  const { breakdown, timeSpec, metric } = spec;
  const ownershipWatermarkSlots = useMetricOwnershipWatermarkSlots(spec);
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? false;
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate, tPendingTranslation } = translationDependencies;
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(metric, translationDependencies),
    [metric, translationDependencies],
  );

  const unit = buildChartUnitOptions(spec, translationDependencies);

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(() => ({ fetchTotalSeries: true }), []);
  const {
    data: raqiData,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    error,
  } = useRAQIV2Request(spec, requestOptions, ignoreCache);

  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      error,
    }),
    [isDataLoading, isResponseFailed, isUserForbidden, error],
  );

  const summarySpecOrDefault = useMemo(
    () => summarySpec ?? getDefaultSummarySpec(spec),
    [spec, summarySpec],
  );

  // GenericSeries does not respect the breakdownLimit since the map needs all breakdowns
  const { series: genericSeries, summary } = useMemo(() => {
    if (!isDataLoading && raqiData && raqiData.response !== null && translationDependencies.ready) {
      return genericRAQIV2HorizontalBarChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        summarySpec: summarySpecOrDefault,
        translationDependencies,
        labelDataAsPercent,
        sort,
      });
    }
    return { series: [], summary: [] };
  }, [
    isDataLoading,
    labelDataAsPercent,
    raqiData,
    sort,
    spec,
    summarySpecOrDefault,
    translationDependencies,
  ]);

  const {
    seriesInfo,
    series: adaptedBarSeries,
    orderedCategories,
  } = useMemo(() => {
    // barSeries is when we need to respect the breakdownLimit
    const barSeries = genericSeries.slice(0, breakdownLimit);
    return adaptBarSeriesForWebbloxChart(barSeries);
  }, [breakdownLimit, genericSeries]);

  const { barDataForWebbloxChart, mapDataForWebbloxChart } = useMemo(() => {
    const name = metricLabel;
    return {
      barDataForWebbloxChart: {
        series: adaptedBarSeries,
        orderedCategories,
      },
      mapDataForWebbloxChart: adaptBarSeriesToMapSeriesForWebbloxChart(
        genericSeries,
        name,
        mapLegendSplits,
        labelDataAsPercent,
      ),
    };
  }, [
    adaptedBarSeries,
    genericSeries,
    mapLegendSplits,
    orderedCategories,
    metricLabel,
    labelDataAsPercent,
  ]);

  const exporter = useMemo(() => {
    // Plumb each region's breakdownValues into the exporter so a
    // multi-dimension breakdown (e.g. Country + Platform) gets one
    // CSV column per dimension instead of collapsing into a
    // comma-joined value in a single "Country" column.
    const breakdownDims = breakdown ?? [];
    const breakColumnHeaderKeys =
      breakdownDims.length > 0 ? breakdownDims.map((d) => getDimensionRenderer(d).name) : [];
    const exporterSeries = genericSeries.map(({ breakdownValues, data, name: barSeriesName }) => ({
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
    }));
    return new SingleDateChartExporter(
      metricLabel,
      {
        series: exporterSeries,
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKeys,
      },
      translationDependencies.translate,
    );
  }, [genericSeries, breakdown, metricLabel, timeSpec.startTime, translationDependencies, spec]);

  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: summary,
      exporter,
    });
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  const mapChartTooltipFormatter = useCallback(
    ({ hcKey, seriesName }: { hcKey: string; seriesName: string }) => {
      const dataPoint = genericSeries
        .map((series) => series.data.find((point) => point['hc-key'] === hcKey))
        .find((point): point is BarSeriesNamedDatapoint => point != null);

      const formattedValue = dataPoint
        ? formatAnalyticsNumber(
            dataPoint.y,
            {
              metric,
              context: NumberContext.DataPoint,
            },
            translationDependencies,
          )
        : undefined;

      if (labelDataAsPercent) {
        const formattedPercent =
          dataPoint && dataPoint.percentage != null
            ? formatNumberWithSpec(dataPoint.percentage, wholePercentageFormattingSpec, {
                locale,
                translate,
              })
            : undefined;

        return `${dataPoint?.name} (${seriesName}): ${formattedPercent} (${formattedValue})`;
      }
      return `${dataPoint?.name} (${seriesName}): ${formattedValue}`;
    },
    [genericSeries, labelDataAsPercent, locale, translate, metric, translationDependencies],
  );

  const mapLegendFormatter = useCallback(
    ({ from, to }: { from?: number; to?: number }) => {
      const formattedFrom =
        from !== undefined
          ? formatNumberWithSpec(from, wholePercentageFormattingSpec, {
              locale,
              translate,
            })
          : undefined;
      const formattedTo =
        to !== undefined
          ? formatNumberWithSpec(to, wholePercentageFormattingSpec, {
              locale,
              translate,
            })
          : undefined;

      if (formattedTo === undefined) {
        return `> ${formattedFrom}`;
      }
      if (formattedFrom === undefined) {
        return `< ${formattedTo}`;
      }
      return `${formattedFrom} - ${formattedTo}`;
    },
    [locale, translate],
  );

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
          },
          translationDependencies,
        );
      },
    };
  }, [metric, translationDependencies]);

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
        },
        translationDependencies,
      );
    },
    [labelDataAsPercent, metric, seriesInfo, translationDependencies],
  );

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: {
          isDataLoading,
          isUserForbidden,
          isResponseFailed,
          error,
        },
        hasNoData: exporter.hasEmptyData,
        translate,
        tPendingTranslation,
      }),
    [
      exporter.hasEmptyData,
      error,
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      translate,
      tPendingTranslation,
    ],
  );

  const chartSummarySpecs = useChartSummarySpecs(summary);

  const chartComponents = (
    <Grid container direction='row' columnSpacing='20px'>
      <Grid item Large={7} XSmall={12}>
        <MapChart
          data={mapDataForWebbloxChart}
          chartStyleMode={chartStyleMode}
          height={chartHeight}
          tooltipFormatter={mapChartTooltipFormatter}
          legendLabelFormatter={mapLegendFormatter}
        />
      </Grid>
      <Grid item Large={5} XSmall={12}>
        <BarChart
          data={barDataForWebbloxChart}
          tooltipFormatters={tooltipFormatters}
          dataLabelsFormatter={dataLabelsFormatter}
          DataLabelLeadingIcon={
            unit.formattingSpec?.icon === NumberIcon.Robux ? RobuxIcon : undefined
          }
          chartStyleMode={chartStyleMode}
          height={chartHeight}
          forceHideLegends
        />
      </Grid>
    </Grid>
  );

  return renderWithoutPeripherals ? (
    chartComponents
  ) : (
    <RAQIV2SingleChartCard
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- Empty titleLabel should fall back to the translated title.
      titleLabel={titleLabel || (titleKey ? translate(titleKey) : '')}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      // If the user explicitly passes in no summarySpec, we don't want to show any summaries.
      // chartSummarySpecs is always non-empty since tabbed charts rely on passing in summarySpec=undefined and getting the default summary spec
      chartSummarySpecs={summarySpec ? chartSummarySpecs : getEmptyArray()}
      chartKeyOrConfig={null}
      spec={spec}
      kpiType={metricLabel}
      exporter={exporter}
      chartLocation={chartLocation}
      chartBanner={chartBanner}
      chartWarnings={chartWarnings}
      footerProps={footerProps}
      alwaysRenderFooter
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}
      actionLayout={downloadOnlyChartActionLayout}>
      {chartComponents}
    </RAQIV2SingleChartCard>
  );
};

export default GenericRAQIV2MapAndBarChartV2;
