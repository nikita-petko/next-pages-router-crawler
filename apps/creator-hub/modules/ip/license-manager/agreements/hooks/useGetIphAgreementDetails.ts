import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import developClient from '@modules/clients/develop';
import rightsClient from '@modules/clients/rights';
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

      const response = await contentLicensingClient.getIphAgreement(accountId, agreementId);

      const { listing } = response;

      if (
        !response.license ||
        !response.targetAccountId ||
        !response.licenseId ||
        !response.agreementTargets ||
        !listing?.accountId ||
        !listing?.ipFamilyId
      ) {
        throw new Error(
          'Agreement missing license, targetAccountId, licenseId, agreementTargets, listing accountId, or listing ipFamilyId',
        );
      }

      // IP Family methods are still using rights client
      const ipFamilyResponse = await rightsClient.getIpFamilyId({
        accountId: listing.accountId,
        ipFamilyId: listing.ipFamilyId,
      });

      const universeId = Number(response.agreementTargets[0]?.contentId);
      const universeResponse = await developClient.getUniverseDetails(universeId);

      return {
        agreement: response,
        license: response.license,
        listing,
        ipFamily: ipFamilyResponse,
        universe: universeResponse,
      };
    },
    enabled: !!accountId,
  });
};

export default useGetIphAgreementDetails;
