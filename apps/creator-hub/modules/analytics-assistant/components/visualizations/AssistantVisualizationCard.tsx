import React, { useMemo } from 'react';
import {
  AreaChart,
  BarChart,
  ChartStyleMode,
  ColumnChart,
  LineChart,
  PieChart,
  SingleChartCardContainer,
  XAxisGranularity,
} from '@rbx/analytics-ui';
import type { SingleChartCardContainerProps, YAxisConfig } from '@rbx/analytics-ui';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import { formatTimestampForChartTooltip } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import ChartsGenericXAxisGranularity from '@modules/charts-generic/enums/XAxisGranularity';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import FlagGatedOwnershipWatermark from '@modules/experience-analytics-shared/components/FlagGatedOwnershipWatermark';
import {
  formatVisualizationValue,
  type VisualizationFormatDependencies,
} from '../../adapters/adaptVisualizationToChartElement';
import VisualizationCsvExporter from '../../exporters/VisualizationCsvExporter';
import type {
  VisualizationChartElement,
  VisualizationTableElement,
} from '../../types/AssistantVisualizationChartElement';

type AssistantVisualizationCardProps = {
  element: VisualizationChartElement;
  /** Used by the ownership watermark when assistant-generated charts lack metric ownership. */
  conversationId?: string;
};

const CHART_HEIGHT = 360;
const UTC_TIME_ZONE = 'UTC';

const AssistantVisualizationCard = ({
  element,
  conversationId,
}: AssistantVisualizationCardProps) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());
  const formattingDependencies = useMemo(() => ({ locale, translate }), [locale, translate]);
  const timeSeriesXAxisFormatter = useXAxisFormatter(
    locale,
    getTimeSeriesGranularity(element),
    getTimeSeriesXAxisGranularity(element),
    ChartStyleMode.Normal,
  );
  const xAxisFormatter = useMemo(
    () => makeXAxisFormatter(element, formattingDependencies, timeSeriesXAxisFormatter),
    [element, formattingDependencies, timeSeriesXAxisFormatter],
  );
  const tooltipFormatters = useMemo(
    () => makeVisualizationTooltipFormatters(element, formattingDependencies),
    [element, formattingDependencies],
  );
  const yAxisConfig = useMemo(
    () => makeYAxisConfig(element, formattingDependencies),
    [element, formattingDependencies],
  );
  const chartSummarySpecs = useMemo(
    () => makeChartSummarySpecs(element, formattingDependencies),
    [element, formattingDependencies],
  );
  const exporter = useMemo(
    () => new VisualizationCsvExporter(element, translate),
    [element, translate],
  );
  const downloadAction = useDownloadAction({ kpiType: element.title, exporter });
  const ownershipWatermarkSlots = useMemo(
    () => ({
      watermark: <FlagGatedOwnershipWatermark conversationId={conversationId} />,
    }),
    [conversationId],
  );

  return (
    <Grid item XSmall={12}>
      <SingleChartCardContainer
        titleLabel={element.title}
        titleTooltipLabel={element.description}
        chartSummarySpecs={chartSummarySpecs}
        downloadAction={downloadAction}
        slots={ownershipWatermarkSlots}>
        {renderVisualizationElement(
          element,
          tooltipFormatters,
          xAxisFormatter,
          yAxisConfig,
          formattingDependencies,
        )}
      </SingleChartCardContainer>
    </Grid>
  );
};

