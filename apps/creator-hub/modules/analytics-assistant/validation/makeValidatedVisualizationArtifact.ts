import { SeriesDataTypes } from '@rbx/analytics-ui';
import { RAQIV2MetricGranularity, RAQIV2MetricUnit } from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type {
  AreaVisualization,
  BarVisualization,
  CategoricalPoint,
  CategoricalSeries,
  CategoricalXAxis,
  ColumnVisualization,
  PieSlice,
  PieVisualization,
  SplineVisualization,
  TableColumn,
  TableRow,
  TableVisualization,
  TimeSeries,
  TimeSeriesPoint,
  TimeSeriesRange,
  TimeSeriesRangePoint,
  TimeSeriesXAxis,
  VisualizationArtifact,
  VisualizationBase,
  VisualizationEnvelope,
  VisualizationSummary,
  VisualizationSummaryComparison,
  VisualizationTableColumnType,
  VisualizationValueFormat,
} from '../types/AssistantVisualizationArtifact';

const SUPPORTED_VISUALIZATION_CHART_TYPES = [
  ChartType.Spline,
  ChartType.Area,
  ChartType.Bar,
  ChartType.Column,
  ChartType.Pie,
  ChartType.Table,
] as const;
type SupportedVisualizationChartType = (typeof SUPPORTED_VISUALIZATION_CHART_TYPES)[number];

const SUPPORTED_TABLE_COLUMN_TYPES = [
  ColumnType.Text,
  ColumnType.Number,
  ColumnType.Timestamp,
  ColumnType.Date,
  ColumnType.Code,
] as const;

const ISO_TIMESTAMP_WITH_TIMEZONE = /(?:Z|[+-]\d{2}:\d{2})$/;
// Six fraction digits preserve fine-grained rates without creating noisy chart labels.
const MAX_VALUE_FORMAT_PRECISION = 6;

export function toValidatedVisualizationEnvelope(data: unknown): VisualizationEnvelope {
  const record = requireRecord(data, 'VisualizationEnvelope');
  if (record.version !== 1) {
    throw new Error('VisualizationEnvelope version must be 1');
  }
  const artifacts = requireArray(record.artifacts, 'VisualizationEnvelope.artifacts');
  if (artifacts.length === 0) {
    throw new Error('VisualizationEnvelope.artifacts must contain at least one artifact');
  }

  const validatedArtifacts = artifacts.flatMap((artifact, index) => {
    try {
      return [
        toValidatedVisualizationArtifact(artifact, `VisualizationEnvelope.artifacts[${index}]`),
      ];
    } catch (error) {
      logAnalyticsError(error);
      return [];
    }
  });

  return {
    version: 1,
    artifacts: validatedArtifacts,
  };
}

export function toValidatedVisualizationArtifact(
  data: unknown,
  path = 'VisualizationArtifact',
): VisualizationArtifact {
  const record = requireRecord(data, path);
  const chartType = validateChartType(record.chartType, `${path}.chartType`);
  switch (chartType) {
    case ChartType.Spline:
      return validateSplineVisualization(record, path);
    case ChartType.Area:
      return validateAreaVisualization(record, path);
    case ChartType.Bar:
      return validateBarVisualization(record, path);
    case ChartType.Column:
      return validateColumnVisualization(record, path);
    case ChartType.Pie:
      return validatePieVisualization(record, path);
    case ChartType.Table:
      return validateTableVisualization(record, path);
    default:
      return assertUnhandledChartType(chartType);
  }
}

function validateSplineVisualization(
  record: Record<string, unknown>,
  path: string,
): SplineVisualization {
  const series = requireArray(record.series, `${path}.series`);
  if (series.length === 0) {
    throw new Error(`${path}.series must contain at least one series`);
  }
  const validatedSeries = series.map((item, index) =>
    validateTimeSeries(item, `${path}.series[${index}]`),
  );
  const range =
    record.range == null ? undefined : validateTimeSeriesRange(record.range, `${path}.range`);

  return {
    ...validateBase(record, path),
    chartType: ChartType.Spline,
    xAxis: record.xAxis == null ? {} : validateTimeSeriesXAxis(record.xAxis, `${path}.xAxis`),
    series: validatedSeries,
    range,
  };
}

