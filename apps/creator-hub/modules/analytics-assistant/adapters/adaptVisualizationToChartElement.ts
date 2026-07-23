import { SeriesDataTypes, XAxisGranularity, AreaSeriesDataTypes } from '@rbx/analytics-ui';
import type { TAreaSeriesDataTypes } from '@rbx/analytics-ui';
import { RAQIV2MetricGranularity, RAQIV2MetricUnit } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import {
  type TranslationKey,
  type TranslationKeyOrFormattedText,
  type TranslationKeyToFormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations/types';
import {
  formatNumberWithSpec,
  NumberIcon,
  type TFormattingSpec,
} from '@modules/charts-generic/charts/numberFormatters';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { MetricUnitDefaultSuffix } from '@modules/experience-analytics-shared/utils/analyticsNumberFormattingSpec';
import type {
  AreaVisualization,
  BarVisualization,
  CategoricalSeries,
  ColumnVisualization,
  PieVisualization,
  SplineVisualization,
  TableVisualization,
  TimeSeries,
  VisualizationArtifact,
  VisualizationValueFormat,
} from '../types/AssistantVisualizationArtifact';
import type {
  VisualizationAreaChartElement,
  VisualizationBarChartElement,
  VisualizationChartElement,
  VisualizationColumnChartElement,
  VisualizationLineChartElement,
  VisualizationPieChartElement,
  VisualizationTableElement,
} from '../types/AssistantVisualizationChartElement';

const MISSING_VISUALIZATION_VALUE = '-';
const DEFAULT_MAX_FRACTION_DIGITS = 3;

export type VisualizationFormatDependencies = {
  locale: Locale;
  translate: TranslationKeyToFormattedText;
};

export function adaptVisualizationToChartElement(
  artifact: VisualizationArtifact,
  index: number,
): VisualizationChartElement {
  switch (artifact.chartType) {
    case ChartType.Spline:
      return adaptSplineVisualization(artifact, index);
    case ChartType.Area:
      return adaptAreaVisualization(artifact, index);
    case ChartType.Bar:
      return adaptBarVisualization(artifact, index);
    case ChartType.Column:
      return adaptColumnVisualization(artifact, index);
    case ChartType.Pie:
      return adaptPieVisualization(artifact, index);
    case ChartType.Table:
      return adaptTableVisualization(artifact, index);
    default:
      return assertUnhandledVisualizationArtifact(artifact);
  }
}

export default adaptVisualizationToChartElement;

export function formatVisualizationValue(
  value: number | string | null | undefined,
  valueFormat?: VisualizationValueFormat,
  dependencies?: VisualizationFormatDependencies,
): string {
  if (value == null) {
    return MISSING_VISUALIZATION_VALUE;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (!dependencies) {
    return formatVisualizationValueWithIntl(value, valueFormat);
  }
  return String(
    formatNumberWithSpec(value, makeVisualizationFormattingSpec(valueFormat), dependencies),
  );
}

export function makeVisualizationFormattingSpec(
  valueFormat?: VisualizationValueFormat,
): TFormattingSpec {
  const maximumFractionDigits = valueFormat?.precision ?? DEFAULT_MAX_FRACTION_DIGITS;
  const unit = valueFormat?.unit;
  const numberFormatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  };
  if (unit === RAQIV2MetricUnit.Percentage01 || unit === RAQIV2MetricUnit.Percentage0100) {
    numberFormatOptions.style = 'percent';
  }
  if (unit === RAQIV2MetricUnit.Usd) {
    numberFormatOptions.currency = 'USD';
    numberFormatOptions.style = 'currency';
  }
  return {
    abbreviate: valueFormat?.abbreviate ?? false,
    suffix: unit
      ? toTranslationKeyOrFormattedText(MetricUnitDefaultSuffix[unit]?.defaultSuffix)
      : undefined,
    numberFormatOptions,
    icon: unit === RAQIV2MetricUnit.Robux ? NumberIcon.Robux : undefined,
    scalingFactor: getInputScale(valueFormat),
  };
}

function toTranslationKeyOrFormattedText(
  key?: TranslationKey,
): TranslationKeyOrFormattedText | undefined {
  if (!key) {
    return undefined;
  }
  return {
    type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
    key,
  };
}

function formatVisualizationValueWithIntl(
  value: number,
  valueFormat?: VisualizationValueFormat,
): string {
  const scaledValue = value * getInputScale(valueFormat);
  const maximumFractionDigits = valueFormat?.precision ?? DEFAULT_MAX_FRACTION_DIGITS;
  const unit = valueFormat?.unit;
  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits,
    notation: valueFormat?.abbreviate ? 'compact' : 'standard',
  };
  if (unit === RAQIV2MetricUnit.Percentage01 || unit === RAQIV2MetricUnit.Percentage0100) {
    options.style = 'percent';
  }
  if (unit === RAQIV2MetricUnit.Usd) {
    options.currency = 'USD';
    options.style = 'currency';
  }
  return new Intl.NumberFormat(undefined, options).format(scaledValue);
}

