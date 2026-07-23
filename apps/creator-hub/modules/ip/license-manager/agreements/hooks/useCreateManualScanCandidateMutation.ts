import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { MATCHES_QUERY_KEY } from '../../queryKeys';

interface Props {
  ipFamilyId: string;
  licenseId: string;
  universeId: string;
}

export const useCreateManualScanCandidateMutation = () => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: async ({ ipFamilyId, licenseId, universeId }: Props) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.createManualScanCandidate(
        accountId,
        ipFamilyId,
        licenseId,
        universeId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEY });
    },
    onError: (error, ipFamilyId, licenseId, universeId) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'iphCreateManualScanCandidate' },
        extra: { accountId, ipFamilyId, licenseId, universeId },
      });
    },
  });
};

export default useCreateManualScanCandidateMutation;
