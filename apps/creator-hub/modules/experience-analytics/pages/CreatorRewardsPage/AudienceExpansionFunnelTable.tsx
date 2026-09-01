import type { FC } from 'react';
import { useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import type { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import computeRAQIV2MetricColumnConfigOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2MetricColumnConfigOverride';
// Note: I'm importing these to avoid duping the same files but they should probably be put in a shared analytics lib if these
// are going to be used more than once
import useCombineRowDataCallbacks from '../RetentionPage/useCombineRowDataCallbacks';
import type { CohortTimeInterval } from '../RetentionPage/useRetentionCohortPagination';
import useTableContexts from '../RetentionPage/useTableContexts';
import useTableState from '../RetentionPage/useTableState';
import type { AudienceExpansionFunnelColumnKey } from './cohortTableConfigs';
import {
  AudienceExpansionFunnelTableColumnConfig,
  orderedAudienceExpansionFunnelColumnKeys,
  SpecialCohortColumnKey,
} from './cohortTableConfigs';
import AudienceExpansionFunnelTab from './enums/AudienceExpansionFunnelTab';
import initEmptyAudienceExpansionFunnelRow from './initEmptyAudienceExpansionFunnelRow';
import useAudienceExpansionFunnelRowData from './useAudienceExpansionFunnelRowData';

const tableConfig: TableConfig<AudienceExpansionFunnelColumnKey> = {
  tableBorder: false,
  defaultActiveSort: SpecialCohortColumnKey.Cohort,
  firstDataRowIsSummary: false,
};

type AudienceExpansionFunnelTableProps = {
  tableContext: RAQIV2TableContext & {
    granularity: CohortTimeInterval;
  };
  pagination: GenericTablePaginationSpec;
  activeTabKey: AudienceExpansionFunnelTab;
  cohortOrder: TableSortOrder;
  toggleOrder: () => void;
};

const AudienceExpansionFunnelTable: FC<AudienceExpansionFunnelTableProps> = ({
  tableContext,
  pagination,
  activeTabKey,
  cohortOrder,
  toggleOrder,
}) => {
  const { nonSummaryRowsContext } = useTableContexts({
    tableContext,
    page: pagination.page,
    pageSize: pagination.pageSize,
    cohortOrder,
  });

  const { combineToRowData } = useCombineRowDataCallbacks({
    tableContext: nonSummaryRowsContext,
    initEmptyRow: initEmptyAudienceExpansionFunnelRow,
    cohortOrder,
  });

  const { state, rowData } = useAudienceExpansionFunnelRowData<AudienceExpansionFunnelColumnKey>({
    tableContext: nonSummaryRowsContext,
    combineToRowData,
    cohortTimeInterval: tableContext.granularity,
    orderedColumnKeys: orderedAudienceExpansionFunnelColumnKeys,
  });

  const columnConfigs: TableColumnConfig<AudienceExpansionFunnelColumnKey>[] = useMemo(() => {
    return orderedAudienceExpansionFunnelColumnKeys
      .map((columnKey) => {
        if (columnKey === SpecialCohortColumnKey.Cohort) {
          return {
            ...AudienceExpansionFunnelTableColumnConfig[SpecialCohortColumnKey.Cohort],
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
          ...AudienceExpansionFunnelTableColumnConfig[columnKey],
          ...override,
          sort: undefined,
          endAdormentColumnKeyInCompactView: undefined,
        };
      })
      .filter((columnKey) => {
        // Note: if this gets any more complicated we should just make different configs for the three tabs
        // instead of filtering out the omitted columns
        switch (activeTabKey) {
          case AudienceExpansionFunnelTab.Signups:
            return (
              columnKey.columnKey !==
                RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelReactivations &&
              columnKey.columnKey !==
                RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers
            );
          case AudienceExpansionFunnelTab.Reactivations:
            return (
              columnKey.columnKey !== RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelSignups &&
              columnKey.columnKey !==
                RAQIV2Metric.CreatorRewardsAudienceExpansionFunnelPercentOfNewUsers
            );
          case AudienceExpansionFunnelTab.Overview:
          default:
            return true;
        }
      });
  }, [activeTabKey, cohortOrder, toggleOrder]);

  const tableState = useTableState({
    regularRowsState: state,
  });

  return (
    <GenericTableV2
      {...tableState}
      rowData={rowData}
      columnConfigs={columnConfigs}
      tableConfig={tableConfig}
      pagination={pagination}
    />
  );
};

export default AudienceExpansionFunnelTable;
