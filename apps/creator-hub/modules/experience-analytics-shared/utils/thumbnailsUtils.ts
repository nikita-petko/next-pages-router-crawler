import { useEffect, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2MetricValue } from '@modules/clients/analytics';
import { useThumbnailUrlsMapFromContext } from '../context/ThumbnailUrlsMapProvider';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';

type TThumbnailBreakdownSeries = {
  breakdownValue: [
    { dimension: RAQIV2Dimension.ThumbnailAsset; value: string; displayValue?: string },
  ];
};
const isSeriesWithThumbnailAssetBreakdown = (
  series: RAQIV2MetricValue,
): series is TThumbnailBreakdownSeries => {
  if (series.breakdownValue?.length !== 1) {
    return false;
  }

  const breakdownValue = series.breakdownValue[0];
  return breakdownValue.dimension === RAQIV2Dimension.ThumbnailAsset && !!breakdownValue.value;
};

const useLoadThumbnailAssetIdsForData = (raqiData: RAQIV2QueryResponses | null) => {
  const { addAssetIds } = useThumbnailUrlsMapFromContext();
  const thumbnailAssetIds = useMemo(() => {
    const data = raqiData?.response?.values;
    if (data) {
      return data
        .filter(isSeriesWithThumbnailAssetBreakdown)
        .map((series) => Number(series.breakdownValue[0].value));
    }
    return [];
  }, [raqiData]);

  useEffect(() => {
    addAssetIds(thumbnailAssetIds);
  }, [addAssetIds, thumbnailAssetIds]);
};

export default useLoadThumbnailAssetIdsForData;
