import type {
  RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion,
  V1AssetsAssetIdSavedVersionsGetLimitEnum,
  RobloxApiDevelopAssetVersion,
} from '@rbx/client-develop/v1';
import developClient from '@modules/clients/develop';

type PlaceVersionHistoryResponse = RobloxWebWebAPIModelsApiPageResponseRobloxApiDevelopAssetVersion;

export async function setPlaceVersionHistory(
  publishedVersionsOnly: boolean,
  placeId: number,
  setIsLoadingCurrentVersionHistory: React.Dispatch<React.SetStateAction<boolean>>,
  setNextPageCursor: React.Dispatch<React.SetStateAction<string>>,
  setCurrentVersionHistory: React.Dispatch<
    React.SetStateAction<RobloxApiDevelopAssetVersion[] | undefined>
  >,
  setVersionHistoryCount: React.Dispatch<React.SetStateAction<number>>,
  limit?: number,
  cursor?: string,
  prevPageCount?: number,
): Promise<void> {
  if (placeId) {
    setIsLoadingCurrentVersionHistory(true);
    try {
      const pageSize = getPageSize(limit);
      const accumulatedVersionHistory: RobloxApiDevelopAssetVersion[] = [];
      let currNextPage = cursor ?? '';
      do {
        const response = await getPlaceVersionHistory(
          publishedVersionsOnly,
          placeId,
          currNextPage,
          pageSize,
        );
        currNextPage = response.nextPageCursor ?? '';
        if (response.data) {
          accumulatedVersionHistory.push(...response.data);
        }
        // oxlint-disable-next-line eqeqeq, no-unmodified-loop-condition -- preserved pre-existing loose equality, limit needed for length check
      } while (limit && currNextPage != '' && accumulatedVersionHistory.length < limit);
      setNextPageCursor(currNextPage);
      setCurrentVersionHistory(accumulatedVersionHistory);

      // fetched all published versions, meaning we know the total count
      if (
        publishedVersionsOnly &&
        accumulatedVersionHistory &&
        currNextPage === '' &&
        limit &&
        prevPageCount !== undefined
      ) {
        setVersionHistoryCount(accumulatedVersionHistory.length + prevPageCount * limit);
      } else if (publishedVersionsOnly || (cursor === undefined && accumulatedVersionHistory)) {
        // sets the count of versions to the max version number
        // if getting all place versions this is fine
        // for 'only published', this will allow for continued pagination until all published versions are fetched
        setVersionHistoryCount(
          Math.max(...accumulatedVersionHistory.map((version) => version.assetVersionNumber ?? 0)),
        );
      }
    } catch {
      setCurrentVersionHistory(undefined);
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
  const pageSize = getPageSize(limit);
  if (publishedVersionsOnly) {
    // oxlint-disable-next-line typescript/return-await -- preserved pre-existing style
    return await developClient.getAssetPublishedVersions(
      placeId,
      undefined,
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserved pre-existing style
      pageSize as V1AssetsAssetIdSavedVersionsGetLimitEnum,
      nextPage,
    );
  }
  // oxlint-disable-next-line typescript/return-await -- preserved pre-existing style
  return await developClient.getAssetSavedVersions(
    placeId,
    undefined,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- preserved pre-existing style
    pageSize as V1AssetsAssetIdSavedVersionsGetLimitEnum,
    nextPage,
  );
}

const getPageSize = (limit?: number) => {
  let pageSize = limit ?? 0;
  if (pageSize > 100) {
    // This pageSize strategy only works if the last two digits in the page sizes are in [00, 10, 25, 50]
    // eslint-disable-next-line eqeqeq -- preserved pre-existing loose equality
    pageSize = pageSize % 100 == 0 ? 100 : pageSize % 100;
  }
  return pageSize;
};
