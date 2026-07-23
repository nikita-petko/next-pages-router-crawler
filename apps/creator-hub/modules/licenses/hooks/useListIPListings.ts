import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { useAuthentication } from '@modules/authentication/providers';

export enum Sorts {
  MostRecentlyCreated = 'most-recently-created',
  AlphabeticalLowToHigh = 'alphabetical-low-to-high',
  AlphabeticalHighToLow = 'alphabetical-high-to-low',
  IphResponseTimeLowToHigh = 'iph-response-time-low-to-high',
}

export const listIPListingsKey = 'contentLicensingApiClient/listPublicIpListingsPaginated';

export interface ListIPListingsParams {
  limit: number;
  pageToken: string;
  filter: string;
  selectedSort: Sorts | undefined;
}

type PublicIpListing = NonNullable<
  Awaited<ReturnType<typeof contentLicensingClient.listPublicIpListings>>['listings']
>[number];

// TODO - aquach - Implement sorts in the API instead, esp as we scale up
function sortPublicIpListings(
  listings: PublicIpListing[],
  selectedSort: Sorts | undefined,
  allowResponseTimeSort: boolean,
): PublicIpListing[] {
  let publicIpListings = [...listings];
  if (selectedSort === Sorts.AlphabeticalLowToHigh) {
    publicIpListings = publicIpListings.sort((a, b) => a.name!.localeCompare(b.name!));
  } else if (selectedSort === Sorts.AlphabeticalHighToLow) {
    publicIpListings = publicIpListings.sort((a, b) => b.name!.localeCompare(a.name!));
  } else if (selectedSort === Sorts.MostRecentlyCreated) {
    publicIpListings = publicIpListings.sort((a, b) => (b.createdAt! < a.createdAt! ? -1 : 1));
  } else if (allowResponseTimeSort && selectedSort === Sorts.IphResponseTimeLowToHigh) {
    publicIpListings = publicIpListings.sort((a, b) =>
      (a.responseTimeMetrics!.avgResponseTimeSeconds90D ?? Infinity) <=
      (b.responseTimeMetrics!.avgResponseTimeSeconds90D ?? Infinity)
        ? -1
        : 1,
    );
  }
  return publicIpListings;
}

export type UseListIPListingsResult = Omit<
  UseQueryResult<ListIPListingsData, Error>,
  'isPending'
> & {
  isPending: boolean;
};

export interface ListIPListingsData {
  listings: PublicIpListing[];
  nextPageToken: string | undefined;
}

export const useListIPListings = ({
  limit,
  pageToken,
  filter,
  selectedSort,
}: ListIPListingsParams): UseListIPListingsResult => {
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const isLoggedIn = user != null;

  const query = useQuery({
    queryKey: [
      listIPListingsKey,
      isLoggedIn ? 'authenticated' : 'guest',
      limit,
      pageToken,
      filter,
      selectedSort,
    ],
    enabled: isAuthenticationFetched,
    staleTime: 60_000,
    queryFn: async (): Promise<ListIPListingsData> => {
      const listingsResponse = isLoggedIn
        ? await contentLicensingClient.listPublicIpListings(limit, pageToken)
        : await contentLicensingClient.listPublicIpListingsUnauthenticated(limit, pageToken);

      const rawListings = listingsResponse.listings ?? [];
      const listings = sortPublicIpListings(rawListings, selectedSort, isLoggedIn);

      return {
        listings,
        nextPageToken: listingsResponse.nextPageToken ?? undefined,
      };
    },
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    isPending: !isAuthenticationFetched || query.isPending,
  };
};

export default useListIPListings;
