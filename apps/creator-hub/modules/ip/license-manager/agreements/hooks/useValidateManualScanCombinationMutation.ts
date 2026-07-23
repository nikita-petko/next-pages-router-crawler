import { useMutation } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';

import { RequestedScanValidity } from '@rbx/clients/contentLicensingApi/v1';
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
