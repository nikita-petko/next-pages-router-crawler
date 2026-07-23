import React, { FC, useMemo } from 'react';
import {
  CellDataType,
  GenericTablePaginationSpec,
  GenericTableV2,
  TableColumnConfig,
  TableConfig,
  TableSortOrder,
} from '@modules/charts-generic';
import {
  RAQIV2TableContext,
  computeRAQIV2MetricColumnConfigOverride,
} from '@modules/experience-analytics-shared';
import { CohortTimeInterval } from './useRetentionCohortPagination';

import {
  DownFunnelColumnKey,
  DownFunnelTableColumnConfig,
  orderedDownFunnelColumnKeys,
  SpecialCohortColumnKey,
} from './configs';
import initEmptyDownFunnelRow from './initEmptyDownFunnelRow';
import useTableContexts from './useTableContexts';
import useCohortRowData from './useCohortRowData';
import useCombineRowDataCallbacks from './useCombineRowDataCallbacks';
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
