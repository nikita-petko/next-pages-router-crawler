import { useEffect, useMemo } from 'react';
import type { QueryKey, UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

// Typing of this function is copied from the typing of useInfiniteQuery
// Sadly can't use Parameters<> since useInfiniteQuery is an overloaded function
// mapPage converts a single page of data to an array of results
export function usePagedQueryAll<
  TQueryFnData = unknown,
  TError = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TResult = unknown,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    InfiniteData<TQueryFnData>,
    TQueryKey,
    TPageParam
  >,
  mapPage: (data: TQueryFnData) => TResult[],
) {
  const { data, fetchNextPage, hasNextPage, isFetching, isPending, isError } =
    useInfiniteQuery(options);

  // Fetch all pages
  // We include data in the dependencies list so we retrigger the fetch check after the previous data was fetched
  useEffect(() => {
    if (hasNextPage && !isFetching && !isError) {
      // See https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery
      // We set cancelRefetch false to ensure we don't have duplicate network requests
      // Duplicate network requests can occur if multiple places use this hook at the same time
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  // Data is returned as [page1, page2, ...]
  // We want to flatten it and do any transformations on the raw responses we need
  // Note react-query has a select option to do this for us
  // But it doesn't work well in v4; it forces us to return type InfiniteQuery<>
  // This is fixed in v5 so if we ever update to v5, this should be updated here
  // https://github.com/TanStack/query/issues/3065
  const convertedData = useMemo(() => {
    if (!data || isPending || isError) {
      return [];
    }
    return data.pages.flatMap(mapPage);
  }, [data, isPending, isError, mapPage]);

  return {
    data: convertedData,
    isLoading: (isPending || hasNextPage) && !isError,
    isError,
  };
}
