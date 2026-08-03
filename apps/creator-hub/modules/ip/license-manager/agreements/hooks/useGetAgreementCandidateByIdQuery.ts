import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_AGREEMENT_CANDIDATE_BY_ID_QUERY_KEY } from '../../queryKeys';

interface UseGetAgreementCandidateByIdQueryParams {
  agreementCandidateId?: string;
}

/**
 * Fetches a single agreement candidate by id for the experience preview page (deep-linking to a
 * candidate that may not be on the current matches list page).
 */
export const useGetAgreementCandidateByIdQuery = ({
  agreementCandidateId,
}: UseGetAgreementCandidateByIdQueryParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_AGREEMENT_CANDIDATE_BY_ID_QUERY_KEY(accountId, agreementCandidateId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementCandidateId) {
        throw new Error('Missing agreement candidate ID');
      }

      return contentLicensingClient.getAgreementCandidateById(accountId, agreementCandidateId);
    },
    enabled: !!accountId && !!agreementCandidateId,
  });
};
