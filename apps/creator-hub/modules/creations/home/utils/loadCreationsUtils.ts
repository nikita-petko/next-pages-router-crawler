import type { BatchGetUniversePublishEligibilityResponse } from '@rbx/client-core-content-api/v1';
import type { V1Beta1AgeRecommendation } from '@rbx/client-experience-guidelines-service/v1';
import type {
  MultiGetReleaseStatusesResponse,
  ReleaseStatus,
} from '@rbx/client-experience-releases-api/v1';
import type { UniverseModel } from '@rbx/client-universes-api/v1';
import { SearchCreatorType, Surface } from '@rbx/client-universes-api/v1';
import type { EventSortBy } from '@rbx/client-virtual-events-api/v1';
import { EventFilterBy, EventStatus } from '@rbx/client-virtual-events-api/v1';
import type { PageResponse } from '@rbx/core';
import { SortOrder } from '@rbx/core';
import coreContentClient from '@modules/clients/coreContent';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { multiGetExperienceReleaseStatuses } from '@modules/clients/experienceReleasesRequests';
import placeSafetyStatusApi from '@modules/clients/placeSafetyStatus';
import multiUniverseGetCanCollaborate, {
  areUniversesImpacted,
} from '@modules/clients/teamCreateCollaboration';
import universesClient, { type V1SearchUniversesRequest } from '@modules/clients/universes';
import virtualEventsClient, { EventSortOrder } from '@modules/clients/virtualEvents';
import { Asset, assetTypeToItemType, Item } from '@modules/miscellaneous/common';
import type CreationData from '../../common/interfaces/CreationData';
import { getSortForAssetType } from '../../common/interfaces/CreationsFilters';
import isStringNullOrEmpty from '../../event/utils/strings';
import type { CreationsGridPagingParameters } from '../types/CreationsGridPagingParameters';

async function loadExperienceReleaseStatuses(
  universeIds: number[],
): Promise<MultiGetReleaseStatusesResponse> {
  const response = await multiGetExperienceReleaseStatuses({
    multiGetReleaseStatusesRequest: { universeIds },
  });
  return response;
}

async function loadCoreContent(
  universeIds: number[],
): Promise<BatchGetUniversePublishEligibilityResponse> {
  const response = await coreContentClient.coreContentBatchGetUniversePublishEligibility({
    coreContentBatchGetUniversePublishEligibilityRequest: { universeIds },
  });
  return response;
}

type PlaceSafetyFlags = {
  isSequestered: boolean;
  isDiscoveryBlocked: boolean;
};

const NO_FLAGS: PlaceSafetyFlags = { isSequestered: false, isDiscoveryBlocked: false };

function getPlaceSafetyFlags(placeId: number): Promise<PlaceSafetyFlags> {
  return placeSafetyStatusApi
    .getPlaceSafetyStatusById(placeId)
    .then((res) => {
      const status = res.placeSafetyStatus;
      const restriction: unknown = status?.userPlayabilityRestrictions;
      return {
        isSequestered: restriction === 'RestrictedForAll' || restriction === 'RestrictedToOwner',
        isDiscoveryBlocked: status?.discoveryBlocked === true,
      };
    })
    .catch(() => NO_FLAGS);
}

