import {
  RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion,
  V1AssetsAssetIdSavedVersionsGetLimitEnum,
  RobloxApiDevelopAssetVersion,
} from '@rbx/clients/develop';
import { developClient } from '@modules/clients';

type PlaceVersionHistoryResponse = RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion;

export async function setPlaceVersionHistory(
  publishedVersionsOnly: boolean,
  placeId: number,
  setIsLoadingCurrentVersionHistory: React.Dispatch<React.SetStateAction<boolean>>,
  setNextPageCursor: React.Dispatch<React.SetStateAction<string>>,
  setCurrentVersionHistory: React.Dispatch<React.SetStateAction<RobloxApiDevelopAssetVersion[]>>,
  setVersionHistoryCount: React.Dispatch<React.SetStateAction<number>>,
  setVersionHistoryResponse: React.Dispatch<
    React.SetStateAction<RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion | null>
  >,
  limit?: number,
  cursor?: string,
): Promise<void> {
  if (placeId) {
    setIsLoadingCurrentVersionHistory(true);
    try {
      let pageSize = getPageSize(limit);
      const accumulatedVersionHistory: RobloxApiDevelopAssetVersion[] = [];
      let currNextPage = cursor ? cursor : '';
      do {
        let response = await getPlaceVersionHistory(
          publishedVersionsOnly,
          placeId,
          currNextPage,
          pageSize,
        );
        currNextPage = response.nextPageCursor ? response.nextPageCursor : '';
        if (response.data) {
          accumulatedVersionHistory.push(...response.data);
        }
      } while (limit && currNextPage != '' && accumulatedVersionHistory.length < limit);
      setNextPageCursor(currNextPage);
      setCurrentVersionHistory(accumulatedVersionHistory);
      if (cursor === undefined && accumulatedVersionHistory) {
        if (publishedVersionsOnly) {
          // We dont know the count of published versions, so we pass in -1 which is used for an unknown number of items
          setVersionHistoryCount(-1);
        } else {
          setVersionHistoryCount(
            Math.max(
              ...accumulatedVersionHistory.map((version) => version.assetVersionNumber || 0),
            ),
          );
        }
      }
    } catch {
      setVersionHistoryResponse(null);
      setVersionHistoryCount(0);
    } finally {
      setIsLoadingCurrentVersionHistory(false);
    }
  }
}

async function getPlaceVersionHistory(
  publishedVersionsOnly: boolean,
  placeId: number,
  nextPage: string,
  limit?: number,
): Promise<PlaceVersionHistoryResponse> {
  let pageSize = getPageSize(limit);
  if (publishedVersionsOnly) {
    return await developClient.getAssetPublishedVersions(
      placeId,
      undefined,
      pageSize as V1AssetsAssetIdSavedVersionsGetLimitEnum,
      nextPage,
    );
  } else {
    return await developClient.getAssetSavedVersions(
      placeId,
      undefined,
      pageSize as V1AssetsAssetIdSavedVersionsGetLimitEnum,
      nextPage,
    );
  }
}

const getPageSize = (limit?: number) => {
  let pageSize = limit ? limit : 0;
  if (pageSize > 100) {
    // This pageSize strategy only works if the last two digits in the page sizes are in [00, 10, 25, 50]
    pageSize = pageSize % 100 == 0 ? 100 : pageSize % 100;
  }
  return pageSize;
};
