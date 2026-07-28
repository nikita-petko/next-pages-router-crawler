import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query';
import developerProductsClient, {
  type DeveloperProductConfigV2,
} from '@modules/clients/developerProducts';
import {
  DEFAULT_RETRIES,
  DEFAULT_PAGE_SIZE,
  developerProductKeys,
  DEFAULT_STALE_TIME,
} from './constants';

type UseListDeveloperProductsParams = {
  universeId: number;
  pageSize?: number;
  isArchived?: boolean;
};

export type ListDeveloperProductsConfigsResponse = {
  developerProducts: Readonly<DeveloperProductConfigV2>[];
  nextPageToken?: string;
};

export type InfiniteListDeveloperProductsData = InfiniteData<
  ListDeveloperProductsConfigsResponse,
  string
>;

export type UseInfiniteListDeveloperProductsOptions<TData = InfiniteListDeveloperProductsData> =
  Omit<
    UseInfiniteQueryOptions<ListDeveloperProductsConfigsResponse, Error, TData, QueryKey, string>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
  >;

export type UseInfiniteListDeveloperProductsQueryOptions<
  TData = InfiniteListDeveloperProductsData,
> = Omit<UseInfiniteListDeveloperProductsOptions<TData>, 'select'>;

export type UseInfiniteListDeveloperProductsResult<TData = InfiniteListDeveloperProductsData> =
  UseInfiniteQueryResult<TData>;

export function useInfiniteListDeveloperProducts<TData = InfiniteListDeveloperProductsData>(
  { universeId, pageSize = DEFAULT_PAGE_SIZE, isArchived }: UseListDeveloperProductsParams,
  options: UseInfiniteListDeveloperProductsOptions<TData> = {},
): UseInfiniteListDeveloperProductsResult<TData> {
  return useInfiniteQuery({
    queryKey: developerProductKeys.list(universeId, { pageSize, isArchived }),
    queryFn: async ({ pageParam: pageToken, signal }) => {
      const response = await developerProductsClient.listDeveloperProductConfigsByUniverse(
        { universeId, pageSize, pageToken, isArchived },
        { signal },
      );

      return {
        developerProducts: response.developerProducts,
        nextPageToken: response.nextPageToken ?? undefined, // correctly handle mismatched nulls
      } satisfies ListDeveloperProductsConfigsResponse;
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextPageToken,
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}
