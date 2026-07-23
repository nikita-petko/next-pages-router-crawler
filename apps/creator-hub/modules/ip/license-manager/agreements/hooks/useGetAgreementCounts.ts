import { useQuery } from '@tanstack/react-query';
import { contentLicensingClient } from '@modules/clients';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { getAgreementEnumsForFilter } from '../components/AgreementTableFilters';
import { AgreementFilterKeys } from '../utils/constants';

export const GetAgreementCounts = 'contentLicensingClient/getAgreementCounts';

/**
 * Hook to fetch all agreements and aggregate counts by status enum
 * Returns counts indexed by AgreementStatus values
 */
const useGetAgreementCounts = (isCreator: boolean, filterKeys: AgreementFilterKeys[]) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: [GetAgreementCounts, isCreator, filterKeys],
    queryFn: async () => {
      // This query can be used by
      // - creators without shadow RM account
      // - creators with RM (shadow or real)
      // - ip holders

      // In the case of creators without shadow RM account we can't call the API
      // since it requires a RM account id.
      // However, in this case, the user should have no agreements, so we can return an empty array.
      const counts: Map<AgreementFilterKeys, number> = new Map();
      if (!accountId) {
        return counts;
      }

      const countsResults = [];

      for (let i = 0; i < filterKeys.length; i += 1) {
        const filterKey = filterKeys[i];
        const statuses = getAgreementEnumsForFilter(filterKey);
        if (isCreator) {
          countsResults.push(
            contentLicensingClient.getAgreementCountsByTargetAccountAndStatuses(
              accountId,
              statuses,
            ),
          );
        } else {
          countsResults.push(
            contentLicensingClient.getAgreementCountsByAccountAndStatuses(accountId, statuses),
          );
        }
      }

      const results = await Promise.all(countsResults);

      for (let i = 0; i < filterKeys.length; i += 1) {
        const filterKey = filterKeys[i];
        const result = results[i];
        const totalCount = Object.values(result.counts ?? {}).reduce(
          (acc, count) => acc + count,
          0,
        );
        counts.set(filterKey, totalCount);
      }

      return counts;
    },
  });
};

export default useGetAgreementCounts;
