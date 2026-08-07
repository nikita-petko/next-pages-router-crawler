import type {
  ContentCapturesApiModelsResponseGetUsersMomentsResponse as GetUsersMomentsResponse,
  ContentCapturesApiModelsResponseMomentItem as MomentItem,
} from '@rbx/client-content-captures-api/v1';
import type { ServerMomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import { parseVideoContentLanguage } from './momentsUploadLocaleUtils';

/** Server moments are never drafts: `DRAFT` is a local-only status. */
type ServerMomentCreationStatus = ServerMomentCreation['status'];

const MOMENT_TYPE_STATUS_MAP: Record<string, ServerMomentCreationStatus> = {
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
  momentType: string | null | undefined,
): ServerMomentCreationStatus => {
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

/**
 * Captures both raw identifiers so analytics can report either without consulting the flag, and
 * returns null when the identifier `useFeedItemId` selects is absent.
 *
 * Dropping a row is the deliberate choice over rendering one that cannot be deleted: without its
 * delete key the row's action would fail.
 */
export const parseMomentItemToCreation = (
  item: MomentItem,
  useFeedItemId = false,
): ServerMomentCreation | null => {
  const momentId = item.id ?? undefined;
  const feedItemId = item.feedItemId ?? undefined;
  const requiredId = useFeedItemId ? feedItemId : momentId;
  if (requiredId == null || requiredId === '') {
    return null;
  }

  const normalizedType = item.type?.toLowerCase() ?? '';
  if (normalizedType === 'draft' || normalizedType.includes('draft')) {
    return null;
  }

  const captionedAssetMoment = item.captionedAssetMoment;
  const universeId = item.primaryCta?.experienceCta?.experienceId;
  const locale = parseVideoContentLanguage(captionedAssetMoment?.videoContentLanguage);

  return {
    momentId,
    feedItemId,
    assetId: captionedAssetMoment?.assetId,
    description: captionedAssetMoment?.caption ?? '',
    experienceName: '',
    modifiedAt: UNKNOWN_MODIFIED_AT,
    status: parseMomentCreationStatus(item.type),
    universeId,
    ...(locale != null ? { locale } : {}),
  };
};

/**
 * `response.moderatedMomentIds` and `response.failedMomentIds` are deliberately ignored: a moment
 * listed there is never also present in `items`, so cross-referencing them could never match.
 * Moderated moments still reach the table through `item.type` -> `MOMENT_TYPE_STATUS_MAP`.
 */
export const parseUsersMomentsResponse = (
  response: GetUsersMomentsResponse,
  useFeedItemId = false,
): ServerMomentCreation[] =>
  (response.items ?? [])
    .map((item) => parseMomentItemToCreation(item, useFeedItemId))
    .filter((moment): moment is ServerMomentCreation => moment != null);
