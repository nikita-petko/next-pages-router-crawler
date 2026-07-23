import {
  keepPreviousData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';
import type { AgreementCandidateResponse } from '@rbx/clients/contentLicensingApi/v1';
import { useMemo } from 'react';

import { contentLicensingClient } from '@modules/clients';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { MATCHES_QUERY_KEY } from '../../queryKeys';

interface ManualMatchesQueryOptions {
  pageSize: number;
}

interface ManualMatchesPage {
  manualCandidates: AgreementCandidateResponse[];
  nextPageToken: string | undefined;
  manualCandidatesSubmittedToday: number | null | undefined;
  maxDailyLimit: number | null | undefined;
}

type ManualMatchesQueryResult = UseInfiniteQueryResult<
  InfiniteData<ManualMatchesPage, string | undefined>,
  Error
> & {
  allManualCandidates: AgreementCandidateResponse[];
  manualCandidatesSubmittedToday: number | null | undefined;
  maxDailyLimit: number | null | undefined;
};

/**
 * Fetches the list of manual scan candidates (aka Requested Agreement Candidates) for a specific account.
 *
 * This is distinct from deep-scan candidates.
 * For that, see useMatchesQuery defined in apps/creator-hub/modules/ip/license-manager/agreements/hooks/useMatchesQuery.ts
 */
export const useManualMatchesQuery = (options: ManualMatchesQueryOptions) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const { pageSize } = options;

  const request = useInfiniteQuery({
    queryKey: [...MATCHES_QUERY_KEY, 'manualMatchCandidates', pageSize],
    queryFn: async ({ pageParam }) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const response = await contentLicensingClient.listRequestedScanCandidatesByAccount(
        accountId,
        pageSize,
        pageParam as string | undefined,
      );

      return {
        manualCandidates: response.candidates || [],
        nextPageToken: response.nextPageToken || undefined,
        manualCandidatesSubmittedToday: response.numScanRequestsToday,
        maxDailyLimit: response.numScanRequestsLimit,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.nextPageToken ? lastPage.nextPageToken : undefined),
    enabled: !!accountId,
    placeholderData: keepPreviousData,
  });

  const allManualCandidates: AgreementCandidateResponse[] = useMemo(() => {
    const pages = request.data?.pages || [];
    let candidates = pages.flatMap(
      (page: ManualMatchesPage) => (page.manualCandidates || []) as AgreementCandidateResponse[],
    );
    candidates = candidates.sort((a, b) => (b.updatedAt! < a.updatedAt! ? -1 : 1));
    return candidates;
  }, [request.data]);

  const manualCandidatesSubmittedToday = useMemo(() => {
    return (request.data?.pages?.[0] as ManualMatchesPage | undefined)
      ?.manualCandidatesSubmittedToday;
  }, [request.data]);

  const maxDailyLimit = useMemo(() => {
    return (request.data?.pages?.[0] as ManualMatchesPage | undefined)?.maxDailyLimit;
  }, [request.data]);

  return {
    ...request,
    allManualCandidates,
    manualCandidatesSubmittedToday,
    maxDailyLimit,
  } as ManualMatchesQueryResult;
};

export default useManualMatchesQuery;
