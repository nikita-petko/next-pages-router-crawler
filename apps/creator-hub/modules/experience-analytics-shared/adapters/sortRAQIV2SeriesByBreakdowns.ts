import {
  TRAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2BreakdownValueOrder,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { GenericSeriesInfo, logAnalyticsError } from '@modules/charts-generic';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

type DimensionSortFunction = (
  a: RAQIV2BreakdownValue | undefined,
  b: RAQIV2BreakdownValue | undefined,
) => number;

export const dimensionAlphabeticalSort: DimensionSortFunction = (a, b) => {
  const aValue = a?.value;
  const bValue = b?.value;
  if (aValue === undefined && bValue === undefined) {
    return 0;
  }
  if (aValue === undefined) {
    return 1;
  }
  if (bValue === undefined) {
    return -1;
  }
  return aValue.localeCompare(bValue);
};

export const makePartialOrderSortFunction = <TDimensionValues extends string>({
  ordering,
  remainingSort,
}: {
  ordering: Array<TDimensionValues>;
  remainingSort?: RAQIV2BreakdownValueOrder;
}): DimensionSortFunction => {
  return (a, b) => {
    // generally there are few enough breakdowns (generally just 1)
    // that we can reasonably search for the target dimension for each pair of series
    const aValue = a?.value;
    const bValue = b?.value;
    if (aValue === undefined && bValue === undefined) {
      return 0;
    }
    // if one of the values on this dimension is undefined, sort that one to the end
    if (aValue === undefined) {
      return 1;
    }
    if (bValue === undefined) {
      return -1;
    }

    const aIndex = ordering.indexOf(aValue as TDimensionValues);
    const bIndex = ordering.indexOf(bValue as TDimensionValues);

    const aInOrdering = aIndex !== -1;
    const bInOrdering = bIndex !== -1;

    // Both values are in the ordering array - sort by their position
    if (aInOrdering && bInOrdering) {
      return aIndex - bIndex;
    }

    // Only one value is in the ordering array - it comes first
    if (aInOrdering && !bInOrdering) {
      return -1;
    }
    if (!aInOrdering && bInOrdering) {
      return 1;
    }

    switch (remainingSort) {
      case RAQIV2BreakdownValueOrder.SortByValueAlphabetically:
        return dimensionAlphabeticalSort(a, b);
      case RAQIV2BreakdownValueOrder.SortBySum: {
        logAnalyticsError(
          'SortBySum is not supported for partial ordering yet, implement it later',
        );
        return 0;
      }
      case RAQIV2BreakdownValueOrder.Unsorted:
      case undefined:
        // For Unsorted, or undefined remainingSort, maintain relative order
        return 0;
      default: {
        const exhaustiveCheck: never = remainingSort;
        throw new Error(`Unknown remaining sort ${exhaustiveCheck}`);
      }
    }
  };
};

export const sortBySum = <T, V extends number>(
  series: GenericSeriesInfo<T, V>[],
): GenericSeriesInfo<T, V>[] => {
  const seriesWithSums: [number, GenericSeriesInfo<T, V>][] = series.map((s) => {
    const sum = s.dataPoints.reduce((acc, cur) => acc + (cur[1] ?? 0), 0);
    return [sum, s];
  });
  return seriesWithSums
    .sort((a, b) => {
      // if either is a total series, it should be first
      // otherwise pick the one with the higher sum
      if (a[1].isTotalSeries && !b[1].isTotalSeries) {
        return -1;
      }
      if (!a[1].isTotalSeries && b[1].isTotalSeries) {
        return 1;
      }
      return b[0] - a[0];
    })
    .map(([, s]) => s);
};

type BreakdownOrderingConfig = Exclude<
  (typeof RAQIV2DimensionDisplayConfig)[TRAQIV2Dimension]['breakdownOrdering'],
  RAQIV2BreakdownValueOrder.Unsorted | RAQIV2BreakdownValueOrder.SortBySum
>;
type SeriesInfoLike = { isTotalSeries: boolean; breakdownValues: RAQIV2BreakdownValue[] };
export const sortInPlaceByBreakdownOrdering = <T extends SeriesInfoLike>(
  arrayToSort: T[],
  targetDimension: TRAQIV2Dimension,
  config: BreakdownOrderingConfig,
) => {
  const sortFunction =
    config === RAQIV2BreakdownValueOrder.SortByValueAlphabetically
      ? dimensionAlphabeticalSort
      : makePartialOrderSortFunction({
          ordering: config.completeOrder || config.partialOrder || [],
          remainingSort: config.remainingSort,
        });
  arrayToSort.sort((a, b) => {
    if (a.isTotalSeries && !b.isTotalSeries) {
      return -1;
    }
    if (!a.isTotalSeries && b.isTotalSeries) {
      return 1;
    }
    return sortFunction(
      a.breakdownValues.find(({ dimension }) => dimension === targetDimension),
      b.breakdownValues.find(({ dimension }) => dimension === targetDimension),
    );
  });
};

/**
 * This is used for sorting time series data for charts.
 * Tables are sorted in genericRAQIV2Adapter and then later based on metric values.
 */
const sortRAQIV2SeriesByBreakdowns = <T, V extends number>(
  unsortedSeries: GenericSeriesInfo<T, V>[],
  spec: RAQIV2ChartSpec,
): GenericSeriesInfo<T, V>[] => {
  // for each breakdown dimension (in reverse),
  // sort the series if there is a sort function for that dimension
  // if there is no sort function, don't sort on that dimension
  // if a series is a total series, it should be first
  const { breakdown } = spec;
  const sortedSeries = [...unsortedSeries];
  if (!breakdown || !breakdown.length) {
    return sortedSeries;
  }
  for (let i = breakdown.length - 1; i >= 0; i -= 1) {
    const targetDimension = breakdown[i];
    const config = RAQIV2DimensionDisplayConfig[targetDimension].breakdownOrdering;
    if (config === RAQIV2BreakdownValueOrder.Unsorted) {
      return sortedSeries;
    }
    if (config === RAQIV2BreakdownValueOrder.SortBySum) {
      return sortBySum(sortedSeries);
    }
    sortInPlaceByBreakdownOrdering(sortedSeries, targetDimension, config);
  }
  return sortedSeries;
};
export default sortRAQIV2SeriesByBreakdowns;
