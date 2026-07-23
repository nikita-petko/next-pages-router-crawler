import { SocialLinksVerificationStatus, socialLinksUpsellCopy } from '../constants';

export const SOCIAL_VERIFICATION_CONTEXTS = ['experiences', 'community'] as const;
export type SocialLinksVerificationContext = (typeof SOCIAL_VERIFICATION_CONTEXTS)[number];

export function isSocialLinksEnabledForContext(
  status: number | undefined,
  context: SocialLinksVerificationContext,
): boolean {
  if (status === undefined || status === SocialLinksVerificationStatus.None) {
    return false;
  }
  if (status === SocialLinksVerificationStatus.VerifiedForAll) {
    return true;
  }
  switch (context) {
    case 'experiences':
      return status === SocialLinksVerificationStatus.VerifiedForExperiences;
    case 'community':
      return status === SocialLinksVerificationStatus.VerifiedForCommunity;
    default:
      return false;
  }
}

export type SocialLinksUpsellCopy = {
  title: string;
  description: string;
};

export function getSocialLinksUpsellCopy(
  status: number | undefined,
  context: SocialLinksVerificationContext,
  isOwner: boolean,
): SocialLinksUpsellCopy {
  const keys = socialLinksUpsellCopy[context];
  const isOwnerAndSocialLinksLocked = isOwner && !isSocialLinksEnabledForContext(status, context);
  return isOwnerAndSocialLinksLocked ? keys.ownerAndLocked : keys.managerOrUnlocked;
}
