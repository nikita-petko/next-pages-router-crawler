import {
  CellDataType,
  ColumnType,
  formatDateInUTCWithCurrentYearHidden,
  millisecondsInInterval,
  TableSortOrder,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2MetricGranularityToSeriesIntervalMeaning,
  RAQIV2TableContext,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { DataPoint } from '@rbx/client-analytics-query-gateway/v1';
import { addDays } from '@rbx/core';
import { useCallback } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CohortTimeInterval } from './useRetentionCohortPagination';

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
  const seriesIntervalMeaning = RAQIV2MetricGranularityToSeriesIntervalMeaning(
    tableContext.granularity,
  );

  const combineToRowData = useCallback(
    (columnDataPoints: ColumnDataPoints<ColumnKey>) => {
      const { startTime, endTime } = tableContext.timeSpec;
      const rowByCohort: Map<number, Map<ColumnKey, CellDataType>> = new Map();
      for (
        let ts = startTime.getTime();
        ts < endTime.getTime();
        ts += millisecondsInInterval(seriesIntervalMeaning)
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
          if (time === undefined) return;

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
      seriesIntervalMeaning,
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
          if (time === undefined) return;

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
