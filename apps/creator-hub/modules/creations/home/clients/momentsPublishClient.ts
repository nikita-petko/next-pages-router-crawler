import type { ContentCapturesSharedModelsMomentPublishData as MomentPublishData } from '@rbx/client-content-captures-api/v1';
import type { Locale } from '@rbx/intl';
import contentCapturesApiClient from '@modules/clients/contentCapturesApi';
import type { DraftMomentCreation } from '../types/MomentCreation';
import { resolveMomentPublishLocale } from '../utils/momentsUploadLocaleUtils';
import { getVideoDurationSeconds } from '../utils/momentsVideoDurationUtils';

export type PublishMomentRequest = {
  moment: DraftMomentCreation;
  file: File;
  userId: number;
  displayName: string;
  uiLocale?: Locale | null;
  sendVideoContentLanguage?: boolean;
};

export type PublishMomentResult = {
  operationId: string;
};

/** Content-captures expects cookie-style lowercase locale tags (e.g. `en-us`). */
export const toVideoContentLanguage = (locale: Locale): string => locale.toLowerCase();

function buildMomentPublishData(
  moment: DraftMomentCreation,
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
  // Typed as a required number, but drafts normalized from older localStorage records default it
  // to 0 when the stored value was unreadable, and the API rejects a falsy universeId.
  if (!moment.experienceId) {
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
  };
}