async function loadCreationsForUniverses(
  creationsParameters: CreationsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const itemType = assetTypeToItemType[Asset.Place];

  const searchRequest: V1SearchUniversesRequest = {
    search: undefined,
    creatorType: creationsParameters.creatorType,
    creatorTargetId: creationsParameters.creatorTargetId,
    isArchived: creationsParameters.isArchived,
    isPublic: creationsParameters.isActive,
    sortOrder: creationsParameters.sortOrder,
    sortParam: creationsParameters.sort[Asset.Place],
    pageSize: creationsParameters.count,
    surface: Surface.CreatorHubCreations,
    pageIndex: creationsParameters.cursor
      ? Number.parseInt(creationsParameters.cursor, 10)
      : undefined,
    needsAssetOptions: true,
  };
  const response = await universesClient.searchUniverses(searchRequest);

  const { data } = response;

  const cursorString = (
    (response.nextResultIndex ?? 0) / (creationsParameters.count ?? 10)
  )?.toString();
  const nextPageCursor = response.nextResultIndex ? cursorString : undefined;

  const formattedData =
    data?.map((universe: UniverseModel) => ({
      itemType,
      assetType: Asset.Place,
      universeId: universe.id,
      assetId: universe.rootPlaceId ?? undefined,
      name: universe.name ?? undefined,
      isDirectlyArchivable: true,
      isArchived: universe.isArchived,
      isClickable: true,
      creatorType: creationsParameters.creatorType,
      isActive: universe.privacyType?.toLowerCase() === 'public',
      isFriendsOnly: universe.isFriendsOnly ?? undefined,
      audiences: creationsParameters.enableAudiencesReplacement
        ? (universe.audiences ?? undefined)
        : undefined,
    })) ?? [];

  const filteredData = formattedData.filter(
    (universe) =>
      creationsParameters.isArchived === undefined ||
      universe.isArchived === creationsParameters.isArchived,
  );

  // Add experience guidelines
  let guidelinesAddedData = filteredData;
  try {
    const universeIds = filteredData
      .map((item) => item.universeId ?? 0)
      .filter((item) => item !== 0);
    const guidelines =
      (await experienceGuidelinesServiceApiClient.multiGetAgeRecommendations(universeIds, true))
        .ageRecommendationDetailsByUniverse ?? [];
    const guidelinesByUniverseId: Record<number, V1Beta1AgeRecommendation | undefined> = {};
    guidelines.reduce((acc, curr) => {
      if (
        curr.universeId &&
        curr.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation
      ) {
        acc[curr.universeId] =
          curr.ageRecommendationDetails.ageRecommendationSummary.ageRecommendation;
      }

      return acc;
    }, guidelinesByUniverseId);

    guidelinesAddedData =
      filteredData.map((universe) => ({
        ...universe,
        ageRecommendation: universe.universeId
          ? guidelinesByUniverseId[universe.universeId]
          : undefined,
      })) ?? [];
  } catch {
    // If EGS errors, do not block loading of creations.
  }

  // Add release statuses
  let releaseStatusAddedData = guidelinesAddedData;
  try {
    const universeIds = guidelinesAddedData
      .map((item) => item.universeId ?? 0)
      .filter((item) => item !== 0);
    const releaseStatusResponse = await loadExperienceReleaseStatuses(universeIds);
    const releaseStatusByUniverseId: Record<number, ReleaseStatus | undefined> = {};

    // The API returns parallel arrays of universeIds and releaseTypes
    if (releaseStatusResponse.universeIds && releaseStatusResponse.releaseTypes) {
      releaseStatusResponse.universeIds.forEach((universeId, index) => {
        if (universeId && releaseStatusResponse.releaseTypes) {
          releaseStatusByUniverseId[universeId] = releaseStatusResponse.releaseTypes[index];
        }
      });
    }

    releaseStatusAddedData =
      guidelinesAddedData.map((universe) => ({
        ...universe,
        releaseStatus: universe.universeId
          ? releaseStatusByUniverseId[universe.universeId]
          : undefined,
      })) ?? [];
  } catch {
    // If release status service errors, do not block loading of creations.
  }

  // Add age-restricted collaboration status
  let ageRestrictedCollaborationAddedData: CreationData[] = releaseStatusAddedData;
  try {
    const collaborationUniverseIds = releaseStatusAddedData
      .map((item) => item.universeId ?? 0)
      .filter((id) => id !== 0);

    if (creationsParameters.isOwnerViewEnabled) {
      const impactedByUniverseId = await areUniversesImpacted(collaborationUniverseIds);
      ageRestrictedCollaborationAddedData = releaseStatusAddedData.map((universe) => {
        const result = universe.universeId ? impactedByUniverseId[universe.universeId] : undefined;
        return {
          ...universe,
          isAgeRestrictedCollaboration: result?.IsImpacted ?? false,
          isAdminOfImpactedExperience: result?.IsAdmin ?? false,
        };
      });
    } else {
      const ageRestrictedByUniverseId =
        await multiUniverseGetCanCollaborate(collaborationUniverseIds);
      ageRestrictedCollaborationAddedData = releaseStatusAddedData.map((universe) => ({
        ...universe,
        isAgeRestrictedCollaboration: universe.universeId
          ? (ageRestrictedByUniverseId[universe.universeId] ?? false)
          : false,
      }));
    }
  } catch {
    // If age restriction fetch errors, do not block loading of creations.
  }

  // Add core content
  let coreContentAddedData: CreationData[] = ageRestrictedCollaborationAddedData;
  try {
    const coreContentResponse = await loadCoreContent(
      ageRestrictedCollaborationAddedData
        .map((item) => item.universeId ?? 0)
        .filter((item) => item !== 0),
    );
    coreContentAddedData = ageRestrictedCollaborationAddedData.map((item) => ({
      ...item,
      coreContentEligibility: item.universeId
        ? coreContentResponse.universeEligibilities[item.universeId]
        : undefined,
    }));
  } catch {
    // If core content fetch errors, do not block loading of creations.
  }

  let sequestrationMergedData = coreContentAddedData;
  try {
    const settlements = await Promise.allSettled(
      coreContentAddedData.map(async (item) => {
        const universeId = item.universeId ?? 0;
        const placeId = item.assetId;
        if (!placeId || typeof placeId !== 'number') {
          return { universeId, flags: NO_FLAGS };
        }
        const flags = await getPlaceSafetyFlags(placeId);
        return { universeId, flags };
      }),
    );

    const safetyFlagsByUniverseId: Record<number, PlaceSafetyFlags> = {};
    settlements.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.universeId) {
        safetyFlagsByUniverseId[result.value.universeId] = result.value.flags;
      }
    });

    sequestrationMergedData = coreContentAddedData.map((item) => {
      const flags = item.universeId
        ? (safetyFlagsByUniverseId[item.universeId] ?? NO_FLAGS)
        : NO_FLAGS;
      return {
        ...item,
        isSequestered: flags.isSequestered,
        isDiscoveryBlocked: flags.isDiscoveryBlocked,
      };
    });
  } catch {
    // If place safety fetch errors, do not block loading of creations.
  }

  return {
    nextPageCursor,
    items: sequestrationMergedData,
  };
}

