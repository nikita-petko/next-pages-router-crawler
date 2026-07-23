import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getThumbnailsClient } from '@rbx/thumbnails';
import {
  RobloxWebResponsesThumbnailsThumbnailResponse,
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/clients/thumbnails';
import { RAQIV2MetricValue } from '@modules/clients/analytics';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';
import { useThumbnailUrlsMapFromContext } from '../context/ThumbnailUrlsMapProvider';

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

export const useLoadThumbnailAssetIdsForData = (raqiData: RAQIV2QueryResponses | null) => {
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

const emptyMap = new Map<string, string>();

export const useGetThumbnailUrlsMap = (assetIds: number[]) => {
  const select = useCallback(
    (data: RobloxWebResponsesThumbnailsThumbnailResponse[]): ReadonlyMap<string, string> => {
      if (data.length === 0) {
        return emptyMap;
      }
      return data.reduce((acc, curr) => {
        if (!curr.targetId || !curr.imageUrl) {
          return acc;
        }
        acc.set(curr.targetId.toString(), curr.imageUrl);
        return acc;
      }, new Map<string, string>());
    },
    [],
  );
  return useQuery({
    queryKey: ['thumbnailUrls', assetIds],
    queryFn: async () => {
      const thumbnailClient = getThumbnailsClient();
      const { data } = await thumbnailClient.getAssets(
        assetIds,
        V1AssetsGetReturnPolicyEnum.PlaceHolder,
        // eslint-disable-next-line no-underscore-dangle -- we need to access the value of the enum
        V1AssetsGetSizeEnum._768x432,
        V1AssetsGetFormatEnum.Webp,
        false,
      );
      return data ?? [];
    },
    initialData: [],
    select,
    enabled: assetIds.length > 0,
  });
};
