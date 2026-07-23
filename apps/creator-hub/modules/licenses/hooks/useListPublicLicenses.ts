import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { LicenseResponse, PublicLicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import contentLicensingClient from '@modules/clients/contentLicensing';

export const listPublicLicensesKey = 'contentLicensingApiClient/listPublicLicensesPaginated';

export interface ListPublicLicensesParams {
  limit: number;
  filter: string;
}

export type ListPublicLicensesData =
  | Awaited<ReturnType<typeof contentLicensingClient.listPublicLicenses>>
  | Awaited<ReturnType<typeof contentLicensingClient.listPublicLicensesUnauthenticated>>;

export type PublicCatalogLicense = LicenseResponse | PublicLicenseResponse;

export function useListPublicLicenses({ limit, filter }: ListPublicLicensesParams) {
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const isLoggedIn = user != null;

  const query = useInfiniteQuery({
    queryKey: [listPublicLicensesKey, isLoggedIn ? 'authenticated' : 'guest', limit, filter],
    enabled: isAuthenticationFetched,
    initialPageParam: '',
    queryFn: ({ pageParam }: { pageParam: string }): Promise<ListPublicLicensesData> =>
      isLoggedIn
        ? contentLicensingClient.listPublicLicenses(limit, pageParam, filter)
        : contentLicensingClient.listPublicLicensesUnauthenticated(limit, pageParam, filter),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const pageSize = lastPage.licenses?.length ?? 0;
      // Short page means we've reached the end of the catalog; ignore a trailing nextPageToken
      // (filtered lists sometimes still return a token when fewer than `limit` rows exist).
      if (pageSize === 0 || pageSize < limit) {
        return;
      }
      const token = lastPage.nextPageToken;
      if (token == null || typeof token !== 'string' || token.trim().length === 0) {
        return;
      }
      // If the server echoes the same cursor we already used, the next request would repeat
      // the same page (seen with some filtered catalog responses).
      if (token === lastPageParam) {
        return;
      }
      return token;
    },
  });

  const allLicenses: PublicCatalogLicense[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat = pages.flatMap((page) => page.licenses ?? []) as PublicCatalogLicense[];
    const byId = flat.reduce((acc, license) => {
      const { id } = license;
      if (id != null && id !== '' && !acc.has(id)) {
        acc.set(id, license);
      }
      return acc;
    }, new Map<string, PublicCatalogLicense>());
    return Array.from(byId.values());
  }, [query.data]);

  return {
    ...query,
    isPending: !isAuthenticationFetched || query.isPending,
    allLicenses,
  };
}

export type UseListPublicLicensesResult = ReturnType<typeof useListPublicLicenses>;

export default useListPublicLicenses;
