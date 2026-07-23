import { useQuery } from '@tanstack/react-query';
import { CreatorHomeClient } from '@modules/clients/creatorHome';

const landingEligibilityQueryKey = ['creatorHome', 'landingEligibility'] as const;

function useGetLandingEligibility(enabled = false) {
  return useQuery({
    queryKey: landingEligibilityQueryKey,
    enabled,
    queryFn: () =>
      CreatorHomeClient.landingEligibilityApi.landingEligibilityGetLandingEligibility(),
  });
}

export default useGetLandingEligibility;
