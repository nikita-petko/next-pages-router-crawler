import { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { ReasonEnum, SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { Ages16PlusThreshold, AllAgesThreshold } from '../constants/audienceReachConstants';
import { ReachLevel, ThresholdBarColor } from '../types/audienceReach';

export interface ReachCalculationInput {
  contentMinimumAge: number;
  isUnrated: boolean;
  isPrivate: boolean;
  creatorTier: CreatorTierEnum;
  selectStatus: SelectStatusEnum;
  selectReasons: ReasonEnum[];
  isPublishedToGatedAudience: boolean;
  isUnderReview: boolean | null;
}

export interface ReachCalculationResult {
  reachLevel: ReachLevel;
  thresholdBarColor: ThresholdBarColor;
}

export function calculateReachState(input: ReachCalculationInput): ReachCalculationResult {
  const {
    contentMinimumAge,
    isUnrated,
    isPrivate,
    creatorTier,
    selectStatus,
    selectReasons,
    isPublishedToGatedAudience,
    isUnderReview,
  } = input;

  const isSelectEligible = selectStatus === SelectStatusEnum.Eligible;

  return {
    reachLevel: deriveReachLevel({
      isUnrated,
      isPrivate,
      creatorTier,
      contentMinimumAge,
      isSelectEligible,
      isPublishedToGatedAudience,
      isUnderReview,
    }),
    thresholdBarColor: deriveThresholdBarColor({
      isUnrated,
      isPrivate,
      contentMinimumAge,
      isSelectEligible,
      selectReasons,
    }),
  };
}

/**
 * Audience-reach level derivation rules (in priority order):
 * - "Personal use" — creator is Private tier, experience is private/restricted,
 *   OR content is unrated (no maturity rating means nobody else can play it).
 * - "Ages 16+" — public, rated 16+ (regardless of select eligibility).
 * - "Ages 16+ and trusted friends" — public, rated under 16, but currently
 *   not select-eligible (so the broad <16 audience can't reach it).
 * - "Ages 9+" — public, select-eligible, rated 9 to under 16.
 * - "All Ages" — public, select-eligible, rated under 9.
 */
function deriveReachLevel({
  isUnrated,
  isPrivate,
  creatorTier,
  contentMinimumAge,
  isSelectEligible,
  isPublishedToGatedAudience,
  isUnderReview,
}: {
  isUnrated: boolean;
  isPrivate: boolean;
  creatorTier: CreatorTierEnum;
  contentMinimumAge: number;
  isSelectEligible: boolean;
  isPublishedToGatedAudience: boolean;
  isUnderReview: boolean | null;
}): ReachLevel {
  // Unrated or private is personal use no matter what
  if (isUnrated || isPrivate) {
    return ReachLevel.PersonalUse;
  }

  // If select eligible, then only limited by maturity rating
  // Note: null should not be treated as false for isUnderReview
  if (isSelectEligible && isUnderReview === false) {
    if (contentMinimumAge >= Ages16PlusThreshold) {
      return ReachLevel.Ages16Plus;
    }
    if (contentMinimumAge >= AllAgesThreshold) {
      return ReachLevel.Ages9Plus;
    }
    return ReachLevel.AllAges;
  }

  // Not select eligible but current published version is available to 16+ and trusted friends
  // Trusted friends subject to content maturity rating
  if (isPublishedToGatedAudience) {
    return contentMinimumAge >= Ages16PlusThreshold
      ? ReachLevel.Ages16Plus
      : ReachLevel.Ages16PlusAndTrustedFriends;
  }

  // The game must not currently be published as Select or to Trusted tier
  // If current realtime creator tier is Private, its personal use only
  if (creatorTier === CreatorTierEnum.Private) {
    return ReachLevel.PersonalUse;
  }

  // Real time tier is eligible for 16+ or trusted friends, has not propogated to ContentCatalog for above decisions yet
  return contentMinimumAge >= Ages16PlusThreshold
    ? ReachLevel.Ages16Plus
    : ReachLevel.Ages16PlusAndTrustedFriends;
}

/**
 * Threshold bar color rules (in priority order, applied to a rated, public,
 * under-16 experience — anything else short-circuits to Muted):
 * - Green — Threshold reason absent (threshold itself is healthy, even if
 *   other reasons block select eligibility).
 * - Yellow — currently select-eligible but Threshold reason listed (grace
 *   period before tier drops).
 * - Blue — not select-eligible (only reachable here when Threshold is also
 *   present — Green and Yellow handle the other branches).
 * - Muted — the threshold doesn't apply (unrated, private, or rated 16+).
 */
function deriveThresholdBarColor({
  isUnrated,
  isPrivate,
  contentMinimumAge,
  isSelectEligible,
  selectReasons,
}: {
  isUnrated: boolean;
  isPrivate: boolean;
  contentMinimumAge: number;
  isSelectEligible: boolean;
  selectReasons: ReasonEnum[];
}): ThresholdBarColor {
  if (isUnrated || isPrivate || contentMinimumAge >= Ages16PlusThreshold) {
    return ThresholdBarColor.Muted;
  }
  if (!selectReasons.includes(ReasonEnum.Threshold)) {
    return ThresholdBarColor.Green;
  }
  if (isSelectEligible) {
    return ThresholdBarColor.Yellow;
  }
  return ThresholdBarColor.Blue;
}
