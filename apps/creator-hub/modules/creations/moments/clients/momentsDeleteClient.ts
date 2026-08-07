import contentCapturesApiClient from '@modules/clients/contentCapturesApi';

export type DeleteMomentRequest = {
  /** `ServerMomentCreation.feedItemId`. Required when `useFeedItemId` is true. */
  feedItemId?: string;
  /** `ServerMomentCreation.momentId`. Required when `useFeedItemId` is false. */
  momentId?: string;
  /** `isMomentsFeedIdEnabled`. Selects the endpoint and which id is required. */
  useFeedItemId?: boolean;
};

/**
 * Deletes a server-backed moment.
 *
 * The required id is guarded here rather than proven by the type system: a runtime check at the
 * network boundary is the right place for it, and it keeps `ServerMomentCreation` readable.
 */
export async function deleteMoment({
  feedItemId,
  momentId,
  useFeedItemId = false,
}: DeleteMomentRequest): Promise<void> {
  if (useFeedItemId) {
    if (feedItemId == null || feedItemId === '') {
      throw new Error('Moment feed item id is required before deleting');
    }

    await contentCapturesApiClient.momentsDeleteMomentByFeedItem({ feedItemId });
    return;
  }

  if (momentId == null || momentId === '') {
    throw new Error('Moment id is required before deleting');
  }

  await contentCapturesApiClient.momentsDeleteMoment({ momentId });
}
