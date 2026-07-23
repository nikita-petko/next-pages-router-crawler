import { PageResponse, SortOrder } from '@rbx/core';
import { Asset, assetTypeToItemType, Item } from '@modules/miscellaneous/common';
import virtualEventsClient, { EventSortOrder } from '@modules/clients/virtualEvents';
import { EventFilterBy, EventSortBy, EventStatus } from '@rbx/clients/virtualEventsApi';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { V1Beta1AgeRecommendation } from '@rbx/clients/experienceGuidelinesService';
import { universesClient, V1SearchUniversesRequest } from '@modules/clients';
import { SearchCreatorType, Surface, UniverseModel } from '@rbx/clients/universesApi';
import coreContentClient from '@modules/clients/coreContent';
import { multiGetExperienceReleaseStatuses } from '@modules/clients/experienceReleasesRequests';
import { MultiGetReleaseStatusesResponse, ReleaseStatus } from '@rbx/clients/experienceReleases';
import { BatchGetUniversePublishEligibilityResponse } from '@rbx/clients/coreContentApi';
import multiUniverseGetCanCollaborate from '@modules/clients/teamCreateCollaboration';
import { getSortForAssetType } from '../../common/interfaces/CreationsFilters';
import isStringNullOrEmpty from '../../event/utils/strings';
import { CreationData } from '../../common';
import { CreationsGridPagingParameters } from '../containers/CreationsGridContainer';

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
      isActive: universe.privacyType?.toLowerCase() === 'public',
      creatorType: creationsParameters.creatorType,
      isFriendsOnly: universe.isFriendsOnly ?? undefined,
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
  if (creationsParameters.enableExperienceReleases) {
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
  }

  // Add age-restricted collaboration status
  let ageRestrictedCollaborationAddedData: CreationData[] = releaseStatusAddedData;
  if (creationsParameters.enableImpactedExperiencesView) {
    try {
      const collaborationUniverseIds = releaseStatusAddedData
        .map((item) => item.universeId ?? 0)
        .filter((id) => id !== 0);
      const ageRestrictedByUniverseId =
        await multiUniverseGetCanCollaborate(collaborationUniverseIds);
      ageRestrictedCollaborationAddedData = releaseStatusAddedData.map((universe) => ({
        ...universe,
        isAgeRestrictedCollaboration: universe.universeId
          ? (ageRestrictedByUniverseId[universe.universeId] ?? false)
          : false,
      }));
    } catch {
      // If age restriction fetch errors, do not block loading of creations.
    }
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

  return {
    nextPageCursor,
    items: coreContentAddedData,
  };
}

async function loadCreationsForEventsByUniverseId(
  creationsParameters: CreationsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  // TODO: Migrate to new Asset types when the Event Visibility states are available.
  let filterBy;
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

    // Safe to perform the as cast here as we've pre-checked that the assetType is an event type
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

    // Safe to perform the as cast here as we've pre-checked that the assetType is an event type
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
