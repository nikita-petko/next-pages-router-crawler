import { getProductionCreatorHubUrl, resolveUrl } from '@rbx/env-utils';
import type MatchDetailsTabs from './agreements/enums/MatchDetailsTabs';

export const LICENSE_MANAGER_BASE_HREF = '/dashboard/license-manager';

export const IP_LISTINGS_HREF = '/dashboard/license-manager/licenses?tab=licenses';
export const IP_LISTING_CREATE_HREF = '/dashboard/license-manager/license-listings/create';
export const IP_LISTING_DETAILS_HREF = (id: string) =>
  `/dashboard/license-manager/license-listings/${id}`;
export const IP_LISTING_EDIT_HREF = (id: string) =>
  `/dashboard/license-manager/license-listings/${id}/edit`;

/** Create-license URL for a listing with no `copyFrom` query (same as `LICENSE_CREATE_HREF(listingId)`). */
export const LICENSE_CREATE_PATH_NO_QUERY = (listingId: string): string =>
  `/dashboard/license-manager/license-listings/${listingId}/license/create`;

export const LICENSE_CREATE_HREF = (listingId: string, copyFromLicenseId?: string) => {
  const base = LICENSE_CREATE_PATH_NO_QUERY(listingId);
  if (!copyFromLicenseId) {
    return base;
  }
  const params = new URLSearchParams({ copyFrom: copyFromLicenseId });
  return `${base}?${params.toString()}`;
};
export const LICENSE_EDIT_HREF = (id: string) => `/dashboard/license-manager/license/${id}/edit`;

export const AGREEMENTS_HREF = '/dashboard/license-manager/licenses';

export const IPH_AGREEMENT_DETAILS_HREF = (id: string) =>
  `/dashboard/license-manager/agreements/${id}`;

export const IPH_AGREEMENT_CANDIDATE_DETAILS_HREF = (id: string) =>
  `/dashboard/license-manager/matches/${id}`;

export const CREATOR_AGREEMENTS_HREF = '/dashboard/license-manager/creator-agreements';
export const CREATOR_AGREEMENTS_TAB_HREF = (id: string) =>
  `/dashboard/license-manager/creator-agreements/?tab=${id}`;
export const CREATOR_AGREEMENT_DETAILS_HREF = (id: string) =>
  `/dashboard/license-manager/creator-agreements/${id}`;

export const EXTERNAL_EXPERIENCE_HREF = (id: string | number) =>
  `https://www.${process.env.robloxSiteDomain}/games/${id}`;
export const EXTERNAL_PROFILE_HREF = (id: string | number) =>
  `https://www.${process.env.robloxSiteDomain}/users/${id}`;
export const EXTERNAL_MY_TRANSACTIONS_HREF = () =>
  `https://www.${process.env.robloxSiteDomain}/transactions`;

export const ROBLOX_CREATOR_DOCS_IP_GUIDELINES_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators`;
export const ROBLOX_CREATOR_DOCS_REVIEW_LICENSE_OFFER_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/creators#review-a-license-offer`;
export const ROBLOX_CREATOR_DOCS_MANUAL_REQUESTS_HREF = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing/license-manager#review-matches-and-send-a-license-offer`;

export const EXPLORE_LICENSES_HREF = '/explore/licenses';

export const FAIR_USE_HREF = resolveUrl(
  'copyrightFairUseUrl',
  process.env.targetEnvironment,
  process.env.buildTarget,
);
export const CONTENT_MATURITY_LABELS_HREF = 'https://help.roblox.com/hc/articles/8862768451604';
export const COMMUNITY_STANDARDS_HREF = 'https://help.roblox.com/hc/articles/203313410';

export const IP_MATCHES_HREF = '/dashboard/license-manager/matches';

// TODO: Add Experience Preview Details and Gallery views. Tickets: EXP-38, EXP-39. Owner: vkakar
export const IPH_MATCH_DETAILS_TAB_HREF = (agreementCandidateId: string, tab: MatchDetailsTabs) =>
  `${IPH_AGREEMENT_CANDIDATE_DETAILS_HREF(agreementCandidateId)}?tab=${tab}`;
