import { useQuery } from '@tanstack/react-query';
import { developClient, rightsClient, contentLicensingClient } from '@modules/clients';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_IPH_AGREEMENT_WITH_DETAILS_QUERY_KEY } from '../../queryKeys';

interface GetIphAgreementDetailsParams {
  agreementId?: string;
}

export const useGetIphAgreementDetails = ({ agreementId }: GetIphAgreementDetailsParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_IPH_AGREEMENT_WITH_DETAILS_QUERY_KEY(accountId, agreementId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementId) {
        throw new Error('Missing agreement ID');
      }

      const response = await contentLicensingClient.getAgreement(accountId, agreementId);

      if (
        !response.license ||
        !response.targetAccountId ||
        !response.licenseId ||
        !response.agreementTargets ||
        !response.listing
      ) {
        throw new Error(
          'Agreement missing license, targetAccountId, licenseId, agreementTargets, or listing',
        );
      }

      // IP Family methods are still using rights client
      const ipFamilyResponse = await rightsClient.getIpFamilyId({
        accountId: response.listing.accountId!,
        ipFamilyId: response.listing.ipFamilyId!,
      });

      const universeId = Number(response.agreementTargets[0]?.contentId);
      const universeResponse = await developClient.getUniverseDetails(universeId);

      return {
        agreement: response,
        license: response.license,
        listing: response.listing,
        ipFamily: ipFamilyResponse,
        universe: universeResponse,
      };
    },
    enabled: !!accountId,
  });
};

export default useGetIphAgreementDetails;
