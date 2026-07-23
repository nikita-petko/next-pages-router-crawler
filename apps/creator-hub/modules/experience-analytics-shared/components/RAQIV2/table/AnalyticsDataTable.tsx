/* oxlint-disable react/react-compiler -- pre-existing render-synchronized translation ref keeps async table request callbacks stable */
import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useRef } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { TGenericChartExportConfig } from '@modules/charts-generic/charts/GenericChartExportButton';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  GenericTableV2RowExpansionConfig,
  TableConfig,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  DimensionOrTimestampColumnKey,
  RAQIV2TableRowID,
} from '../../../adapters/genericRAQIV2TableAdapter';
import { TIMESTAMP_PSEUDO_DIMENSION } from '../../../adapters/genericRAQIV2TableAdapter';
import { useRAQIV2Client } from '../../../context/RAQIV2ClientProvider';
import type { PaginationResponse } from '../../../hooks/usePaginatedRequest';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import computeRAQIV2MetricColumnConfigOverride from '../../../utils/computeRAQIV2MetricColumnConfigOverride';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';
import { useLoadUniverseIds } from '../../../utils/universeUtils';
import getDimensionColumnDisplayConfig from '../../getDimensionColumnDisplayConfig';
import AnalyticsTableHeader from './AnalyticsTableHeader';
import type {
  PaginatedColumnRequest,
  RowDataResponse,
  TableDataColumnConfig,
} from './GenericDataTable';
import GenericDataTable from './GenericDataTable';
import {
  breakdownToColumnDataResponse,
  makeRAQITableRequest,
  makeRAQIV2TableBreakdownColumnRequest,
} from './tableUtils';
import type { TableColumnSpec, TablePaginationSpec, CustomTableColumnSpec } from './types';
import { isRAQIV2TableColumnSpec } from './types';

// NOTE(shumingxu, 04/24/2024): From inspect element on MUI table component
const HeightPerTableRow = 53;

/**
 * Project a `TableColumnSpec` onto the `TableDataColumnConfig` shape consumed
 * by `GenericDataTable`. Centralizes the metric-vs-custom column conversion
 * so call sites can `allColumnSpecs.map(buildTableDataColumnConfig)` without a
 * structural `as TableDataColumnConfig[]` at the boundary.
 *
 * The base configs the two branches start from (`metricBasedConfig` for
 * metric columns, `spec` for custom columns) carry a few column-key-typed
 * fields (`endAdormentColumnKeyInCompactView`, `sort.columnKey`) whose static
 * type doesn't line up with `TKey` — `metricBasedConfig` is keyed by the
 * metric-side enum, and `CustomTableColumnSpec`'s upstream uses bare `string`.
 * Those fields are never read against the rendered column set, so the
 * narrowing to `TKey` is safe at runtime. We confine the structural cast to a
 * single `unknown`-routed assignment per branch instead of letting it leak
 * out to every caller (one bigger `as` cast at each call site).
 */
const buildTableDataColumnConfig = <TKey extends string>(
  spec: TableColumnSpec<TKey>,
): TableDataColumnConfig<TKey> => {
  if (isRAQIV2TableColumnSpec(spec)) {
    const metricBasedConfig: Omit<
      TableDataColumnConfig<TKey>,
      'columnKey' | 'endAdormentColumnKeyInCompactView'
    > = computeRAQIV2MetricColumnConfigOverride({
      metric: spec.metric,
    });
    const direction = spec.sort?.direction ?? metricBasedConfig.sort?.direction;
    return {
      ...metricBasedConfig,
      sort: direction !== undefined ? { ...spec.sort, direction } : undefined,
      columnKey: spec.columnKey,
      // Caller-supplied display label takes precedence over the metric-derived
      // titleKey. `resolveTableColumnTitle` honors `titleOverride` first.
      titleOverride: spec.titleOverride,
    };
  }
  const sort = spec.sort
    ? {
        ...spec.sort,
        direction: spec.sort.direction ?? TableSortOrder.desc,
      }
    : undefined;
  const { endAdormentColumnKeyInCompactView, ...rest } = spec;
  return { ...rest, sort };
};

