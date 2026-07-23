import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  millisecondsInInterval,
  SeriesIntervalMeaning,
  type GenericTablePaginationSpec,
} from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

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
  seriesIntervalMeaning,
  pageSize = 10,
}: {
  startTime: Date;
  endTime: Date;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  pageSize?: number;
}): GenericTablePaginationSpec => {
  const [page, setPage] = useState(0);
  const onNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page]);
  const onPreviousPage = useCallback(() => {
    setPage(page - 1);
  }, [page]);

  // Reset page when seriesIntervalMeaning changes
  useEffect(() => {
    setPage(0);
  }, [seriesIntervalMeaning.length]);

  const total = useMemo(() => {
    const timeIntervalMs = millisecondsInInterval(seriesIntervalMeaning);
    const totalMs = endTime.getTime() - startTime.getTime();
    return Math.floor(totalMs / timeIntervalMs);
  }, [endTime, startTime, seriesIntervalMeaning]);

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