function adaptSplineVisualization(
  artifact: SplineVisualization,
  index: number,
): VisualizationLineChartElement {
  const xAxisType = makeTimeSeriesXAxisType(artifact.xAxis?.granularity);
  const base = makeBaseElement(artifact, index);
  return {
    ...base,
    type: ChartType.Spline,
    seriesValueFormats: makeSeriesValueFormats(artifact.series),
    data: {
      series: artifact.series.map((series) => ({
        id: getSeriesValueFormatKey(series.id, series.name),
        name: series.name,
        dataPoints: series.points.map((point) => makeTimeDataPoint(point.x, point.y)),
        type: series.style ?? SeriesDataTypes.Normal,
      })),
      range: artifact.range
        ? {
            id: artifact.range.id,
            name: artifact.range.name,
            topDataPoints: artifact.range.points.map((point) =>
              makeTimeDataPoint(point.x, point.upper),
            ),
            bottomDataPoints: artifact.range.points.map((point) =>
              makeTimeDataPoint(point.x, point.lower),
            ),
            tags: artifact.range.points.map((point) =>
              makeRangeTagDataPoint(point.x, artifact.range?.name ?? ''),
            ),
          }
        : undefined,
    },
    xAxisType,
  };
}

function adaptAreaVisualization(
  artifact: AreaVisualization,
  index: number,
): VisualizationAreaChartElement {
  const xAxisType = makeTimeSeriesXAxisType(artifact.xAxis?.granularity);
  return {
    ...makeBaseElement(artifact, index),
    type: ChartType.Area,
    seriesValueFormats: makeSeriesValueFormats(artifact.series),
    data: {
      series: artifact.series.map((series) => ({
        id: getSeriesValueFormatKey(series.id, series.name),
        name: series.name,
        dataPoints: series.points.map((point) => makeTimeDataPoint(point.x, point.y)),
        type: toAreaSeriesType(series.style),
      })),
    },
    xAxisType,
  };
}

function adaptBarVisualization(
  artifact: BarVisualization,
  index: number,
): VisualizationBarChartElement {
  const orderedCategories = getOrderedCategories(artifact);
  const base = makeBaseElement(artifact, index);
  const series = artifact.series.map((item) => ({
    id: getSeriesValueFormatKey(item.id, item.name),
    name: item.name,
    dataPoints: item.points.map((point) => makeCategoricalDataPoint(point.x, point.y)),
  }));
  return {
    ...base,
    type: ChartType.Bar,
    seriesValueFormats: makeSeriesValueFormats(artifact.series),
    data: {
      series,
      orderedCategories,
    },
  };
}

