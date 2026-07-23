import type { GetUsersMomentsResponse, MomentItem } from '@rbx/client-content-captures-api/v1';
import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';

const MOMENT_TYPE_STATUS_MAP: Record<string, MomentCreationStatus> = {
  active: MomentCreationStatus.ACTIVE,
  captionedassetmoment: MomentCreationStatus.ACTIVE,
  live: MomentCreationStatus.ACTIVE,
  moderated: MomentCreationStatus.MODERATED,
  pending: MomentCreationStatus.PENDING,
  published: MomentCreationStatus.ACTIVE,
};

const UNKNOWN_MODIFIED_AT = new Date(0).toISOString();

/** Maps a content-captures moment type string to a table filter status. Draft is local-only. */
export const parseMomentCreationStatus = (
  momentId: string,
  momentType: string | null | undefined,
  moderatedMomentIds: readonly string[],
): MomentCreationStatus => {
  if (moderatedMomentIds.includes(momentId)) {
    return MomentCreationStatus.MODERATED;
  }

  if (!momentType) {
    return MomentCreationStatus.ACTIVE;
  }

  const directMatch = MOMENT_TYPE_STATUS_MAP[momentType.toLowerCase()];
  if (directMatch) {
    return directMatch;
  }

  const normalizedType = momentType.toLowerCase();
  if (normalizedType.includes('pending')) {
    return MomentCreationStatus.PENDING;
  }
  if (
    normalizedType.includes('active') ||
    normalizedType.includes('publish') ||
    normalizedType.includes('live')
  ) {
    return MomentCreationStatus.ACTIVE;
  }

  return MomentCreationStatus.ACTIVE;
};

export const parseMomentItemToCreation = (
  item: MomentItem,
  moderatedMomentIds: readonly string[],
): MomentCreation | null => {
  const momentId = item.id;
  if (!momentId) {
    return null;
  }

  const normalizedType = item.type?.toLowerCase() ?? '';
  if (normalizedType === 'draft' || normalizedType.includes('draft')) {
    return null;
  }

  const captionedAssetMoment = item.captionedAssetMoment;
  const universeId = item.primaryCta?.experienceCta?.experienceId;

  return {
    id: momentId,
    assetId: captionedAssetMoment?.assetId,
    description: captionedAssetMoment?.caption ?? '',
    experienceName: '',
    modifiedAt: UNKNOWN_MODIFIED_AT,
    status: parseMomentCreationStatus(momentId, item.type, moderatedMomentIds),
    universeId,
  };
};

export const parseUsersMomentsResponse = (response: GetUsersMomentsResponse): MomentCreation[] => {
  const moderatedMomentIds = response.moderatedMomentIds ?? [];

  return (response.items ?? [])
    .map((item) => parseMomentItemToCreation(item, moderatedMomentIds))
    .filter((moment): moment is MomentCreation => moment != null);
};
