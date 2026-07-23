import { uniqBy } from 'lodash';

import assetsClient from '@clients/assets';
import { EventName, logNativeErrorEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import { getUniverses } from '@services/ads/getUniversesService';
import { getHttpStatusFromError } from '@type/errorResponse';
import { CaptureException } from '@utils/error';

const fetchUniverseRootPlaceId = async (universeId: number) => {
  try {
    const universeResponse = await getUniverses([universeId]);
    const firstUniverse = universeResponse.data?.[0];
    const rootPlaceId = firstUniverse?.rootPlaceId;
    return rootPlaceId;
  } catch (e) {
    logNativeErrorEvent({
      error: e,
      eventName: EventName.RootPlaceIdFetched,
      parameters: { function: 'fetchUniverserootPlaceId' },
    });
    CaptureException({
      error: e as Error,
      message: `error fetchUniverserootPlaceId for universeId ${universeId}`,
    });
    return null;
  }
};

export const getThumbnailsByUniverseId = async (universeId: number) => {
  try {
    const rootPlaceId = await fetchUniverseRootPlaceId(universeId);
    if (!rootPlaceId) {
      return { assetIds: [], data: [] };
    }

    const response = await assetsClient.get<{ previews: { asset: string }[] }>({
      url: `/assets/${rootPlaceId}?readMask=previews`,
    });

    const assetIds = response.data.previews.map((preview) => {
      const assetParts = preview.asset.split('/');
      return assetParts[1]; // Extract the numeric part after "assets/"
    });

    // Fetch details for each asset ID in parallel and filter based on moderationState, state, and assetType
    const filteredAssetIds = (
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const assetDetails = await assetsClient.get<{
              assetType: string;
              moderationResult: { moderationState: string };
              state: string;
            }>({
              url: `/assets/${assetId}`,
            });

            const { assetType, moderationResult, state } = assetDetails.data;

            if (
              assetType === 'Image' &&
              moderationResult?.moderationState === 'Approved' &&
              state === 'Active'
            ) {
              return assetId;
            }
          } catch (e) {
            logNativeErrorEvent({
              error: e,
              eventName: EventName.AssetsFetched,
              parameters: { function: 'filteredAssetIds' },
            });
            CaptureException({
              error: e as Error,
              message: `error fetching asset details for assetId ${assetId}`,
            });
          }
          return null;
        }),
      )
    ).filter((assetId): assetId is string => !!assetId); // Filter out null values

    return {
      assetIds: filteredAssetIds,
      data: uniqBy(response.data.previews, 'asset').filter(({ asset }) =>
        filteredAssetIds.includes(asset.split('/')[1]),
      ),
    };
  } catch (e) {
    logNativeImpressionEvent(EventName.CreativeLibraryLoadFailed, {
      context: 'campaign_builder',
      source: 'auto_imported_assets',
      statusCode: String(getHttpStatusFromError(e) ?? 'unknown'),
    });
    logNativeErrorEvent({
      error: e,
      eventName: EventName.AssetsFetched,
      parameters: { function: 'getThumbnailsByUniverseId' },
    });
    CaptureException({
      error: e as Error,
      message: `error getThumbnailsByUniverseId for universeId ${universeId}`,
    });
    return { assetIds: [], data: [] };
  }
};
