import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  type RAQIV2Dimension,
  type TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2ChartResourceType,
  type RAQIV2BreakdownValue,
  type RAQIV2ChartResource,
} from '@modules/clients/analytics';
import useRAQIV2DimensionValuesRequest from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionValuesRequest';
import useRAQIV2SortedDimensionValues from '@modules/experience-analytics-shared/hooks/useRAQIV2SortedDimensionValues';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';
import { isLoadingRAQIV2Prerequisites } from '@modules/experience-analytics-shared/utils/RAQIV2InternalException';

export const SESSION_BROWSER_RAQI_DIMENSION_DATE_RANGE = {
  type: DateRangeSelectionType.Preset,
  rangeType: RAQIV2DateRangeType.Last90Days,
  granularity: RAQIV2MetricGranularity.OneDay,
} as const;

export type SessionBrowserRaqiDimensionValueSort = 'dimensionConfig' | 'localeCompare';

export type SessionBrowserRaqiDimensionValues = {
  readonly options: string[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refresh: () => void;
};

const EMPTY_BREAKDOWN_VALUES: RAQIV2BreakdownValue[] = [];

const toOptionNames = (breakdownValues: readonly RAQIV2BreakdownValue[]): string[] =>
  breakdownValues.flatMap((entry) => {
    const { value } = entry;
    return value === undefined || value === '' ? [] : [value];
  });

const useSessionBrowserRaqiDimensionValues = (
  universeId: number,
  dimension: RAQIV2Dimension,
  contextMetrics: readonly TRAQIV2APIMetric[],
  sortMode: SessionBrowserRaqiDimensionValueSort,
): SessionBrowserRaqiDimensionValues => {
  const resource = useMemo<RAQIV2ChartResource>(
    () => ({
      id: universeId,
      type: RAQIV2ChartResourceType.Universe,
      isLoading: universeId <= 0,
    }),
    [universeId],
  );
  const { data, isDataLoading, isResponseFailed, refresh } = useRAQIV2DimensionValuesRequest(
    resource,
    dimension,
    contextMetrics,
    SESSION_BROWSER_RAQI_DIMENSION_DATE_RANGE,
  );
  const sortedBreakdownValues = useRAQIV2SortedDimensionValues(
    dimension,
    data?.values ?? EMPTY_BREAKDOWN_VALUES,
  );
  const isResolving = isDataLoading || isLoadingRAQIV2Prerequisites(resource);

  const options = useMemo(() => {
    const names = toOptionNames(sortedBreakdownValues);
    if (sortMode === 'localeCompare') {
      return [...names].sort((left, right) => left.localeCompare(right));
    }
    return names;
  }, [sortedBreakdownValues, sortMode]);

  return {
    options,
    isLoading: isResolving,
    // Null is both a prereq short-circuit and a finished empty payload; only
    // the latter is an error (`isResolving` avoids a failure flash on mount).
    isError: !isResolving && (isResponseFailed || data === null),
    refresh,
  };
};

export default useSessionBrowserRaqiDimensionValues;
