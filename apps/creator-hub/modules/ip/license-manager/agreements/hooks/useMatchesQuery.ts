import { useMemo } from 'react';
import {
  keepPreviousData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  AgreementCandidateIndexOfferStatusFilter,
  AgreementCandidateIndexSortBy,
  AgreementCandidateIndexSortDirection,
  AgreementCandidateResponse,
  IndexedAgreementCandidateResponse,
  ListAgreementCandidatesResponse,
  UniverseContentMaturity,
} from '@rbx/client-content-licensing-api/v1';
import {
  AgreementCandidateIndexOfferStatusFilter as IndexedOfferStatusFilter,
  AgreementStatus,
  DauBucket,
  LifetimeVisitBucket,
} from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { MATCHES_QUERY_KEY } from '../../queryKeys';
import { DauRange } from '../components/DauRangeFilterChip';
import type { AgreementStatusesColumnProps } from '../components/IphMatchStatusLabel';
import { LifetimeVisitsRange } from '../components/LifetimeVisitsRangeFilterChip';
import { MatchCandidateOfferStatusFilter } from '../components/MatchCandidateOfferStatusFilterChip';
import { useAgreementStatusesByIdsQuery } from './useAgreementStatusesByIdsQuery';

/** Agreement statuses that render as “No offer sent” in the matches status column (see IphMatchStatusLabel). */
const AGREEMENT_STATUSES_UI_NO_OFFER_SENT: readonly AgreementStatus[] = [
  AgreementStatus.Archived,
  AgreementStatus.Cancelled,
  AgreementStatus.Expired,
  AgreementStatus.Terminated,
  AgreementStatus.Unsuccessful,
];

/** Agreement statuses that render as an active IPH agreement row (not “No offer sent” / not “Unknown”). */
const AGREEMENT_STATUSES_UI_HAS_AGREEMENT: readonly AgreementStatus[] = [
  AgreementStatus.Disputed,
  AgreementStatus.Inquired,
  AgreementStatus.Accepted,
];

interface AgreementStatusesForOfferFilter {
  statusesByAgreementId: Record<string, AgreementStatus> | undefined;
  errorsByAgreementId: AgreementStatusesColumnProps['errorsByAgreementId'];
  isPending: boolean;
}

/**
 * Whether a candidate should be included for the offer-status chip filters, using the same rules as
 * IphMatchStatusLabel / AgreementStatusFromBatchMaps.
 */
export const agreementCandidateMatchesOfferStatusFilter = (
  candidate: AgreementCandidateResponse,
  filter: MatchCandidateOfferStatusFilter,
  batch: AgreementStatusesForOfferFilter | undefined,
): boolean => {
  if (
    filter !== MatchCandidateOfferStatusFilter.NoOfferSent &&
    filter !== MatchCandidateOfferStatusFilter.HasAgreement
  ) {
    return true;
  }

  // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- whitespace-only IDs trim to `""`; `??` would keep empty string
  const agreementId = candidate.agreementId?.trim() || undefined;
  const hasAgreementId = !!agreementId;

  if (!batch) {
    return filter === MatchCandidateOfferStatusFilter.HasAgreement
      ? hasAgreementId
      : !hasAgreementId;
  }

  if (filter === MatchCandidateOfferStatusFilter.NoOfferSent) {
    if (!hasAgreementId) {
      return true;
    }
    if (agreementId && batch.errorsByAgreementId?.[agreementId]) {
      return false;
    }
    const status = agreementId ? batch.statusesByAgreementId?.[agreementId] : undefined;
    if (status !== undefined) {
      return AGREEMENT_STATUSES_UI_NO_OFFER_SENT.includes(status);
    }
    if (batch.isPending) {
      return false;
    }
    return false;
  }

  // HasAgreement — same inclusion as a row that would show Disputed / Inquired / Accepted
  if (!hasAgreementId || !agreementId) {
    return false;
  }
  if (batch.errorsByAgreementId?.[agreementId]) {
    return false;
  }
  const status = batch.statusesByAgreementId?.[agreementId];
  if (status !== undefined) {
    return AGREEMENT_STATUSES_UI_HAS_AGREEMENT.includes(status);
  }
  if (batch.isPending) {
    return true;
  }
  return false;
};