function renderVisualizationElement(
  element: VisualizationChartElement,
  tooltipFormatters: ReturnType<typeof makeVisualizationTooltipFormatters>,
  xAxisFormatter: ReturnType<typeof makeXAxisFormatter>,
  yAxisConfig: YAxisConfig | undefined,
  formattingDependencies: VisualizationFormatDependencies,
) {
  switch (element.type) {
    case ChartType.Spline:
      return (
        <LineChart
          data={element.data}
          tooltipFormatters={tooltipFormatters.line}
          xAxisFormatter={xAxisFormatter}
          xAxisType={element.xAxisType}
          yAxisConfigs={yAxisConfig ? [yAxisConfig] : undefined}
          chartStyleMode={ChartStyleMode.Normal}
          height={CHART_HEIGHT}
        />
      );
    case ChartType.Area:
      return (
        <AreaChart
          data={element.data}
          tooltipFormatters={tooltipFormatters.base}
          xAxisFormatter={xAxisFormatter}
          xAxisType={element.xAxisType}
          yAxisConfig={yAxisConfig}
          chartStyleMode={ChartStyleMode.Normal}
          height={CHART_HEIGHT}
        />
      );
    case ChartType.Bar:
      return (
        <BarChart
          data={element.data}
          tooltipFormatters={tooltipFormatters.base}
          chartStyleMode={ChartStyleMode.Normal}
          height={CHART_HEIGHT}
        />
      );
    case ChartType.Column:
      return (
        <ColumnChart
          data={element.data}
          tooltipFormatters={tooltipFormatters.column}
          xAxisFormatter={xAxisFormatter}
          xAxisType={element.xAxisType}
          stacking={element.stacking}
          yAxisConfig={yAxisConfig}
          chartStyleMode={ChartStyleMode.Normal}
          height={CHART_HEIGHT}
        />
      );
    case ChartType.Pie:
      return (
        <PieChart
          data={element.data}
          tooltipFormatters={tooltipFormatters.pie}
          chartStyleMode={ChartStyleMode.Normal}
          height={CHART_HEIGHT}
        />
      );
    case ChartType.Table:
      return (
        <VisualizationTable element={element} formattingDependencies={formattingDependencies} />
      );
    default:
      return assertUnhandledVisualizationElement(element);
  }
}

