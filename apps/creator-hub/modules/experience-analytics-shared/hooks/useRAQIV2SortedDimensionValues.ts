import { useMemo } from 'react';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import {
  RAQIV2BreakdownValueOrder,
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
} from '@rbx/creator-hub-analytics-config';
import {
  dimensionAlphabeticalSort,
  makePartialOrderSortFunction,
} from '../adapters/sortRAQIV2SeriesByBreakdowns';

const useRAQIV2SortedDimensionValues = (
  dimension: RAQIV2Dimension,
  breakdownValues: RAQIV2BreakdownValue[],
) => {
  const sortedData = useMemo(() => {
    const config = RAQIV2DimensionDisplayConfig[dimension];
    if (
      config.breakdownOrdering === RAQIV2BreakdownValueOrder.Unsorted ||
      config.breakdownOrdering === RAQIV2BreakdownValueOrder.SortBySum
    ) {
      return breakdownValues;
    }
    const sortFunction =
      config.breakdownOrdering === RAQIV2BreakdownValueOrder.SortByValueAlphabetically
        ? dimensionAlphabeticalSort
        : makePartialOrderSortFunction({
            ordering:
              config.breakdownOrdering.completeOrder || config.breakdownOrdering.partialOrder || [],
            remainingSort: config.breakdownOrdering.remainingSort,
          });
    const sortedValues = [...breakdownValues];
    sortedValues.sort(sortFunction);
    return sortedValues;
  }, [breakdownValues, dimension]);
  return sortedData;
};

export default useRAQIV2SortedDimensionValues;
