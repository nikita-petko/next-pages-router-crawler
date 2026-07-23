import { PageResponse } from '@rbx/core';
import { contentLicensingClient, developClient } from '@modules/clients';
import { Asset, CreatorType, Item } from '@modules/miscellaneous/common';
import { UniverseModel } from '@rbx/clients/universesApi';
import { attemptNetworkRequestWithRetry } from '@modules/clients/utils';

export interface LoadExperiencesParameters {
  licenseId: string;
  creatorId: number;
  creatorType: CreatorType;
  pageIndex?: string;
  loadPageSize?: number;
}

/**
 * Represents the data structure for an experience/game
 */
export interface ExperienceData {
  // Core identification
  itemType: Item;
  assetType: Asset;
  universeId: number;
  assetId?: number;
  name: string;

  // Status flags
  isArchived: boolean;
  isClickable: boolean;
  isActive: boolean;

  // Metadata
  creatorName?: string;
}

/**
 * Fetches eligible universe IDs for the license from the content licensing API
 */
async function fetchEligibleUniverseIds(parameters: LoadExperiencesParameters): Promise<{
  universeIds: number[];
  nextPageCursor?: string;
}> {
  const contentType = 'Universe';

  const eligibleContents = await attemptNetworkRequestWithRetry(() =>
    contentLicensingClient.listEligibleContentsByLicense(
      parameters.licenseId,
      contentType,
      parameters.loadPageSize,
      parameters.pageIndex,
      parameters.creatorId.toString(),
      parameters.creatorType,
    ),
  );

  // Convert the contentId which is a string to a number
  const universeIds =
    eligibleContents.agreementContents
      ?.filter((content) => content.contentType === contentType)
      .map((content) => Number(content.contentId)) ?? [];

  return {
    universeIds,
    nextPageCursor: eligibleContents.nextPageToken ?? undefined,
  };
}

/**
 * Transforms a universe model into an ExperienceData object
 */
function transformUniverseToExperienceData(universe: UniverseModel): ExperienceData {
  return {
    itemType: Item.Game,
    assetType: Asset.Place,
    universeId: universe.id!,
    assetId: universe.rootPlaceId ?? undefined,
    name: universe.name ?? '',
    isArchived: universe.isArchived ?? false,
    isClickable: true,
    isActive: universe.privacyType?.toLowerCase() === 'public',
  };
}

/**
 * Searches for experiences based on the given parameters.
 * @param parameters Parameters used to search experiences
 * @returns A page response containing the experiences that match the search parameters
 */
async function loadExperiences(
  parameters: LoadExperiencesParameters,
): Promise<PageResponse<ExperienceData>> {
  const { universeIds, nextPageCursor } = await fetchEligibleUniverseIds(parameters);

  if (universeIds.length === 0) {
    return {
      items: [],
      nextPageCursor: undefined,
    };
  }

  const universeDetails = await developClient.getUniversesDetails(universeIds);
  const formattedData = universeDetails.data?.map(transformUniverseToExperienceData) ?? [];

  // Determine the expected minimum items based on request parameters.
  // Use loadPageSize if specified, otherwise fall back to 50 bc
  // ExperienceSelector > ItemGridContainer renders up to 100 items
  // per page so we would make max 2 API calls per page.
  const expectedMinimum = parameters.loadPageSize || 50;

  // Only return nextPageCursor if we actually have enough items to suggest there might be more.
  // This prevents infinite loading when the API can't provide the expected amount of data.
  let validatedNextPageCursor;
  if (nextPageCursor !== '' && formattedData.length >= expectedMinimum) {
    validatedNextPageCursor = nextPageCursor;
  }

  return {
    items: formattedData,
    nextPageCursor: validatedNextPageCursor,
  };
}

export default loadExperiences;