interface MatchesQueryOptions {
  pageSize: number;
  ipFamilyId?: string;
  dauRange?: DauRange;
  lifetimeVisitsRange?: LifetimeVisitsRange;
  contentMaturityRatings?: UniverseContentMaturity[];
  /** Client-side filter aligned with the matches table status column (use with loadAgreementStatuses). */
  offerStatusFilter?: MatchCandidateOfferStatusFilter;
  sortBy?: AgreementCandidateIndexSortBy;
  sortDirection?: AgreementCandidateIndexSortDirection;
  /**
   * When true, batch-loads agreement statuses for loaded candidates and exposes agreementStatusesColumn
   * for the matches table and offer-status filtering.
   */
  loadAgreementStatuses?: boolean;
}

/** Translate from the UI DAU range to backend buckets. */
const convertDauRangeToDau7DayBuckets = (dauRange?: DauRange): DauBucket[] | undefined => {
  switch (dauRange) {
    case DauRange.High:
      return [DauBucket.Large];
    case DauRange.Low:
      return [DauBucket.Small, DauBucket.Large];
    case DauRange.All:
    case undefined:
      return undefined;
    default:
      return undefined;
  }
};

/** Translate from our FE LifetimeVisitsRange construct to the backend buckets */
const convertLifetimeVisitsRangeToLifetimeVisitBucket = (
  lifetimeVisitsRange?: LifetimeVisitsRange,
): LifetimeVisitBucket[] | undefined => {
  switch (lifetimeVisitsRange) {
    case LifetimeVisitsRange.High:
      return [LifetimeVisitBucket.Large];
    case LifetimeVisitsRange.Low:
      return [LifetimeVisitBucket.Medium, LifetimeVisitBucket.Large];
    case LifetimeVisitsRange.All:
    case undefined:
      return undefined;
    default:
      return undefined;
  }
};

const convertOfferStatusFilter = (
  offerStatusFilter?: MatchCandidateOfferStatusFilter,
): AgreementCandidateIndexOfferStatusFilter | undefined => {
  switch (offerStatusFilter) {
    case MatchCandidateOfferStatusFilter.NoOfferSent:
      return IndexedOfferStatusFilter.NoOfferSent;
    case MatchCandidateOfferStatusFilter.HasAgreement:
      return IndexedOfferStatusFilter.HasAgreement;
    case MatchCandidateOfferStatusFilter.All:
    case undefined:
      return undefined;
    default:
      return undefined;
  }
};

const normalizeIndexedAgreementCandidate = ({
  contentMaturity,
  ...candidate
}: IndexedAgreementCandidateResponse): AgreementCandidateResponse => ({
  ...candidate,
  universeContentMaturity: contentMaturity,
});

type MatchesQueryPage = ListAgreementCandidatesResponse;

type MatchesQueryResult = UseInfiniteQueryResult<
  InfiniteData<MatchesQueryPage, string | undefined>
> & {
  allAgreementCandidates: AgreementCandidateResponse[];
  agreementStatusesColumn: AgreementStatusesColumnProps | undefined;
};

/**
 * Fetches the list of deepscan candidates (aka Agreement Candidates) for a specific account.
 *
 * This is distinct from manual scan candidates.
 * For that, see useManualMatchesQuery defined in apps/creator-hub/modules/ip/license-manager/agreements/hooks/useManualMatchesQuery.ts
 */
