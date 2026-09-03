import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { CreatorType } from '@rbx/client-content-licensing-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import contentLicensingClient, {
  type GetLicenseRecommendationsResponse,
} from '@modules/clients/contentLicensing';

export const getLicenseRecommendationsKey = 'contentLicensingApiClient/getLicenseRecommendations';

const STALE_TIME_MS = 5 * 60_000; // Recommendations change infrequently.

export type UseGetLicenseRecommendationsResult = Omit<
  UseQueryResult<GetLicenseRecommendationsResponse>,
  'isPending'
> & {
  isPending: boolean;
};

export const useGetLicenseRecommendations = (
  enabled = true,
): UseGetLicenseRecommendationsResult => {
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [getLicenseRecommendationsKey, userId],
    enabled: enabled && isAuthenticationFetched && userId != null,
    staleTime: STALE_TIME_MS,
    queryFn: () =>
      contentLicensingClient.getLicenseRecommendations({
        creatorId: String(userId),
        creatorType: CreatorType.User,
      }),
  });

  return Object.assign(query, {
    isPending: enabled && (!isAuthenticationFetched || (userId != null && query.isPending)),
  });
};

export default useGetLicenseRecommendations;
