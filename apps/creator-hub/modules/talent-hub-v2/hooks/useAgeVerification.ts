import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import coreContentClient, { CreatorEligibilityEnum } from '@modules/clients/coreContent';
import { th2QueryKeys } from '../queryKeys';
import { isMocksEnabled } from '../utils';

type AgeVerificationState = {
  isVerified: boolean;
  isLoading: boolean;
};

const AGE_ELIGIBLE = new Set<string>([
  CreatorEligibilityEnum.AgeEstimationVerified,
  CreatorEligibilityEnum.IdVerified,
]);

function getQaAgeVerificationOverride(): boolean | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const targetEnvironment = (process.env.targetEnvironment ?? '').toLowerCase();
  const isProductionTarget = targetEnvironment === 'production';
  const isSitetestHost = window.location.hostname.toLowerCase().includes('sitetest');

  if (isProductionTarget && !isSitetestHost) {
    return null;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('th2Age')?.trim().toLowerCase();

    if (!value) {
      return null;
    }
    if (['verified', '1', 'true'].includes(value)) {
      return true;
    }
    if (['unverified', '0', 'false'].includes(value)) {
      return false;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Checks whether the current user satisfies TH2's age-verification
 * requirement. Accepts either facial age estimation (FAE) or full ID
 * verification via the creator-eligibility API.
 */
export default function useAgeVerification(enabled = true): AgeVerificationState {
  const { user } = useAuthentication();
  const userId = user?.id;

  const qaOverride = getQaAgeVerificationOverride();
  const mocks = isMocksEnabled();
  const shouldQuery = enabled && qaOverride == null && !mocks && userId != null;
  const queryKey =
    userId != null
      ? th2QueryKeys.ageVerification.user(userId)
      : th2QueryKeys.ageVerification.placeholder;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (userId == null) {
        return false;
      }
      const response = await coreContentClient.coreContentGetCreatorEligibility({
        userId,
      });
      return response.creatorEligibility.some((e) => AGE_ELIGIBLE.has(e));
    },
    enabled: shouldQuery,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled) {
    return { isVerified: false, isLoading: false };
  }
  if (qaOverride != null) {
    return { isVerified: qaOverride, isLoading: false };
  }
  if (mocks) {
    return { isVerified: true, isLoading: false };
  }

  return { isVerified: data === true, isLoading };
}
