import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LicenseType } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';
import {
  buildApplyToLicenseRevenueTargets,
  type CollaborationSalesAvenues,
} from '../utils/salesAvenue';

/**
 * The date range picker stores the inclusive end as local calendar midnight.
 * For apply-to-license, send the end of that calendar date on the UTC clock: 23:59:59.999Z
 * for the picker's local year/month/day (11:59 PM UTC through the last instant before next UTC midnight).
 */
export function toEndOfSelectedCalendarDayUtc(endDate: Date): Date {
  return new Date(
    Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999),
  );
}

export const getLicenseKey = (licenseId: string) => [
  'contentLicensingApiClient/getLicense',
  licenseId,
];

export interface ApplyToPublicLicenseParams {
  universeId: number;
  pitch: string;
  dateRange: { startDate: Date | null; endDate: Date | null } | undefined;
  collaborationSalesAvenues?: CollaborationSalesAvenues;
}

const useApplyToPublicLicenseMutation = (
  licenseId: string,
  enableMonetization: boolean,
  enableCollaborationLicensing: boolean,
  licenseType?: LicenseType,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      universeId,
      pitch,
      dateRange,
      collaborationSalesAvenues,
    }: ApplyToPublicLicenseParams) => {
      const startDate = dateRange?.startDate ?? null;
      const endDate = dateRange?.endDate ? toEndOfSelectedCalendarDayUtc(dateRange.endDate) : null;
      const revenueTargets = buildApplyToLicenseRevenueTargets({
        enableCollaborationLicensing,
        licenseType,
        universeId,
        collaborationSalesAvenues,
      });

      return contentLicensingClient.applyToLicense(
        licenseId,
        universeId,
        enableMonetization,
        pitch,
        startDate,
        endDate,
        revenueTargets,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getLicenseKey(licenseId) });
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
