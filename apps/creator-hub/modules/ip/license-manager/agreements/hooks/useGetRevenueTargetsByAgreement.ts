import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import listAll from '@modules/clients/utils/listAll';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_REVENUE_TARGETS_BY_AGREEMENT_QUERY_KEY } from '../../queryKeys';

const DEFAULT_PAGE_SIZE = 100;

interface UseGetRevenueTargetsByAgreementParams {
  agreementId?: string;
  enabled?: boolean;
}

export const useGetRevenueTargetsByAgreement = ({
  agreementId,
  enabled = true,
}: UseGetRevenueTargetsByAgreementParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_REVENUE_TARGETS_BY_AGREEMENT_QUERY_KEY(accountId, agreementId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementId) {
        throw new Error('Missing agreement ID');
      }

      return listAll({
        api: (pageToken) =>
          contentLicensingClient.listRevenueTargetsByAgreement(
            accountId,
            agreementId,
            DEFAULT_PAGE_SIZE,
            pageToken,
          ),
        getItems: (response) => response.revenueTargets ?? [],
        getPageToken: (response) => response.nextPageToken ?? undefined,
      });
    },
    enabled: enabled && !!accountId && !!agreementId,
  });
};

export default useGetRevenueTargetsByAgreement;
