import { FC, useCallback, useMemo } from 'react';
import {
  ChartFooter,
  SingleDateChartExporter,
  NumberContext,
  ChartUnit,
  useDownloadAction,
  NumberIcon,
  useChartSummarySpecs,
} from '@modules/charts-generic';
import { FormattedText, translationKey } from '@modules/analytics-translations';
import { PieChart, ChartStyleMode, SingleChartCardContainer } from '@rbx/analytics-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RobuxIcon, useTheme } from '@rbx/ui';
import { numberFormatter } from '@rbx/core';
import useSentryChartTracers from '../../hooks/useSentryChartTracers';
import { MakeRAQIV2RequestOptions } from '../../utils/makeRAQIV2Request';
import { PieChartConfig } from '../../constants/RAQIV2PredefinedChartConfig';
import useRAQIV2Request from '../../hooks/useRAQIV2Request';
import { buildChartUnitOptions } from '../../adapters/genericRAQIV2ChartAdapter';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import genericRAQIV2PieChartAdapter from '../../adapters/genericRAQIV2PieChartAdapter';
import getDimensionRenderer from '../getDimensionRenderer';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import useExploreModeAction from '../../exploreMode/useExploreModeAction';
import {
  getExportLabelFromMetricLike,
  getIsAverageAggregationMetric,
  getMetricLabelFromMetricLike,
} from '../../utils/metricLikeSemantics';
import useBreakdownColors from '../../hooks/useBreakdownColors';

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
  chartBanner,
}) => {
  const { breakdown, timeSpec, metric } = spec;
  const metricLabel = useMemo(() => getMetricLabelFromMetricLike(metric), [metric]);
  const exportMetric = useMemo(() => getExportLabelFromMetricLike(metric), [metric]);
  const sentryBundle = useSentryChartTracers({
    metric,
    componentKeyOrConfig: chartKeyOrConfig,
    breakdown: breakdown?.slice(),
    numExpectedPoints: 0,
  });
  const theme = useTheme();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const isAverageAggregation = getIsAverageAggregationMetric(metric);
  const labelDataAsPercent = displayOptions?.labelDataAsPercent ?? !isAverageAggregation;
  const tooltipDataAsPercent = displayOptions?.tooltipDataAsPercent ?? false;

  const unit = buildChartUnitOptions(spec, translationDependencies);
  const requestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({ fetchTotalSeries: !breakdown?.length }),
    [breakdown],
  );

  sentryBundle.startDataLoading();
  const { data: raqiData, ...requestStatus } = useRAQIV2Request(spec, requestOptions, ignoreCache);
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
    return new SingleDateChartExporter(
      exportMetric,
      {
        series:
          series.dataPoints.length > 0
            ? [
                {
                  name: series.name as FormattedText,
                  data: series.dataPoints
                    .map(([name, y]) => ({
                      name,
                      y,
                    }))
                    .filter(({ y }) => y !== null) as Array<{ name: FormattedText; y: number }>,
                },
              ]
            : [],
        date: timeSpec.startTime,
        unit: buildChartUnitOptions(spec, translationDependencies),
        breakColumnHeaderKey: breakdown?.length
          ? getDimensionRenderer(breakdown[0]).name
          : translationKey('Label.Breakdown', TranslationNamespace.Analytics),
      },
      translate,
    );
  }, [
    series,
    breakdown,
    exportMetric,
    spec,
    timeSpec.startTime,
    translate,
    translationDependencies,
  ]);

  const downloadAction = useDownloadAction({
    kpiType: metricLabel,
    exporter,
  });
  const secondaryAction = useExploreModeAction(chartKeyOrConfig, spec);

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: requestStatus,
        hasNoData: exporter.hasEmptyData,
        translate,
      }),
    [exporter.hasEmptyData, requestStatus, translate],
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
          // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
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
    <SingleChartCardContainer
      titleLabel={titleLabel || translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      downloadAction={downloadAction}
      secondaryAction={secondaryAction}
      footerContent={
        chartWarnings?.length || footerProps?.actionLink ? (
          <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
        ) : undefined
      }
      chartSummarySpecs={chartSummarySpecs}
      chartBanner={chartBanner}
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericRAQIV2PieChartV2;
