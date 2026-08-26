import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { Showcase } from '../types';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, showcaseKeys } from './constants';

type Options = Omit<
  UseQueryOptions<Showcase | undefined, Error, Showcase | undefined>,
  'queryKey' | 'queryFn'
>;

export function useShowcase(showcaseId: string | undefined, options: Options = {}) {
  return useQuery({
    queryKey: showcaseKeys.detail(showcaseId ?? ''),
    queryFn: ({ signal }) => showcaseDataSource.getShowcase(showcaseId ?? '', signal),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!showcaseId && (options.enabled ?? true),
  });
}

export default useShowcase;
