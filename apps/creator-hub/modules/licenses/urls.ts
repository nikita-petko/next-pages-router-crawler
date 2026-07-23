import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import getContentStandardsBucketDomain from './utils/getContentStandardsBucketDomain';

export const AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF =
  '/dashboard/license-manager/creator-agreements?tab=requests';
export const EXPLORE_LICENSES_HREF = '/explore/licenses';

export const EXPLORE_LISTING_DETAILS = (listingId: string) => `/explore/licenses/${listingId}`;

/** Query key on the license request URL; values are {@link LicenseRequestCancelReturnTo}. */
export const LICENSE_REQUEST_RETURN_TO_QUERY = 'returnTo';

/** Where to send the user if they cancel out of the license request flow. */
export const LicenseRequestCancelReturnTo = {
  /** Listing details page (`/explore/licenses/:listingId`). Default when the query param is omitted. */
  ListingDetails: 'listing',
  /** Public licenses catalog (`/explore/licenses`). */
  LicensesCatalog: 'catalog',
} as const;

export type LicenseRequestCancelReturnToValue =
  (typeof LicenseRequestCancelReturnTo)[keyof typeof LicenseRequestCancelReturnTo];

export const LICENSE_APPLY_HREF = (
  listingId: string,
  licenseId: string,
  cancelReturnTo?: LicenseRequestCancelReturnToValue,
): string => {
  const path = `/explore/licenses/${listingId}/${licenseId}/request`;
  if (cancelReturnTo === LicenseRequestCancelReturnTo.LicensesCatalog) {
    return `${path}?${LICENSE_REQUEST_RETURN_TO_QUERY}=${LicenseRequestCancelReturnTo.LicensesCatalog}`;
  }
  return path;
};

export const CONTENT_STANDARDS_HREF = (documentId: string) =>
  `${getContentStandardsBucketDomain()}/${documentId}`;

export const ROBLOX_EXPLORE_LICENSES_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing`;
export const CREATOR_PITCH_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators#pitch-details`;
