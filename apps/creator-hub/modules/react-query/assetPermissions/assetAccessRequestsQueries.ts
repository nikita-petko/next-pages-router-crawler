import { useCallback, useMemo } from 'react';
import {
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import assetPermissionsApiClient, {
  type AssetPermissionRequest,
  type ListAssetPermissionRequestsResponse,
} from '@modules/clients/assetPermissions';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';

// Page size requested per network round-trip while the background loader walks
// the full cursor chain. Matches the largest option the owner tables offer.
const REQUESTS_PAGE_SIZE = 50;

export function getListAssetPermissionRequestsKey(assetId: number) {
  return ['assetAccessRequestsApi_listAssetPermissionRequests', assetId] as const;
}

export function listReceivedRequestsQueryKey() {
  return ['assetAccessRequests_listReceived'] as const;
}

type AggregatedRequestsResult = {
  data: { requests: AssetPermissionRequest[] } | undefined;
  isPending: boolean;
  isError: boolean;
};

// Walks the entire cursor chain (not just the first page) and returns every
// request flattened into a single array. The owner tables paginate client-side
// over this array and use its length as the total, so all pages must be loaded
// for the count and the later pages to be correct.
function useAllOwnerRequests(
  queryKey: QueryKey,
  params: { assetId?: number },
  enabled: boolean,
): AggregatedRequestsResult {
  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchNextPageError } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }): Promise<ListAssetPermissionRequestsResponse> =>
        assetPermissionsApiClient.listOwnerAssetPermissionRequests({
          ...params,
          limit: REQUESTS_PAGE_SIZE,
          cursor: pageParam || undefined,
        }),
      enabled,
      initialPageParam: '',
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  // cancelRefetch: false so a slow in-flight page isn't aborted and restarted on
  // every loader tick (which would stall pagination on connections where a page
  // takes longer than the tick interval).
  const fetchNextPageInBackground = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  // Auto-advance through every remaining page in the background until the cursor
  // chain is exhausted. Gate on !isFetchNextPageError so a persistently failing
  // page isn't retried every tick (hasNextPage stays true after a failed fetch).
  useBackgroundPageLoader({
    hasNextPage: hasNextPage && !isFetchNextPageError,
    fetchNextPage: fetchNextPageInBackground,
    disabled: !enabled,
  });

  const requests = useMemo<AssetPermissionRequest[]>(
    () => data?.pages.flatMap((page) => page.requests ?? []) ?? [],
    [data],
  );

  return useMemo(
    () => ({ data: data ? { requests } : undefined, isPending, isError }),
    [data, requests, isPending, isError],
  );
}

// Per-asset owner view: requests received for a single asset.
export function useListAssetPermissionRequests(
  assetId: number,
  enabled = true,
): AggregatedRequestsResult {
  return useAllOwnerRequests(getListAssetPermissionRequestsKey(assetId), { assetId }, enabled);
}

// Universal owner view: all requests received across every asset the caller owns.
export function useListAllAssetPermissionRequests(enabled: boolean): AggregatedRequestsResult {
  return useAllOwnerRequests(listReceivedRequestsQueryKey(), {}, enabled);
}

export function useApproveAssetPermissionRequest(assetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      assetPermissionsApiClient.approveAssetPermissionRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getListAssetPermissionRequestsKey(assetId) });
      void queryClient.invalidateQueries({ queryKey: listReceivedRequestsQueryKey() });
    },
  });
}

export function useRejectAssetPermissionRequest(assetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      assetPermissionsApiClient.rejectAssetPermissionRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getListAssetPermissionRequestsKey(assetId) });
      void queryClient.invalidateQueries({ queryKey: listReceivedRequestsQueryKey() });
    },
  });
}
