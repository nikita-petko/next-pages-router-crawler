import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { ShowcasePublishQuota } from '../types';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, showcaseKeys } from './constants';

type Options = Omit<
  UseQueryOptions<ShowcasePublishQuota, Error, ShowcasePublishQuota>,
  'queryKey' | 'queryFn'
>;

export function useShowcasePublishQuota(communityId: number | undefined, options: Options = {}) {
  return useQuery({
    queryKey: showcaseKeys.quota(communityId ?? 0),
    queryFn: ({ signal }) => showcaseDataSource.getPublishQuota(communityId ?? 0, signal),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!communityId && communityId > 0 && (options.enabled ?? true),
  });
}

export default useShowcasePublishQuota;
