import type { FC } from 'react';
import { useMemo } from 'react';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { type TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import type { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import computeRAQIV2MetricColumnConfigOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2MetricColumnConfigOverride';
import type { DownFunnelColumnKey } from './configs';
import {
  DownFunnelTableColumnConfig,
  orderedDownFunnelColumnKeys,
  SpecialCohortColumnKey,
} from './configs';
import initEmptyDownFunnelRow from './initEmptyDownFunnelRow';
import useCohortRowData from './useCohortRowData';
import useCombineRowDataCallbacks from './useCombineRowDataCallbacks';
import type { CohortTimeInterval } from './useRetentionCohortPagination';
import useTableContexts from './useTableContexts';
import useTableState from './useTableState';

const tableConfig: TableConfig<DownFunnelColumnKey> = {
  tableBorder: false,
  defaultActiveSort: SpecialCohortColumnKey.Cohort,
  firstDataRowIsSummary: true,
};

type NewUserDownFunnelTableProps = {
  tableContext: RAQIV2TableContext & {
    granularity: CohortTimeInterval;
  };
  pagination: GenericTablePaginationSpec;
  cohortOrder: TableSortOrder;
  toggleOrder: () => void;
};

const NewUserDownFunnelTable: FC<NewUserDownFunnelTableProps> = ({
  tableContext,
  pagination,
  cohortOrder,
  toggleOrder,
}) => {
  const { nonSummaryRowsContext, summaryRowContext } = useTableContexts({
    tableContext,
    page: pagination.page,
    pageSize: pagination.pageSize,
    cohortOrder,
  });

  const { combineToRowData, combineToSummaryRowData } = useCombineRowDataCallbacks({
    tableContext: nonSummaryRowsContext,
    initEmptyRow: initEmptyDownFunnelRow,
    cohortOrder,
  });

  const { state, rowData } = useCohortRowData<DownFunnelColumnKey>({
    tableContext: nonSummaryRowsContext,
    combineToRowData,
    cohortTimeInterval: tableContext.granularity,
    orderedColumnKeys: orderedDownFunnelColumnKeys,
  });

  const { state: summaryState, rowData: summaryRow } = useCohortRowData({
    tableContext: summaryRowContext,
    combineToRowData: combineToSummaryRowData,
    cohortTimeInterval: tableContext.granularity,
    orderedColumnKeys: orderedDownFunnelColumnKeys,
  });

  const columnConfigs: TableColumnConfig<DownFunnelColumnKey>[] = useMemo(() => {
    return orderedDownFunnelColumnKeys.map((columnKey) => {
      if (columnKey === SpecialCohortColumnKey.Cohort) {
        return {
          ...DownFunnelTableColumnConfig[SpecialCohortColumnKey.Cohort],
          sort: {
            direction: cohortOrder,
            onClick: toggleOrder,
          },
        };
      }

      const override = computeRAQIV2MetricColumnConfigOverride({
        metric: columnKey,
      });
      return {
        ...DownFunnelTableColumnConfig[columnKey],
        ...override,
        sort: undefined,
        endAdormentColumnKeyInCompactView: undefined,
      };
    });
  }, [cohortOrder, toggleOrder]);

  const orderedRowData: Map<DownFunnelColumnKey, CellDataType>[] = useMemo(
    () => [...summaryRow, ...rowData],
    [summaryRow, rowData],
  );

  const tableState = useTableState({
    regularRowsState: state,
    summaryRowState: summaryState,
  });

  return (
    <GenericTableV2
      {...tableState}
      rowData={orderedRowData}
      columnConfigs={columnConfigs}
      tableConfig={tableConfig}
      pagination={pagination}
    />
  );
};

export default NewUserDownFunnelTable;
