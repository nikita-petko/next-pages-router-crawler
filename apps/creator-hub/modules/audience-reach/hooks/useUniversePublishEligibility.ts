import { useQuery } from '@tanstack/react-query';
import coreContentClient from '@modules/clients/coreContent';
import { TransientQueryRetry, transientQueryRetryDelay } from '../constants/audienceReachConstants';

export const universePublishEligibilityQueryKey = (universeId: number) =>
  ['coreContentBatchGetUniversePublishEligibility', String(universeId)] as const;

export const useUniversePublishEligibility = (universeId: number) => {
  return useQuery({
    queryKey: universePublishEligibilityQueryKey(universeId),
    queryFn: () =>
      coreContentClient.coreContentBatchGetUniversePublishEligibility({
        coreContentBatchGetUniversePublishEligibilityRequest: {
          universeIds: [universeId],
        },
      }),
    enabled: !!universeId,
    select: (data) => data.universeEligibilities[String(universeId)],
    retry: TransientQueryRetry,
    retryDelay: transientQueryRetryDelay,
  });
};
