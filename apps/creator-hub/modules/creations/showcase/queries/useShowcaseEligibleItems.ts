import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import showcaseDataSource from '../data/showcaseDataSource';
import type { EligibleItemsPage } from '../types';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, showcaseKeys } from './constants';

type Options = Omit<
  UseQueryOptions<EligibleItemsPage, Error, EligibleItemsPage>,
  'queryKey' | 'queryFn'
>;

/**
 * One page of the community's items that may be added to a showcase (FR-C2.7 —
 * already published and approved). Page-based rather than infinite so the picker
 * can show a "1-10 of 50" readout.
 */
export function useShowcaseEligibleItems(
  communityId: number | undefined,
  page: number,
  pageSize: number,
  options: Options = {},
) {
  return useQuery({
    queryKey: showcaseKeys.eligibleItems(communityId ?? 0, page, pageSize),
    queryFn: ({ signal }) =>
      showcaseDataSource.listEligibleItems(communityId ?? 0, { page, pageSize }, signal),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!communityId && communityId > 0 && (options.enabled ?? true),
  });
}

export default useShowcaseEligibleItems;
