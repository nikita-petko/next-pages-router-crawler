import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';

export const listIPLicensesKey = 'contentLicensingApiClient/listPublicIpLicensesPaginated';

export interface ListIPLicensesParams {
  listingId: string;
  limit: number;
  pageToken?: string;
}

export type ListIPLicensesData = Awaited<
  ReturnType<typeof contentLicensingClient.listPublicLicensesByListing>
>;

export type UseListIPLicensesResult = Omit<
  UseQueryResult<ListIPLicensesData, Error>,
  'isPending'
> & {
  isPending: boolean;
};

export const useListIPLicenses = ({
  listingId,
  limit,
  pageToken,
}: ListIPLicensesParams): UseListIPLicensesResult => {
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const isLoggedIn = user != null;

  const query = useQuery({
    queryKey: [
      listIPLicensesKey,
      isLoggedIn ? 'authenticated' : 'guest',
      listingId,
      limit,
      pageToken,
    ],
    enabled: isAuthenticationFetched,
    queryFn: (): Promise<ListIPLicensesData> =>
      isLoggedIn
        ? contentLicensingClient.listPublicLicensesByListing(listingId, limit, pageToken)
        : contentLicensingClient.listPublicLicensesByListingUnauthenticated(
            listingId,
            limit,
            pageToken,
          ),
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    isPending: !isAuthenticationFetched || query.isPending,
  };
};

export default useListIPLicenses;
