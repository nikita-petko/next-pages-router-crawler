import { useQuery, QueryKey, UseQueryResult, QueryObserverOptions } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import { useCloudPricingClient } from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import type { Account } from '@modules/cloud-services/pricing/types';
import { CreatorType } from '@modules/miscellaneous/common';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

type QueryOptions = QueryObserverOptions<Account | null | undefined>;

export interface UseExtendedServicesAccountInfoQueryProps {
  enabled?: boolean;
  refetchOnWindowFocus?: QueryOptions['refetchOnWindowFocus'];
}

export type AccountInfoQuery = UseQueryResult<Account | null | undefined, Error>;

const useExtendedServicesAccountInfoQuery = ({
  enabled = true,
  refetchOnWindowFocus = false,
}: UseExtendedServicesAccountInfoQueryProps = {}): [AccountInfoQuery, QueryKey] => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();
  const creatorType = currentGroup?.id ? CreatorType.Group : CreatorType.User;
  const creatorId = currentGroup?.id ?? user?.id ?? 0;
  const cloudPricingClient = useCloudPricingClient();

  const queryKey: QueryKey = ['resAccountInfo', creatorType, creatorId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await cloudPricingClient.getAccountSettings(creatorId, creatorType);
        if (response !== null) {
          return {
            accountName: response?.accountName ?? '',
            accountTaxType: response.accountTaxType,
            taxId: response.taxId,
            taxIdType: response.taxIdType,
          } as Account;
        }

        return null;
      } catch {
        throw new Error('No account settings found');
      }
    },
    enabled: enabled && (!!user?.id || !!currentGroup?.id),
    refetchOnWindowFocus: refetchOnWindowFocus as boolean | 'always' | undefined,
  });

  return [query, queryKey];
};

export default useExtendedServicesAccountInfoQuery;