export const useMatchesQuery = (options: MatchesQueryOptions): MatchesQueryResult => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const useIndexedMatches = settings.enableIpPlatformMatchesTableEsIndexImprovements;

  const {
    pageSize,
    ipFamilyId,
    dauRange,
    lifetimeVisitsRange,
    contentMaturityRatings,
    offerStatusFilter,
    sortBy,
    sortDirection,
    loadAgreementStatuses = false,
  } = options;

  const request = useInfiniteQuery({
    queryKey: [
      ...MATCHES_QUERY_KEY,
      accountId,
      useIndexedMatches,
      pageSize,
      ipFamilyId,
      dauRange,
      lifetimeVisitsRange,
      contentMaturityRatings,
      useIndexedMatches ? offerStatusFilter : undefined,
      useIndexedMatches ? sortBy : undefined,
      useIndexedMatches ? sortDirection : undefined,
    ],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const dau7DayBuckets = convertDauRangeToDau7DayBuckets(dauRange);

      if (useIndexedMatches) {
        const response = await contentLicensingClient.listIndexedAgreementCandidatesByAccount(
          accountId,
          pageSize,
          pageParam,
          false,
          ipFamilyId,
          dau7DayBuckets,
          convertLifetimeVisitsRangeToLifetimeVisitBucket(lifetimeVisitsRange),
          contentMaturityRatings?.length ? contentMaturityRatings : undefined,
          convertOfferStatusFilter(offerStatusFilter),
          sortBy,
          sortDirection,
        );

        return {
          nextPageToken: response.nextPageToken,
          agreementCandidates:
            response.agreementCandidates?.map(normalizeIndexedAgreementCandidate) ?? [],
        };
      }

      // TODO - when cleaning up useIndexedMatches aka enableIpPlatformMatchesTableEsIndexImprovements, we should also
      // clean-up the old `listAgreementCandidatesByAccount` API and remove the filter-building logic below.
      // The new API supports all of these filters directly.

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

      const dauFilters = dau7DayBuckets?.map((bucket) => `dau_7_day_bucket="${bucket}"`);
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

      let agreementCandidates: AgreementCandidateResponse[] = response.agreementCandidates ?? [];

      // Only filter when a selection for lifetimeVisitsRange is made
      if (
        options.lifetimeVisitsRange === LifetimeVisitsRange.High ||
        options.lifetimeVisitsRange === LifetimeVisitsRange.Low
      ) {
        // MUS-2432 - TODO - dminnerly - Since we've already established a page size
        // when calling `listAgreementCandidatesByAccount` any filtering that
        // happens at this point will result in inconsistently sized pages.
        agreementCandidates = agreementCandidates?.filter((agreementCandidate) => {
          return convertLifetimeVisitsRangeToLifetimeVisitBucket(lifetimeVisitsRange)?.some(
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
    // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- API may return `""` when there is no next page; `??` would keep fetching
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled: !!accountId && isSettingsFetched,
    // in order to avoid jank when filtering we'll keep the previous data
    // in the table until the new data is loaded
    placeholderData: keepPreviousData,
  });

  const rawAgreementCandidates: AgreementCandidateResponse[] = useMemo(() => {
    const pages = request.data?.pages ?? [];
    return pages.flatMap((page) => page.agreementCandidates ?? []);
  }, [request.data]);

  const agreementIdsForStatuses = useMemo(
    () =>
      rawAgreementCandidates.map((c) => c.agreementId).filter((id): id is string => !!id?.trim()),
    [rawAgreementCandidates],
  );

  const agreementStatusesQuery = useAgreementStatusesByIdsQuery({
    agreementIds: agreementIdsForStatuses,
    enabled:
      loadAgreementStatuses && agreementIdsForStatuses.length > 0 && !!request.data?.pages?.length,
  });

  const allAgreementCandidates: AgreementCandidateResponse[] = useMemo(() => {
    if (
      useIndexedMatches ||
      (offerStatusFilter !== MatchCandidateOfferStatusFilter.NoOfferSent &&
        offerStatusFilter !== MatchCandidateOfferStatusFilter.HasAgreement)
    ) {
      return rawAgreementCandidates;
    }
    const batch: AgreementStatusesForOfferFilter | undefined = loadAgreementStatuses
      ? {
          statusesByAgreementId: agreementStatusesQuery.data?.statusesByAgreementId,
          errorsByAgreementId: agreementStatusesQuery.data?.errorsByAgreementId,
          isPending: agreementStatusesQuery.isPending,
        }
      : undefined;
    return rawAgreementCandidates.filter((candidate) =>
      agreementCandidateMatchesOfferStatusFilter(candidate, offerStatusFilter, batch),
    );
  }, [
    rawAgreementCandidates,
    useIndexedMatches,
    offerStatusFilter,
    loadAgreementStatuses,
    agreementStatusesQuery.data,
    agreementStatusesQuery.isPending,
  ]);

  const agreementStatusesColumn: AgreementStatusesColumnProps | undefined = useMemo(
    () =>
      loadAgreementStatuses
        ? {
            statusByAgreementId: agreementStatusesQuery.data?.statusesByAgreementId,
            errorsByAgreementId: agreementStatusesQuery.data?.errorsByAgreementId,
            isPending: agreementStatusesQuery.isPending,
            isError: agreementStatusesQuery.isError,
          }
        : undefined,
    [
      loadAgreementStatuses,
      agreementStatusesQuery.data,
      agreementStatusesQuery.isPending,
      agreementStatusesQuery.isError,
    ],
  );

  /* oxlint-disable typescript/no-unsafe-type-assertion -- useInfiniteQuery pageParam inferred as unknown vs string | undefined */
  return {
    // oxlint-disable-next-line @tanstack/query/no-rest-destructuring -- composed return; spreading query is intentional here
    ...request,
    allAgreementCandidates,
    agreementStatusesColumn,
  } as MatchesQueryResult;
  /* oxlint-enable typescript/no-unsafe-type-assertion */
};

export type UseMatchesQueryResult = ReturnType<typeof useMatchesQuery>;

export default useMatchesQuery;
