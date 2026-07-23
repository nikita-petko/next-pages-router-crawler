import { createContext } from 'react';
import type { VerifiedAgeResponse } from '@modules/clients/ageVerification';
import type { CheckCreationAccessResponse } from '@modules/clients/marketplacesales';
import type { UserSubscriptionResponse } from '@modules/clients/premiumfeatures';
import type { Subscription } from '@modules/clients/subscriptions';
import type { AgeBracketResponse } from '@modules/clients/users';

export interface VerificationMetadataContextValue {
  ageBracket: AgeBracketResponse | undefined;
  verifiedAgeData: VerifiedAgeResponse | undefined;
  creationAccessMetadata: CheckCreationAccessResponse | undefined;
  userSubscription: UserSubscriptionResponse | undefined;
  blackbirdSubscription: Subscription | undefined;
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
};

const verificationMetadataContext = createContext<VerificationMetadataContextValue>(defaultDetails);
verificationMetadataContext.displayName = 'VerificationMetadata';

export default verificationMetadataContext;
