import { useCallback, useEffect, useMemo, useState } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import { millisecondsInInterval } from '@modules/charts-generic/utils/granularityUtils';

const emptyFunction = () => {};
const emptyArray: number[] = [];

export const cohortTimeIntervals = [
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneWeek,
] as const;
export type CohortTimeInterval = (typeof cohortTimeIntervals)[number];

const useRetentionCohortPagination = ({
  startTime,
  endTime,
  granularity,
  pageSize = 10,
}: {
  startTime: Date;
  endTime: Date;
  granularity: RAQIV2MetricGranularity;
  pageSize?: number;
}): GenericTablePaginationSpec => {
  const [page, setPage] = useState(0);
  const onNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page]);
  const onPreviousPage = useCallback(() => {
    setPage(page - 1);
  }, [page]);

  // Reset page when granularity changes
  useEffect(() => {
    setPage(0);
  }, [granularity]);

  const total = useMemo(() => {
    const timeIntervalMs = millisecondsInInterval(granularity);
    const totalMs = endTime.getTime() - startTime.getTime();
    return Math.floor(totalMs / timeIntervalMs);
  }, [endTime, startTime, granularity]);

  const pagination = useMemo(
    () => ({
      page,
      total,
      pageSize,
      pageSizeOptions: emptyArray,
      setPageSize: emptyFunction,
      onNextPage,
      onPreviousPage,
      hasNext: (page + 1) * pageSize < total,
      hasPrevious: page > 0,
    }),
    [onNextPage, onPreviousPage, page, pageSize, total],
  );

  return pagination;
};

export default useRetentionCohortPagination;
