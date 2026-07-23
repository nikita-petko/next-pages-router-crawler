import { AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';

export enum AdIntegrationPlacementStatus {
  Approved = 'Approved',
  Archived = 'Archived',
  InReview = 'InReview',
  Limited = 'Limited',
  Rejected = 'Rejected',
}

const APPROVED_LABELS = new Set<AdPolicyReviewLabelType>([
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_APPROVE_ALL_AGE,
]);

// TODO(jkohn) Return moderation status per placement from the backend so this logic can be removed.
const REJECTED_LABELS = new Set<AdPolicyReviewLabelType>([
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNSPECIFIED,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ABUSE_OF_ROBLOX_EMPLOYEES_OR_AFFILIATES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_BULLYING_AND_HARASSMENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CHEATING_AND_EXPLOITS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CHILD_ENDANGERMENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CONTESTS_AND_SWEEPSTAKES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DATING_AND_ROMANTIC_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DIRECTING_USERS_OFF_PLATFORM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DISCRIMINATION_AND_HATE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DISRUPTIVE_AUDIO,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_EXTORTION_AND_BLACKMAIL,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_HARMFUL_OFF_PLATFORM_SPEECH_AND_BEHAVIOR,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ILLEGAL_AND_REGULATED_ACTIVITIES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_IP_VIOLATIONS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MISLEADING_IMPERSONATION_MISREPRESENTATION,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MISUSING_ROBLOX_SYSTEMS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_POLITICAL_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_PROFANITY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_REAL_WORLD_DANGEROUS_ACTIVITIES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_REAL_WORLD_TRAGEDY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ROBLOX_ECONOMY,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SCAMS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SEXUAL_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SHARING_PII,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SPAM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_SUICIDE_AND_SELF_HARM,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_TVE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_THREATS_OF_VIOLENCE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_VIOLENT_CONTENT_AND_GORE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ANIMALS_AND_INSECTS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_BODY_ALTERATIONS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CHARITABLE_CAUSES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_CRYPTOCURRENCIES_AND_NFTS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FINANCIAL_SERVICES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FUNERAL_SERVICES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_INVESTIGATIVE_AND_LEGAL_SERVICES,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MALICIOUS_SOFTWARE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MARTIAL_ARTS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MATURE_MEDIA,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MULTILEVEL_MARKETING,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_PARANORMAL_ASTROLOGICAL_AND_OCCULT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_RELIGION,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ILLEGAL_AND_REGULATED_GOODS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNREQUESTED_AD,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_NO_REWARD,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_MISLEADING_REWARD,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ILLEGAL_AND_REGULATED,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_DIRECTING_USERS_OFF_PLATFORM_GENERAL,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_AGE_INAPPROPRIATE_CONTENT,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_AD_TRANSPARENCY_GENERAL,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_AD_TRANSPARENCY_ADS_DISCLOSURE,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_AD_FRAUD,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_POLITICS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FOOD_AND_BEVERAGE_INFANT_FOODS,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_TOYS_HOBBY_AND_LEARNING_OTHER,
  AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_UNAUTHORIZED_ADVERTISING,
]);

const ENUM_PREFIX = 'AD_POLICY_REVIEW_LABEL_';

const labelNameToEnum = new Map<string, AdPolicyReviewLabelType>(
  Object.entries(AdPolicyReviewLabelType)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => [key, value as AdPolicyReviewLabelType]),
);

const parseLabelToEnum = (label: string): AdPolicyReviewLabelType | undefined => {
  const asNumber = Number(label);
  if (!Number.isNaN(asNumber) && asNumber in AdPolicyReviewLabelType) {
    return asNumber as AdPolicyReviewLabelType;
  }
  return labelNameToEnum.get(label) ?? labelNameToEnum.get(`${ENUM_PREFIX}${label}`);
};

export const getPlacementStatusTranslationKey = (status: AdIntegrationPlacementStatus): string => {
  switch (status) {
    case AdIntegrationPlacementStatus.Approved:
      return 'Label.ModerationStatusApproved';
    case AdIntegrationPlacementStatus.Archived:
      return 'Label.Archived';
    case AdIntegrationPlacementStatus.Limited:
      return 'Label.ModerationStatusLimited';
    case AdIntegrationPlacementStatus.Rejected:
      return 'Label.Rejected';
    case AdIntegrationPlacementStatus.InReview:
    default:
      return 'Label.InReview';
  }
};

export const getPlacementStatus = (
  labels?: string[],
  archived?: boolean,
): AdIntegrationPlacementStatus => {
  if (archived) {
    return AdIntegrationPlacementStatus.Archived;
  }

  if (!labels || labels.length === 0) {
    return AdIntegrationPlacementStatus.InReview;
  }

  const resolvedLabels = labels
    .map(parseLabelToEnum)
    .filter((v): v is AdPolicyReviewLabelType => v !== undefined);

  if (resolvedLabels.length === 0) {
    return AdIntegrationPlacementStatus.InReview;
  }

  if (resolvedLabels.some((label) => REJECTED_LABELS.has(label))) {
    return AdIntegrationPlacementStatus.Rejected;
  }

  if (resolvedLabels.length === 1 && APPROVED_LABELS.has(resolvedLabels[0])) {
    return AdIntegrationPlacementStatus.Approved;
  }

  return AdIntegrationPlacementStatus.Limited;
};

export const getNonApprovedLabels = (labels?: string[]): AdPolicyReviewLabelType[] => {
  if (!labels || labels.length === 0) {
    return [];
  }

  return labels
    .map(parseLabelToEnum)
    .filter((v): v is AdPolicyReviewLabelType => v !== undefined)
    .filter((label) => !APPROVED_LABELS.has(label));
};

export const getFirstNonApprovedLabel = (labels?: string[]): AdPolicyReviewLabelType | undefined =>
  getNonApprovedLabels(labels)[0];
