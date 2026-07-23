import { useMutation, useQueryClient } from '@tanstack/react-query';
import { captureException } from '@sentry/nextjs';
import { contentLicensingClient } from '@modules/clients';
import { MS_PER_DAY } from '../utils/constants';

export const getLicenseKey = (licenseId: string) => [
  'contentLicensingApiClient/getLicense',
  licenseId,
];

export interface ApplyToPublicLicenseParams {
  universeId: number;
  pitch: string;
  dateRange: { startDate: Date | null; endDate: Date | null } | undefined;
}

const useApplyToPublicLicenseMutation = (licenseId: string, enableMonetization: boolean) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ universeId, pitch, dateRange }: ApplyToPublicLicenseParams) => {
      const startDate = dateRange?.startDate ?? null;
      const endDate = dateRange?.endDate
        ? new Date(dateRange.endDate.getTime() + MS_PER_DAY)
        : null;

      return contentLicensingClient.applyToLicense(
        licenseId,
        universeId,
        enableMonetization,
        pitch,
        startDate,
        endDate,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLicenseKey(licenseId) });
    },
    onError: (error, params) => {
      captureException(error, {
        tags: { module: 'licenses', operation: 'applyToPublicLicense' },
        extra: { licenseId, universeId: params.universeId, enableMonetization },
      });
    },
  });
};

export default useApplyToPublicLicenseMutation;
