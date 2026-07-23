import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ListShopsByScopeResponse } from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, shopsKeys } from './constants';

type Options<TData = ListShopsByScopeResponse> = Omit<
  UseQueryOptions<ListShopsByScopeResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// Raw cache wrapper; sub-features narrow the response via `select`.
export function useListShopsByScope<TData = ListShopsByScopeResponse>(
  universeId: number | undefined,
  options: Options<TData> = {},
) {
  // oxlint-disable typescript/no-non-null-assertion -- guaranteed by enabled
  return useQuery({
    queryKey: shopsKeys.byUniverse(universeId!),
    queryFn: ({ signal }) => shopsApiClient.listShopsByScope('Universe', universeId!, { signal }),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!universeId && universeId > 0 && (options.enabled ?? true),
  });
}
