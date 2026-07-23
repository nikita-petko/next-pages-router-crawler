import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import type { ListExperimentProductDetailsResponse } from '@rbx/client-price-experimentation-api/v1';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, managedPricingExperimentKeys } from './constants';

type UseInfiniteListExperimentProductDetailsParams = {
  universeId: number;
  experimentId: string;
  pageSize?: number;
};

export type InfiniteExperimentProductDetailsData = InfiniteData<
  ListExperimentProductDetailsResponse,
  string
>;

export type UseInfiniteListExperimentProductDetailsOptions<
  TData = InfiniteExperimentProductDetailsData,
> = Omit<
  UseInfiniteQueryOptions<ListExperimentProductDetailsResponse, Error, TData, QueryKey, string>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
>;

export type UseInfiniteListExperimentProductDetailsQueryOptions<
  TData = InfiniteExperimentProductDetailsData,
> = Omit<UseInfiniteListExperimentProductDetailsOptions<TData>, 'select'>;

export type UseInfiniteListExperimentProductDetailsResult<
  TData = InfiniteExperimentProductDetailsData,
> = UseInfiniteQueryResult<TData>;

const DEFAULT_PAGE_SIZE = 400;

export function useInfiniteListExperimentProductDetails<
  TData = InfiniteExperimentProductDetailsData,
>(
  {
    universeId,
    experimentId,
    pageSize = DEFAULT_PAGE_SIZE,
  }: UseInfiniteListExperimentProductDetailsParams,
  options: UseInfiniteListExperimentProductDetailsOptions<TData> = {},
): UseInfiniteListExperimentProductDetailsResult<TData> {
  return useInfiniteQuery({
    queryKey: managedPricingExperimentKeys.productDetails(universeId, experimentId, {
      pageSize,
    }),
    queryFn: async ({ pageParam: pageToken, signal }) =>
      priceExperimentationApi.listExperimentProductDetails(
        { universeId, experimentId, pageSize, pageToken: pageToken || undefined },
        { signal },
      ),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextPageToken ?? undefined,
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}
