import contentCapturesApiClient from '@modules/clients/contentCapturesApi';

export type DeleteMomentRequest = {
  momentId: string;
};

export async function deleteMoment({ momentId }: DeleteMomentRequest): Promise<void> {
  if (momentId === '') {
    throw new Error('Moment id is required before deleting');
  }

  await contentCapturesApiClient.momentsDeleteMoment({ momentId });
}
