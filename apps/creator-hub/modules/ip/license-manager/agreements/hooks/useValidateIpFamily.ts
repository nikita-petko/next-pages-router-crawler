import { captureException } from '@sentry/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { IpFamilyValidity } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

interface Props {
  ipFamilyId: string;
}

const useValidateIpFamily = () => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ ipFamilyId }: Props): Promise<IpFamilyValidity | undefined> => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const response = await contentLicensingClient.validateIpFamilyForManualScan(
        accountId,
        ipFamilyId,
      );
      return response.validity;
    },
    onError: (error, ipFamilyId, universeId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'validateIpFamilyForManualScan' },
        extra: { ipFamilyId, universeId },
      });
    },
  });
};

export default useValidateIpFamily;