async function loadCreationsForEventsByUniverseId(
  creationsParameters: CreationsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  // TODO: Migrate to new Asset types when the Event Visibility states are available.
  let filterBy;
  // eslint-disable-next-line typescript-eslint/switch-exhaustiveness-check -- only event asset types are expected here
  switch (creationsParameters.assetType) {
    case Asset.DraftEvent:
      filterBy = EventFilterBy.Drafts;
      break;
    case Asset.UpcomingEvent:
      filterBy = EventFilterBy.Upcoming;
      break;
    case Asset.PastEvent:
      filterBy = EventFilterBy.Past;
      break;
    default:
      filterBy = EventFilterBy.Upcoming;
      break;
  }

  const { nextPageCursor, data } = await virtualEventsClient.getMyEvents({
    cursor: creationsParameters.cursor,
    filterBy,
    sortOrder:
      creationsParameters.sortOrder === SortOrder.Asc ? EventSortOrder.Asc : EventSortOrder.Desc,
    fromUtc:
      filterBy === EventFilterBy.Upcoming || filterBy === EventFilterBy.Past
        ? (creationsParameters.fromUtc ?? new Date())
        : undefined,

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- pre-checked that assetType is an event type
    sortBy: getSortForAssetType(
      creationsParameters.assetType,
      creationsParameters.sort,
    ) as EventSortBy,
    groupId:
      creationsParameters.creatorType === SearchCreatorType.Group
        ? creationsParameters.creatorTargetId
        : undefined,
  });

  const formattedData =
    data
      ?.map((virtualEvent) => ({
        itemType: Item.Event,
        assetType: creationsParameters.assetType,
        assetId: virtualEvent.id ?? 0,
        universeId: virtualEvent.universeId ?? undefined,
        name: virtualEvent.title ?? undefined,
        isActive: virtualEvent.eventStatus === EventStatus.Active,
        isClickable: true,
        placeDescription: virtualEvent.description ?? undefined,
        startTime: virtualEvent.eventTime?.startUtc,
        endTime: virtualEvent.eventTime?.endUtc,
        eventStatus: virtualEvent.eventStatus,
        firstThumbnailId: virtualEvent.thumbnails?.[0]?.mediaId,
      }))
      ?.filter((event) => {
        return event.universeId === Number(creationsParameters.universeId);
      }) ?? [];

  return {
    nextPageCursor: !isStringNullOrEmpty(nextPageCursor)
      ? (nextPageCursor ?? undefined)
      : undefined,
    items: formattedData,
  };
}

