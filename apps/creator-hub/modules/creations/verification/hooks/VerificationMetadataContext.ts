import { createContext } from 'react';
import type { AgeBracketResponse } from '@modules/clients/users';
import type { VerifiedAgeResponse } from '@modules/clients/ageVerification';
import type { UserSubscriptionResponse } from '@modules/clients/premiumfeatures';
import type { CheckCreationAccessResponse } from '@modules/clients/marketplacesales';
import type { Subscription } from '@modules/clients/subscriptions';
import { RobloxWebWebAPIModelsApiArrayResponseRobloxApiDevelopAssetModel } from '@rbx/clients/develop/v1';

export interface VerificationMetadataContextValue {
  ageBracket: AgeBracketResponse | undefined;
  verifiedAgeData: VerifiedAgeResponse | undefined;
  creationAccessMetadata: CheckCreationAccessResponse | undefined;
  userSubscription: UserSubscriptionResponse | undefined;
  blackbirdSubscription: Subscription | undefined;
  assetDetailsMetadata: RobloxWebWebAPIModelsApiArrayResponseRobloxApiDevelopAssetModel | undefined;
}

export function hasLowestPremiumTier(
  metadata: VerificationMetadataContextValue | undefined,
): boolean {
  try {
    if (!metadata) {
      return false;
    }
    const stipendAmount = metadata.userSubscription?.subscriptionProductModel?.robuxStipendAmount;
    if (!stipendAmount) {
      return false;
    }
    return stipendAmount >= 450;
  } catch {
    return false;
  }
}

export function isUserAgeVerified(metadata: VerificationMetadataContextValue | undefined): boolean {
  if (!metadata) {
    return false;
  }
  return metadata.ageBracket?.ageBracket !== 1 && metadata.verifiedAgeData?.isVerified === true;
}

export function hasPremiumSubscription(
  metadata: VerificationMetadataContextValue | undefined,
): boolean {
  try {
    if (!metadata) {
      return false;
    }
    const stipendAmount = metadata.userSubscription?.subscriptionProductModel?.robuxStipendAmount;
    return (
      metadata.blackbirdSubscription != null || (stipendAmount != null && stipendAmount >= 1000)
    );
  } catch {
    return false;
  }
}

const defaultDetails: VerificationMetadataContextValue = {
  ageBracket: undefined,
  verifiedAgeData: undefined,
  creationAccessMetadata: undefined,
  userSubscription: undefined,
  blackbirdSubscription: undefined,
  assetDetailsMetadata: undefined,
};

const verificationMetadataContext = createContext<VerificationMetadataContextValue>(defaultDetails);
verificationMetadataContext.displayName = 'VerificationMetadata';

export default verificationMetadataContext;
