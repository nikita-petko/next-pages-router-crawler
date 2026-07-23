import { FC, useCallback, useEffect, useMemo } from 'react';

import {
  ChartFooter,
  BarSeriesEntry,
  SingleDateChartExporter,
  formatNumber,
  NumberContext,
  useLocale,
  ChartUnit,
  ChartUnitAggregationType,
  BarSeriesNamedDatapoint,
  useDownloadAction,
  NumberIcon,
  useChartSummarySpecs,
} from '@modules/charts-generic';
import { translationKey, FormattedText } from '@modules/analytics-translations';
import { MapChart, BarChart, SingleChartCardContainer, ChartStyleMode } from '@rbx/analytics-ui';
import { Grid, RobuxIcon } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import clone from 'just-clone';
import { numberFormatter } from '@rbx/core';
import topoJSON from '../../../../public/assets/analytics/world-highres.topo.json';
import getEmptyArray from '../../emptyArray';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { MapAndBarChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import { buildChartUnitOptions } from '../../adapters/genericRAQIV2ChartAdapter';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import genericRAQIV2HorizontalBarChartAdapter from '../../adapters/genericRAQIV2HorizontalBarChartAdapter';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import { getDefaultSummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import { isComputedMetric } from '../../types/ComputedMetric';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

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
  labelDataAsPercent: boolean = false,
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
}) => {
  const { breakdown, timeSpec, metric } = spec;
  const metricLabelForDisplay = useMemo(() => getMetricLabelFromMetricLike(metric), [metric]);
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? false;
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;

  const unit = buildChartUnitOptions(spec, translationDependencies);

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(() => ({ fetchTotalSeries: true }), []);
  const {
    data: raqiData,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
    isNoDataAvailable,
    error,
  } = useRAQIV2Request(spec, requestOptions, ignoreCache);

  const requestStatus = useMemo(
    () => ({
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      isNoDataAvailable,
      error,
    }),
    [isDataLoading, isResponseFailed, isUserForbidden, isNoDataAvailable, error],
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
    const name = isComputedMetric(metric)
      ? (metricLabelForDisplay as FormattedText)
      : translate(getAnalyticsMetricDisplayConfig(metric).localizedName);
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
    metric,
    genericSeries,
    mapLegendSplits,
    orderedCategories,
    metricLabelForDisplay,
    translate,
    labelDataAsPercent,
  ]);

  const exporter = useMemo(() => {
    return new SingleDateChartExporter(
      getExportLabelFromMetricLike(metric),
      {
        series: genericSeries,
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKey: breakdown?.length
          ? getDimensionRenderer(breakdown[0]).name
          : translationKey('Label.Breakdown', TranslationNamespace.Analytics),
      },
      translationDependencies.translate,
    );
  }, [genericSeries, breakdown, metric, timeSpec.startTime, translationDependencies, spec]);

  useEffect(() => {
    onChartDataUpdated?.({
      chartState: requestStatus,
      summaryItems: summary,
      exporter,
    });
  }, [onChartDataUpdated, requestStatus, summary, exporter]);

  const mapChartTooltipFormatter = useCallback(
    ({ hcKey, seriesName }: { hcKey: string; seriesName: string }) => {
      let dataPoint: BarSeriesNamedDatapoint | undefined;
      genericSeries.forEach((series) => {
        if (dataPoint) return;
        const correspondingPoint = series.data.find((point) => point['hc-key'] === hcKey);
        if (correspondingPoint) {
          dataPoint = correspondingPoint;
        }
      });

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
            ? // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Migration in progress
              formatNumber({
                value: dataPoint.percentage,
                unit: ChartUnit.WholePercentage,
                type: ChartUnitAggregationType.Ratio,
                context: NumberContext.DataPoint,
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
          ? // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Migration in progress
            formatNumber({
              value: from,
              unit: ChartUnit.WholePercentage,
              type: ChartUnitAggregationType.Ratio,
              context: NumberContext.DataPoint,
              locale,
              translate,
            })
          : undefined;
      const formattedTo =
        to !== undefined
          ? // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Migration in progress
            formatNumber({
              value: to,
              unit: ChartUnit.WholePercentage,
              type: ChartUnitAggregationType.Ratio,
              context: NumberContext.DataPoint,
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

  const downloadAction = useDownloadAction({
    exporter,
    kpiType: getMetricLabelFromMetricLike(metric),
  });

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: {
          isDataLoading,
          isUserForbidden,
          isResponseFailed,
          isNoDataAvailable,
        },
        hasNoData: exporter.hasEmptyData,
        translate,
      }),
    [
      exporter.hasEmptyData,
      isDataLoading,
      isNoDataAvailable,
      isResponseFailed,
      isUserForbidden,
      translate,
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
            // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
            unit.unit === ChartUnit.Robux || unit.formattingSpec?.icon === NumberIcon.Robux
              ? RobuxIcon
              : undefined
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
    <SingleChartCardContainer
      titleLabel={titleLabel || (titleKey ? translate(titleKey) : '')}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      // If the user explicitly passes in no summarySpec, we don't want to show any summaries.
      // chartSummarySpecs is always non-empty since tabbed charts rely on passing in summarySpec=undefined and getting the default summary spec
      chartSummarySpecs={summarySpec ? chartSummarySpecs : getEmptyArray()}
      footerContent={<ChartFooter warnings={chartWarnings ?? []} {...footerProps} />}
      downloadAction={downloadAction}
      chartBanner={chartBanner}
      abnormalState={abnormalState}>
      {chartComponents}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2MapAndBarChartV2;
