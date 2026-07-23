import { useMemo } from 'react';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import type { LabeledDateRange } from '../types/LabeledDateRange';

export type AnalyticsLabeledDateRangesBundle = {
  labeledTimeRanges: LabeledDateRange[];
  setLabeledTimeRangesQuery: (ranges: LabeledDateRange[]) => void;
};

const useQueryBasedLabeledTimeRangesBundle = (): AnalyticsLabeledDateRangesBundle => {
  const [{ [AnalyticsQueryParams.LabeledTimeRanges]: query }, setQuery] = useQueryParams([
    AnalyticsQueryParams.LabeledTimeRanges,
  ]);

  const parseTimeRangeQueryString = (queryToParse: string | string[] | null | undefined) => {
    if (!queryToParse) {
      return [];
    }
    const queryArray = Array.isArray(queryToParse) ? queryToParse : [queryToParse];
    return queryArray.map((queryString) => {
      const splitString = queryString.split('-');
      if (splitString.length < 2) {
        throw new Error();
      } else {
        return {
          startTime: new Date(parseInt(splitString[0], 10)),
          endTime: new Date(parseInt(splitString[1], 10)),
          label: splitString.length > 2 ? splitString.slice(2).join('-') : '',
        };
      }
    });
  };

  const setLabeledTimeRangesQuery = useMemo(() => {
    const setRangeQuery = (ranges: LabeledDateRange[]) => {
      const queryArray = ranges.map((timeRange) => {
        return `${timeRange.startTime.getTime().toString()}-${timeRange.endTime.getTime().toString()}-${timeRange.label || ''}`;
      });
      setQuery({ labeledTimeRange: queryArray });
    };

    return setRangeQuery;
  }, [setQuery]);

  const labeledTimeRanges = useMemo(() => {
    return parseTimeRangeQueryString(query);
  }, [query]);

  return {
    labeledTimeRanges,
    setLabeledTimeRangesQuery,
  };
};

export default useQueryBasedLabeledTimeRangesBundle;
