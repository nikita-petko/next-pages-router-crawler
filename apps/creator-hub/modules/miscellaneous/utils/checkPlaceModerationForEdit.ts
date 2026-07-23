import { gamesClient, placeSafetyStatusApi } from '@modules/clients';

/** Sequestered places cannot be edited in Studio; we show the "Experience is locked" dialog. */
const SEQUESTERED_PLAYABILITY_RESTRICTION = 'RestrictedForAll';

/**
 * Checks whether both the place being launched and the root place of its universe
 * pass moderation. Only when both pass should we allow opening in Studio.
 * Uses content-safety place safety status (RestrictedForAll = not allowed).
 */
export default async function checkPlaceModerationForEdit(
  universeId: string,
  placeId: string,
): Promise<boolean> {
  const universeIdNum = Number(universeId);
  const placeIdNum = Number(placeId);
  if (!Number.isFinite(universeIdNum) || !Number.isFinite(placeIdNum)) {
    return false;
  }

  const response = await gamesClient.getDetails([universeIdNum]);
  const gameDetail = response.data?.[0];
  const rootPlaceId = gameDetail?.rootPlaceId;
  if (rootPlaceId == null) {
    return false;
  }

  const placeIdsToCheck = new Set([placeIdNum, rootPlaceId]);

  const results = await Promise.all(
    [...placeIdsToCheck].map(async (id) => {
      const safety = await placeSafetyStatusApi.getPlaceSafetyStatusById(id);
      const restrictions = safety.placeSafetyStatus?.userPlayabilityRestrictions;
      return restrictions !== SEQUESTERED_PLAYABILITY_RESTRICTION;
    }),
  );
  return results.every(Boolean);
}
