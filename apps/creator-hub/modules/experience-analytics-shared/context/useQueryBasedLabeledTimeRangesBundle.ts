import { useCallback, useMemo } from 'react';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import useQueryParams, { type TQueryParamValue } from '@modules/miscellaneous/hooks/useQueryParams';
import type { LabeledDateRange } from '../types/LabeledDateRange';

export type AnalyticsLabeledDateRangesBundle = {
  labeledTimeRanges: LabeledDateRange[];
  setLabeledTimeRangesQuery: (ranges: LabeledDateRange[]) => void;
};

const labeledTimeRangeQueryKeys = [AnalyticsQueryParams.LabeledTimeRanges] as const;
const MinTimeRangeSegments = 2;

const parseTimeRangeQueryString = (queryToParse: TQueryParamValue): LabeledDateRange[] => {
  if (!queryToParse) {
    return [];
  }
  const queryArray = Array.isArray(queryToParse) ? queryToParse : [queryToParse];
  return queryArray.map((queryString) => {
    const splitString = queryString.split('-');
    if (splitString.length < MinTimeRangeSegments) {
      throw new Error(
        `Invalid labeled time range query string: expected at least ${MinTimeRangeSegments} segments`,
      );
    }
    return {
      startTime: new Date(parseInt(splitString[0], 10)),
      endTime: new Date(parseInt(splitString[1], 10)),
      label:
        splitString.length > MinTimeRangeSegments
          ? splitString.slice(MinTimeRangeSegments).join('-')
          : '',
    };
  });
};

const useQueryBasedLabeledTimeRangesBundle = (): AnalyticsLabeledDateRangesBundle => {
  const [queryParams, setQueryParams] = useQueryParams(labeledTimeRangeQueryKeys);
  const query = queryParams[AnalyticsQueryParams.LabeledTimeRanges];

  const setLabeledTimeRangesQuery = useCallback(
    (ranges: LabeledDateRange[]) => {
      const queryArray = ranges.map((timeRange) => {
        return `${timeRange.startTime.getTime().toString()}-${timeRange.endTime.getTime().toString()}-${timeRange.label ?? ''}`;
      });
      setQueryParams({ [AnalyticsQueryParams.LabeledTimeRanges]: queryArray });
    },
    [setQueryParams],
  );

  const labeledTimeRanges = useMemo(() => {
    return parseTimeRangeQueryString(query);
  }, [query]);

  return {
    labeledTimeRanges,
    setLabeledTimeRangesQuery,
  };
};

export default useQueryBasedLabeledTimeRangesBundle;
