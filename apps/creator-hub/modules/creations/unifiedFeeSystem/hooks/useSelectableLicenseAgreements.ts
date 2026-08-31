import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  CreatorType,
  HydratedListAgreementResponse,
} from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus, LicenseType } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient from '@modules/clients/contentLicensing';

export const listAgreementsByCreatorKey = 'contentLicensingApiClient/listAgreementsByCreator';

// The creator-facing endpoint only supports a single status filter, so eligibility is
// resolved on the client: an agreement is selectable only if it is a marketplace-sale
// license the creator can currently publish under (Active, or Accepted — which schedules
// the item on sale at agreement activation time). "Quota remaining" is intentionally not
// applied: Content Licensing exposes no quota concept yet (tracked as a CL follow-up).
const ELIGIBLE_STATUSES: ReadonlySet<AgreementStatus> = new Set([
  AgreementStatus.Active,
  AgreementStatus.Accepted,
]);

// Marketplace-sale agreements per creator are few; a single generous page covers them.
// If a creator ever exceeds this, pagination would need to be added (CL follow-up).
const PAGE_SIZE = 100;

export function isSelectableAgreement(agreement: HydratedListAgreementResponse): boolean {
  return (
    agreement.id != null &&
    agreement.id !== '' &&
    agreement.status != null &&
    ELIGIBLE_STATUSES.has(agreement.status) &&
    agreement.license?.licenseType === LicenseType.MarketplaceSale
  );
}

export interface UseSelectableLicenseAgreementsParams {
  creatorType: CreatorType;
  creatorId: string;
  enabled: boolean;
}

/**
 * Fetches the creator's IP licensing agreements and narrows them to the ones eligible to
 * attach to a marketplace item, for the license picker on the Configure page.
 */
export function useSelectableLicenseAgreements({
  creatorType,
  creatorId,
  enabled,
}: UseSelectableLicenseAgreementsParams) {
  const query = useQuery({
    queryKey: [listAgreementsByCreatorKey, creatorType, creatorId],
    enabled: enabled && creatorId !== '',
    queryFn: () =>
      contentLicensingClient.listAgreementsByCreator(creatorType, creatorId, PAGE_SIZE),
  });

  const agreements: HydratedListAgreementResponse[] = useMemo(
    () => (query.data?.agreements ?? []).filter(isSelectableAgreement),
    [query.data],
  );

  // Return only the fields the picker needs rather than spreading the query result, which
  // would subscribe consumers to every query state change (oxlint no-rest-destructuring).
  return {
    agreements,
    isPending: query.isPending,
  };
}

export type UseSelectableLicenseAgreementsResult = ReturnType<
  typeof useSelectableLicenseAgreements
>;

export default useSelectableLicenseAgreements;
