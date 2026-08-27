import {
  CreatorNoticeKeyEnum,
  CreatorTierEnum,
  type CreatorPublishPermissionRequirement,
  type CreatorPublishPermissionsResponse,
} from '@rbx/client-core-content-api/v1';
import {
  approvalBannerKeys,
  defaultTierDescriptionKeys,
  defaultTierLabelKeys,
  getRequirementDisplayCopy,
  type PublishPermissionRequirement,
  type PublishingTier,
  VIETNAM_COUNTRY_CODE,
  vietnamTierDescriptionKeys,
  vietnamTierLabelKeys,
} from '../constants/displayCopy';

const isPublishingTier = (tier: CreatorTierEnum): tier is PublishingTier =>
  tier === CreatorTierEnum.Private ||
  tier === CreatorTierEnum.Trusted ||
  tier === CreatorTierEnum.Everyone;

export const isRequiredForTier = (
  requirement: CreatorPublishPermissionRequirement,
  tier: CreatorTierEnum,
): boolean =>
  requirement.tierRequirements.some(
    (tierRequirement) => tierRequirement.tier === tier && tierRequirement.isRequired,
  );

export const mapPublishPermissionsToView = (response: CreatorPublishPermissionsResponse) => {
  const isVietnam = response.countryCode === VIETNAM_COUNTRY_CODE;
  const noticeKeys = new Set(response.notices.map((notice) => notice.key));
  const hasCurrentTierAllowlisted = noticeKeys.has(CreatorNoticeKeyEnum.CurrentTierAllowlisted);

  const requirements: PublishPermissionRequirement[] = response.requirements.flatMap(
    (requirement) => {
      const displayCopy = getRequirementDisplayCopy(
        requirement.id,
        response.ageBracket,
        response.countryCode,
      );
      if (!displayCopy) {
        return [];
      }

      return [
        {
          ...requirement,
          labelKey: displayCopy.labelKey,
          descriptionKey: displayCopy.descriptionKey,
          actionUrl: displayCopy.actionUrl,
        },
      ];
    },
  );

  return {
    currentTier: response.currentTier,
    ageBracket: response.ageBracket,
    tierOrder: response.tierOrder.filter(isPublishingTier),
    tierLabelKeys: isVietnam ? vietnamTierLabelKeys : defaultTierLabelKeys,
    tierDescriptionKeys: isVietnam ? vietnamTierDescriptionKeys : defaultTierDescriptionKeys,
    requirements,
    approvalBannerKey: hasCurrentTierAllowlisted
      ? approvalBannerKeys[response.currentTier]
      : undefined,
    showPlusEligibilityBanner: noticeKeys.has(CreatorNoticeKeyEnum.PlusEligibility),
    showParentLinkExpirationBanner: noticeKeys.has(CreatorNoticeKeyEnum.ParentLinkExpiration),
  };
};
