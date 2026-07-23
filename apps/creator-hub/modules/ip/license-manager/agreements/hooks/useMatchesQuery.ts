import {
  keepPreviousData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  AgreementCandidateResponse,
  ListAgreementCandidatesResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import {
  DauBucket,
  LifetimeVisitBucket,
  UniverseContentMaturity,
} from '@rbx/clients/contentLicensingApi/v1';
import { useMemo } from 'react';

import { contentLicensingClient } from '@modules/clients';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { MATCHES_QUERY_KEY } from '../../queryKeys';
import { DauRange } from '../components/DauRangeFilterChip';
import { LifetimeVisitsRange } from '../components/LifetimeVisitsRangeFilterChip';

interface MatchesQueryOptions {
  pageSize: number;
  ipFamilyId?: string;
  dauRange?: DauRange;
  lifetimeVisitsRange?: LifetimeVisitsRange;
  contentMaturityRatings?: UniverseContentMaturity[];
}

/** Convert dau range to filter strings for OR-based query syntax */
const convertDauRangeToMultipleDau7DayBucketFilters = (
  dauRange?: DauRange,
): string[] | undefined => {
  switch (dauRange) {
    case DauRange.High:
      return [`dau_7_day_bucket="${DauBucket.Large}"`];
    case DauRange.Low:
      return [`dau_7_day_bucket="${DauBucket.Small}"`, `dau_7_day_bucket="${DauBucket.Large}"`];
    default:
      return undefined;
  }
};

/** Translate from our FE LifetimeVisitsRange construct to the backend buckets */
const convertLifetimeVisitsRangeToLifetimeVisitBucket = (
  lifetimeVisitsRange?: LifetimeVisitsRange,
): LifetimeVisitBucket[] => {
  switch (lifetimeVisitsRange) {
    case LifetimeVisitsRange.High:
      return [LifetimeVisitBucket.Large];
    case LifetimeVisitsRange.Low:
      return [LifetimeVisitBucket.Medium, LifetimeVisitBucket.Large];
    default:
      return [LifetimeVisitBucket.Small, LifetimeVisitBucket.Medium, LifetimeVisitBucket.Large];
  }
};

type MatchesQueryPage = ListAgreementCandidatesResponse;

type MatchesQueryResult = UseInfiniteQueryResult<
  InfiniteData<MatchesQueryPage, string | undefined>,
  Error
> & {
  allAgreementCandidates: AgreementCandidateResponse[];
};

/**
 * Fetches the list of deepscan candidates (aka Agreement Candidates) for a specific account.
 *
 * This is distinct from manual scan candidates.
 * For that, see useManualMatchesQuery defined in apps/creator-hub/modules/ip/license-manager/agreements/hooks/useManualMatchesQuery.ts
 */
export const useMatchesQuery = (options: MatchesQueryOptions) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const { pageSize, ipFamilyId, dauRange, lifetimeVisitsRange, contentMaturityRatings } = options;

  const request = useInfiniteQuery({
    queryKey: [
      ...MATCHES_QUERY_KEY,
      pageSize,
      ipFamilyId,
      dauRange,
      lifetimeVisitsRange,
      contentMaturityRatings,
    ],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const filters = ['archived=false'];

      if (ipFamilyId) {
        filters.push(`ip_family_id="${ipFamilyId}"`);
      }

      if (contentMaturityRatings && contentMaturityRatings.length) {
        if (contentMaturityRatings.length === 1) {
          filters.push(`universe_content_maturity="${contentMaturityRatings[0]}"`);
        } else {
          const maturityFilters = contentMaturityRatings.map(
            (rating) => `universe_content_maturity="${rating}"`,
          );
          filters.push(`(${maturityFilters.join(' || ')})`);
        }
      }

      const dauFilters = convertDauRangeToMultipleDau7DayBucketFilters(dauRange);
      if (dauFilters && dauFilters.length > 0) {
        if (dauFilters.length === 1) {
          filters.push(dauFilters[0]);
        } else {
          filters.push(`(${dauFilters.join(' || ')})`);
        }
      }

      const filter = filters.join(' AND ');

      const response: ListAgreementCandidatesResponse =
        await contentLicensingClient.listAgreementCandidatesByAccount(
          accountId,
          pageSize,
          pageParam,
          filter,
        );

      let agreementCandidates: AgreementCandidateResponse[] = response.agreementCandidates || [];

      // Only filter when a selection for lifetimeVisitsRange is made
      if (
        options.lifetimeVisitsRange === LifetimeVisitsRange.High ||
        options.lifetimeVisitsRange === LifetimeVisitsRange.Low
      ) {
        // MUS-2432 - TODO - dminnerly - Since we've already established a page size
        // when calling `listAgreementCandidatesByAccount` any filtering that
        // happens at this point will result in inconsistently sized pages.
        agreementCandidates = agreementCandidates?.filter((agreementCandidate) => {
          return convertLifetimeVisitsRangeToLifetimeVisitBucket(options.lifetimeVisitsRange).find(
            (option) => option === agreementCandidate.creatorLifetimeVisitBucket,
          );
        });
      }

      return {
        ...response,
        agreementCandidates,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.nextPageToken ? lastPage.nextPageToken : undefined),
    enabled: !!accountId,
    // in order to avoid jank when filtering we'll keep the previous data
    // in the table until the new data is loaded
    placeholderData: keepPreviousData,
  });

  const allAgreementCandidates: AgreementCandidateResponse[] = useMemo(() => {
    const pages = request.data?.pages || [];
    const candidates = pages.flatMap(
      (page) => (page.agreementCandidates || []) as AgreementCandidateResponse[],
    );
    return candidates;
  }, [request.data]);

  return {
    ...request,
    allAgreementCandidates,
  } as MatchesQueryResult;
};

export type UseMatchesQueryResult = ReturnType<typeof useMatchesQuery>;

export default useMatchesQuery;
