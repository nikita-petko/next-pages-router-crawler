import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TableCellBackgroundColor } from '@modules/charts-generic/charts/options';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import {
  CellBackgroundType,
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { TableConfig } from '@modules/charts-generic/tables/types/GenericTableType';
import type { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import { millisecondsInInterval } from '@modules/charts-generic/utils/granularityUtils';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import computeRAQIV2MetricColumnConfigOverride from '@modules/experience-analytics-shared/utils/computeRAQIV2MetricColumnConfigOverride';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { RetentionColumnKey } from './configs';
import {
  CohortRetentionTableColumnConfig,
  getDynamicCohortColumnKey,
  orderedRetentionColumnKeys,
  SpecialCohortColumnKey,
} from './configs';
import useCohortRowData, { CohortTimeIntervalToRAQIV2Metric } from './useCohortRowData';
import useCombineRowDataCallbacks from './useCombineRowDataCallbacks';
import type { CohortTimeInterval } from './useRetentionCohortPagination';
import useTableContexts from './useTableContexts';
import useTableState from './useTableState';

const MAXIMUM_DYNAMIC_COLUMNS_LIMIT = 10;

const tableConfig: TableConfig<RetentionColumnKey> = {
  tableBorder: false,
  defaultActiveSort: SpecialCohortColumnKey.Cohort,
};

type NewUserRetentionTableProps = {
  tableContext: Omit<RAQIV2TableContext, 'granularity'> & {
    granularity: CohortTimeInterval;
  };
  pagination: GenericTablePaginationSpec;
  cohortOrder: TableSortOrder;
  toggleOrder: () => void;
  maximumDynamicColumns?: number;
};

const NewUserRetentionTable: FC<NewUserRetentionTableProps> = ({
  tableContext,
  pagination,
  cohortOrder,
  toggleOrder,
  maximumDynamicColumns = MAXIMUM_DYNAMIC_COLUMNS_LIMIT,
}) => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const granularity = tableContext.granularity;

  const { nonSummaryRowsContext } = useTableContexts({
    tableContext,
    page: pagination.page,
    pageSize: pagination.pageSize,
    cohortOrder,
  });

  const columnConfigs: TableColumnConfig<RetentionColumnKey>[] = useMemo(() => {
    const configs: TableColumnConfig<RetentionColumnKey>[] = [];
    orderedRetentionColumnKeys.forEach((columnKey) => {
      if (columnKey === SpecialCohortColumnKey.Cohort) {
        configs.push({
          ...CohortRetentionTableColumnConfig[columnKey],
          sort: {
            direction: cohortOrder,
            onClick: toggleOrder,
          },
        });
      } else if (isValidEnumValue(RAQIV2Metric, columnKey)) {
        const override = computeRAQIV2MetricColumnConfigOverride({
          metric: columnKey,
        });
        configs.push({
          ...CohortRetentionTableColumnConfig[columnKey],
          ...override,
          sort: undefined,
          endAdormentColumnKeyInCompactView: undefined,
        });
      } else if (columnKey === SpecialCohortColumnKey.CohortInterval) {
        const today = getCurrentDate();
        const numberOfDynamicColumns = Math.min(
          Math.min(maximumDynamicColumns, MAXIMUM_DYNAMIC_COLUMNS_LIMIT),
          Math.floor(
            (today.getTime() - tableContext.timeSpec.startTime.getTime()) /
              millisecondsInInterval(granularity),
          ),
        );
        const { metric, breakdownDimension } =
          CohortTimeIntervalToRAQIV2Metric[nonSummaryRowsContext.granularity];
        const override = computeRAQIV2MetricColumnConfigOverride({
          metric,
        });
        for (let i = 1; i <= numberOfDynamicColumns; i += 1) {
          const shouldShowTooltip = i <= 2;
          let tooltipKey: TranslationKey | undefined;
          switch (tableContext.granularity) {
            case RAQIV2MetricGranularity.OneDay:
              tooltipKey =
                i === 1
                  ? translationKey('Description.CohortIntervalDay1', TranslationNamespace.Analytics)
                  : translationKey(
                      'Description.CohortIntervalDay2',
                      TranslationNamespace.Analytics,
                    );
              break;
            case RAQIV2MetricGranularity.OneWeek:
              tooltipKey =
                i === 1
                  ? translationKey(
                      'Description.CohortIntervalWeek1',
                      TranslationNamespace.Analytics,
                    )
                  : translationKey(
                      'Description.CohortIntervalWeek2',
                      TranslationNamespace.Analytics,
                    );
              break;
            default: {
              const exhaustiveCheck: never = tableContext.granularity;
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              throw new Error(`Unexpected series interval meaning: ${exhaustiveCheck}`);
            }
          }
          configs.push({
            ...CohortRetentionTableColumnConfig[SpecialCohortColumnKey.CohortInterval],
            ...override,
            sort: undefined,
            endAdormentColumnKeyInCompactView: undefined,
            titleOverride: getDimensionRenderer(breakdownDimension).getBreakdownValueName(
              { value: i.toString() },
              translationDependencies,
            ),
            tooltipKey: shouldShowTooltip ? tooltipKey : undefined,
            cellBackground: {
              type: CellBackgroundType.ValueOpacityFill,
              color: TableCellBackgroundColor.Progression,
              fullOpacityScale: 0.5,
            },
            columnKey: getDynamicCohortColumnKey(i),
          });
        }
      }
    });
    return configs;
  }, [
    cohortOrder,
    nonSummaryRowsContext.granularity,
    granularity,
    tableContext.granularity,
    tableContext.timeSpec.startTime,
    toggleOrder,
    translationDependencies,
    maximumDynamicColumns,
  ]);

  const initEmptyRetentionCohortRow = useCallback(
    (cohort: string) => {
      const row = new Map<RetentionColumnKey, CellDataType>();
      columnConfigs.forEach(({ columnKey }) => {
        if (columnKey === SpecialCohortColumnKey.Cohort) {
          row.set(columnKey, { type: ColumnType.Text, value: cohort });
        } else {
          row.set(columnKey, { type: ColumnType.Number, value: Number.NaN });
        }
      });
      return row;
    },
    [columnConfigs],
  );

  const { combineToRowData } = useCombineRowDataCallbacks({
    tableContext: nonSummaryRowsContext,
    initEmptyRow: initEmptyRetentionCohortRow,
    cohortOrder,
  });

  const { state, rowData } = useCohortRowData({
    tableContext: nonSummaryRowsContext,
    combineToRowData,
    cohortTimeInterval: nonSummaryRowsContext.granularity,
    orderedColumnKeys: orderedRetentionColumnKeys,
  });

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

export default NewUserRetentionTable;
