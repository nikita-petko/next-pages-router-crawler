import {
  ColumnType,
  CellDataType,
  logAnalyticsError,
  getComparisonChipSpec,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2BreakdownValue, RAQIV2MetricValue } from '@modules/clients/analytics';
import {
  RAQIV2DimensionDisplayConfig,
  TRAQIV2Dimension,
  RAQIV2BreakdownValueOrder,
  RAQIV2MetricValueType,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import combineRAQIV2QueryResponses, {
  RAQIV2QueryResponses,
} from '../utils/combineRAQIV2QueryResponses';
import { BreakdownLabel, getSingleDimensionBreakdownLabel } from './genericRAQIV2ChartAdapter';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { sortInPlaceByBreakdownOrdering } from './sortRAQIV2SeriesByBreakdowns';
import getDimensionColumnDisplayConfig from '../components/getDimensionColumnDisplayConfig';
import getRAQIV2MetricValueRenderer from '../components/getRAQIV2MetricValueRenderer';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import { isComputedMetric } from '../types/ComputedMetric';
import { getMetricLabelFromMetricLike } from '../utils/metricLikeSemantics';
import {
  isRAQIV2TableColumnSpec,
  MetricTableColumnSpec,
  TableColumnSpec,
} from '../components/RAQIV2/table/types';

export type RAQIV2TableColumnKey = string; // Previously RAQIV2PredefinedTableColumnKey | RAQIV2Metric | TRAQIV2Dimension;

export type RAQIV2TableRowID = string & { _: RAQIV2TableRowID };

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
      return { type: columnType, value: Number(value?.value || label.name || undefined) };
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
      throw new Error(`Unhandled column type ${exhaustiveCheck} for analytics data`);
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

export const getColumnBreakdowns = (
  columnData: RAQIV2QueryResponses | null,
): Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]> => {
  const result = new Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>();
  if (!isRAQIV2QueryResponse(columnData)) return result;

  const { response } = combineRAQIV2QueryResponses(columnData);
  if (!response) return result;

  response.values?.forEach(({ breakdownValue }) => {
    if (!breakdownValue) return;
    const hash = breakdownValuesToRowID(breakdownValue);
    result.set(hash, breakdownValue);
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

const getTableResponseValue = (
  metricValue: RAQIV2MetricValue,
  valueType: RAQIV2MetricValueType,
): { hash: RAQIV2TableRowID; value: number | string[] } | null => {
  const { breakdownValue, dataPoints } = metricValue;
  if (!breakdownValue || !dataPoints || !dataPoints.length) return null;
  const hash = breakdownValuesToRowID(breakdownValue);
  const { value, stringValues } = dataPoints[0];
  switch (valueType) {
    case RAQIV2MetricValueType.Numeric:
      if (value == null) return null;
      return { hash, value };
    case RAQIV2MetricValueType.String:
    case RAQIV2MetricValueType.StringArray:
      if (stringValues == null) return null;
      return { hash, value: stringValues };
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unhandled metric value type ${exhaustiveCheck}`);
    }
  }
};

export const ingestColumnData = (
  columnData: RAQIV2QueryResponses | null,
  spec: MetricTableColumnSpec<RAQIV2TableColumnKey>,
): NumericOrNonNumericColumnData | null => {
  if (!columnData) return null;
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(columnData);
  if (!response) return null;
  // Computed metrics always produce numeric output (the result of evaluating the formula)
  const valueType = isComputedMetric(spec.metric)
    ? RAQIV2MetricValueType.Numeric
    : getAnalyticsMetricDisplayConfig(spec.metric).valueType;
  const rowToCellDataMap = new Map<
    RAQIV2TableRowID,
    number | string[] | { current: number; previous: number }
  >();
  response.values?.forEach((metricValue) => {
    const value = getTableResponseValue(metricValue, valueType);
    if (!value) return;
    const { hash, value: metricValueData } = value;
    rowToCellDataMap.set(hash, metricValueData);
  });
  comparisonResponse?.values?.forEach((metricValue) => {
    const value = getTableResponseValue(metricValue, valueType);
    if (!value) return;
    const { hash, value: metricValueData } = value;
    const currentValue = rowToCellDataMap.get(hash);
    if (typeof currentValue === 'number' && typeof metricValueData === 'number') {
      rowToCellDataMap.set(hash, { current: currentValue, previous: metricValueData });
    }
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
    if (!spec) return;

    const ingestedColumn = ingestColumnData(columnData, spec);
    if (ingestedColumn) {
      result.set(columnKey, ingestedColumn);
    }
  });
  return result;
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
    return current.map(({ hash }) => hash);
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
  return current.map(({ hash }) => hash);
};

export const buildMetricCellValue = (
  rowHash: RAQIV2TableRowID,
  columnData: NumericOrNonNumericColumnData,
  spec: MetricTableColumnSpec<RAQIV2TableColumnKey>,
  translationDependencies: RAQIV2TranslationDependencies,
): CellDataType => {
  const metricValue = columnData.get(rowHash);
  const metricLabel = getMetricLabelFromMetricLike(spec.metric);
  const metricValueRenderer = isComputedMetric(spec.metric)
    ? null
    : getRAQIV2MetricValueRenderer(spec.metric);
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
                isPositiveGood: getAnalyticsMetricDisplayConfig(spec.metric).isPositiveGood,
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
      throw new Error(`Unhandled metric value type ${exhaustiveCheck}`);
    }
  }
  return cellValue;
};

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
  dimensionColumnKeys: TRAQIV2Dimension[];
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
    if (!breakdown) return;

    const rowData = new Map<RAQIV2TableColumnKey, CellDataType>();

    // Add dimension columns
    dimensionColumnKeys.forEach((dimensionKey) => {
      const breakdownValue = breakdown.find(({ dimension }) => dimension === dimensionKey);
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
      if (!spec) return;

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
  dimensionColumnKeys: TRAQIV2Dimension[],
  specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>>,
): Map<RAQIV2TableColumnKey, CellDataType>[] => {
  const metricData = new Map<RAQIV2TableColumnKey, CellDataType[]>();
  const customData = new Map<RAQIV2TableColumnKey, CellDataType[]>();

  ingestedTableData.forEach((columnData, columnKey) => {
    const spec = specs.get(columnKey);
    if (!spec) return;

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

  const columnBreakdownMaps = Array.from(data.values()).map(getColumnBreakdowns);
  const mergedBreakdowns = mergeMapsWithoutOverwriting(...columnBreakdownMaps);
  const allRowBreakdowns = getAllRowBreakdowns(mergedBreakdowns, requiredBreakdownRows);

  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  return buildRows(
    rowOrder,
    allRowBreakdowns,
    ingestedTableData,
    translationDependencies,
    dimensionColumnKeys,
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
    if (!isRAQIV2TableColumnSpec(spec)) return;

    const columnData = ingestedRAQIData.get(metricColumnKey);
    if (!columnData || Array.isArray(columnData)) return;

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