export type AnalyticsDataTableProps<TColumnKey extends string = string> = {
  /**
   * All props to this component must be serializable (not functions, components, etc.)
   * if they are to be usable in custom dashboards. Any non-serializable props that are added here
   * must be excluded from the `TAnalyticsSerializableTableConfig` type at the same time.
   *
   * currently the only non-serializable props are:
   * - some `dataColumnSpecs`, those which are `CustomTableColumnSpec`s
   * - some `chartWarnings`, those which are not preformatted strings
   * - `rowExpansion`
   */
  breakdowns: TRAQIV2Dimension[]; // Keep breakdowns for future implementation
  requiredBreakdownRows?: Array<RAQIV2BreakdownValue[]>;
  dataColumnSpecs: TableColumnSpec<TColumnKey>[];
  tableConfig?: TableConfig<TColumnKey>;
  isTotalRowIncluded?: boolean;
  ignoreCache?: boolean;
  titleKey?: TranslationKey;
  definitionTooltipKey?: TranslationKey;
  isInTabSwitchedContext?: boolean;
  pagination?: TablePaginationSpec;
  rowRange?: {
    start: number;
    end: number;
  };
  exportButtonConfig?: TGenericChartExportConfig;
  footerProps?: Partial<React.ComponentProps<typeof ChartFooter>>;
  chartWarnings?: ReactNode[];
  // if true, the auto generated breakdown name columns will be hidden,
  // usually used when we want customized column for dynamic breakdown values
  hideBreakdownLabelColumns?: boolean;
  /**
   * Optional override for the body cell column type of every auto-generated
   * breakdown dimension column. Used by callers (e.g. the explore mode table)
   * that want consistent plain-text rendering instead of per-dimension styling
   * (which can apply bolding via `TextWithTooltip`, etc.).
   */
  breakdownColumnTypeOverride?: ColumnType;
  /**
   * When true, every auto-generated breakdown dimension column receives a
   * client-side sort handle (ascending by default). The synthetic Timestamp
   * column is always sortable regardless of this flag.
   *
   * Defaults to false because adding `sort` to dimension columns shifts which
   * column `GenericDataTable` treats as the implicit default sort
   * (`firstColumnWithSort` picks the leftmost column with a `sort` entry).
   * Callers that opt in should also set `tableConfig.defaultActiveSort` to
   * preserve their intended initial sort.
   */
  breakdownColumnsSortable?: boolean;
  /**
   * Called whenever the rendered table data changes with a getter for the
   * CSV exporter that the parent can wire into a custom download-CSV
   * control. Receives `null` when the table has no data to export.
   *
   * The getter form lets the parent defer the (non-trivial)
   * `GenericTableExporter` allocation until the user actually triggers a
   * download — every render of this header otherwise produced an exporter
   * instance the parent never read.
   */
  onExporterReady?: (getExporter: (() => GenericCsvExporter) | null) => void;
  /**
   * When true, the primary metric request seeds its row set from the union of
   * all metric columns so row presence does not depend on which metric is
   * currently primary/sorted.
   */
  mergeMetricBreakdownRows?: boolean;
  chartControl?: React.JSX.Element | null;
  rowExpansion?: GenericTableV2RowExpansionConfig<
    TColumnKey | TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION
  >;
};

