import {
  computeRAQIV2MetricColumnConfigOverride,
  getDimensionRenderer,
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  RAQIV2TableContext,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import React, { FC, useCallback, useMemo } from 'react';
import {
  CellBackgroundType,
  CellDataType,
  ColumnType,
  GenericTablePaginationSpec,
  GenericTableV2,
  getCurrentDate,
  millisecondsInInterval,
  TableCellBackgroundColor,
  TableColumnConfig,
  TableConfig,
  TableSortOrder,
} from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CohortTimeInterval } from './useRetentionCohortPagination';
import {
  CohortRetentionTableColumnConfig,
  getDynamicCohortColumnKey,
  orderedRetentionColumnKeys,
  RetentionColumnKey,
  SpecialCohortColumnKey,
} from './configs';
import useTableContexts from './useTableContexts';
import useCohortRowData, { CohortTimeIntervalToRAQIV2Metric } from './useCohortRowData';
import useCombineRowDataCallbacks from './useCombineRowDataCallbacks';
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
  const seriesIntervalMeaning = RAQIV2MetricGranularityToSeriesIntervalMeaning(
    tableContext.granularity,
  );

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
              millisecondsInInterval(seriesIntervalMeaning),
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
    seriesIntervalMeaning,
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
