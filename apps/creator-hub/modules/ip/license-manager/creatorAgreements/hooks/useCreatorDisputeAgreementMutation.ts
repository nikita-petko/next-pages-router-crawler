import { useMutation, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';
import { DisputeReason } from '@rbx/clients/contentLicensingApi/v1';

import { useCurrentAccountContext } from '../../../components/AccountProvider';

import { AGREEMENTS_QUERY_KEY } from '../../queryKeys';

export const useCreatorDisputeAgreementMutation = (agreementId: string) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async (disputeReason: DisputeReason) => {
      if (!accountId || !disputeReason) {
        throw new Error('Missing account ID or dispute reason');
      }

      return contentLicensingClient.disputeAgreementOffer(accountId, agreementId, disputeReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error, disputeReason) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'creatorDisputeAgreement' },
        extra: { agreementId, disputeReason, accountId },
      });
    },
  });
};

export default useCreatorDisputeAgreementMutation;