const AnalyticsDataTable = <TColumnKey extends string>({
  breakdowns,
  hideBreakdownLabelColumns,
  requiredBreakdownRows,
  dataColumnSpecs,
  tableConfig,
  isTotalRowIncluded,
  ignoreCache,
  titleKey,
  definitionTooltipKey,
  isInTabSwitchedContext,
  pagination,
  rowRange,
  exportButtonConfig,
  footerProps,
  chartWarnings,
  breakdownColumnTypeOverride,
  breakdownColumnsSortable,
  onExporterReady,
  mergeMetricBreakdownRows,
  chartControl,
  rowExpansion,
}: AnalyticsDataTableProps<TColumnKey>) => {
  // The component's internal key universe is wider than the caller-declared
  // `TColumnKey`: it also includes every `TRAQIV2Dimension` (because each
  // entry in `breakdowns` is auto-rendered as a column keyed by the dimension
  // string) and the synthetic timestamp pseudo-dimension. Acknowledging that
  // here lets the breakdown-spec construction below assign `dimension` to
  // `columnKey` without an `as TColumnKey` cast. Caller-supplied props that
  // are typed against `TColumnKey` (`dataColumnSpecs`, `tableConfig`) widen
  // into this union covariantly — `TableColumnSpec` and `TableConfig` only
  // use their key parameter in output positions.
  type ColumnKeyWithTimestamp = TColumnKey | TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION;

  const translationDependencies = useRAQIV2TranslationDependencies();
  const translationDependenciesRef = useRef(translationDependencies);
  translationDependenciesRef.current = translationDependencies;

  const { client } = useRAQIV2Client(ignoreCache ?? false);
  const loadUniverseForRowResponses = useLoadUniverseIds();

  // Helper to extract resource/timeSpec/metric from the first metric spec.
  // Granularity comes along for the ride because the synthetic Timestamp
  // cell needs it for date/time formatting; using the first metric's
  // granularity matches the seeding metric in
  // `makeRAQIV2TableBreakdownColumnRequest`, so the format is consistent
  // across primary and secondary fetches.
  const context = useMemo(() => {
    const metricSpec = dataColumnSpecs.find(isRAQIV2TableColumnSpec);
    if (!metricSpec) {
      return null;
    }
    return {
      resource: metricSpec.resource,
      timeSpec: metricSpec.timeSpec,
      granularity: metricSpec.granularity,
    };
  }, [dataColumnSpecs]);

  const makeDimensionGetData = useCallback(
    (dimension: TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION) =>
      async (
        request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, string>,
      ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
        const { rows } = request;
        // Secondary fetch: map provided rows to cells
        if (rows.length > 0) {
          const values = rows.map(({ id, data }) => {
            return breakdownToColumnDataResponse(
              id,
              data,
              dimension,
              translationDependenciesRef.current,
              breakdownColumnTypeOverride,
              context?.granularity,
            );
          });
          return {
            values,
            total: values.length,
            nextPaginationToken: '',
          };
        }

        if (!context) {
          throw new Error('No metric columns available to seed breakdown rows.');
        }

        const { timeSpec, resource } = context;
        return makeRAQIV2TableBreakdownColumnRequest(
          resource,
          timeSpec,
          dataColumnSpecs,
          dimension,
          breakdowns,
          client,
          translationDependenciesRef.current,
          requiredBreakdownRows,
          breakdownColumnTypeOverride,
          // Same row-union seeding as the metric-primary path
          // (`makeRAQITableRequest`): when this dimension fetch is the
          // primary for a multi-metric, time-bucketed table (e.g. sorted
          // by Timestamp), include sibling metric breakdown maps so time
          // buckets that exist for any metric column survive into the
          // rendered row set.
          mergeMetricBreakdownRows ? dataColumnSpecs.filter(isRAQIV2TableColumnSpec) : undefined,
        );
      },
    [
      breakdowns,
      context,
      dataColumnSpecs,
      client,
      requiredBreakdownRows,
      breakdownColumnTypeOverride,
      mergeMetricBreakdownRows,
    ],
  );

  /**
   * When any data column has a non-`None` granularity, the rows produced by
   * the table fan out into one row per `(breakdown, time bucket)` tuple via
   * the synthetic {@link TIMESTAMP_PSEUDO_DIMENSION} (see the table adapter).
   * Without a corresponding header column the user sees seemingly-duplicated
   * rows, so prepend a Timestamp column whenever the table is time-bucketed.
   * Always rendered as `ColumnType.Timestamp` regardless of
   * `breakdownColumnTypeOverride` — flattening it to plain text would lose the
   * formatted date/time that makes time-bucketed rows readable.
   */
  const isTimeBucketed = dataColumnSpecs.some(
    (spec) =>
      isRAQIV2TableColumnSpec(spec) &&
      spec.granularity !== undefined &&
      spec.granularity !== RAQIV2MetricGranularity.None,
  );

  const dimensionColumnSpecs = useMemo(() => {
    if (hideBreakdownLabelColumns) {
      return [] as CustomTableColumnSpec<ColumnKeyWithTimestamp>[];
    }
    if (!context) {
      return [] as CustomTableColumnSpec<ColumnKeyWithTimestamp>[];
    }

    const realBreakdownSpecs = breakdowns.map((dimension) => {
      const dimConfig = getDimensionColumnDisplayConfig(dimension);

      const spec: CustomTableColumnSpec<ColumnKeyWithTimestamp> = {
        ...dimConfig,
        ...(breakdownColumnTypeOverride !== undefined
          ? { columnType: breakdownColumnTypeOverride }
          : {}),
        columnKey: dimension,
        resource: context.resource,
        getData: makeDimensionGetData(dimension),
        // Opt-in: client-side sort on real breakdown columns. Asc default
        // matches typical alphabetical / numeric expectations; the comparator
        // in `tableSortUtils` handles Text/Number/etc. cell types. Omitting
        // `isServerSideSorting` keeps this purely a UI reorder — no refetch.
        ...(breakdownColumnsSortable ? { sort: { direction: TableSortOrder.asc } } : {}),
      };

      return spec;
    });

    if (!isTimeBucketed) {
      return realBreakdownSpecs;
    }

    const timestampSpec: CustomTableColumnSpec<ColumnKeyWithTimestamp> = {
      columnKey: TIMESTAMP_PSEUDO_DIMENSION,
      columnType: ColumnType.Timestamp,
      titleKey: translationKey('Label.Date', TranslationNamespace.Analytics),
      resource: context.resource,
      getData: makeDimensionGetData(TIMESTAMP_PSEUDO_DIMENSION),
      // Sort client-side: the adapter already returns timestamp rows in
      // chronological order, and `getSortValue` knows how to parse Timestamp
      // cells. Default to ascending so the initial render reads earliest →
      // latest, matching the pre-sort applied by `sortByTimestampPseudoDimension`.
      // Omitting `isServerSideSorting` means GenericTableV2 reorders rows in
      // place when the user toggles direction; no re-fetch is needed.
      sort: { direction: TableSortOrder.asc },
    };
    return [timestampSpec, ...realBreakdownSpecs];
  }, [
    breakdowns,
    hideBreakdownLabelColumns,
    context,
    makeDimensionGetData,
    breakdownColumnTypeOverride,
    breakdownColumnsSortable,
    isTimeBucketed,
  ]);

  const dimensionColumnKeys = useMemo(() => {
    return new Set(dimensionColumnSpecs.map((spec) => spec.columnKey));
  }, [dimensionColumnSpecs]);

  // Merge specs: breakdown columns first (if any), then metrics/customs provided by caller
  const allColumnSpecs: TableColumnSpec<ColumnKeyWithTimestamp>[] = useMemo(() => {
    return [...dimensionColumnSpecs, ...dataColumnSpecs];
  }, [dimensionColumnSpecs, dataColumnSpecs]);

  const getColumnsData = useCallback(
    async (
      request: PaginatedColumnRequest<
        RAQIV2BreakdownValue[],
        RAQIV2TableRowID,
        ColumnKeyWithTimestamp
      >,
    ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
      const { columnKey: requestColumnKey } = request;
      const dataSpec = allColumnSpecs.find((spec) => spec.columnKey === requestColumnKey);

      if (!dataSpec) {
        throw new Error(`Column spec not found for key: ${requestColumnKey}`);
      }

      if (isRAQIV2TableColumnSpec(dataSpec)) {
        const response = await makeRAQITableRequest<ColumnKeyWithTimestamp>(
          dataSpec,
          request,
          client,
          translationDependenciesRef.current,
          isTotalRowIncluded,
          requiredBreakdownRows,
          mergeMetricBreakdownRows ? dataColumnSpecs.filter(isRAQIV2TableColumnSpec) : undefined,
        );
        loadUniverseForRowResponses(response.values);
        return response;
      }

      const customResponse = await dataSpec.getData(request);
      if (request.rows.length === 0) {
        loadUniverseForRowResponses(customResponse.values);
      }
      return customResponse;
    },
    [
      client,
      allColumnSpecs,
      dataColumnSpecs,
      isTotalRowIncluded,
      mergeMetricBreakdownRows,
      requiredBreakdownRows,
      loadUniverseForRowResponses,
    ],
  );

  const formatCellData = useCallback(
    (
      columnKey: ColumnKeyWithTimestamp,
      row: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>,
    ): CellDataType => {
      if (!dimensionColumnKeys.has(columnKey)) {
        return row.data;
      }

      let dimensionForCell: DimensionOrTimestampColumnKey;
      if (columnKey === TIMESTAMP_PSEUDO_DIMENSION) {
        dimensionForCell = TIMESTAMP_PSEUDO_DIMENSION;
      } else {
        const breakdownDimension = breakdowns.find((d) => d === columnKey);
        if (breakdownDimension === undefined) {
          return row.data;
        }
        dimensionForCell = breakdownDimension;
      }

      return breakdownToColumnDataResponse(
        row.rowId,
        row.rowData,
        dimensionForCell,
        translationDependencies,
        breakdownColumnTypeOverride,
        context?.granularity,
      ).data;
    },
    [
      breakdowns,
      dimensionColumnKeys,
      translationDependencies,
      breakdownColumnTypeOverride,
      context,
    ],
  );

  // Transform dataColumnSpecs to TableColumnConfig[] following the same pattern as GenericRAQIV2Table
  const columnConfigs: TableDataColumnConfig<ColumnKeyWithTimestamp>[] = useMemo(() => {
    return allColumnSpecs.map((spec) => buildTableDataColumnConfig(spec));
  }, [allColumnSpecs]);

  const emptyStateTableHeight = useMemo<number | undefined>(() => {
    if (!requiredBreakdownRows?.length) {
      return undefined;
    }

    const rows = isTotalRowIncluded
      ? requiredBreakdownRows.length + 1
      : requiredBreakdownRows.length;
    return rows * HeightPerTableRow;
  }, [isTotalRowIncluded, requiredBreakdownRows?.length]);

  const getTableHeader = useCallback(
    (data: Map<ColumnKeyWithTimestamp, CellDataType>[], isDataLoading: boolean) => {
      return (
        <AnalyticsTableHeader
          data={data}
          isDataLoading={isDataLoading}
          columnConfigs={columnConfigs}
          titleKey={titleKey}
          definitionTooltipKey={definitionTooltipKey}
          isInTabSwitchedContext={isInTabSwitchedContext}
          fallbackFileName={
            !titleKey && context ? `${context.resource.type}-${context.resource.id}` : undefined
          }
          exportButtonConfig={exportButtonConfig}
          metricLabelsForExportLog={allColumnSpecs
            .filter(isRAQIV2TableColumnSpec)
            .map((config) => getMetricLabelFromMetricLike(config.metric, translationDependencies))}
          onExporterReady={onExporterReady}
          chartControl={chartControl}
        />
      );
    },
    [
      allColumnSpecs,
      columnConfigs,
      context,
      definitionTooltipKey,
      isInTabSwitchedContext,
      titleKey,
      translationDependencies,
      exportButtonConfig,
      onExporterReady,
      chartControl,
    ],
  );

  return (
    <GenericDataTable<RAQIV2BreakdownValue[], RAQIV2TableRowID, ColumnKeyWithTimestamp>
      getColumnsData={getColumnsData}
      columnConfigs={columnConfigs}
      pagination={pagination}
      tableConfig={tableConfig}
      formatCellData={formatCellData}
      getTableHeader={getTableHeader}
      footer={<ChartFooter warnings={chartWarnings ?? []} {...footerProps} />}
      rowRange={rowRange}
      emptyStateTableHeight={emptyStateTableHeight}
      isInTabSwitchedContext={isInTabSwitchedContext}
      rowExpansion={rowExpansion}
    />
  );
};

export default AnalyticsDataTable;
