import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { AgreementCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import { MATCHES_QUERY_KEY } from '../../queryKeys';

type MatchesListPage = {
  agreementCandidates?: AgreementCandidateResponse[] | null;
};

const isMatchesInfiniteData = (
  data: unknown,
): data is InfiniteData<MatchesListPage, string | undefined> => {
  if (typeof data !== 'object' || data === null || !('pages' in data)) {
    return false;
  }
  return Array.isArray(data.pages);
};

const isAgreementCandidate = (data: unknown): data is AgreementCandidateResponse =>
  typeof data === 'object' && data !== null && 'id' in data && 'candidateId' in data;

const withAgreementId = (
  candidate: AgreementCandidateResponse,
  candidateId: string,
  agreementId: string,
): AgreementCandidateResponse =>
  candidate.id === candidateId ? { ...candidate, agreementId } : candidate;

/**
 * After promoting a match candidate, the matches list / candidate-by-id APIs (and especially the
 * indexed list) can lag. Patch cached match data so the row immediately shows an agreement and the
 * details panel can switch from Offer License → View Agreement.
 */
export const patchPromotedCandidateInMatchesQueries = (
  queryClient: QueryClient,
  candidateId: string,
  agreementId: string,
): void => {
  queryClient.setQueriesData({ queryKey: MATCHES_QUERY_KEY }, (old) => {
    if (isMatchesInfiniteData(old)) {
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          agreementCandidates: page.agreementCandidates?.map((candidate) =>
            withAgreementId(candidate, candidateId, agreementId),
          ),
        })),
      };
    }

    if (isAgreementCandidate(old) && old.id === candidateId) {
      return { ...old, agreementId };
    }

    return old;
  });
};
