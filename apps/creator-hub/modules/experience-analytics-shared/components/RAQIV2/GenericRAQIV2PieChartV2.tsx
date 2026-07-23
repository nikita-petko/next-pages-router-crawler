import type { FC } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { PieChart, ChartStyleMode } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import { RobuxIcon, useTheme } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import SingleDateChartExporter from '@modules/charts-generic/charts/exporters/SingleDateChartExporter';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import { NumberContext, NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import { ChartUnit } from '@modules/charts-generic/charts/types/ChartTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  buildBreakdownColumnNames,
  buildChartUnitOptions,
} from '../../adapters/genericRAQIV2ChartAdapter';
import genericRAQIV2PieChartAdapter from '../../adapters/genericRAQIV2PieChartAdapter';
import type { PieChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import useBreakdownColors from '../../hooks/useBreakdownColors';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import type { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import {
  brandUserSuppliedText,
  getIsAverageAggregationMetric,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import RAQIV2SingleChartCard from './RAQIV2SingleChartCard';
import useMetricOwnershipWatermarkSlots from './useMetricOwnershipWatermarkSlots';

const GenericRAQIV2PieChartV2: FC<GenericRAQIV2ChartProps & Omit<PieChartConfig, 'chartType'>> = ({
  spec,
  summarySpec,
  titleLabel,
  titleKey = translationKey('Label.Default', TranslationNamespace.Analytics),
  definitionTooltipKey,
  chartWarnings,
  footerProps,
  ignoreCache,
  displayOptions,
  chartHeight,
  chartStyleMode = ChartStyleMode.Normal,
  chartKeyOrConfig,
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
  const theme = useTheme();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate, tPendingTranslation } = translationDependencies;
  const metricLabel = useMemo(
    () => getMetricLabelFromMetricLike(metric, translationDependencies),
    [metric, translationDependencies],
  );
  const isAverageAggregation = getIsAverageAggregationMetric(metric);
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? !isAverageAggregation;
  const tooltipDataAsPercent = displayOptions?.tooltipDataAsPercent ?? true;

  const unit = buildChartUnitOptions(spec, translationDependencies);
  const requestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: !breakdown?.length }),
    [breakdown],
  );

  sentryBundle.startDataLoading();
  const {
    data: raqiData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    error,
  } = useRAQIV2Request(spec, requestOptions, ignoreCache);
  // Memoize so the `onChartDataUpdated` effect below (which lifts the
  // exporter into Explore Mode) only re-fires on real status changes,
  // not on every render. `useApiRequest` returns a fresh object each
  // render, so spreading it directly would churn the dependency array.
  const requestStatus = useMemo(
    () => ({ isDataLoading, isResponseFailed, isUserForbidden, error }),
    [isDataLoading, isResponseFailed, isUserForbidden, error],
  );
  sentryBundle.handleRAQIV2RequestResult(requestStatus);

  const { series, sliceBreakdownValues, summary } = useMemo(() => {
    return genericRAQIV2PieChartAdapter({
      responses: raqiData ?? { response: null },
      spec,
      summarySpec,
      translationDependencies,
    });
  }, [raqiData, spec, summarySpec, translationDependencies]);

  const getBreakdownColor = useBreakdownColors(breakdown, sliceBreakdownValues);
  const chartSummarySpecs = useChartSummarySpecs(summary);

  const exporter = useMemo(() => {
    // Each slice's per-dimension breakdown values are aligned with the
    // pie chart's `series.dataPoints` array by index (the adapter
    // returns them as parallel arrays), so the exporter can lay each
    // breakdown dimension into its own CSV column.
    const breakdownDims = breakdown ?? [];
    const breakColumnHeaderKeys =
      breakdownDims.length > 0 ? breakdownDims.map((d) => getDimensionRenderer(d).name) : [];
    return new SingleDateChartExporter(
      metricLabel,
      {
        series:
          series.dataPoints.length > 0
            ? [
                {
                  name: metricLabel,
                  // `series.dataPoints` declares its slice name as a bare
                  // `string` (the pie chart UI lib's `SinglePieSeries`
                  // generic), but the adapter constructs each tuple with
                  // an actual `FormattedText` produced by the breakdown
                  // renderer. Brand here so `buildBreakdownColumnNames`
                  // sees the branded text it expects. We use `flatMap` to
                  // drop null y-values in the same pass so the resulting
                  // array is statically typed as `{ names; y: number }[]`
                  // without needing a cast.
                  data: series.dataPoints.flatMap(([name, y], i) => {
                    if (y === null) {
                      return [];
                    }
                    return [
                      {
                        names: buildBreakdownColumnNames(
                          brandUserSuppliedText(name),
                          sliceBreakdownValues[i] ?? [],
                          breakdownDims,
                          translationDependencies,
                        ),
                        y,
                      },
                    ];
                  }),
                },
              ]
            : [],
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKeys,
      },
      translate,
    );
  }, [
    series,
    sliceBreakdownValues,
    breakdown,
    metricLabel,
    spec,
    timeSpec.startTime,
    translate,
    translationDependencies,
  ]);

  // Surface the freshly built exporter and request state to embedders that
  // own the download affordance themselves (e.g. Explore Mode's overflow
  // menu). Without this hook, switching to pie mid-session leaves the
  // parent's exporter ref pointing at the previous chart's exporter, and
  // on a fresh page load the download CTA stays disabled because the
  // parent never sees the pie chart's data.
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

  const data = useMemo(() => {
    return {
      series: {
        ...series,
        dataPointColors: sliceBreakdownValues.map((bvs) => getBreakdownColor(bvs)),
      },
    };
  }, [series, sliceBreakdownValues, getBreakdownColor]);

  const formatSeriesKeyForSlice = useCallback(
    ({ sliceName }: { sliceName: string; sliceValue: number; percentage: number }) => {
      return sliceName;
    },
    [],
  );

  const formatSeriesValueForSlice = useCallback(
    ({ sliceValue, percentage }: { sliceName: string; sliceValue: number; percentage: number }) => {
      if (!tooltipDataAsPercent) {
        return formatAnalyticsNumber(
          sliceValue,
          {
            metric,
            context: NumberContext.DataPoint,
          },
          translationDependencies,
        );
      }
      const oneDecimalDigit: Intl.NumberFormatOptions = {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      };
      const formattedPercentage = numberFormatter(percentage / 100, {
        style: 'percent',
        ...oneDecimalDigit,
      });

      return String(formattedPercentage);
    },
    [metric, tooltipDataAsPercent, translationDependencies],
  );

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForSlice,
      formatSeriesValueForSlice,
    }),
    [formatSeriesKeyForSlice, formatSeriesValueForSlice],
  );

  // Data labels formatter - shows percentage if labelDataAsPercent is true, otherwise shows value
  const formatDataLabel = useCallback(
    ({
      y,
      percentage,
    }: {
      y: number;
      category: string;
      seriesName: string;
      percentage?: number;
    }) => {
      if (labelDataAsPercent && percentage !== undefined) {
        const oneDecimalDigit: Intl.NumberFormatOptions = {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        };
        return numberFormatter(percentage / 100, { style: 'percent', ...oneDecimalDigit });
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
    [labelDataAsPercent, metric, translationDependencies],
  );

  const chartComponent = useMemo(
    () => (
      <PieChart
        data={data}
        chartStyleMode={chartStyleMode}
        height={chartHeight}
        tooltipFormatters={tooltipFormatters}
        formatDataLabel={formatDataLabel}
        DataLabelLeadingIcon={
          // eslint-disable-next-line deprecation/deprecation, @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660.
          unit.unit === ChartUnit.Robux || unit.formattingSpec?.icon === NumberIcon.Robux
            ? RobuxIcon
            : undefined
        }
        borderWidth={3}
        borderColor={theme.palette.surface[0]}
      />
    ),
    [
      chartHeight,
      chartStyleMode,
      data,
      formatDataLabel,
      tooltipFormatters,
      unit,
      theme.palette.surface,
    ],
  );

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <RAQIV2SingleChartCard
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- Empty titleLabel should fall back to the translated title.
      titleLabel={titleLabel || translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      chartSummarySpecs={chartSummarySpecs}
      chartKeyOrConfig={chartKeyOrConfig}
      spec={spec}
      kpiType={metricLabel}
      exporter={exporter}
      chartLocation={chartLocation}
      chartBanner={chartBanner}
      chartWarnings={chartWarnings}
      footerProps={footerProps}
      abnormalState={abnormalState}
      slots={ownershipWatermarkSlots}>
      {chartComponent}
    </RAQIV2SingleChartCard>
  );
};

export default GenericRAQIV2PieChartV2;
