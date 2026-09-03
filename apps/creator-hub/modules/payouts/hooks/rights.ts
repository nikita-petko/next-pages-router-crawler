import { useQuery } from '@tanstack/react-query';
import type { HydratedListAgreementResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import rightsClient from '@modules/clients/rights';
import { listAll } from '@modules/clients/utils';

const currentAccountKey = 'payouts/currentAccount';
const activeAgreementsKey = 'payouts/activeAgreements';

/**
 * Returns the Rights Manager account for the current user or group context.
 * This account is used to determine a user's permissions to access IP and
 * rights related resources.
 * @returns The current Rights Manager account.
 */
const useRightsManagerAccount = () => {
  const response = useQuery({
    queryKey: [currentAccountKey],
    queryFn: async () => {
      return rightsClient.getCurrentAccount();
    },
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
  });

  const account = response.data?.account;
  const user = response.data?.user;
  const accountStatus = account?.status;
  return { account, user, accountStatus, ...response };
};

/**
 * Returns a mapping of experience ids to active IP agreements for a Rights
 * Manager account.
 * @returns A map of experience ids to agreements.
 */
const useGetActiveAgreementsForAccount = () => {
  const { account, isPending: isAccountFetchPending } = useRightsManagerAccount();

  return useQuery({
    queryKey: [activeAgreementsKey, account?.id],
    queryFn: async () => {
      // If the user does not have a rights manager account, return an empty agreement map.
      if (!account?.id) {
        return new Map<string, HydratedListAgreementResponse>();
      }

      const agreements = await listAll({
        api: (pageToken) =>
          contentLicensingClient.listAgreementsByTargetAccount(
            account.id!,
            AgreementStatus.Active,
            500,
            pageToken,
          ),
        getItems: (agreementsResponse) => agreementsResponse.agreements ?? [],
        getPageToken: (agreementsResponse) => agreementsResponse.nextPageToken ?? undefined,
      });

      return new Map(
        agreements
          ?.filter((agreement) => agreement.agreementTargets?.length)
          .flatMap(
            (agreement) =>
              agreement.agreementTargets?.map((target) => [target.contentId!, agreement]) ?? [],
          ),
      );
    },
    enabled: !isAccountFetchPending,
    staleTime: 30_000, // 30 seconds
    refetchOnMount: false,
  });
};

export default useGetActiveAgreementsForAccount;
