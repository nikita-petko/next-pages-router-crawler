import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import {
  CellDataType,
  ChartFooter,
  TableConfig,
  TableSortOrder,
  TGenericChartExportConfig,
} from '@modules/charts-generic';
import { TranslationKey } from '@modules/analytics-translations';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';

import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';

import {
  isRAQIV2TableColumnSpec,
  TableColumnSpec,
  TablePaginationSpec,
  CustomTableColumnSpec,
} from './types';
import GenericDataTable, {
  PaginatedColumnRequest,
  RowDataResponse,
  TableDataColumnConfig,
} from './GenericDataTable';
import { PaginationResponse } from '../../../hooks/usePaginatedRequest';
import { useRAQIV2Client } from '../../../context/RAQIV2ClientProvider';
import { RAQIV2TableRowID } from '../../../adapters/genericRAQIV2TableAdapter';
import computeRAQIV2MetricColumnConfigOverride from '../../../utils/computeRAQIV2MetricColumnConfigOverride';
import {
  breakdownToColumnDataResponse,
  makeRAQITableRequest,
  makeRAQIV2TableBreakdownColumnRequest,
} from './tableUtils';
import getDimensionColumnDisplayConfig from '../../getDimensionColumnDisplayConfig';
import { useLoadUniverseIds } from '../../../utils/universeUtils';
import useAllowComputedMetrics from '../../../hooks/useAllowComputedMetrics';
import AnalyticsTableHeader from './AnalyticsTableHeader';
import { getMetricLabelFromMetricLike } from '../../../utils/metricLikeSemantics';

// NOTE(shumingxu, 04/24/2024): From inspect element on MUI table component
const HeightPerTableRow = 53;

export type AnalyticsDataTableProps<TColumnKey> = {
  /**
   * All props to this component must be serializable (not functions, components, etc.)
   * if they are to be usable in custom dashboards. Any non-serializable props that are added here
   * must be excluded from the `TAnalyticsSerializableTableConfig` type at the same time.
   *
   * currently the only non-serializable props are:
   * - some `dataColumnSpecs`, those which are `CustomTableColumnSpec`s
   * - some `chartWarnings`, those which are not preformatted strings
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
  chartControl?: React.JSX.Element | null;
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
  chartControl,
}: AnalyticsDataTableProps<TColumnKey>) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const translationDependenciesRef = useRef(translationDependencies);
  translationDependenciesRef.current = translationDependencies;

  const { client } = useRAQIV2Client(ignoreCache ?? false);
  const allowComputedMetrics = useAllowComputedMetrics();
  const loadUniverseForRowResponses = useLoadUniverseIds();

  // Helper to extract resource/timeSpec/metric from the first metric spec
  const context = useMemo(() => {
    const metricSpec = dataColumnSpecs.find(isRAQIV2TableColumnSpec);
    if (!metricSpec) return null;
    return {
      resource: metricSpec.resource,
      timeSpec: metricSpec.timeSpec,
    };
  }, [dataColumnSpecs]);

  const makeDimensionGetData = useCallback(
    (dimension: TRAQIV2Dimension) =>
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
          allowComputedMetrics,
          requiredBreakdownRows,
        );
      },
    [allowComputedMetrics, breakdowns, context, dataColumnSpecs, client, requiredBreakdownRows],
  );

  const dimensionColumnSpecs = useMemo(() => {
    if (hideBreakdownLabelColumns) return [] as CustomTableColumnSpec<TColumnKey>[];
    if (!context) return [] as CustomTableColumnSpec<TColumnKey>[];

    return breakdowns.map((dimension) => {
      const dimConfig = getDimensionColumnDisplayConfig(dimension);

      const spec: CustomTableColumnSpec<TColumnKey> = {
        ...dimConfig,
        columnKey: dimension as TColumnKey,
        resource: context.resource,
        getData: makeDimensionGetData(dimension),
      };

      return spec;
    });
  }, [breakdowns, hideBreakdownLabelColumns, context, makeDimensionGetData]);

  const dimensionColumnKeys = useMemo(() => {
    return new Set(dimensionColumnSpecs.map((spec) => spec.columnKey));
  }, [dimensionColumnSpecs]);

  // Merge specs: breakdown columns first (if any), then metrics/customs provided by caller
  const allColumnSpecs: TableColumnSpec<TColumnKey>[] = useMemo(() => {
    return [
      ...dimensionColumnSpecs,
      ...dataColumnSpecs,
    ] as unknown[] as TableColumnSpec<TColumnKey>[];
  }, [dimensionColumnSpecs, dataColumnSpecs]);

  const getColumnsData = useCallback(
    async (
      request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, TColumnKey>,
    ): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
      const { columnKey: requestColumnKey } = request;
      const dataSpec = allColumnSpecs.find((spec) => spec.columnKey === requestColumnKey);

      if (!dataSpec) {
        throw new Error(`Column spec not found for key: ${requestColumnKey}`);
      }

      if (isRAQIV2TableColumnSpec(dataSpec)) {
        const response = await makeRAQITableRequest<TColumnKey>(
          dataSpec,
          request,
          client,
          translationDependenciesRef.current,
          allowComputedMetrics,
          isTotalRowIncluded,
          requiredBreakdownRows,
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
      allowComputedMetrics,
      client,
      allColumnSpecs,
      isTotalRowIncluded,
      requiredBreakdownRows,
      loadUniverseForRowResponses,
    ],
  );

  const formatCellData = useCallback(
    (
      columnKey: TColumnKey,
      row: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>,
    ): CellDataType => {
      if (!dimensionColumnKeys.has(columnKey)) {
        return row.data;
      }

      return breakdownToColumnDataResponse(
        row.rowId,
        row.rowData,
        columnKey as TRAQIV2Dimension,
        translationDependencies,
      ).data;
    },
    [dimensionColumnKeys, translationDependencies],
  );

  // Transform dataColumnSpecs to TableColumnConfig[] following the same pattern as GenericRAQIV2Table
  const columnConfigs: TableDataColumnConfig<TColumnKey>[] = useMemo(() => {
    return allColumnSpecs.map((spec) => {
      if (isRAQIV2TableColumnSpec(spec)) {
        const metricBasedConfig = computeRAQIV2MetricColumnConfigOverride({
          metric: spec.metric,
        });
        return {
          ...metricBasedConfig,
          sort: {
            ...spec.sort,
            direction: spec.sort?.direction ?? metricBasedConfig.sort?.direction,
          },
          columnKey: spec.columnKey,
        };
      }
      return {
        ...spec,
        sort: spec.sort
          ? {
              ...spec.sort,
              direction: spec.sort.direction ?? TableSortOrder.desc,
            }
          : undefined,
      };
    }) as TableDataColumnConfig<TColumnKey>[];
  }, [allColumnSpecs]);

  const emptyStateTableHeight = useMemo(() => {
    if (!requiredBreakdownRows?.length) {
      return undefined;
    }

    const rows = isTotalRowIncluded
      ? requiredBreakdownRows.length + 1
      : requiredBreakdownRows.length;
    return rows * HeightPerTableRow;
  }, [isTotalRowIncluded, requiredBreakdownRows?.length]);

  const getTableHeader = useCallback(
    (data: Map<TColumnKey, CellDataType>[], isDataLoading: boolean) => {
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
            .map((config) => getMetricLabelFromMetricLike(config.metric))}
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
      exportButtonConfig,
      chartControl,
    ],
  );

  return (
    <GenericDataTable<RAQIV2BreakdownValue[], RAQIV2TableRowID, TColumnKey>
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
    />
  );
};

export default AnalyticsDataTable;
