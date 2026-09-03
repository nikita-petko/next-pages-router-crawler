import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { AGREEMENTS_QUERY_KEY } from '../../queryKeys';

export const useIphRejectConditionalChangeRequestMutation = (agreementId: string) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.rejectConditionalChangeRequest(accountId, agreementId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY });
    },
    onError: (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'iphRejectConditionalChangeRequest' },
        extra: { agreementId, accountId },
      });
    },
  });
};

export default useIphRejectConditionalChangeRequestMutation;
