import { useQuery } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { listAll } from '@modules/clients/utils';
import { AgreementStatus } from '@rbx/clients/contentLicensingApi/v1';

import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_CREATOR_AGREEMENTS_BY_STATUS_QUERY_KEY } from '../../queryKeys';

const DEFAULT_PAGE_SIZE = 100;

interface GetCreatorAgreementsByStatusParams {
  agreementStatus: AgreementStatus[];
}

export const useGetCreatorAgreementsByStatus = ({
  agreementStatus,
}: GetCreatorAgreementsByStatusParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_CREATOR_AGREEMENTS_BY_STATUS_QUERY_KEY(accountId, agreementStatus),
    queryFn: async () => {
      if (!accountId) {
        return {
          agreements: [],
          allAgreementCount: 0,
        };
      }

      const agreements = await listAll({
        api: (pageToken) =>
          contentLicensingClient.listAgreementsByTargetAccount(
            accountId,
            undefined, // filter
            DEFAULT_PAGE_SIZE,
            pageToken,
          ),
        getItems: (response) => response?.agreements ?? [],
        getPageToken: (response) => response.nextPageToken ?? undefined,
      });

      const filteredAgreements = agreements.filter((agreement) =>
        agreementStatus.includes(agreement.status ?? AgreementStatus.None),
      );

      return {
        agreements: filteredAgreements,
        allAgreementCount: agreements.length,
      };
    },
  });
};

export default useGetCreatorAgreementsByStatus;
