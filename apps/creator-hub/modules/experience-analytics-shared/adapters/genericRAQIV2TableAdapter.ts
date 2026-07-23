import {
  RAQIV2BreakdownValueOrder,
  RAQIV2DimensionDisplayConfig,
  RAQIV2MetricGranularity,
  RAQIV2MetricValueType,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { getComparisonChipSpec } from '@modules/charts-generic/utils/comparisonChipUtils';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIV2BreakdownValue, RAQIV2MetricValue } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getDimensionColumnDisplayConfig from '../components/getDimensionColumnDisplayConfig';
import getRAQIV2MetricValueRenderer from '../components/getRAQIV2MetricValueRenderer';
import type { MetricTableColumnSpec, TableColumnSpec } from '../components/RAQIV2/table/types';
import { isRAQIV2TableColumnSpec } from '../components/RAQIV2/table/types';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import { getUIMetricFromAtomicMetricLike, isComputedMetric } from '../types/ComputedMetric';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { getMetricLabelFromMetricLike } from '../utils/metricLikeSemantics';
import type { BreakdownLabel } from './genericRAQIV2ChartAdapter';
import { getSingleDimensionBreakdownLabel } from './genericRAQIV2ChartAdapter';
import { sortInPlaceByBreakdownOrdering } from './sortRAQIV2SeriesByBreakdowns';

export type RAQIV2TableColumnKey = string; // Previously RAQIV2PredefinedTableColumnKey | RAQIV2Metric | TRAQIV2Dimension;

export type RAQIV2TableRowID = string & { _: RAQIV2TableRowID };

/**
 * Synthetic dimension key used to represent a per-time-bucket row when a table
 * column spec uses a non-`None` granularity. The value is intentionally chosen
 * so it cannot collide with any real {@link TRAQIV2Dimension} member (those are
 * PascalCase enum members), and it is treated specially anywhere it appears as
 * a row's "dimension" — including the row hash and the dimension column
 * rendering path.
 */
export const TIMESTAMP_PSEUDO_DIMENSION = '__pseudo_timestamp__';

/**
 * True if any of the provided specs has a non-None granularity, in which case
 * the table is implicitly time-bucketed and a synthetic Timestamp column is
 * added.
 */
export const isTimeBucketedTableSpecs = (
  specs: ReadonlyMap<RAQIV2TableColumnKey, MetricTableColumnSpec<RAQIV2TableColumnKey>>,
): boolean =>
  Array.from(specs.values()).some(
    (spec) => spec.granularity != null && spec.granularity !== RAQIV2MetricGranularity.None,
  );

const makeTimestampPseudoBreakdownValue = (time: string): RAQIV2BreakdownValue => ({
  dimension: TIMESTAMP_PSEUDO_DIMENSION,
  value: time,
  displayValue: time,
});

/**
 * {@link BreakdownLabel.name} is {@link FormattedText}, but the synthetic
 * timestamp column shows the raw ISO string from the API — not a translated
 * string. Branding is applied only here so the table layer stays typed without
 * inline assertions at each callsite.
 */
function formattedTextLabelFromApiTimestampBreakdown(isoTimestampFromApi: string): FormattedText {
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API timestamps are already displayable labels for the synthetic timestamp column.
  return isoTimestampFromApi as FormattedText;
}

export const isCustomQueryResponse = (
  response: RAQIV2QueryResponses | CellDataType[] | null,
): response is CellDataType[] => {
  // RAQIV2QueryResponses is a nested object not a simple array
  return Array.isArray(response);
};

export const isRAQIV2QueryResponse = (
  response: RAQIV2QueryResponses | CellDataType[] | null,
): response is RAQIV2QueryResponses => {
  return response !== null && !isCustomQueryResponse(response);
};

