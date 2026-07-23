import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetShopConfigResponse } from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, shopsKeys } from './constants';

type Options<TData = GetShopConfigResponse> = Omit<
  UseQueryOptions<GetShopConfigResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// Raw cache wrapper for the full creator shop config; sub-features narrow
// the response via `select`.
export function useGetCreatorShopConfig<TData = GetShopConfigResponse>(
  shopId: number | undefined,
  options: Options<TData> = {},
) {
  // oxlint-disable typescript/no-non-null-assertion -- guaranteed by enabled
  return useQuery({
    queryKey: shopsKeys.configByShop(shopId!),
    queryFn: ({ signal }) => shopsApiClient.getCreatorShopConfig(shopId!, 'Full', { signal }),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!shopId && (options.enabled ?? true),
  });
}
