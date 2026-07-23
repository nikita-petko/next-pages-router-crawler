import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';

export const getIPListingKey = 'contentLicensingApiClient/getIPListing';

export interface GetIPListingParams {
  listingId: string;
}

export type GetIPListingData =
  | Awaited<ReturnType<typeof contentLicensingClient.getPublicListing>>
  | Awaited<ReturnType<typeof contentLicensingClient.getPublicListingUnauthenticated>>;

export type UseGetIPListingResult = Omit<UseQueryResult<GetIPListingData, Error>, 'isPending'> & {
  isPending: boolean;
};

export const useGetIPListing = ({ listingId }: GetIPListingParams): UseGetIPListingResult => {
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const isLoggedIn = user != null;

  const query = useQuery({
    queryKey: [getIPListingKey, isLoggedIn ? 'authenticated' : 'guest', listingId],
    enabled: isAuthenticationFetched,
    queryFn: (): Promise<GetIPListingData> =>
      isLoggedIn
        ? contentLicensingClient.getPublicListing(listingId)
        : contentLicensingClient.getPublicListingUnauthenticated(listingId),
  });

  return {
    ...query,
    isPending: !isAuthenticationFetched || query.isPending,
  };
};

export default useGetIPListing;
