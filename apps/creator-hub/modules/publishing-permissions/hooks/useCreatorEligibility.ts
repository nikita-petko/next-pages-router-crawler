import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import coreContentClient from '@modules/clients/coreContent';
import type { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';

export const creatorEligibilityQueryKey = (userId: number) =>
  ['creatorEligibility', userId] as const;

export const useCreatorEligibility = () => {
  const { user } = useAuthentication();
  const userId = user?.id;

  return useQuery({
    queryKey: creatorEligibilityQueryKey(userId!),
    queryFn: async (): Promise<CreatorEligibilityEnum[]> => {
      const response = await coreContentClient.coreContentGetCreatorEligibility({
        userId: userId!,
      });
      return response.creatorEligibility;
    },
    enabled: !!userId,
  });
};