const breakdownValueComparator = (a: RAQIV2BreakdownValue, b: RAQIV2BreakdownValue): number => {
  // Check for undefined first, and then use localeCompare
  if (a.dimension === undefined && b.dimension === undefined) {
    return 0;
  }
  if (a.dimension === undefined) {
    return 1;
  }
  if (b.dimension === undefined) {
    return -1;
  }
  return a.dimension.localeCompare(b.dimension);
};
// NOTE(shumingxu, 03/30/2024): Hash internally to use breakdown values as keys
const hashBreakdownValuesSeparator = ';';
export const breakdownValuesToRowID = (
  breakdownValues: RAQIV2BreakdownValue[],
): RAQIV2TableRowID => {
  return (
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- RAQIV2TableRowID is a string brand over the deterministic row hash.
    [...breakdownValues]
      // NOTE(shumingxu, 03/30/2024): Use array to guarantee order of fields.
      // We do not include display value since the value itself should be unique.
      // It doesn't make sense for two values to be the same but have different display values.
      .sort(breakdownValueComparator)
      .map((value) => JSON.stringify([value.dimension, value.value]))
      .join(hashBreakdownValuesSeparator) as RAQIV2TableRowID
  );
};

const totalTranslationKey = translationKey('Label.Total', TranslationNamespace.Analytics);

export const buildCellValue = (
  columnType: ColumnType,
  label: BreakdownLabel,
  value?: RAQIV2BreakdownValue,
): CellDataType => {
  switch (columnType) {
    case ColumnType.TextWithTooltip:
      return { type: columnType, text: label.name, tooltip: label.tooltip };
    case ColumnType.TextWithDisplayValue:
      return { type: columnType, value: value?.value ?? label.name, displayValue: label.name };
    case ColumnType.BoldText:
    case ColumnType.Text:
    case ColumnType.Timestamp:
      return { type: columnType, value: label.name };
    case ColumnType.Date: {
      return { type: columnType, value: new Date(label.name) };
    }
    case ColumnType.Number:
      return { type: columnType, value: Number((value?.value ?? label.name) || undefined) };
    case ColumnType.Other:
    case ColumnType.RawJSONString:
    case ColumnType.Selection:
    case ColumnType.Actions:
    case ColumnType.TextWithLink:
    case ColumnType.Image:
    case ColumnType.Status:
    case ColumnType.TextWithIcon:
    case ColumnType.CodeDiff:
    case ColumnType.Code:
      // NOTE(@yukihe@20240806): These column types are not fully supported in analytic framework yet;
      // please contact #creator-analytics if you need these types for breakdown dimensions
      throw new Error(`Column type ${columnType} is not supported for breakdown dimensions`);
    default: {
      const exhaustiveCheck: never = columnType;
      throw new Error(`Unhandled column type ${String(exhaustiveCheck)} for analytics data`);
    }
  }
};

/** Result values for a given key will be from the first map argument which has that key defined */
export const mergeMapsWithoutOverwriting = <K, V>(...maps: ReadonlyMap<K, V>[]): Map<K, V> => {
  const result = new Map<K, V>();
  maps.forEach((map) => {
    map.forEach((value, key) => {
      if (!result.has(key)) {
        result.set(key, value);
      }
    });
  });
  return result;
};

type ComparisonMetricValue = { current: number; previous: number };
type NumericOrNonNumericData = number | string[] | ComparisonMetricValue;

export type NumericOrNonNumericColumnData = Map<RAQIV2TableRowID, NumericOrNonNumericData>;

const isComparisonMetricValue = (
  value: NumericOrNonNumericData | undefined,
): value is ComparisonMetricValue => {
  return typeof value === 'object' && 'current' in value;
};

/**
 * Build the row identity map for a column response.
 *
 * For non-time-bucketed tables (the default), each metric value contributes one
 * row keyed by its breakdown values.
 *
 * For time-bucketed tables (i.e. when {@param granularity} is provided and not
 * `None`), each metric value fans out into one row per data point. The
 * timestamp is folded into the row identity by appending a synthetic
 * {@link TIMESTAMP_PSEUDO_DIMENSION} entry to the breakdown values.
 */