function validateAreaVisualization(
  record: Record<string, unknown>,
  path: string,
): AreaVisualization {
  const series = requireArray(record.series, `${path}.series`);
  if (series.length === 0) {
    throw new Error(`${path}.series must contain at least one series`);
  }
  const validatedSeries = series.map((item, index) =>
    validateTimeSeries(item, `${path}.series[${index}]`),
  );

  return {
    ...validateBase(record, path),
    chartType: ChartType.Area,
    xAxis: record.xAxis == null ? {} : validateTimeSeriesXAxis(record.xAxis, `${path}.xAxis`),
    series: validatedSeries,
  };
}

function validateBarVisualization(record: Record<string, unknown>, path: string): BarVisualization {
  const series = requireArray(record.series, `${path}.series`);
  if (series.length === 0) {
    throw new Error(`${path}.series must contain at least one series`);
  }
  const validatedSeries = series.map((item, index) =>
    validateCategoricalSeries(item, `${path}.series[${index}]`),
  );

  return {
    ...validateBase(record, path),
    chartType: ChartType.Bar,
    xAxis: record.xAxis == null ? {} : validateCategoricalXAxis(record.xAxis, `${path}.xAxis`),
    series: validatedSeries,
  };
}

function validateColumnVisualization(
  record: Record<string, unknown>,
  path: string,
): ColumnVisualization {
  const series = requireArray(record.series, `${path}.series`);
  if (series.length === 0) {
    throw new Error(`${path}.series must contain at least one series`);
  }
  const validatedSeries = series.map((item, index) =>
    validateCategoricalSeries(item, `${path}.series[${index}]`),
  );

  return {
    ...validateBase(record, path),
    chartType: ChartType.Column,
    xAxis: record.xAxis == null ? {} : validateCategoricalXAxis(record.xAxis, `${path}.xAxis`),
    series: validatedSeries,
    stacking:
      record.stacking == null ? undefined : requireBoolean(record.stacking, `${path}.stacking`),
  };
}

function validatePieVisualization(record: Record<string, unknown>, path: string): PieVisualization {
  const slices = requireArray(record.slices, `${path}.slices`);
  if (slices.length === 0) {
    throw new Error(`${path}.slices must contain at least one slice`);
  }

  return {
    ...validateBase(record, path),
    chartType: ChartType.Pie,
    seriesName: optionalNonEmptyString(record.seriesName, `${path}.seriesName`),
    slices: slices.map((slice, index) => validatePieSlice(slice, `${path}.slices[${index}]`)),
  };
}

function validateTableVisualization(
  record: Record<string, unknown>,
  path: string,
): TableVisualization {
  const columns = requireArray(record.columns, `${path}.columns`);
  if (columns.length === 0) {
    throw new Error(`${path}.columns must contain at least one column`);
  }
  const validatedColumns = columns.map((column, index) =>
    validateTableColumn(column, `${path}.columns[${index}]`),
  );
  const columnKeys = validatedColumns.map((column) => column.key);
  const duplicateKeys = columnKeys.filter((key, index) => columnKeys.indexOf(key) !== index);
  if (duplicateKeys.length > 0) {
    throw new Error(`${path}.columns contains duplicate keys: ${duplicateKeys.join(', ')}`);
  }

  const rows = record.rows == null ? [] : requireArray(record.rows, `${path}.rows`);
  const columnsByKey = new Map(validatedColumns.map((column) => [column.key, column]));

  return {
    ...validateBase(record, path),
    chartType: ChartType.Table,
    columns: validatedColumns,
    rows: rows.map((row, index) => validateTableRow(row, columnsByKey, `${path}.rows[${index}]`)),
  };
}

