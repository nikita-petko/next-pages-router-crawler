import { FC, useCallback, useMemo } from 'react';
import {
  ChartFooter,
  type GenericChartState,
  useDownloadAction,
  GenericTreemapExporter,
  wrapNonRAQIMetricAsFormattedTextForExporter,
} from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import {
  TreemapChart,
  ChartStyleMode,
  SingleChartCardContainer,
  SingleTreemapSeries,
  TreemapTooltipContext,
  ChartAbnormalStatus,
  type SingleChartCardContainerProps,
  type OnTreemapRootNodeChanged,
} from '@rbx/analytics-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { numberFormatter } from '@rbx/core';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';

export type TreemapValueFormatter = (value: number) => string;

export type GenericTreemapChartProps = Pick<
  GenericRAQIV2ChartProps,
  | 'titleLabel'
  | 'titleKey'
  | 'definitionTooltipKey'
  | 'chartWarnings'
  | 'footerProps'
  | 'chartStyleMode'
  | 'chartHeight'
  | 'renderWithoutPeripherals'
  | 'chartBanner'
> &
  Pick<SingleChartCardContainerProps, 'chartSummarySpecs'> & {
    data: SingleTreemapSeries;
    requestStatus: GenericChartState;
    dataLabelFormatter?: TreemapValueFormatter;
    noDataMessage?: TranslationKey;
    /** Root label (e.g. first breadcrumb). Optional; when data has a single root, that node's name is used. */
    rootName?: string;
    /** Minimum % of root total to show as separate node (e.g. 0.1 for 0.1%). Below this, nodes are grouped into "Other". */
    minDisplayPercentage?: number;
    /** When true, node color reflects its share among siblings. When false, node color reflects its share of root total. */
    colorBySiblingProportion?: boolean;
    onRootNodeChanged?: OnTreemapRootNodeChanged;
    /** When provided, enables a CSV download button in the chart card header. */
    exportFileName?: string;
  };

const defaultValueFormatter: TreemapValueFormatter = (value): string => {
  return String(numberFormatter(value));
};

const GenericTreemapChart: FC<GenericTreemapChartProps> = ({
  titleLabel,
  titleKey = translationKey('Label.Default', TranslationNamespace.Analytics),
  definitionTooltipKey,
  chartWarnings,
  chartSummarySpecs,
  footerProps,
  chartStyleMode = ChartStyleMode.Normal,
  chartHeight,
  renderWithoutPeripherals,
  data,
  requestStatus,
  dataLabelFormatter = defaultValueFormatter,
  noDataMessage,
  rootName,
  minDisplayPercentage,
  colorBySiblingProportion,
  onRootNodeChanged,
  exportFileName = '',
  chartBanner,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const exporter = useMemo(
    () =>
      new GenericTreemapExporter(
        wrapNonRAQIMetricAsFormattedTextForExporter(exportFileName),
        { series: data },
        translate,
      ),
    [exportFileName, data, translate],
  );

  const downloadActionResult = useDownloadAction({
    kpiType: exportFileName,
    exporter,
  });
  const downloadAction = exportFileName ? downloadActionResult : undefined;

  const tooltipFormatter = useCallback(
    ({ name, value, percentage }: TreemapTooltipContext) => {
      const formattedValue = dataLabelFormatter(value);

      if (percentage !== undefined) {
        const oneDecimalDigit: Intl.NumberFormatOptions = {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        };
        const formattedPercentage = String(
          numberFormatter(percentage, {
            style: 'percent',
            ...oneDecimalDigit,
          }),
        );
        return `<strong>${name}</strong><br/>${formattedValue} (${formattedPercentage})`;
      }

      return `${name}: ${formattedValue}`;
    },
    [dataLabelFormatter],
  );

  const formatDataLabel = useCallback(
    ({ y }: { y: number }) => dataLabelFormatter(y),
    [dataLabelFormatter],
  );

  const hasNoData = data.length === 0;
  const abnormalState = useMemo(
    () =>
      !requestStatus.isDataLoading && hasNoData && noDataMessage
        ? {
            status: ChartAbnormalStatus.NoData,
            description: translate(noDataMessage),
          }
        : genericChartStateToChartAbnormalState({
            state: requestStatus,
            hasNoData,
            translate,
          }),
    [hasNoData, noDataMessage, requestStatus, translate],
  );

  const chartComponent = useMemo(
    () => (
      <TreemapChart
        data={data}
        chartStyleMode={chartStyleMode}
        height={chartHeight}
        rootName={rootName}
        minDisplayPercentage={minDisplayPercentage}
        colorBySiblingProportion={colorBySiblingProportion}
        tooltipFormatter={tooltipFormatter}
        formatDataLabel={formatDataLabel}
        onRootNodeChanged={onRootNodeChanged}
      />
    ),
    [
      chartHeight,
      chartStyleMode,
      data,
      formatDataLabel,
      rootName,
      minDisplayPercentage,
      colorBySiblingProportion,
      tooltipFormatter,
      onRootNodeChanged,
    ],
  );

  if (renderWithoutPeripherals) {
    return chartComponent;
  }

  return (
    <SingleChartCardContainer
      downloadAction={downloadAction}
      titleLabel={titleLabel || translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      chartSummarySpecs={chartSummarySpecs}
      chartBanner={chartBanner}
      footerContent={
        chartWarnings?.length || footerProps?.actionLink ? (
          <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
        ) : undefined
      }
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericTreemapChart;