export const getColumnBreakdowns = (
  columnData: RAQIV2QueryResponses | null,
  granularity?: RAQIV2MetricGranularity,
): Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]> => {
  const result = new Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>();
  if (!isRAQIV2QueryResponse(columnData)) {
    return result;
  }

  const { response } = combineRAQIV2QueryResponses(columnData);
  if (!response) {
    return result;
  }

  const isTimeBucketed = granularity !== undefined && granularity !== RAQIV2MetricGranularity.None;

  response.values?.forEach(({ breakdownValue, dataPoints }) => {
    if (!breakdownValue) {
      return;
    }
    if (isTimeBucketed) {
      dataPoints?.forEach((point) => {
        if (!point.time) {
          return;
        }
        const expanded = [...breakdownValue, makeTimestampPseudoBreakdownValue(point.time)];
        const hash = breakdownValuesToRowID(expanded);
        result.set(hash, expanded);
      });
    } else {
      const hash = breakdownValuesToRowID(breakdownValue);
      result.set(hash, breakdownValue);
    }
  });

  return result;
};

export const getAllRowBreakdowns = (
  columnResultBreakdowns: Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>,
  requiredBreakdownRows?: RAQIV2BreakdownValue[][],
): Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]> => {
  const result = new Map(columnResultBreakdowns);
  requiredBreakdownRows?.forEach((breakdownValues) => {
    const hash = breakdownValuesToRowID(breakdownValues);
    result.set(hash, breakdownValues);
  });
  return result;
};

/**
 * Extract row entries from a single metric value.
 *
 * - Default (non-time-bucketed): exactly one entry whose hash is derived from
 *   the breakdown values, and whose value is the first (only) data point.
 * - Time-bucketed (granularity != None): one entry per data point, where each
 *   row's hash incorporates a synthetic {@link TIMESTAMP_PSEUDO_DIMENSION}
 *   entry so that the same breakdown across different time buckets becomes
 *   distinct rows.
 */
const getTableResponseValues = (
  metricValue: RAQIV2MetricValue,
  valueType: RAQIV2MetricValueType,
  granularity?: RAQIV2MetricGranularity,
): { hash: RAQIV2TableRowID; value: number | string[] }[] => {
  const { breakdownValue, dataPoints } = metricValue;
  if (!breakdownValue || !dataPoints || !dataPoints.length) {
    return [];
  }

  const isTimeBucketed = granularity !== undefined && granularity !== RAQIV2MetricGranularity.None;
  const pointsToConsume = isTimeBucketed ? dataPoints : dataPoints.slice(0, 1);

  const result: { hash: RAQIV2TableRowID; value: number | string[] }[] = [];
  const buildBreakdownForRow = (
    point: (typeof pointsToConsume)[number],
  ): RAQIV2BreakdownValue[] | null => {
    if (!isTimeBucketed) {
      return breakdownValue;
    }
    if (!point.time) {
      return null;
    }
    return [...breakdownValue, makeTimestampPseudoBreakdownValue(point.time)];
  };
  pointsToConsume.forEach((point) => {
    const breakdownForRow = buildBreakdownForRow(point);
    if (!breakdownForRow) {
      return;
    }
    const hash = breakdownValuesToRowID(breakdownForRow);
    const { value, stringValues } = point;
    switch (valueType) {
      case RAQIV2MetricValueType.Numeric:
        if (value != null) {
          result.push({ hash, value });
        }
        break;
      case RAQIV2MetricValueType.String:
      case RAQIV2MetricValueType.StringArray:
        if (stringValues != null) {
          result.push({ hash, value: stringValues });
        }
        break;
      default: {
        const exhaustiveCheck: never = valueType;
        throw new Error(`Unhandled metric value type ${String(exhaustiveCheck)}`);
      }
    }
  });
  return result;
};