function validateBase(record: Record<string, unknown>, path: string): VisualizationBase {
  return {
    id: optionalNonEmptyString(record.id, `${path}.id`),
    title: requireNonEmptyString(record.title, `${path}.title`),
    description: optionalNonEmptyString(record.description, `${path}.description`),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
    summaries: validateOptionalSummaries(record.summaries, `${path}.summaries`),
  };
}

function validateOptionalSummaries(
  data: unknown,
  path: string,
): VisualizationSummary[] | undefined {
  if (data == null) {
    return undefined;
  }
  return requireArray(data, path).map((summary, index) =>
    validateSummary(summary, `${path}[${index}]`),
  );
}

function validateSummary(data: unknown, path: string): VisualizationSummary {
  const record = requireRecord(data, path);
  return {
    key: optionalNonEmptyString(record.key, `${path}.key`),
    description: requireNonEmptyString(record.description, `${path}.description`),
    value: requireNullableSummaryValue(record.value, `${path}.value`),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
    tooltip: optionalNonEmptyString(record.tooltip, `${path}.tooltip`),
    comparison:
      record.comparison == null
        ? undefined
        : validateSummaryComparison(record.comparison, `${path}.comparison`),
  };
}

function validateSummaryComparison(data: unknown, path: string): VisualizationSummaryComparison {
  const record = requireRecord(data, path);
  return {
    value: requireNullableSummaryValue(record.value, `${path}.value`),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
    isUp: requireBoolean(record.isUp, `${path}.isUp`),
    isGood: requireBoolean(record.isGood, `${path}.isGood`),
    tooltip: optionalNonEmptyString(record.tooltip, `${path}.tooltip`),
  };
}

function validateValueFormat(data: unknown, path: string): VisualizationValueFormat {
  const record = requireRecord(data, path);
  const valueFormat: VisualizationValueFormat = {};
  if (record.unit != null) {
    if (
      (typeof record.unit !== 'string' && typeof record.unit !== 'number') ||
      !isValidEnumValue(RAQIV2MetricUnit, record.unit)
    ) {
      throw new Error(`${path}.unit is invalid: ${formatUnknownValue(record.unit)}`);
    }
    valueFormat.unit = record.unit;
  }
  if (record.precision != null) {
    valueFormat.precision = requireIntegerInRange(
      record.precision,
      0,
      MAX_VALUE_FORMAT_PRECISION,
      `${path}.precision`,
    );
  }
  if (record.abbreviate != null) {
    if (typeof record.abbreviate !== 'boolean') {
      throw new TypeError(`${path}.abbreviate must be a boolean`);
    }
    valueFormat.abbreviate = record.abbreviate;
  }
  if (record.inputScale != null) {
    valueFormat.inputScale = requireFiniteNumber(record.inputScale, `${path}.inputScale`);
    if (valueFormat.inputScale <= 0) {
      throw new Error(`${path}.inputScale must be greater than 0`);
    }
  }
  return valueFormat;
}

function validateTimeSeriesXAxis(data: unknown, path: string): TimeSeriesXAxis {
  const record = requireRecord(data, path);
  const xAxis: TimeSeriesXAxis = {};
  if (record.granularity != null) {
    if (
      (typeof record.granularity !== 'string' && typeof record.granularity !== 'number') ||
      !isValidEnumValue(RAQIV2MetricGranularity, record.granularity)
    ) {
      throw new Error(`${path}.granularity is invalid: ${formatUnknownValue(record.granularity)}`);
    }
    xAxis.granularity = record.granularity;
  }
  return xAxis;
}

function validateCategoricalXAxis(data: unknown, path: string): CategoricalXAxis {
  const record = requireRecord(data, path);
  return {
    label: optionalNonEmptyString(record.label, `${path}.label`),
  };
}