function adaptColumnVisualization(
  artifact: ColumnVisualization,
  index: number,
): VisualizationColumnChartElement {
  const orderedCategories = getOrderedCategories(artifact);
  const base = makeBaseElement(artifact, index);
  const series = artifact.series.map((item) => ({
    id: getSeriesValueFormatKey(item.id, item.name),
    name: item.name,
    dataPoints: item.points.map((point) => makeCategoricalDataPoint(point.x, point.y)),
  }));
  return {
    ...base,
    type: ChartType.Column,
    seriesValueFormats: makeSeriesValueFormats(artifact.series),
    data: {
      series,
      orderedCategories,
    },
    xAxisType: { type: 'linear' },
    stacking: artifact.stacking,
  };
}

function adaptPieVisualization(
  artifact: PieVisualization,
  index: number,
): VisualizationPieChartElement {
  return {
    ...makeBaseElement(artifact, index),
    type: ChartType.Pie,
    data: {
      series: {
        id: artifact.id,
        name: artifact.seriesName ?? artifact.title,
        dataPoints: artifact.slices.map((slice) =>
          makeCategoricalDataPoint(slice.name, slice.value),
        ),
      },
    },
  };
}

function adaptTableVisualization(
  artifact: TableVisualization,
  index: number,
): VisualizationTableElement {
  return {
    ...makeBaseElement(artifact, index),
    type: ChartType.Table,
    columns: artifact.columns,
    rows: artifact.rows ?? [],
  };
}

function makeBaseElement(
  artifact: VisualizationArtifact,
  index: number,
): Pick<VisualizationChartElement, 'key' | 'title' | 'description' | 'valueFormat' | 'summaries'> {
  return {
    key: artifact.id ?? `${artifact.chartType}-${index}`,
    title: artifact.title,
    description: artifact.description,
    valueFormat: artifact.valueFormat,
    summaries: artifact.summaries,
  };
}

function makeTimeSeriesXAxisType(granularity?: RAQIV2MetricGranularity | null) {
  if (granularity === RAQIV2MetricGranularity.OneMonth) {
    return { type: 'datetime' as const, granularity: XAxisGranularity.Month };
  }
  if (
    granularity === RAQIV2MetricGranularity.OneWeek ||
    granularity === RAQIV2MetricGranularity.OneDay
  ) {
    return { type: 'datetime' as const, granularity: XAxisGranularity.Day };
  }
  return { type: 'datetime' as const, granularity: XAxisGranularity.Minute };
}

function getOrderedCategories(artifact: BarVisualization | ColumnVisualization): string[] {
  const categories: string[] = [];
  artifact.series.forEach((series) => {
    series.points.forEach((point) => {
      if (!categories.includes(point.x)) {
        categories.push(point.x);
      }
    });
  });
  return categories;
}

function toAreaSeriesType(style?: SeriesDataTypes): TAreaSeriesDataTypes {
  return AreaSeriesDataTypes.find((value) => value === style) ?? SeriesDataTypes.Normal;
}

function getInputScale(valueFormat?: VisualizationValueFormat): number {
  const unitDefault = valueFormat?.unit === RAQIV2MetricUnit.Percentage0100 ? 0.01 : 1;
  return unitDefault * (valueFormat?.inputScale ?? 1);
}

export function getSeriesValueFormatKey(id: string | undefined, name: string): string {
  return id ?? name;
}

function makeSeriesValueFormats(
  series: Array<Pick<TimeSeries | CategoricalSeries, 'id' | 'name' | 'valueFormat'>>,
): Record<string, VisualizationValueFormat> | undefined {
  const entries = series.flatMap((item) =>
    item.valueFormat
      ? [[getSeriesValueFormatKey(item.id, item.name), item.valueFormat] as const]
      : [],
  );
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

function makeTimeDataPoint(x: string, y: number | null): [number, number | null] {
  return [Date.parse(x), y];
}

function makeRangeTagDataPoint(x: string, tag: string): [number, string] {
  return [Date.parse(x), tag];
}

function makeCategoricalDataPoint(x: string, y: number | null): [string, number | null] {
  return [x, y];
}

function assertUnhandledVisualizationArtifact(artifact: never): never {
  void artifact;
  throw new Error('Unhandled visualization artifact');
}