export const ingestColumnData = (
  columnData: RAQIV2QueryResponses | null,
  spec: MetricTableColumnSpec<RAQIV2TableColumnKey>,
): NumericOrNonNumericColumnData | null => {
  if (!columnData) {
    return null;
  }
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(columnData);
  if (!response) {
    return null;
  }
  // Computed metrics always produce numeric output (the result of evaluating the formula)
  const valueType = isComputedMetric(spec.metric)
    ? RAQIV2MetricValueType.Numeric
    : getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(spec.metric)).valueType;
  const rowToCellDataMap = new Map<
    RAQIV2TableRowID,
    number | string[] | { current: number; previous: number }
  >();
  response.values?.forEach((metricValue) => {
    const entries = getTableResponseValues(metricValue, valueType, spec.granularity);
    entries.forEach(({ hash, value: metricValueData }) => {
      rowToCellDataMap.set(hash, metricValueData);
    });
  });
  // Comparison data is intentionally not fanned out by timestamp — comparison
  // is a whole-range concept and does not pair naturally with per-bucket rows.
  // Time-bucketed tables therefore ignore the comparison response entirely.
  comparisonResponse?.values?.forEach((metricValue) => {
    const entries = getTableResponseValues(metricValue, valueType /* no granularity */);
    entries.forEach(({ hash, value: metricValueData }) => {
      const currentValue = rowToCellDataMap.get(hash);
      if (typeof currentValue === 'number' && typeof metricValueData === 'number') {
        rowToCellDataMap.set(hash, { current: currentValue, previous: metricValueData });
      }
    });
  });
  return rowToCellDataMap;
};

const ingestData = (
  data: Map<RAQIV2TableColumnKey, RAQIV2QueryResponses | null>,
  specs: Map<RAQIV2TableColumnKey, MetricTableColumnSpec<RAQIV2TableColumnKey>>,
): Map<RAQIV2TableColumnKey, NumericOrNonNumericColumnData> => {
  const result = new Map<RAQIV2TableColumnKey, NumericOrNonNumericColumnData>();
  data.forEach((columnData, columnKey) => {
    const spec = specs.get(columnKey);
    if (!spec) {
      return;
    }

    const ingestedColumn = ingestColumnData(columnData, spec);
    if (ingestedColumn) {
      result.set(columnKey, ingestedColumn);
    }
  });
  return result;
};

/**
 * If rows include a synthetic timestamp pseudo-breakdown, do a stable ascending
 * sort by that timestamp (so time-bucketed rows render chronologically). Rows
 * without a timestamp are left in their original relative position.
 */
