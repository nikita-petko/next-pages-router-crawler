import { useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { isForcedSinglePlaceFilter } from '../utils/placeFilterLock';
import useCurrentAnalyticsPageContextMetrics from './useCurrentAnalyticsPageContextMetrics';
import useRAQIV2DimensionChoiceRenderBundle from './useRAQIV2DimensionChoiceRenderBundle';

const useForcedSinglePlaceFilterLock = (
  resource: RAQIV2ChartResource,
): {
  hidePlaceFilter: boolean;
} => {
  const contextMetrics = useCurrentAnalyticsPageContextMetrics();
  const metrics = useMemo(() => contextMetrics ?? [], [contextMetrics]);
  const { enumOptions, isDataLoading } = useRAQIV2DimensionChoiceRenderBundle(
    resource,
    RAQIV2Dimension.Place,
    metrics,
    undefined,
    { onlyFilterSupportedValues: true },
  );

  return {
    hidePlaceFilter:
      !isDataLoading && isForcedSinglePlaceFilter(RAQIV2Dimension.Place, enumOptions.length),
  };
};

export default useForcedSinglePlaceFilterLock;
