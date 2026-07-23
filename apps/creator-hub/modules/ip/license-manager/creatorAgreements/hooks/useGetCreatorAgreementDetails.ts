import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_CREATOR_AGREEMENT_WITH_DETAILS_QUERY_KEY } from '../../queryKeys';

interface GetCreatorAgreementDetailsParams {
  agreementId?: string;
}

export const useGetCreatorAgreementDetails = ({
  agreementId,
}: GetCreatorAgreementDetailsParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_CREATOR_AGREEMENT_WITH_DETAILS_QUERY_KEY(accountId, agreementId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementId) {
        throw new Error('Missing agreement ID');
      }

      const agreementResponse = await contentLicensingClient.getCreatorAgreement(
        accountId,
        agreementId,
      );

      if (
        !agreementResponse.listing ||
        !agreementResponse.license ||
        !agreementResponse.agreementTargets
      ) {
        throw new Error('Agreement missing listing, license, or agreementTargets');
      }

      return {
        agreement: agreementResponse,
        license: agreementResponse.license,
        listing: agreementResponse.listing,
      };
    },
    enabled: !!accountId && !!agreementId,
  });
};

export default useGetCreatorAgreementDetails;
