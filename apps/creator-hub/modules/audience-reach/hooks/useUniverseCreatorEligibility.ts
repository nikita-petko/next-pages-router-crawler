import { useQuery } from '@tanstack/react-query';
import type { GetUniverseCreatorEligibilityResponse } from '@rbx/client-core-content-api/v1';
import coreContentClient from '@modules/clients/coreContent';
import { TransientQueryRetry, transientQueryRetryDelay } from '../constants/audienceReachConstants';

export const universeCreatorEligibilityQueryKey = (universeId: number) =>
  ['coreContent', 'universeCreatorEligibility', universeId] as const;

export const useUniverseCreatorEligibility = (universeId: number) => {
  return useQuery({
    queryKey: universeCreatorEligibilityQueryKey(universeId),
    queryFn: (): Promise<GetUniverseCreatorEligibilityResponse> =>
      coreContentClient.coreContentGetUniverseCreatorEligibility({ universeId }),
    enabled: !!universeId,
    retry: TransientQueryRetry,
    retryDelay: transientQueryRetryDelay,
  });
};