function validateTimeSeries(data: unknown, path: string): TimeSeries {
  const record = requireRecord(data, path);
  const points = requireArray(record.points, `${path}.points`);
  if (points.length === 0) {
    throw new Error(`${path}.points must contain at least one point`);
  }
  return {
    id: optionalNonEmptyString(record.id, `${path}.id`),
    name: requireNonEmptyString(record.name, `${path}.name`),
    points: points.map((point, index) =>
      validateTimeSeriesPoint(point, `${path}.points[${index}]`),
    ),
    style: validateOptionalSeriesStyle(record.style, `${path}.style`),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
  };
}

function validateTimeSeriesRange(data: unknown, path: string): TimeSeriesRange {
  const record = requireRecord(data, path);
  const points = requireArray(record.points, `${path}.points`);
  if (points.length === 0) {
    throw new Error(`${path}.points must contain at least one point`);
  }
  return {
    id: optionalNonEmptyString(record.id, `${path}.id`),
    name: requireNonEmptyString(record.name, `${path}.name`),
    points: points.map((point, index) =>
      validateTimeSeriesRangePoint(point, `${path}.points[${index}]`),
    ),
  };
}

function validateCategoricalSeries(data: unknown, path: string): CategoricalSeries {
  const record = requireRecord(data, path);
  const points = requireArray(record.points, `${path}.points`);
  if (points.length === 0) {
    throw new Error(`${path}.points must contain at least one point`);
  }
  return {
    id: optionalNonEmptyString(record.id, `${path}.id`),
    name: requireNonEmptyString(record.name, `${path}.name`),
    points: points.map((point, index) =>
      validateCategoricalPoint(point, `${path}.points[${index}]`),
    ),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
  };
}

function validateTimeSeriesPoint(data: unknown, path: string): TimeSeriesPoint {
  const record = requireRecord(data, path);
  return {
    x: requireIsoTimestamp(record.x, `${path}.x`),
    y: requireNullableFiniteNumber(record.y, `${path}.y`),
  };
}

function validateTimeSeriesRangePoint(data: unknown, path: string): TimeSeriesRangePoint {
  const record = requireRecord(data, path);
  return {
    x: requireIsoTimestamp(record.x, `${path}.x`),
    lower: requireNullableFiniteNumber(record.lower, `${path}.lower`),
    upper: requireNullableFiniteNumber(record.upper, `${path}.upper`),
  };
}

function validateCategoricalPoint(data: unknown, path: string): CategoricalPoint {
  const record = requireRecord(data, path);
  return {
    x: requireNonEmptyString(record.x, `${path}.x`),
    y: requireNullableFiniteNumber(record.y, `${path}.y`),
  };
}

function validatePieSlice(data: unknown, path: string): PieSlice {
  const record = requireRecord(data, path);
  return {
    name: requireNonEmptyString(record.name, `${path}.name`),
    value: requireNullableFiniteNumber(record.value, `${path}.value`),
  };
}

function validateTableColumn(data: unknown, path: string): TableColumn {
  const record = requireRecord(data, path);
  return {
    key: requireNonEmptyString(record.key, `${path}.key`),
    title: requireNonEmptyString(record.title, `${path}.title`),
    type: validateOptionalTableColumnType(record.type, `${path}.type`),
    valueFormat:
      record.valueFormat == null
        ? undefined
        : validateValueFormat(record.valueFormat, `${path}.valueFormat`),
  };
}

function validateTableRow(
  data: unknown,
  columnsByKey: Map<string, TableColumn>,
  path: string,
): TableRow {
  const record = requireRecord(data, path);
  const cells = requireRecord(record.cells, `${path}.cells`);
  const validatedCells: TableRow['cells'] = {};
  Object.entries(cells).forEach(([key, value]) => {
    const column = columnsByKey.get(key);
    if (!column) {
      throw new Error(`${path}.cells.${key} references an unknown column`);
    }
    validatedCells[key] = validateTableCellValue(value, column, `${path}.cells.${key}`);
  });
  return {
    id: optionalNonEmptyString(record.id, `${path}.id`),
    cells: validatedCells,
  };
}

