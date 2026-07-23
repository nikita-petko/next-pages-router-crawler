import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_PLACEFILE_IMAGES_QUERY_KEY } from '../../queryKeys';

interface UseGetPlacefileImagesQueryParams {
  agreementCandidateId?: string;
  /**
   * Relies on isExperiencePreviewEnabled to be true for this to run.
   * Defaults to false.
   */
  enabled?: boolean;
}

/**
 * Fetches the placefile (screenshot) image asset ids detected for an agreement candidate.
 *
 * These asset ids are resolved to image URLs downstream by the consumer.
 */
export const useGetPlacefileImagesQuery = ({
  agreementCandidateId,
  enabled: enabledOption = false,
}: UseGetPlacefileImagesQueryParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_PLACEFILE_IMAGES_QUERY_KEY(accountId, agreementCandidateId),
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementCandidateId) {
        throw new Error('Missing agreement candidate ID');
      }

      const response = await contentLicensingClient.getPlacefileImagesByAgreementCandidate(
        accountId,
        agreementCandidateId,
      );

      return response.assetIds ?? [];
    },
    enabled: !!accountId && !!agreementCandidateId && enabledOption,
    staleTime: Infinity,
  });
};
