import { FC, useCallback, useMemo } from 'react';
import {
  ChartFooter,
  SingleDateChartExporter,
  NumberContext,
  ChartUnit,
  useDownloadAction,
  NumberIcon,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { BarChart, ChartStyleMode, SingleChartCardContainer } from '@rbx/analytics-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RobuxIcon } from '@rbx/ui';
import { numberFormatter } from '@rbx/core';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import getEmptyArray from '../../emptyArray';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { BarChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import { buildChartUnitOptions } from '../../adapters/genericRAQIV2ChartAdapter';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import genericRAQIV2HorizontalBarChartAdapter from '../../adapters/genericRAQIV2HorizontalBarChartAdapter';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import {
  getExportLabelFromMetricLike,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';

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
  renderWithoutPeripherals,
  chartBanner,
}) => {
  const { breakdown, timeSpec, metric } = spec;
  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? false;
  const shouldFetchTotalSeries = labelDataAsPercent || !breakdown?.length;

  const unit = buildChartUnitOptions(spec, translationDependencies);

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: shouldFetchTotalSeries }),
    [shouldFetchTotalSeries],
  );

  sentryBundle.startDataLoading();
  const { data: raqiData, ...requestStatus } = useRAQIV2Request(spec, requestOptions, ignoreCache);
  sentryBundle.handleRAQIV2RequestResult(requestStatus);
  const seriesWithBreakdowns = useMemo(() => {
    if (
      !requestStatus.isDataLoading &&
      raqiData &&
      raqiData.response !== null &&
      translationDependencies.ready
    ) {
      return genericRAQIV2HorizontalBarChartAdapter({
        responses: raqiData ?? { response: null },
        spec,
        translationDependencies,
        labelDataAsPercent,
        sort,
        breakdownLimit,
        summarySpec: undefined,
      }).series;
    }
    return [];
  }, [
    requestStatus.isDataLoading,
    labelDataAsPercent,
    breakdownLimit,
    raqiData,
    sort,
    spec,
    translationDependencies,
  ]);

  const series = useMemo(
    () => seriesWithBreakdowns.map(({ breakdownValues: _, ...entry }) => entry),
    [seriesWithBreakdowns],
  );

  const exporter = useMemo(() => {
    return new SingleDateChartExporter(
      getExportLabelFromMetricLike(metric),
      {
        series,
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKey: breakdown?.length
          ? getDimensionRenderer(breakdown[0]).name
          : translationKey('Label.Breakdown', TranslationNamespace.Analytics),
      },
      translate,
    );
  }, [series, breakdown, metric, spec, timeSpec.startTime, translate, translationDependencies]);

  const downloadAction = useDownloadAction({
    kpiType: getMetricLabelFromMetricLike(metric),
    exporter,
  });

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate,
      }),
    [exporter.hasEmptyData, requestStatus, translate],
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
          // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
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
    <SingleChartCardContainer
      titleLabel={titleLabel || translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      downloadAction={downloadAction}
      footerContent={
        chartWarnings?.length || footerProps?.actionLink ? (
          <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
        ) : undefined
      }
      chartSummarySpecs={getEmptyArray()}
      chartBanner={chartBanner}
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2HorizontalBarChartV2;
