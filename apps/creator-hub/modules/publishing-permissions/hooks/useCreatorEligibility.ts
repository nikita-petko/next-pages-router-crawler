import { useQuery } from '@tanstack/react-query';
import type { GetCreatorEligibilityResponse } from '@rbx/client-core-content-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import coreContentClient from '@modules/clients/coreContent';

export const creatorEligibilityQueryKey = (userId?: number) =>
  ['creatorEligibility', userId ?? null] as const;

interface UseCreatorEligibilityOptions {
  overrideUserId?: number;
  isReady?: boolean;
}

export const useCreatorEligibility = ({
  overrideUserId,
  isReady = true,
}: UseCreatorEligibilityOptions = {}) => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const effectiveUserId = overrideUserId ?? userId;

  return useQuery({
    queryKey: creatorEligibilityQueryKey(effectiveUserId),
    queryFn: async (): Promise<GetCreatorEligibilityResponse> => {
      if (effectiveUserId == null) {
        throw new Error('Creator eligibility userId is required');
      }
      const response = await coreContentClient.coreContentGetCreatorEligibility({
        userId: effectiveUserId,
      });
      return response;
    },
    enabled: isReady && !!effectiveUserId,
  });
};
