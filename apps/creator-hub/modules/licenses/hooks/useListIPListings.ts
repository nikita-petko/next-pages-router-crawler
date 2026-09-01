import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import contentLicensingClient from '@modules/clients/contentLicensing';

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
  /**
   * When false (guest), response-time sort is skipped. When true, listings missing
   * `responseTimeMetrics` are ordered as slowest (Infinity).
   */
  isAuthenticatedUser: boolean,
): PublicIpListing[] {
  let publicIpListings = [...listings];
  if (selectedSort === Sorts.AlphabeticalLowToHigh) {
    publicIpListings = publicIpListings.sort((a, b) => a.name!.localeCompare(b.name!));
  } else if (selectedSort === Sorts.AlphabeticalHighToLow) {
    publicIpListings = publicIpListings.sort((a, b) => b.name!.localeCompare(a.name!));
  } else if (selectedSort === Sorts.MostRecentlyCreated) {
    publicIpListings = publicIpListings.sort((a, b) => (b.createdAt! < a.createdAt! ? -1 : 1));
  } else if (isAuthenticatedUser && selectedSort === Sorts.IphResponseTimeLowToHigh) {
    publicIpListings = publicIpListings.sort((a, b) => {
      const avgA = a.responseTimeMetrics?.avgResponseTimeSeconds90D ?? Infinity;
      const avgB = b.responseTimeMetrics?.avgResponseTimeSeconds90D ?? Infinity;
      if (avgA < avgB) {
        return -1;
      }
      if (avgA > avgB) {
        return 1;
      }
      return 0;
    });
  }
  return publicIpListings;
}

export type UseListIPListingsResult = Omit<UseQueryResult<ListIPListingsData>, 'isPending'> & {
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
