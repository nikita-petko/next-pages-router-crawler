import type { MomentPublishData } from '@rbx/client-content-captures-api/v1';
import type { Locale } from '@rbx/intl';
import contentCapturesApiClient from '@modules/clients/contentCapturesApi';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import { resolveMomentPublishLocale } from '../utils/momentsUploadLocaleUtils';
import { getVideoDurationSeconds } from '../utils/momentsVideoDurationUtils';

export type PublishMomentRequest = {
  moment: StoredMomentCreation;
  file: File;
  userId: number;
  displayName: string;
  uiLocale?: Locale | null;
  sendVideoContentLanguage?: boolean;
};

export type PublishMomentResult = {
  operationId: string;
  momentId?: string | null;
};

/** Content-captures expects cookie-style lowercase locale tags (e.g. `en-us`). */
export const toVideoContentLanguage = (locale: Locale): string => locale.toLowerCase();

function buildMomentPublishData(
  moment: StoredMomentCreation,
  durationSeconds: number,
): MomentPublishData {
  return {
    metadata: {
      captureType: 'Video',
      description: moment.description,
      universeId: moment.experienceId,
      placeId: moment.rootPlaceId,
      assetTotalDuration: durationSeconds,
      edits: {},
    },
    feedRegistrationInfo: {
      contentType: 'moment',
      duration: durationSeconds,
      attributes: [],
      customTags: [],
    },
  };
}

export async function publishMoment({
  moment,
  file,
  displayName,
  uiLocale,
  sendVideoContentLanguage = true,
}: PublishMomentRequest): Promise<PublishMomentResult> {
  if (moment.experienceId == null) {
    throw new Error('Moment experience is required before publishing');
  }

  const durationSeconds = await getVideoDurationSeconds(file);
  const momentPublishData = buildMomentPublishData(moment, durationSeconds);

  const response = await contentCapturesApiClient.contentCapturesCreateInfluencerMomentFromVideo({
    files: [file],
    name: displayName,
    description: moment.description,
    universeId: moment.experienceId,
    momentPublishData: JSON.stringify(momentPublishData),
    ...(sendVideoContentLanguage
      ? {
          videoContentLanguage: toVideoContentLanguage(
            resolveMomentPublishLocale(moment, uiLocale),
          ),
        }
      : {}),
  });

  const operationId = response.operationId;
  if (operationId == null || operationId === '') {
    throw new Error('Publish operation id is missing from the response');
  }

  return {
    operationId,
    momentId: response.momentId,
  };
}
