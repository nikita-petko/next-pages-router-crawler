import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { millisecondsInInterval } from '@modules/charts-generic/utils/granularityUtils';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import type { CohortTimeInterval } from './useRetentionCohortPagination';

type TableContextWithPagination = {
  tableContext: Omit<RAQIV2TableContext, 'granularity'> & {
    granularity: CohortTimeInterval;
  };
  page: number;
  pageSize: number;
  cohortOrder: TableSortOrder;
};

type TableContexts = {
  summaryRowContext: RAQIV2TableContext;
  nonSummaryRowsContext: Omit<RAQIV2TableContext, 'granularity'> & {
    granularity: CohortTimeInterval;
  };
};

const useTableContexts = ({
  tableContext,
  page,
  pageSize,
  cohortOrder,
}: TableContextWithPagination): TableContexts => {
  const granularity = tableContext.granularity;
  const intervalMs = millisecondsInInterval(granularity);

  const { pageStartTime, pageEndTime } = useMemo(() => {
    const { startTime, endTime } = tableContext.timeSpec;

    switch (cohortOrder) {
      case TableSortOrder.asc: {
        const start = startTime.getTime() + page * pageSize * intervalMs;
        const end = Math.min(endTime.getTime(), start + pageSize * intervalMs);
        return { pageStartTime: start, pageEndTime: end };
      }
      case TableSortOrder.desc: {
        const end = endTime.getTime() - page * pageSize * intervalMs;
        let start = end - pageSize * intervalMs;
        switch (tableContext.granularity) {
          case RAQIV2MetricGranularity.OneWeek:
            // When using weekly granularity, the end time is aligned to Sunday midnight (00:00:00 UTC).
            // Subtracting pageSize * intervalMs from the end time would land us on another Sunday.
            // To align the start time to Monday instead, we add one day to the calculated start time.
            start += millisecondsInInterval(RAQIV2MetricGranularity.OneDay);
            break;
          case RAQIV2MetricGranularity.OneDay:
            // For daily granularity, no special alignment is needed
            break;
          default: {
            const exhaustiveCheck: never = tableContext.granularity;
            throw new Error(`Unhandled granularity: ${String(exhaustiveCheck)}`);
          }
        }
        return { pageStartTime: Math.max(startTime.getTime(), start), pageEndTime: end };
      }
      default: {
        const exhaustiveCheck: never = cohortOrder;
        throw new Error(`Unhandled table sort order: ${String(exhaustiveCheck)}`);
      }
    }
  }, [tableContext.timeSpec, tableContext.granularity, cohortOrder, page, pageSize, intervalMs]);

  return useMemo(
    () => ({
      summaryRowContext: {
        ...tableContext,
        granularity: RAQIV2MetricGranularity.None,
      },
      nonSummaryRowsContext: {
        ...tableContext,
        timeSpec: {
          ...tableContext.timeSpec,
          rangeType: RAQIV2DateRangeType.Custom,
          startTime: new Date(pageStartTime),
          endTime: new Date(pageEndTime),
        },
      },
    }),
    [pageEndTime, pageStartTime, tableContext],
  );
};

export default useTableContexts;
