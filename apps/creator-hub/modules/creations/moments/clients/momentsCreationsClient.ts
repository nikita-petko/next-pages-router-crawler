import type { ContentCapturesApiModelsResponseGetUsersMomentsResponse as GetUsersMomentsResponse } from '@rbx/client-content-captures-api/v1';
import type { Locale } from '@rbx/intl';
import contentCapturesApiClient from '@modules/clients/contentCapturesApi';
import developClient from '@modules/clients/develop';
import { MOMENTS_LIST_PAGE_SIZE } from '../constants/momentsCreationsConstants';
import {
  logMomentsCreationsError,
  MomentsCreationsErrorOperation,
} from '../logging/momentsCreationsErrorLogging';
import {
  logMomentsCreationsAttempt,
  logMomentsCreationsSuccess,
  MomentsCreationsOperation,
} from '../logging/momentsCreationsEventLogging';
import type {
  DraftMomentCreation,
  ListMomentsPageParams,
  ListMomentsPageResponse,
  ServerMomentCreation,
} from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import { parseUsersMomentsResponse } from '../utils/parseUsersMomentsResponse';

export type UploadMomentVideoRequest = {
  experienceId: number;
  experienceName: string;
  rootPlaceId?: number;
  locale?: Locale;
  file: File;
  onProgress?: (progress: number) => void;
};

const UPLOAD_PROGRESS_STEPS = 10;
const UPLOAD_PROGRESS_STEP_MS = 100;

/** Mints the client-only identifier for a local draft. Never a server id. */
const createDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `moment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const fetchUserMomentsPage = async (
  userId: number,
  pageParams?: ListMomentsPageParams,
): Promise<GetUsersMomentsResponse> =>
  contentCapturesApiClient.momentsGetUsersMoments({
    targetUserId: userId,
    paginationContext: pageParams?.paginationContext,
    count: MOMENTS_LIST_PAGE_SIZE,
  });

const enrichMomentsWithExperienceNames = async (
  moments: ServerMomentCreation[],
): Promise<ServerMomentCreation[]> => {
  const universeIds = [
    ...new Set(
      moments
        .map((moment) => moment.universeId)
        .filter((universeId): universeId is number => universeId != null && universeId > 0),
    ),
  ];

  if (universeIds.length === 0) {
    return moments;
  }

  try {
    logMomentsCreationsAttempt(MomentsCreationsOperation.EnrichExperienceNames, {
      universeIdCount: universeIds.length,
    });
    const { data: universes = [] } = await developClient.getUniversesDetails(universeIds);
    const experienceNameByUniverseId = new Map(
      universes
        .filter(
          (universe): universe is typeof universe & { id: number; name: string } =>
            universe.id != null && typeof universe.name === 'string' && universe.name.length > 0,
        )
        .map((universe) => [universe.id, universe.name]),
    );

    const enrichedMoments = moments.map((moment) => {
      const experienceName =
        moment.universeId != null ? (experienceNameByUniverseId.get(moment.universeId) ?? '') : '';

      return experienceName === moment.experienceName
        ? moment
        : {
            ...moment,
            experienceName,
          };
    });
    logMomentsCreationsSuccess(MomentsCreationsOperation.EnrichExperienceNames, {
      universeIdCount: universeIds.length,
    });

    return enrichedMoments;
  } catch (enrichError) {
    logMomentsCreationsError(MomentsCreationsErrorOperation.EnrichExperienceNames, enrichError, {
      universeIdCount: universeIds.length,
    });
    return moments;
  }
};

/**
 * Loads one page of Moments for the current creator context.
 */
const listMomentsPage = async (
  userId: number,
  pageParams?: ListMomentsPageParams,
  useFeedItemId = false,
): Promise<ListMomentsPageResponse> => {
  const operation =
    pageParams?.paginationContext != null
      ? MomentsCreationsOperation.FetchNextPage
      : MomentsCreationsOperation.ListMoments;

  logMomentsCreationsAttempt(operation, { userId });

  const response = await fetchUserMomentsPage(userId, pageParams);
  const parsedMoments = parseUsersMomentsResponse(response, useFeedItemId);
  const moments = await enrichMomentsWithExperienceNames(parsedMoments);

  logMomentsCreationsSuccess(operation, {
    userId,
    pageCount: pageParams?.pageNumber ?? 1,
    momentCount: moments.length,
  });

  return {
    moments,
    paginationContext: response.paginationContext ?? undefined,
  };
};

/**
 * Uploads a Moments video for the selected experience.
 * TODO: Replace stub with the Moments upload API when available.
 */
const uploadMomentVideo = async ({
  experienceId,
  experienceName,
  rootPlaceId,
  locale,
  onProgress,
}: UploadMomentVideoRequest): Promise<DraftMomentCreation> => {
  for (let step = 1; step <= UPLOAD_PROGRESS_STEPS; step += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, UPLOAD_PROGRESS_STEP_MS);
    });
    onProgress?.(step / UPLOAD_PROGRESS_STEPS);
  }

  return {
    draftId: createDraftId(),
    experienceId,
    rootPlaceId,
    experienceName,
    description: '',
    modifiedAt: new Date().toISOString(),
    status: MomentCreationStatus.DRAFT,
    ...(locale != null ? { locale } : {}),
  };
};

const momentsCreationsClient = {
  listMomentsPage,
  uploadMomentVideo,
};

export default momentsCreationsClient;
