import type { GithubRbxComRobloxAdsManagementApiInternalModelsPolicyViolation as AdPolicyReviewLabel } from '@rbx/client-ads-management-api/v1';

/** Default prompt length cap when metadata has not hydrated yet. Matches AMA middleware. */
export const DEFAULT_GEN_AI_CREATIVES_USER_PROMPT_MAX_LENGTH = 100;

/** Foundation icon for AI Create entry-point Generate buttons. */
export const AI_CREATE_GENERATE_ICON = 'icon-regular-nebula' as const;

/** Foundation icon for the campaign-builder "Add creative" menu item. */
export const AI_CREATE_ADD_CREATIVE_ICON = 'icon-regular-plus-small' as const;

/** Foundation icon for the Report action in the generated-image tile menu. */
export const AI_CREATE_REPORT_ICON = 'icon-regular-megaphone' as const;

/** Foundation icon for the Don't show this again action in the generated-image tile menu. */
export const AI_CREATE_HIDE_IMAGE_ICON = 'icon-regular-circle-x' as const;

/**
 * A report reason is a value from the canonical AdPolicyReviewLabel taxonomy shared
 * with AMA (POST /v1/adCreatives/report) and ads-moderation surfaces, so the values
 * we send are the same enum the backend validates against. The report dialog sources
 * the selectable reasons directly from the shared ads-moderation label map.
 */
export type AiCreativeReportReason = AdPolicyReviewLabel;

export const MAX_AI_CREATIVE_FEEDBACK_DETAILS_LENGTH = 1000;

const GEN_AI_CREATIVES_AGREEMENT_STORAGE_KEY_PREFIX = 'genAiCreativesAgreementAccepted';

// Enum string values from the ad-management client's AdAssetType
// (AdAssetTypeImage / AdAssetTypeModel). Inlined as literals so this constants
// module carries no runtime dependency on the generated client.
export const AI_CREATIVE_REFERENCE_IMAGE_TYPES: ReadonlyArray<string> = ['AD_ASSET_TYPE_IMAGE'];
export const AI_CREATIVE_REFERENCE_MODEL_TYPES: ReadonlyArray<string> = ['AD_ASSET_TYPE_MODEL'];

/**
 * Canonical set of asset-type tokens accepted as user-supplied AI-creative
 * reference assets, kept in sync with the backend `allowedUserReferenceAssetTypes`
 * allow-list in `ads-management-api` (which is in turn a curated visual-cosmetic
 * subset of the `AvatarEquippableAssetTypes` group granted to that client in
 * assets-core — see Roblox/assets-core#4388). Alongside the original image/model
 * references, creators can reference avatar/UGC wearables they own: clothing,
 * accessories, dynamic-head accessories, makeup, and heads. Non-visual members of
 * the group (animations, avatar backgrounds, classic body parts) are intentionally
 * excluded here and in the backend.
 *
 * Tokens are stored in a normalized, separator-free, prefix-stripped form so a
 * single set matches both the develop `/v1/assets` human-readable strings
 * (e.g. `"BackAccessory"`, `"Model"`) and the ad-management client enum strings
 * (e.g. `AD_ASSET_TYPE_BACK_ACCESSORY`).
 */
const AI_CREATIVE_REFERENCE_SUPPORTED_TYPE_TOKENS: ReadonlySet<string> = new Set([
  'image',
  'model',
  // Clothing
  'tshirt',
  'shirt',
  'pants',
  'hat',
  // Accessories
  'hairaccessory',
  'faceaccessory',
  'neckaccessory',
  'shoulderaccessory',
  'frontaccessory',
  'backaccessory',
  'waistaccessory',
  'tshirtaccessory',
  'shirtaccessory',
  'pantsaccessory',
  'jacketaccessory',
  'sweateraccessory',
  'shortsaccessory',
  'leftshoeaccessory',
  'rightshoeaccessory',
  'dressskirtaccessory',
  // Dynamic head + related accessories
  'eyebrowaccessory',
  'eyelashaccessory',
  'dynamichead',
  // Head
  'head',
  // Makeup
  'facemakeup',
  'lipmakeup',
  'eyemakeup',
]);

/**
 * Normalizes an asset-type string to the separator-free, lowercased form used as
 * keys in {@link AI_CREATIVE_REFERENCE_SUPPORTED_TYPE_TOKENS}, stripping the
 * `AdAssetType`/`AD_ASSET_TYPE_` enum prefix so develop and client forms collapse
 * to the same token (e.g. both `"DynamicHead"` and `AD_ASSET_TYPE_DYNAMIC_HEAD`
 * become `"dynamichead"`).
 */
const toCanonicalReferenceTypeToken = (type: string): string =>
  type
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^adassettype/, '');

/**
 * Whether an asset type is accepted as an AI-creative reference asset. Accepts
 * image, model, and the curated avatar/UGC wearable types (see
 * {@link AI_CREATIVE_REFERENCE_SUPPORTED_TYPE_TOKENS}). Handles both the develop
 * `/v1/assets` human-readable strings and the ad-management client enum strings.
 */
export const isSupportedAiCreativeReferenceAssetType = (type: string | undefined): boolean => {
  if (type == null) {
    return false;
  }
  return AI_CREATIVE_REFERENCE_SUPPORTED_TYPE_TOKENS.has(toCanonicalReferenceTypeToken(type));
};

/** Minimal moderation shape from the develop `/v1/assets` response. */
interface AiCreativeReferenceModerationFields {
  isModerated?: boolean;
  moderationStatus?: string;
  reviewStatus?: string;
}

/**
 * Fail-open moderation pre-check for reference assets, mirroring AMA's
 * `IsApproved` gate (the generate call otherwise returns a 400 "reference asset
 * X has not been approved"). The develop `/v1/assets` response carries a
 * traffic-light `moderationStatus` (`"Green"` = clean), a `reviewStatus`
 * (`"Finished"` once review completes), and `isModerated` (true once the asset
 * has been flagged). We block only on a *clear* negative signal; unknown or
 * absent fields fall through to `true` so the backend stays the source of truth
 * and we never false-block a valid asset in the picker.
 */
export const isAiCreativeReferenceAssetLikelyApproved = (
  asset: AiCreativeReferenceModerationFields,
): boolean => {
  if (asset.isModerated === true) {
    return false;
  }
  const review = asset.reviewStatus?.trim().toLowerCase();
  if (review != null && review !== '' && review !== 'finished') {
    return false;
  }
  const status = asset.moderationStatus?.trim().toLowerCase();
  if (status != null && status !== '' && status !== 'green') {
    return false;
  }
  return true;
};

export const getGenAiCreativesAgreementStorageKey = (userId: number): string =>
  `${GEN_AI_CREATIVES_AGREEMENT_STORAGE_KEY_PREFIX}:${userId}`;
