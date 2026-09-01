import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import type {
  ChartCardHeaderAction,
  SankeyChartData,
  SankeyNode,
  SankeyTooltipContext,
  SankeyZoomAction,
} from '@rbx/analytics-ui';
import {
  ChartAbnormalStatus,
  ChartStyleMode,
  SankeyChart,
  SingleChartCardContainer,
  type SingleChartCardContainerProps,
} from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import { DownloadIcon } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import { wrapNonRAQIMetricAsFormattedTextForExporter } from '@modules/charts-generic/charts/exporters/GenericChartExporter';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import GenericSankeyExporter from '@modules/charts-generic/charts/exporters/GenericSankeyExporter';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import genericChartStateToChartAbnormalState from './genericChartStateToChartAbnormalState';

export type SankeyValueFormatter = (value: number) => string;

export type GenericSankeyChartProps = Pick<
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
  Pick<SingleChartCardContainerProps, 'headerActionItems'> & {
    chartSummarySpecs?: SingleChartCardContainerProps['chartSummarySpecs'];
    data: SankeyChartData;
    requestStatus: GenericChartState;
    /** Tooltip counts; defaults to `numberFormatter`. */
    valueFormatter?: SankeyValueFormatter;
    formatDataLabel?: (node: SankeyNode) => string;
    noDataMessage?: TranslationKey;
    /** When provided, enables a CSV download button in the chart card header. */
    exportFileName?: string;
    /**
     * Renders the zoom controls and enables gesture zoom and the overview
     * minimap. The diagram stays pannable either way.
     */
    enableZoom?: boolean;
    containerHeight?: number;
    /** Override the default from/to/weight CSV exporter. */
    exporter?: GenericCsvExporter;
  };

const defaultValueFormatter: SankeyValueFormatter = (value): string => {
  return String(numberFormatter(value));
};

const OneDecimalDigit: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const EMPTY_CHART_SUMMARY_SPECS: NonNullable<GenericSankeyChartProps['chartSummarySpecs']> = [];

const GenericSankeyChart: FC<GenericSankeyChartProps> = ({
  titleLabel,
  titleKey = translationKey('Label.Default', TranslationNamespace.Analytics),
  definitionTooltipKey,
  chartWarnings,
  chartSummarySpecs = EMPTY_CHART_SUMMARY_SPECS,
  footerProps,
  chartStyleMode = ChartStyleMode.Normal,
  chartHeight,
  renderWithoutPeripherals,
  data,
  requestStatus,
  valueFormatter = defaultValueFormatter,
  formatDataLabel,
  noDataMessage,
  exportFileName,
  enableZoom,
  containerHeight,
  headerActionItems,
  exporter: customExporter,
  chartBanner,
}) => {
  const { translate, tPendingTranslation } = useRAQIV2TranslationDependencies();

  const defaultExporter = useMemo(
    () =>
      new GenericSankeyExporter(
        wrapNonRAQIMetricAsFormattedTextForExporter(exportFileName ?? ''),
        data,
        translate,
      ),
    [exportFileName, data, translate],
  );
  const activeExporter = customExporter ?? defaultExporter;

  const downloadActionResult = useDownloadAction({
    kpiType: exportFileName ?? '',
    exporter: activeExporter,
  });
  const downloadAction = exportFileName || customExporter ? downloadActionResult : undefined;

  const tooltipFormatter = useCallback(
    (context: SankeyTooltipContext): string => {
      const formattedValue = valueFormatter(context.value);

      if (context.kind === 'node') {
        return `<strong>${context.name}</strong><br/>${formattedValue}`;
      }

      const percentLabel =
        context.sourceShare === undefined
          ? ''
          : ` (${String(
              numberFormatter(context.sourceShare, {
                style: 'percent',
                ...OneDecimalDigit,
              }),
            )})`;

      return `<strong>${context.fromName} → ${context.toName}</strong>&nbsp;&nbsp;${formattedValue}${percentLabel}`;
    },
    [valueFormatter],
  );

  // `analytics-ui` is translation-free, so the accessible names for its zoom
  // controls are resolved here and handed down as a formatter.
  const zoomLabelsFormatter = useMemo(() => {
    if (!enableZoom) {
      return undefined;
    }
    const labels: Record<SankeyZoomAction, string> = {
      zoomIn: tPendingTranslation(
        'Zoom in',
        'Accessible label for the button that zooms into the Sankey diagram.',
        translationKey('Action.ZoomIn', TranslationNamespace.Analytics),
      ),
      zoomOut: tPendingTranslation(
        'Zoom out',
        'Accessible label for the button that zooms out of the Sankey diagram.',
        translationKey('Action.ZoomOut', TranslationNamespace.Analytics),
      ),
      resetView: tPendingTranslation(
        'Reset view',
        'Accessible label for the button that resets the Sankey diagram zoom and pan.',
        translationKey('Action.ResetView', TranslationNamespace.Analytics),
      ),
    };
    return (action: SankeyZoomAction): string => labels[action];
  }, [enableZoom, tPendingTranslation]);

  const hasNoData = data.nodes.length === 0 || data.links.length === 0;
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
            tPendingTranslation,
          }),
    [hasNoData, noDataMessage, requestStatus, translate, tPendingTranslation],
  );

  // ChartCard treats `headerActionItems` as exclusive of `downloadAction`, so
  // prepend download when the caller also supplies header actions (e.g. source query).
  const resolvedHeaderActionItems = useMemo(() => {
    if (!headerActionItems?.length) {
      return undefined;
    }
    if (!downloadAction) {
      return headerActionItems;
    }
    const downloadHeaderAction: ChartCardHeaderAction = {
      id: 'download',
      kind: 'button',
      label: downloadAction.tooltip ?? '',
      onClick: downloadAction.onClick,
      tooltip: downloadAction.tooltip,
      icon: <DownloadIcon fontSize='small' />,
      disabled: !!abnormalState,
      testId: 'chart-download-button',
    };
    return [downloadHeaderAction, ...headerActionItems];
  }, [abnormalState, downloadAction, headerActionItems]);

  const chartComponent = useMemo(
    () => (
      <SankeyChart
        data={data}
        chartStyleMode={chartStyleMode}
        height={chartHeight}
        containerHeight={containerHeight}
        tooltipFormatter={tooltipFormatter}
        formatDataLabel={formatDataLabel}
        zoomLabelsFormatter={zoomLabelsFormatter}
      />
    ),
    [
      chartHeight,
      chartStyleMode,
      containerHeight,
      data,
      formatDataLabel,
      tooltipFormatter,
      zoomLabelsFormatter,
    ],
  );

  const footerContent = useMemo(
    () =>
      chartWarnings?.length || footerProps?.actionLink ? (
        <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
      ) : undefined,
    [chartWarnings, footerProps],
  );

  if (renderWithoutPeripherals) {
    return chartComponent;
  }

  return (
    <SingleChartCardContainer
      downloadAction={resolvedHeaderActionItems ? undefined : downloadAction}
      headerActionItems={resolvedHeaderActionItems}
      titleLabel={titleLabel ?? translate(titleKey)}
      titleTooltipLabel={definitionTooltipKey ? translate(definitionTooltipKey) : undefined}
      chartSummarySpecs={chartSummarySpecs}
      chartBanner={chartBanner}
      footerContent={footerContent}
      abnormalState={abnormalState}>
      {chartComponent}
    </SingleChartCardContainer>
  );
};

export default GenericSankeyChart;
