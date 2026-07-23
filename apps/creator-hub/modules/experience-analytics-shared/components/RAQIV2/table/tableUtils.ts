import { EntireRangeInterval, TExplicitTimeRangeSpec } from '@modules/charts-generic';
import {
  RAQIV2BreakdownValue,
  RAQIV2ChartResource,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import { RAQIV2Dimension, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';

import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isRAQIV2TableColumnSpec, MetricTableColumnSpec, TableColumnSpec } from './types';
import makeRAQIV2Request, {
  FetchComparisonSeriesMode,
  RAQIV2CombinedAPIClientWrapper,
} from '../../../utils/makeRAQIV2Request';
import { maybeThrowRAQIV2InternalException } from '../../../utils/RAQIV2InternalException';
import {
  buildCellValue,
  buildMetricCellValue,
  getColumnBreakdowns,
  getAllRowBreakdowns,
  ingestColumnData,
  RAQIV2TableRowID,
  RAQIV2TableColumnKey,
  sortBreakdownRows,
  mergeMapsWithoutOverwriting,
} from '../../../adapters/genericRAQIV2TableAdapter';
import { RAQIV2TranslationDependencies } from '../../../types/RAQIV2DimensionRenderer';
import { PaginatedColumnRequest, RowDataResponse } from './GenericDataTable';
import getDimensionColumnDisplayConfig from '../../getDimensionColumnDisplayConfig';
import { getSingleDimensionBreakdownLabel } from '../../../adapters/genericRAQIV2ChartAdapter';
import { PaginationResponse } from '../../../hooks/usePaginatedRequest';

export const expandFiltersToIncludeBreakdownValues = (
  filters: readonly RAQIV2QueryFilter[],
  breakdownValues: RAQIV2BreakdownValue[][],
): RAQIV2QueryFilter[] => {
  const filtersMap: Map<RAQIV2Dimension, RAQIV2QueryFilter> = breakdownValues.reduce(
    (acc: Map<RAQIV2Dimension, RAQIV2QueryFilter>, breakdownValue: RAQIV2BreakdownValue[]) => {
      breakdownValue.forEach((value) => {
        const currentDimension =
          value.dimension && isValidEnumValue(RAQIV2Dimension, value.dimension)
            ? value.dimension
            : undefined;

        if (currentDimension && value.value) {
          const accValues: string[] = acc.get(currentDimension)?.values || [];
          if (accValues.length > 0) {
            const merged = accValues.includes(value.value)
              ? accValues
              : [...accValues, value.value];
            const newFilter: RAQIV2QueryFilter = {
              dimension: currentDimension,
              values: merged,
            };
            acc.set(currentDimension, newFilter);
          } else {
            // First time seeing this dimension, create new filter
            const newFilter: RAQIV2QueryFilter = {
              dimension: currentDimension,
              values: [value.value],
            };
            acc.set(currentDimension, newFilter);
          }
        }
      });
      return acc;
    },
    new Map(),
  );
  filters.forEach((filter) => {
    if (isValidEnumValue(RAQIV2Dimension, filter.dimension)) {
      const currentFilterValues = filtersMap.get(filter.dimension);
      if (currentFilterValues) {
        // Merge incoming filter values with existing (dedup)
        const merged = Array.from(
          new Set<string>([...currentFilterValues.values, ...filter.values]),
        );
        filtersMap.set(filter.dimension, {
          dimension: filter.dimension,
          values: merged,
        });
      } else {
        filtersMap.set(filter.dimension, filter);
      }
    }
  });

  const result = Array.from(filtersMap.values());
  return result;
};

export const makeRAQITableRequest = async <TColumnKey extends string>(
  dataSpec: MetricTableColumnSpec<string>,
  request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, TColumnKey>,
  client: RAQIV2CombinedAPIClientWrapper,
  translationDependencies: RAQIV2TranslationDependencies,
  allowComputedMetrics: boolean,
  isTotalRowIncluded?: boolean,
  requiredBreakdownRows?: RAQIV2BreakdownValue[][],
) => {
  const { columnKey: _columnKey, ...specWithoutColumnKey } = dataSpec;
  const { rows } = request;
  maybeThrowRAQIV2InternalException(specWithoutColumnKey.resource, 'TableDataFetch');

  const breakdownValues: RAQIV2BreakdownValue[][] =
    rows.length > 0 ? rows.map((row) => row.data) : []; // Empty for primary column

  // NOTE(yukihe@20250813): can handle pagination and sort in the future when CAaaS API supports it
  const raqiRequestSpec = {
    ...specWithoutColumnKey,
    filter: expandFiltersToIncludeBreakdownValues(
      specWithoutColumnKey.filter || [],
      breakdownValues,
    ),
  };

  const raqiResponse = await makeRAQIV2Request(raqiRequestSpec, client, {
    fetchTotalSeries: isTotalRowIncluded,
    fetchComparison: dataSpec.isComparisonDataShown
      ? {
          mode: FetchComparisonSeriesMode.Separate,
          seriesIntervalMeaning: EntireRangeInterval,
        }
      : undefined,
    allowComputedMetrics,
  });

  const columnBreakdowns = getColumnBreakdowns(raqiResponse);
  const rowBreakdownFromRequest = rows.reduce((acc, row) => {
    return acc.set(row.id, row.data);
  }, new Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>());
  const rowBreakdownsFromResponse = getAllRowBreakdowns(columnBreakdowns, requiredBreakdownRows);
  const allRowBreakdowns = mergeMapsWithoutOverwriting(
    rowBreakdownFromRequest,
    rowBreakdownsFromResponse,
  );
  const specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>> = new Map([
    [dataSpec.columnKey, dataSpec],
  ]);
  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  const ingestedColumn = ingestColumnData(raqiResponse, dataSpec);

  // Convert to row-based format - filter out rows with null cell values
  const rowBasedData: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = [];

  rowOrder.forEach((hash) => {
    if (!ingestedColumn) return;

    const cellValue = buildMetricCellValue(hash, ingestedColumn, dataSpec, translationDependencies);

    rowBasedData.push({
      rowId: hash,
      data: cellValue,
      rowData: allRowBreakdowns.get(hash) || [],
    });
  });

  return {
    values: rowBasedData,
    total: rowBasedData.length,
    nextPaginationToken: '',
  };
};

export const breakdownToColumnDataResponse = (
  hash: RAQIV2TableRowID,
  breakdownTuple: RAQIV2BreakdownValue[],
  dimension: TRAQIV2Dimension,
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  const dimensionColumnConfig = getDimensionColumnDisplayConfig(dimension);
  const currentBreakdownValue = breakdownTuple.find((v) => v.dimension === dimension);
  const translatedBreakdownLabel = currentBreakdownValue
    ? getSingleDimensionBreakdownLabel(currentBreakdownValue, translationDependencies)
    : {
        name: translationDependencies.translate(
          translationKey('Label.Total', TranslationNamespace.Analytics),
        ),
      };
  return {
    rowId: hash,
    data: buildCellValue(
      dimensionColumnConfig.columnType,
      translatedBreakdownLabel,
      currentBreakdownValue,
    ),
    rowData: breakdownTuple,
  };
};

export const makeRAQIV2TableBreakdownColumnRequest = async <TColumnKey extends string>(
  resource: RAQIV2ChartResource,
  timeSpec: TExplicitTimeRangeSpec,
  dataColumnSpecs: TableColumnSpec<TColumnKey>[],
  dimension: TRAQIV2Dimension,
  allBreakdowns: TRAQIV2Dimension[],
  client: RAQIV2CombinedAPIClientWrapper,
  translationDependencies: RAQIV2TranslationDependencies,
  allowComputedMetrics: boolean,
  requiredBreakdownRows?: RAQIV2BreakdownValue[][],
): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
  const firstMetric = dataColumnSpecs.find(isRAQIV2TableColumnSpec);
  if (!firstMetric) {
    throw new Error('No metric columns available to seed breakdown rows.');
  }
  const raqiResponse = await makeRAQIV2Request(
    {
      resource,
      timeSpec,
      metric: firstMetric.metric,
      granularity: firstMetric.granularity,
      breakdown: allBreakdowns,
      filter: firstMetric.filter,
      limit: undefined,
    },
    client,
    { fetchComparison: undefined, allowComputedMetrics },
  );
  const columnBreakdowns = getColumnBreakdowns(raqiResponse);
  const allRowBreakdowns = getAllRowBreakdowns(columnBreakdowns, requiredBreakdownRows);
  const specs: Map<string, TableColumnSpec<string>> = new Map([
    [firstMetric.columnKey, firstMetric],
  ]);
  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  const allValues = rowOrder.map((hash) => {
    const breakdownTuple = allRowBreakdowns.get(hash) || [];
    return breakdownToColumnDataResponse(hash, breakdownTuple, dimension, translationDependencies);
  });

  return { values: allValues, total: allValues.length, nextPaginationToken: '' };
};
