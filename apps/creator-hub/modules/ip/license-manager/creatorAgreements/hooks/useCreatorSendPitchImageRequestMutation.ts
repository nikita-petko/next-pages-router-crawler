import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import {
  AGREEMENTS_QUERY_KEY,
  GET_CREATOR_AGREEMENT_WITH_DETAILS_QUERY_KEY,
  GET_CREATOR_PITCH_IMAGE_ATTACHMENTS_QUERY_KEY,
} from '../../queryKeys';

export const useCreatorSendPitchImageRequestMutation = (agreementId: string) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (pitchImageAssetIds: number[]) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.updateCreatorPitchImages(
        accountId,
        agreementId,
        pitchImageAssetIds,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: GET_CREATOR_AGREEMENT_WITH_DETAILS_QUERY_KEY(accountId, agreementId),
      });
      void queryClient.invalidateQueries({
        queryKey: GET_CREATOR_PITCH_IMAGE_ATTACHMENTS_QUERY_KEY(accountId, agreementId),
      });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'creatorSendPitchImageRequest' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export default useCreatorSendPitchImageRequestMutation;
