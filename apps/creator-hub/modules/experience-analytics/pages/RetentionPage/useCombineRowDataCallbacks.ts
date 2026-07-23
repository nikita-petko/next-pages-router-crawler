import { useCallback } from 'react';
import type { DataPoint } from '@rbx/client-analytics-query-gateway/v1';
import { addDays } from '@rbx/core';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateInUTCWithCurrentYearHidden } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { millisecondsInInterval } from '@modules/charts-generic/utils/granularityUtils';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CohortTimeInterval } from './useRetentionCohortPagination';

export type ColumnDataPoints<ColumnKey extends string> = Array<{
  columnKey: ColumnKey;
  dataPoints: Array<DataPoint>;
}>;

const useCombineRowDataCallbacks = <ColumnKey extends string>({
  tableContext,
  initEmptyRow,
  cohortOrder,
}: {
  tableContext: RAQIV2TableContext & {
    granularity: CohortTimeInterval;
  };
  initEmptyRow: (cohort: string) => Map<ColumnKey, CellDataType>;
  cohortOrder: TableSortOrder;
}): {
  combineToRowData: (results: ColumnDataPoints<ColumnKey>) => Map<ColumnKey, CellDataType>[];
  combineToSummaryRowData: (results: ColumnDataPoints<ColumnKey>) => Map<ColumnKey, CellDataType>[];
} => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const granularity = tableContext.granularity;

  const combineToRowData = useCallback(
    (columnDataPoints: ColumnDataPoints<ColumnKey>) => {
      const { startTime, endTime } = tableContext.timeSpec;
      const rowByCohort: Map<number, Map<ColumnKey, CellDataType>> = new Map();
      for (
        let ts = startTime.getTime();
        ts < endTime.getTime();
        ts += millisecondsInInterval(granularity)
      ) {
        if (tableContext.granularity === RAQIV2MetricGranularity.OneDay) {
          const cohort = formatDateInUTCWithCurrentYearHidden({
            timestamp: new Date(ts),
            locale,
            options: {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          });
          rowByCohort.set(ts, initEmptyRow(cohort));
        } else {
          const rangeStart = formatDateInUTCWithCurrentYearHidden({
            timestamp: new Date(ts),
            locale,
            options: {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          });
          const rangeEnd = formatDateInUTCWithCurrentYearHidden({
            timestamp: addDays(new Date(ts), 6),
            locale,
            options: {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          });
          rowByCohort.set(ts, initEmptyRow(`${rangeStart} - ${rangeEnd}`));
        }
      }

      columnDataPoints.forEach(({ columnKey, dataPoints }) => {
        dataPoints.forEach(({ time, value }) => {
          if (time === undefined) {
            return;
          }

          const timestamp = new Date(time).getTime();
          const row = rowByCohort.get(timestamp);
          row?.set(columnKey, { type: ColumnType.Number, value: value ?? 0 });
        });
      });

      return Array.from(rowByCohort.entries())
        .sort(([timeA], [timeB]) => {
          return cohortOrder === TableSortOrder.asc ? timeA - timeB : timeB - timeA;
        })
        .map(([, row]) => row);
    },
    [
      cohortOrder,
      initEmptyRow,
      locale,
      granularity,
      tableContext.granularity,
      tableContext.timeSpec,
    ],
  );

  const combineToSummaryRowData = useCallback(
    (columnDataPoints: ColumnDataPoints<ColumnKey>) => {
      const summaryRow = initEmptyRow(
        translate(translationKey('Label.CohortTableSummaryRow', TranslationNamespace.Analytics)),
      );

      columnDataPoints.forEach(({ columnKey, dataPoints }) => {
        const dataPoint = dataPoints?.[0];
        if (dataPoint) {
          const { time, value } = dataPoint;
          if (time === undefined) {
            return;
          }

          summaryRow.set(columnKey, {
            type: ColumnType.Number,
            value: value ?? 0,
          });
        }
      });

      return [summaryRow];
    },
    [initEmptyRow, translate],
  );

  return {
    combineToRowData,
    combineToSummaryRowData,
  };
};

export default useCombineRowDataCallbacks;
