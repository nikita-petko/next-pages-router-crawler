import type { MomentPublishData } from '@rbx/client-content-captures-api/v1';
import contentCapturesApiClient from '@modules/clients/contentCapturesApi';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import { getVideoDurationSeconds } from '../utils/momentsVideoDurationUtils';

export type PublishMomentRequest = {
  moment: StoredMomentCreation;
  file: File;
  userId: number;
  displayName: string;
};

export type PublishMomentResult = {
  operationId: string;
  momentId?: string | null;
};

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