async function loadCreationsForEvents(
  creationsParameters: CreationsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  let filterBy;
  // eslint-disable-next-line typescript-eslint/switch-exhaustiveness-check -- only event asset types are expected here
  switch (creationsParameters.assetType) {
    case Asset.DraftEvent:
      filterBy = EventFilterBy.Drafts;
      break;
    case Asset.UpcomingEvent:
      filterBy = EventFilterBy.Upcoming;
      break;
    case Asset.PastEvent:
      filterBy = EventFilterBy.Past;
      break;
    default:
      filterBy = EventFilterBy.Upcoming;
      break;
  }

  const { nextPageCursor, data } = await virtualEventsClient.getMyEvents({
    cursor: creationsParameters.cursor,
    filterBy,
    sortOrder:
      creationsParameters.sortOrder === SortOrder.Asc ? EventSortOrder.Asc : EventSortOrder.Desc,
    fromUtc:
      filterBy === EventFilterBy.Upcoming || filterBy === EventFilterBy.Past
        ? (creationsParameters.fromUtc ?? new Date())
        : undefined,

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- pre-checked that assetType is an event type
    sortBy: getSortForAssetType(
      creationsParameters.assetType,
      creationsParameters.sort,
    ) as EventSortBy,
    groupId:
      creationsParameters.creatorType === SearchCreatorType.Group
        ? creationsParameters.creatorTargetId
        : undefined,
  });

  const formattedData =
    data?.map((virtualEvent) => ({
      itemType: Item.Event,
      assetType: creationsParameters.assetType,
      assetId: virtualEvent.id ?? 0,
      universeId: virtualEvent.universeId ?? undefined,
      name: virtualEvent.title ?? undefined,
      isActive: virtualEvent.eventStatus === EventStatus.Active,
      isClickable: true,
      placeDescription: virtualEvent.description ?? undefined,
      startTime: virtualEvent.eventTime?.startUtc,
      endTime: virtualEvent.eventTime?.endUtc,
      eventStatus: virtualEvent.eventStatus,
      firstThumbnailId: virtualEvent.thumbnails?.[0]?.mediaId,
    })) ?? [];

  return {
    nextPageCursor: !isStringNullOrEmpty(nextPageCursor)
      ? (nextPageCursor ?? undefined)
      : undefined,
    items: formattedData,
  };
}

export default async function loadCreationsForAssetType(
  creationsParameters: CreationsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const { assetType } = creationsParameters;
  const itemType = assetTypeToItemType[assetType];
  if (assetType === Asset.MyExperiences) {
    return loadCreationsForUniverses(creationsParameters);
  }
  if (assetType === Asset.SharedExperiences) {
    return loadCreationsForUniverses({
      ...creationsParameters,
      creatorType: SearchCreatorType.Team,
    });
  }

  if (itemType === Item.Event) {
    if (creationsParameters.universeId) {
      return loadCreationsForEventsByUniverseId(creationsParameters);
    }
    return loadCreationsForEvents(creationsParameters);
  }

  // Should never reach here. If it's a catalog asset, it will be handled by loadAvatarItemUtils.ts
  return { nextPageCursor: undefined, items: [] };
}
