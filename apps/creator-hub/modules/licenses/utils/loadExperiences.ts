import type { UniverseModel } from '@rbx/client-universes-api/v1';
import type { PageResponse } from '@rbx/core';
import contentLicensingClient from '@modules/clients/contentLicensing';
import developClient from '@modules/clients/develop';
import { attemptNetworkRequestWithRetry } from '@modules/clients/utils';
import { Audience } from '@modules/creations/common/audiences';
import type { CreatorType } from '@modules/miscellaneous/common';
import { Asset, Item } from '@modules/miscellaneous/common';

export interface LoadExperiencesParameters {
  licenseId: string;
  creatorId: number;
  creatorType: CreatorType;
  /** Page token for eligible-contents API (used when invoked outside CursorPager). */
  pageIndex?: string;
  /** Next page token; set by CursorPager on subsequent loads (see PagingParameters.cursor). */
  cursor?: string;
  loadPageSize?: number;
  enableAudiencesReplacement?: boolean;
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

  const pageToken = parameters.pageIndex ?? parameters.cursor;

  const eligibleContents = await attemptNetworkRequestWithRetry(() =>
    contentLicensingClient.listEligibleContentsByLicense(
      parameters.licenseId,
      contentType,
      parameters.loadPageSize,
      pageToken,
      parameters.creatorId.toString(),
      parameters.creatorType,
    ),
  );

  // Convert the contentId which is a string to a number
  const universeIds =
    eligibleContents.agreementContents
      ?.filter((content) => content.contentType === contentType)
      .map((content) => Number(content.contentId)) ?? [];

  const token = eligibleContents.nextPageToken;
  const nextPageCursor = typeof token === 'string' && token !== '' ? token : undefined;

  return {
    universeIds,
    nextPageCursor,
  };
}

/** Eligible-contents uses an empty string when there is no next page; never infer that from row counts. */
function hasNextPageToken(token: string | undefined): boolean {
  return typeof token === 'string' && token !== '';
}

/** Caps chained eligible-contents calls per loadItems invocation (throttling / runaway guard). */
const MAX_ELIGIBLE_CONTENT_PAGES_PER_LOAD = 30;

const DEFAULT_LOAD_PAGE_SIZE = 50;

/**
 * Transforms a universe model into an ExperienceData object
 */
function transformUniverseToExperienceData(
  universe: UniverseModel,
  enableAudiencesReplacement: boolean,
): ExperienceData {
  const isActive = enableAudiencesReplacement
    ? (universe.audiences?.includes(Audience.Public) ?? false)
    : universe.privacyType?.toLowerCase() === 'public';
  return {
    itemType: Item.Game,
    assetType: Asset.Place,
    universeId: universe.id ?? 0,
    assetId: universe.rootPlaceId ?? undefined,
    name: universe.name ?? '',
    isArchived: universe.isArchived ?? false,
    isClickable: true,
    isActive,
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
  const targetBatchSize = parameters.loadPageSize ?? DEFAULT_LOAD_PAGE_SIZE;
  let pageCursor: string | undefined = parameters.pageIndex ?? parameters.cursor;
  const seenUniverseIds = new Set<number>();
  const universeIdsInOrder: number[] = [];
  let nextPageTokenForClient: string | undefined;

  let eligiblePagesFetched = 0;
  while (eligiblePagesFetched < MAX_ELIGIBLE_CONTENT_PAGES_PER_LOAD) {
    eligiblePagesFetched += 1;
    // Sequential eligible-contents fetches: each pageToken comes from the prior response.
    const { universeIds, nextPageCursor } = await fetchEligibleUniverseIds({
      ...parameters,
      pageIndex: pageCursor,
      cursor: undefined,
    });

    universeIds.forEach((id) => {
      if (!seenUniverseIds.has(id)) {
        seenUniverseIds.add(id);
        universeIdsInOrder.push(id);
      }
    });

    if (!hasNextPageToken(nextPageCursor)) {
      nextPageTokenForClient = undefined;
      break;
    }

    nextPageTokenForClient = nextPageCursor;

    if (universeIdsInOrder.length >= targetBatchSize) {
      break;
    }

    pageCursor = nextPageCursor;
  }

  if (universeIdsInOrder.length === 0) {
    return {
      items: [],
      nextPageCursor: undefined,
    };
  }

  const universeDetails = await developClient.getUniversesDetails(universeIdsInOrder);
  const formattedData =
    universeDetails.data?.map((universe) =>
      transformUniverseToExperienceData(universe, parameters.enableAudiencesReplacement === true),
    ) ?? [];

  return {
    items: formattedData,
    nextPageCursor: nextPageTokenForClient,
  };
}

export default loadExperiences;
