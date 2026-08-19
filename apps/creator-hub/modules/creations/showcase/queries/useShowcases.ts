import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { Showcase } from '../types';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, showcaseKeys } from './constants';

type Options<TData = Showcase[]> = Omit<
  UseQueryOptions<Showcase[], Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useShowcases<TData = Showcase[]>(
  communityId: number | undefined,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: showcaseKeys.byCommunity(communityId ?? 0),
    queryFn: ({ signal }) => showcaseDataSource.listShowcases(communityId ?? 0, signal),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!communityId && communityId > 0 && (options.enabled ?? true),
  });
}

export default useShowcases;
