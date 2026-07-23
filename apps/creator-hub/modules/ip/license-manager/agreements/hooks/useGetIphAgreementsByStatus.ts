import { useQuery } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { listAll } from '@modules/clients/utils';
import type { HydratedListAgreementResponse } from '@rbx/clients/contentLicensingApi/v1';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_IPH_AGREEMENTS_BY_STATUS_QUERY_KEY } from '../../queryKeys';

const DEFAULT_PAGE_SIZE = 100;

interface GetIphAgreementsByStatusParams {
  agreementStatus?: string[];
}

export const useGetIphAgreementsByStatus = ({
  agreementStatus,
}: GetIphAgreementsByStatusParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_IPH_AGREEMENTS_BY_STATUS_QUERY_KEY(accountId, agreementStatus),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      let agreements: HydratedListAgreementResponse[] = [];

      // Make separate API calls for each agreement status
      if (agreementStatus && agreementStatus.length > 0) {
        const agreementsByStatus = await Promise.all(
          agreementStatus.map((status) =>
            listAll({
              api: (pageToken) =>
                contentLicensingClient.listAgreementsByAccount(
                  accountId,
                  status.toString(),
                  DEFAULT_PAGE_SIZE,
                  pageToken,
                ),
              getItems: (response) => response?.agreements ?? [],
              getPageToken: (response) => response.nextPageToken ?? undefined,
            }),
          ),
        );
        agreements = agreementsByStatus.flat();
        // Sort by updatedAt descending (most recent first)
        agreements.sort((a, b) => {
          const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bDate - aDate;
        });
      } else {
        // No status filter provided, fetch all agreements
        agreements = await listAll({
          api: (pageToken) =>
            contentLicensingClient.listAgreementsByAccount(
              accountId,
              undefined,
              DEFAULT_PAGE_SIZE,
              pageToken,
            ),
          getItems: (response) => response?.agreements ?? [],
          getPageToken: (response) => response.nextPageToken ?? undefined,
        });
      }

      return {
        agreements,
        allAgreementCount: agreements.length,
      };
    },
    enabled: !!accountId,
  });
};

export default useGetIphAgreementsByStatus;