const sortByTimestampPseudoDimension = <T extends { breakdownValues: RAQIV2BreakdownValue[] }>(
  rows: T[],
): T[] => {
  const hasTimestamp = rows.some((row) =>
    row.breakdownValues.some((bv) => bv.dimension === TIMESTAMP_PSEUDO_DIMENSION),
  );
  if (!hasTimestamp) {
    return rows;
  }
  // Decorate-sort-undecorate to keep the sort stable for rows that share a
  // timestamp (e.g. multiple breakdown combinations within the same bucket).
  return rows
    .map((row, index) => {
      const tsValue = row.breakdownValues.find(
        (bv) => bv.dimension === TIMESTAMP_PSEUDO_DIMENSION,
      )?.value;
      const tsMs = tsValue ? Date.parse(tsValue) : Number.NaN;
      return { row, index, tsMs };
    })
    .sort((a, b) => {
      // Push rows without a parseable timestamp to the end while keeping their
      // relative order.
      const aValid = !Number.isNaN(a.tsMs);
      const bValid = !Number.isNaN(b.tsMs);
      if (!aValid && !bValid) {
        return a.index - b.index;
      }
      if (!aValid) {
        return 1;
      }
      if (!bValid) {
        return -1;
      }
      if (a.tsMs !== b.tsMs) {
        return a.tsMs - b.tsMs;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
};

/**
 * NOTE(gperkins@20240823): We cannot simply use sortRAQIV2SeriesByBreakdowns...
 * For tables, we can have non-numeric values, which of course we can't sort by sum.
 *
 * Also, importantly, GenericTableV2 re-sorts the rows using the selected sort metric.
 * So this is just to sort by breakdowns, or for when the table is otherwise unsorted.
 */
export const sortBreakdownRows = (
  specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>>,
  allRowBreakdowns: Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>,
): RAQIV2TableRowID[] => {
  const current = Array.from(allRowBreakdowns.keys()).map((hash) => {
    const breakdownValues = allRowBreakdowns.get(hash) ?? [];
    return {
      hash,
      breakdownValues,
      isTotalSeries: breakdownValues.length === 0,
    };
  });

  const spec = Array.from(specs.values()).find(isRAQIV2TableColumnSpec);
  const breakdownDimensions = spec?.breakdown;
  if (!spec?.breakdown) {
    // Can't sort if there are no breakdown dimensions
    logAnalyticsError('Undefined breakdown dimensions for RAQIV2Table');
    return sortByTimestampPseudoDimension(current).map(({ hash }) => hash);
  }

  breakdownDimensions?.forEach((dimension) => {
    const { breakdownOrdering } = RAQIV2DimensionDisplayConfig[dimension];
    if (
      breakdownOrdering === RAQIV2BreakdownValueOrder.SortBySum ||
      breakdownOrdering === RAQIV2BreakdownValueOrder.Unsorted
    ) {
      // We don't know which metric we are sorting on, so nothing we can do here.
      // This will be handled in GenericTableV2.
      return;
    }
    sortInPlaceByBreakdownOrdering(current, dimension, breakdownOrdering);
  });
  return sortByTimestampPseudoDimension(current).map(({ hash }) => hash);
};

export const buildMetricCellValue = (
  rowHash: RAQIV2TableRowID,
  columnData: NumericOrNonNumericColumnData,
  spec: MetricTableColumnSpec<RAQIV2TableColumnKey>,
  translationDependencies: RAQIV2TranslationDependencies,
): CellDataType => {
  const metricValue = columnData.get(rowHash);
  const metricLabel = getMetricLabelFromMetricLike(spec.metric, translationDependencies);
  const metricValueRenderer = isComputedMetric(spec.metric)
    ? null
    : getRAQIV2MetricValueRenderer(getUIMetricFromAtomicMetricLike(spec.metric));
  const type = metricValueRenderer?.type ?? RAQIV2MetricValueType.Numeric;

  let cellValue: CellDataType;
  switch (type) {
    case RAQIV2MetricValueType.Numeric:
      {
        const getDisplayValue =
          metricValueRenderer?.type === RAQIV2MetricValueType.Numeric
            ? metricValueRenderer.getDisplayValue
            : (value: number | undefined) => value ?? 0;
        let displayValue: number;
        if (typeof metricValue === 'number' || metricValue === undefined) {
          displayValue = getDisplayValue(metricValue);
        } else if (isComparisonMetricValue(metricValue)) {
          displayValue = getDisplayValue(metricValue.current);
          const previousValue = getDisplayValue(metricValue.previous);
          const comparisonChipSpec = isComputedMetric(spec.metric)
            ? undefined
            : getComparisonChipSpec({
                isPositiveGood: getAnalyticsMetricDisplayConfig(
                  getUIMetricFromAtomicMetricLike(spec.metric),
                ).isPositiveGood,
                current: displayValue,
                previous: previousValue,
              });
          cellValue = {
            type: ColumnType.Number,
            value: displayValue,
            comparisonChipSpec,
          };
          return cellValue;
        } else {
          logAnalyticsError(
            `expecting numeric value for metric: ${metricLabel}, but received non-numeric value`,
          );
          displayValue = Number.NaN;
        }
        cellValue = { type: ColumnType.Number, value: displayValue };
      }
      break;
    case RAQIV2MetricValueType.StringArray:
      {
        if (
          !metricValueRenderer ||
          metricValueRenderer.type !== RAQIV2MetricValueType.StringArray
        ) {
          return { type: ColumnType.Text, value: '' };
        }
        const { getDisplayValue } = metricValueRenderer;
        let displayValue: string;
        if (Array.isArray(metricValue) || metricValue === undefined) {
          displayValue = getDisplayValue(metricValue, translationDependencies);
        } else {
          logAnalyticsError(
            `expecting string array value for metric: ${metricLabel}, but received non-string value`,
          );
          displayValue = '';
        }
        cellValue = { type: ColumnType.Text, value: displayValue };
      }
      break;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled metric value type ${String(exhaustiveCheck)}`);
    }
  }
  return cellValue;
};

/**
 * A column key that names either a real {@link TRAQIV2Dimension} breakdown
 * column, or the synthetic {@link TIMESTAMP_PSEUDO_DIMENSION} column used to
 * render a per-bucket Timestamp column in time-bucketed tables.
 */
export type DimensionOrTimestampColumnKey = TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION;

export const buildRowsFromColumnarData = ({
  metricData,
  customData,
  specs,
  dimensionColumnKeys,
  translationDependencies,
  allRowBreakdowns,
  rowOrder,
  startIndex,
  endIndex,
}: {
  metricData: Map<RAQIV2TableColumnKey, CellDataType[]>;
  customData: Map<RAQIV2TableColumnKey, CellDataType[]>;
  specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>>;
  dimensionColumnKeys: readonly DimensionOrTimestampColumnKey[];
  translationDependencies: RAQIV2TranslationDependencies;
  allRowBreakdowns: Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>;
  rowOrder: RAQIV2TableRowID[];
  startIndex: number;
  endIndex: number;
}): Map<RAQIV2TableColumnKey, CellDataType>[] => {
  const allColumnarData: Map<RAQIV2TableColumnKey, CellDataType[]> = mergeMapsWithoutOverwriting(
    customData,
    metricData,
  );

  const rows: Map<RAQIV2TableColumnKey, CellDataType>[] = [];
  const pageRowOrder = rowOrder.slice(startIndex, endIndex);

  pageRowOrder.forEach((hash, relativeIndex) => {
    const absoluteIndex = startIndex + relativeIndex;
    const breakdown = allRowBreakdowns.get(hash);
    if (!breakdown) {
      return;
    }

    const rowData = new Map<RAQIV2TableColumnKey, CellDataType>();

    // Add dimension columns
    dimensionColumnKeys.forEach((dimensionKey) => {
      const breakdownValue = breakdown.find(({ dimension }) => dimension === dimensionKey);
      // The synthetic timestamp column is not a real dimension and has no
      // RAQIV2DimensionDisplayConfig entry. Render it directly as a Timestamp
      // cell whose raw string value is the ISO time emitted by the API.
      if (dimensionKey === TIMESTAMP_PSEUDO_DIMENSION) {
        const timestampLabel = formattedTextLabelFromApiTimestampBreakdown(
          breakdownValue?.value ?? '',
        );
        rowData.set(
          dimensionKey,
          buildCellValue(ColumnType.Timestamp, { name: timestampLabel }, breakdownValue),
        );
        return;
      }
      const dimensionColumnConfig = getDimensionColumnDisplayConfig(dimensionKey);
      if (breakdownValue) {
        const translatedBreakdownLabel = getSingleDimensionBreakdownLabel(
          breakdownValue,
          translationDependencies,
        );
        rowData.set(
          dimensionKey,
          buildCellValue(
            dimensionColumnConfig.columnType,
            translatedBreakdownLabel,
            breakdownValue,
          ),
        );
      } else {
        rowData.set(
          dimensionKey,
          buildCellValue(dimensionColumnConfig.columnType, {
            name: translationDependencies.translate(totalTranslationKey),
          }),
        );
      }
    });

    allColumnarData.forEach((columnData, columnKey) => {
      const spec = specs.get(columnKey);
      if (!spec) {
        return;
      }

      const isCustomColumn = customData.has(columnKey);
      const dataIndex = isCustomColumn ? relativeIndex : absoluteIndex;
      const cellValue = columnData[dataIndex];
      if (cellValue !== undefined) {
        rowData.set(columnKey, cellValue);
      }
    });

    rows.push(rowData);
  });

  return rows;
};

const buildRows = (
  rowOrder: RAQIV2TableRowID[],
  allRowBreakdowns: Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>,
  ingestedTableData: Map<RAQIV2TableColumnKey, NumericOrNonNumericColumnData | CellDataType[]>,
  translationDependencies: RAQIV2TranslationDependencies,
  dimensionColumnKeys: readonly DimensionOrTimestampColumnKey[],
  specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>>,
): Map<RAQIV2TableColumnKey, CellDataType>[] => {
  const metricData = new Map<RAQIV2TableColumnKey, CellDataType[]>();
  const customData = new Map<RAQIV2TableColumnKey, CellDataType[]>();

  ingestedTableData.forEach((columnData, columnKey) => {
    const spec = specs.get(columnKey);
    if (!spec) {
      return;
    }

    if (isRAQIV2TableColumnSpec(spec)) {
      if (!Array.isArray(columnData)) {
        const cellValues: CellDataType[] = [];
        rowOrder.forEach((hash) => {
          const cellValue = buildMetricCellValue(hash, columnData, spec, translationDependencies);
          cellValues.push(cellValue);
        });
        metricData.set(columnKey, cellValues);
      }
    } else if (Array.isArray(columnData)) {
      customData.set(columnKey, columnData);
    }
  });

  // Use the unified row builder
  return buildRowsFromColumnarData({
    metricData,
    customData,
    specs,
    dimensionColumnKeys,
    translationDependencies,
    allRowBreakdowns,
    rowOrder,
    startIndex: 0,
    endIndex: rowOrder.length,
  });
};

const genericRAQIV2TableAdapter = ({
  data,
  specs,
  dimensionColumnKeys,
  translationDependencies,
  requiredBreakdownRows,
}: {
  data: Map<RAQIV2TableColumnKey, RAQIV2QueryResponses | null>;
  specs: Map<RAQIV2TableColumnKey, MetricTableColumnSpec<RAQIV2TableColumnKey>>;
  dimensionColumnKeys: TRAQIV2Dimension[];
  translationDependencies: RAQIV2TranslationDependencies;
  requiredBreakdownRows?: RAQIV2BreakdownValue[][];
}): Map<RAQIV2TableColumnKey, CellDataType>[] => {
  const ingestedTableData = ingestData(data, specs);

  // Build per-column breakdown maps, threading granularity through each column
  // so that time-bucketed responses fan out into one row per (breakdown,
  // timestamp) tuple via the synthetic TIMESTAMP_PSEUDO_DIMENSION.
  const columnBreakdownMaps = Array.from(data.entries()).map(([columnKey, columnData]) =>
    getColumnBreakdowns(columnData, specs.get(columnKey)?.granularity),
  );
  const mergedBreakdowns = mergeMapsWithoutOverwriting(...columnBreakdownMaps);
  const allRowBreakdowns = getAllRowBreakdowns(mergedBreakdowns, requiredBreakdownRows);

  // When any column is time-bucketed, prepend a synthetic Timestamp dimension
  // column so the rows are visually disambiguated by their time bucket.
  const effectiveDimensionColumnKeys: (TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION)[] =
    isTimeBucketedTableSpecs(specs)
      ? [TIMESTAMP_PSEUDO_DIMENSION, ...dimensionColumnKeys]
      : dimensionColumnKeys;

  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  return buildRows(
    rowOrder,
    allRowBreakdowns,
    ingestedTableData,
    translationDependencies,
    effectiveDimensionColumnKeys,
    specs,
  );
};

export const convertMetricDataToColumnar = ({
  ingestedRAQIData,
  specs,
  translationDependencies,
  rowOrder,
}: {
  ingestedRAQIData: Map<RAQIV2TableColumnKey, NumericOrNonNumericColumnData>;
  specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>>;
  translationDependencies: RAQIV2TranslationDependencies;
  rowOrder: RAQIV2TableRowID[];
}): Map<RAQIV2TableColumnKey, CellDataType[]> => {
  const metricColumnarData = new Map<RAQIV2TableColumnKey, CellDataType[]>();

  specs.forEach((spec, metricColumnKey) => {
    if (!isRAQIV2TableColumnSpec(spec)) {
      return;
    }

    const columnData = ingestedRAQIData.get(metricColumnKey);
    if (!columnData || Array.isArray(columnData)) {
      return;
    }

    const cellValues: CellDataType[] = [];
    rowOrder.forEach((hash) => {
      const cellValue = buildMetricCellValue(hash, columnData, spec, translationDependencies);
      cellValues.push(cellValue);
    });

    metricColumnarData.set(metricColumnKey, cellValues);
  });

  return metricColumnarData;
};

export default genericRAQIV2TableAdapter;