function validateTableCellValue(
  data: unknown,
  column: TableColumn,
  path: string,
): string | number | boolean | null {
  if (data == null) {
    return null;
  }
  if (column.type === ColumnType.Number) {
    return requireFiniteNumber(data, path);
  }
  if (column.type === ColumnType.Date || column.type === ColumnType.Timestamp) {
    return requireIsoTimestamp(data, path);
  }
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    if (typeof data === 'number' && !Number.isFinite(data)) {
      throw new TypeError(`${path} must be finite`);
    }
    return data;
  }
  throw new Error(`${path} must be a scalar table cell value`);
}

function validateChartType(data: unknown, path: string): SupportedVisualizationChartType {
  return validateRequiredStringUnion(data, SUPPORTED_VISUALIZATION_CHART_TYPES, path);
}

function validateOptionalSeriesStyle(data: unknown, path: string): SeriesDataTypes | undefined {
  if (data == null) {
    return undefined;
  }
  return validateRequiredStringUnion(data, Object.values(SeriesDataTypes), path);
}

function validateOptionalTableColumnType(
  data: unknown,
  path: string,
): VisualizationTableColumnType | undefined {
  if (data == null) {
    return undefined;
  }
  return validateRequiredStringUnion(data, SUPPORTED_TABLE_COLUMN_TYPES, path);
}

function validateRequiredStringUnion<TValue extends string>(
  data: unknown,
  values: readonly TValue[],
  path: string,
): TValue {
  if (typeof data === 'string') {
    const value = values.find((candidate) => candidate === data);
    if (value !== undefined) {
      return value;
    }
  }
  throw new Error(`${path} is invalid: ${formatUnknownValue(data)}`);
}

function requireRecord(data: unknown, path: string): Record<string, unknown> {
  if (!isRecord(data)) {
    throw new TypeError(`${path} must be an object`);
  }
  return data;
}

function requireArray(data: unknown, path: string): unknown[] {
  if (!Array.isArray(data)) {
    throw new TypeError(`${path} must be an array`);
  }
  return data;
}

function requireNonEmptyString(data: unknown, path: string): string {
  if (typeof data !== 'string' || data.length === 0) {
    throw new TypeError(`${path} must be a non-empty string`);
  }
  return data;
}

function optionalNonEmptyString(data: unknown, path: string): string | undefined {
  if (data == null) {
    return undefined;
  }
  return requireNonEmptyString(data, path);
}

function requireIsoTimestamp(data: unknown, path: string): string {
  const value = requireNonEmptyString(data, path);
  if (!ISO_TIMESTAMP_WITH_TIMEZONE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${path} must be an ISO 8601 timestamp with timezone`);
  }
  return value;
}

function requireFiniteNumber(data: unknown, path: string): number {
  if (typeof data !== 'number' || !Number.isFinite(data)) {
    throw new TypeError(`${path} must be a finite number`);
  }
  return data;
}

function requireBoolean(data: unknown, path: string): boolean {
  if (typeof data !== 'boolean') {
    throw new TypeError(`${path} must be a boolean`);
  }
  return data;
}

function requireNullableFiniteNumber(data: unknown, path: string): number | null {
  if (data == null) {
    return null;
  }
  return requireFiniteNumber(data, path);
}

function requireNullableSummaryValue(data: unknown, path: string): string | number | null {
  if (data === undefined) {
    throw new TypeError(`${path} is required`);
  }
  if (data === null) {
    return null;
  }
  if (typeof data === 'string') {
    return data;
  }
  return requireFiniteNumber(data, path);
}

function requireIntegerInRange(data: unknown, min: number, max: number, path: string): number {
  const value = requireFiniteNumber(data, path);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${path} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data != null && !Array.isArray(data);
}

function formatUnknownValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol' ||
    value === undefined
  ) {
    return String(value);
  }
  if (value === null) {
    return 'null';
  }
  return '[object]';
}

function assertUnhandledChartType(chartType: never): never {
  void chartType;
  throw new Error('Unhandled visualization chart type');
}
