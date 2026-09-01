import { captureException } from '@sentry/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { RequestedScanValidity } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

interface Props {
  universeId: string;
  ipFamilyId: string;
}

const useValidateManualScanCombinationMutation = () => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({
      universeId,
      ipFamilyId,
    }: Props): Promise<RequestedScanValidity | undefined> => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const response = await contentLicensingClient.validateManualScanCombination(
        accountId,
        ipFamilyId,
        universeId,
      );
      return response.validity;
    },
    onError: (error, ipFamilyId, universeId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'validateManualScanCombination' },
        extra: { ipFamilyId, universeId },
      });
    },
  });
};

export default useValidateManualScanCombinationMutation;