function VisualizationTable({
  element,
  formattingDependencies,
}: {
  element: VisualizationTableElement;
  formattingDependencies: VisualizationFormatDependencies;
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {element.columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.type === ColumnType.Number ? 'right' : 'left'}>
                {column.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {element.rows.map((row, rowIndex) => (
            <TableRow key={row.id ?? rowIndex}>
              {element.columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.type === ColumnType.Number ? 'right' : 'left'}>
                  {formatTableCell(
                    row.cells[column.key],
                    column.type,
                    column.valueFormat,
                    formattingDependencies,
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function formatTableCell(
  value: string | number | boolean | null | undefined,
  columnType?: ColumnType,
  valueFormat?: VisualizationChartElement['valueFormat'],
  formattingDependencies?: VisualizationFormatDependencies,
): string {
  if (value == null) {
    return formatVisualizationValue(value, valueFormat, formattingDependencies);
  }
  if (typeof value === 'number') {
    return formatVisualizationValue(value, valueFormat, formattingDependencies);
  }
  if (typeof value === 'string' && columnType === ColumnType.Date) {
    return formatDateOnlyValue(value, formattingDependencies?.locale);
  }
  if (typeof value === 'string' && columnType === ColumnType.Timestamp) {
    return formatTimestampValue(value, formattingDependencies?.locale);
  }
  return String(value);
}

function makeYAxisConfig(
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
): YAxisConfig | undefined {
  if (!element.valueFormat) {
    return undefined;
  }
  return {
    yAxisFormatter: ({ value }: { value: string | number }) => {
      const numericValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numericValue)) {
        return String(value);
      }
      return formatVisualizationValue(numericValue, element.valueFormat, formattingDependencies);
    },
  };
}

function makeChartSummarySpecs(
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
): SingleChartCardContainerProps['chartSummarySpecs'] {
  return (element.summaries ?? []).map((summary, index) => ({
    key: summary.key ?? `${element.key}-summary-${index}`,
    summaryValue: formatVisualizationValue(
      summary.value,
      summary.valueFormat ?? element.valueFormat,
      formattingDependencies,
    ),
    description: summary.description,
    tooltip: summary.tooltip,
    comparisonChipSpec: summary.comparison
      ? {
          isUp: summary.comparison.isUp,
          isGood: summary.comparison.isGood,
          formattedLabel: formatVisualizationValue(
            summary.comparison.value,
            summary.comparison.valueFormat,
            formattingDependencies,
          ),
          tooltip: summary.comparison.tooltip,
        }
      : undefined,
  }));
}

function makeVisualizationTooltipFormatters(
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
) {
  const base = makeTooltipFormatters(element, formattingDependencies);
  return {
    base,
    line: {
      ...base,
      formatRange: ({
        bottom,
        top,
        tag,
      }: {
        bottom: number | null;
        top: number | null;
        tag?: unknown;
      }) => ({
        rangeKey: typeof tag === 'string' ? tag : undefined,
        rangeValue: `${formatVisualizationValue(bottom, element.valueFormat, formattingDependencies)} - ${formatVisualizationValue(
          top,
          element.valueFormat,
          formattingDependencies,
        )}`,
      }),
    },
    column: {
      ...base,
      formatXForPoint: (x: number | string) => String(x),
    },
    pie: {
      formatSeriesKeyForSlice: ({ sliceName }: { sliceName: string }) => sliceName,
      formatSeriesValueForSlice: ({ sliceValue }: { sliceValue: number | null }) =>
        formatVisualizationValue(sliceValue, element.valueFormat, formattingDependencies),
    },
  };
}

function makeTooltipFormatters(
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
) {
  return {
    formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => seriesName,
    formatSeriesValueForPoint: ({ y, seriesId }: { y: number; seriesId?: string }) => {
      const valueFormat =
        (seriesId ? element.seriesValueFormats?.[seriesId] : undefined) ?? element.valueFormat;
      return formatVisualizationValue(y, valueFormat, formattingDependencies);
    },
    formatXForPoint: (x: number | string) =>
      formatTooltipXValue(x, element, formattingDependencies),
  };
}

function makeXAxisFormatter(
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
  timeSeriesXAxisFormatter: ReturnType<typeof useXAxisFormatter>,
) {
  return ({ value }: { value: number | string }) => {
    if (element.type === ChartType.Spline || element.type === ChartType.Area) {
      return formatXValue(value, element, formattingDependencies, timeSeriesXAxisFormatter);
    }
    return String(value);
  };
}

function formatXValue(
  value: number | string,
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
  timeSeriesXAxisFormatter: ReturnType<typeof useXAxisFormatter>,
): string {
  if (typeof value === 'number') {
    if (element.type === ChartType.Spline || element.type === ChartType.Area) {
      return timeSeriesXAxisFormatter({ value });
    }
    return formatDateOnlyValue(value, formattingDependencies.locale);
  }
  return value;
}

function formatTooltipXValue(
  value: number | string,
  element: VisualizationChartElement,
  formattingDependencies: VisualizationFormatDependencies,
): string {
  if (typeof value === 'number') {
    if (element.type === ChartType.Spline || element.type === ChartType.Area) {
      return formatTimestampForChartTooltip(
        getTimeSeriesGranularity(element),
        formattingDependencies.locale,
        new Date(value),
        formattingDependencies.translate,
      );
    }
    return formatDateOnlyValue(value, formattingDependencies.locale);
  }
  return value;
}

function getTimeSeriesGranularity(element: VisualizationChartElement): RAQIV2MetricGranularity {
  if (element.type === ChartType.Spline || element.type === ChartType.Area) {
    switch (element.xAxisType.granularity) {
      case XAxisGranularity.Month:
        return RAQIV2MetricGranularity.OneMonth;
      case XAxisGranularity.Minute:
        return RAQIV2MetricGranularity.OneMinute;
      case XAxisGranularity.Day:
        return RAQIV2MetricGranularity.OneDay;
      default: {
        const exhaustiveCheck: never = element.xAxisType.granularity;
        void exhaustiveCheck;
        throw new Error('Unhandled x-axis granularity');
      }
    }
  }
  return RAQIV2MetricGranularity.OneDay;
}

function getTimeSeriesXAxisGranularity(
  element: VisualizationChartElement,
): ChartsGenericXAxisGranularity {
  if (element.type === ChartType.Spline || element.type === ChartType.Area) {
    switch (element.xAxisType.granularity) {
      case XAxisGranularity.Month:
        return ChartsGenericXAxisGranularity.Month;
      case XAxisGranularity.Minute:
        return ChartsGenericXAxisGranularity.Minute;
      case XAxisGranularity.Day:
        return ChartsGenericXAxisGranularity.Day;
      default: {
        const exhaustiveCheck: never = element.xAxisType.granularity;
        void exhaustiveCheck;
        throw new Error('Unhandled x-axis granularity');
      }
    }
  }
  return ChartsGenericXAxisGranularity.Day;
}

function formatDateOnlyValue(
  value: number | string,
  locale?: VisualizationFormatDependencies['locale'],
): string {
  return new Date(value).toLocaleDateString(locale, { timeZone: UTC_TIME_ZONE });
}

function formatTimestampValue(
  value: number | string,
  locale?: VisualizationFormatDependencies['locale'],
): string {
  return new Date(value).toLocaleString(locale, { timeZone: UTC_TIME_ZONE });
}

function assertUnhandledVisualizationElement(element: never): never {
  void element;
  throw new Error('Unhandled visualization element');
}

export default AssistantVisualizationCard;
