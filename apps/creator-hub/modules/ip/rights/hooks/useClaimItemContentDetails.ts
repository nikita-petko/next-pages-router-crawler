import type { ClaimItem, ClaimItemSourceEnum } from '@rbx/client-rights/v1';
import { ClaimContentContentTypeEnum, ContentMetadataCreatorTypeEnum } from '@rbx/client-rights/v1';
import { ClaimContentRole } from '../types/types';
import { useClaimItemMetadata } from './useClaimItemMetadata';
import type { ContentDetails } from './useContentDetails';
import useContentDetails, {
  DEV_MARKETPLACE_ASSET_TYPES,
  EMPTY_CONTENT_DETAILS,
} from './useContentDetails';

export interface ClaimItemContentDetailsResult {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
  originalLink: string;
  sourceOfCreation?: ClaimItemSourceEnum;
  contentDetails: ContentDetails;
  isPending: boolean;
  error: Error | null;
}

/**
 * Fetches content details for a claim item, selecting the content record based on `role`:
 *
 * - **Infringing** (`contents[0]`): primary fetch via public APIs with fallback to the
 *   claim-item metadata endpoint when the content is not publicly accessible.
 * - **Original** (`content`): primary fetch only, no fallback.
 *
 * This is an interim solution to resolve content information in the absence of a more general
 * solution for all claim items.
 */
export default function useClaimItemContentDetails(
  claimItem?: ClaimItem,
  role: ClaimContentRole = ClaimContentRole.Infringing,
): ClaimItemContentDetailsResult {
  const contentRecord =
    role === ClaimContentRole.Infringing ? claimItem?.contents?.[0] : claimItem?.content;

  const contentId = parseInt(contentRecord?.contentId ?? '-1', 10);
  const contentType = contentRecord?.contentType ?? ClaimContentContentTypeEnum.Asset;
  const originalLink = contentRecord?.url ?? '';
  const sourceOfCreation = claimItem?.source;
  const accountId = claimItem?.accountId ?? '';
  const claimItemId = claimItem?.id ?? '';
  const enabled = !!claimItem;

  const parsed = { contentId, contentType, originalLink, sourceOfCreation };

  const {
    contentDetails,
    isContentFound,
    isPending: isPrimaryPending,
    error: primaryError,
  } = useContentDetails(contentId, contentType, enabled);

  // We don't enrich metadata on original content, so we can't fallback for that yet
  const shouldFallback =
    role === ClaimContentRole.Infringing && !isContentFound && !isPrimaryPending;

  const {
    metadata,
    isPending: isMetadataPending,
    error: metadataError,
  } = useClaimItemMetadata(accountId, claimItemId, shouldFallback);

  if (isContentFound) {
    return {
      ...parsed,
      contentDetails,
      isPending: false,
      error: primaryError,
    };
  }

  if (isPrimaryPending) {
    return {
      ...parsed,
      contentDetails: EMPTY_CONTENT_DETAILS,
      isPending: true,
      error: null,
    };
  }

  if (role === ClaimContentRole.Original) {
    return {
      ...parsed,
      contentDetails: EMPTY_CONTENT_DETAILS,
      isPending: false,
      error: primaryError,
    };
  }

  if (isMetadataPending) {
    return {
      ...parsed,
      contentDetails: EMPTY_CONTENT_DETAILS,
      isPending: true,
      error: null,
    };
  }

  const content = metadata?.[0];
  if (!content) {
    return {
      ...parsed,
      contentDetails: EMPTY_CONTENT_DETAILS,
      isPending: false,
      error: metadataError ?? primaryError,
    };
  }

  const isDevMarketplace =
    contentType !== ClaimContentContentTypeEnum.Bundle &&
    !!content.assetType &&
    DEV_MARKETPLACE_ASSET_TYPES.has(content.assetType);
  const creatorType =
    content.creatorType === ContentMetadataCreatorTypeEnum.Group ? 'Group' : 'User';

  const fallbackDetails: ContentDetails = {
    contentName: content.contentName ?? '',
    creatorName: content.creatorName ?? '',
    creatorId: content.creatorId ?? '',
    creatorType,
    isDevMarketplace,
  };

  return {
    ...parsed,
    contentDetails: fallbackDetails,
    isPending: false,
    error: null,
  };
}
