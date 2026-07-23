import { AdCreativeAssetSource, ContentModerationStatus } from '@rbx/client-ads-management-api/v1';

export const VIEW_MODE = {
  LIST: 'list',
  TILE: 'tile',
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

// Sentinel used by the single-select Experience filter to mean "any game".
// (The other filter dimensions are checkbox groups where the empty set
// means "no filter", so they don't need an analogous sentinel.)
export const EXPERIENCE_FILTER_ALL = 'all';

// The filter drawer's checkbox groups treat an empty set as "no filter"
// (matches everything), so none of these constants include an `ALL`
// sentinel.

export const MEDIA_TYPE_FILTER = {
  IMAGE: 'image',
  MODEL: 'model',
  VIDEO: 'video',
} as const;

// Moderation values are sourced from the generated AMA client so they
// can't drift from the wire enum. ARCHIVED is a UI-only sentinel that
// maps to the asset's `is_archived` boolean, not a moderation state.
export const STATUS_FILTER = {
  APPROVED: ContentModerationStatus.ContentModerationStatusApproved,
  ARCHIVED: 'archived',
  PENDING_REVIEW: ContentModerationStatus.ContentModerationStatusPendingReview,
  REJECTED: ContentModerationStatus.ContentModerationStatusRejected,
} as const;

// Values come from the generated AMA client so they can be compared
// directly against `asset.source` without a mapping table.
export const SOURCE_FILTER = {
  GEN_AI: AdCreativeAssetSource.AdCreativeAssetSourceAIGen,
  UPLOAD: AdCreativeAssetSource.AdCreativeAssetSourceUpload,
} as const;
