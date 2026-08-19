import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { ListShopItemsResponse } from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { API_DEFAULT_PAGE_SIZE, DEFAULT_RETRIES, DEFAULT_STALE_TIME, shopsKeys } from './constants';

type UseInfiniteListShopItemsParams = {
  shopId: number | undefined;
  pageSize?: number;
};

export type InfiniteShopItemsData = InfiniteData<ListShopItemsResponse, string>;

export type UseInfiniteListShopItemsOptions<TData = InfiniteShopItemsData> = Omit<
  UseInfiniteQueryOptions<ListShopItemsResponse, Error, TData, QueryKey, string>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
>;

export type UseInfiniteListShopItemsQueryOptions<TData = InfiniteShopItemsData> = Omit<
  UseInfiniteListShopItemsOptions<TData>,
  'select'
>;

export type UseInfiniteListShopItemsResult<TData = InfiniteShopItemsData> =
  UseInfiniteQueryResult<TData>;

export function useInfiniteListShopItems<TData = InfiniteShopItemsData>(
  { shopId, pageSize = API_DEFAULT_PAGE_SIZE }: UseInfiniteListShopItemsParams,
  options: UseInfiniteListShopItemsOptions<TData> = {},
): UseInfiniteListShopItemsResult<TData> {
  // oxlint-disable typescript/no-non-null-assertion -- guaranteed by enabled
  return useInfiniteQuery({
    queryKey: shopsKeys.itemsByShopList(shopId!, { pageSize }),
    queryFn: ({ pageParam: pageToken, signal }) =>
      shopsApiClient.listShopItems(shopId!, { pageToken, pageSize }, { signal }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextPageToken ?? undefined,
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!shopId && (options.enabled ?? true),
  });
}
