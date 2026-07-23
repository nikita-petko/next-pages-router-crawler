import { useMutation, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';

import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { AGREEMENTS_QUERY_KEY } from '../../queryKeys';

export const useCreatorCompleteChangeRequestMutation = (agreementId: string) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.completeChangeRequest(accountId, agreementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'creatorCompleteChangeRequest' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export default useCreatorCompleteChangeRequestMutation;
