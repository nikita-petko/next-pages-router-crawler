import { useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export const getRightsFeatureTimeoutInterventionKey =
  'rightsClient/getRightsFeatureTimeoutIntervention';

export const useGetRightsFeatureTimeoutIntervention = (feature: string, accountId?: string) => {
  const response = useQuery({
    queryKey: [getRightsFeatureTimeoutInterventionKey, accountId],
    queryFn: async () => {
      if (!accountId || !feature) {
        return;
      }
      return rightsClient.getFeatureTimeoutIntervention({
        accountId,
        feature,
      });
    },
    // we treat the data as valid for 5 seconds, during which we don't need to refetch
    staleTime: 5 * 1000,
  });

  return {
    intervention: response.data,
    ...response,
  };
};

export const RMCreateClaimFeatureName = 'rights_management_create_claim';
