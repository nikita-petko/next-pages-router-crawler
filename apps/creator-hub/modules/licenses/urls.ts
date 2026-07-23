import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import getContentStandardsBucketDomain from './utils/getContentStandardsBucketDomain';

export const AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF =
  '/dashboard/license-manager/creator-agreements?tab=requests';
export const EXPLORE_LICENSES_HREF = '/explore/licenses';

export const EXPLORE_LISTING_DETAILS = (listingId: string) => `/explore/licenses/${listingId}`;
export const LICENSE_APPLY_HREF = (listingId: string, licenseId: string) =>
  `/explore/licenses/${listingId}/${licenseId}/request`;

export const CONTENT_STANDARDS_HREF = (documentId: string) =>
  `${getContentStandardsBucketDomain()}/${documentId}`;

export const ROBLOX_EXPLORE_LICENSES_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing`;
export const CREATOR_PITCH_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators#pitch-details`;
