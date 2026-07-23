const rootIpListingsKey = 'am_ipListings';
export const IP_LISTINGS_QUERY_KEY = [rootIpListingsKey];
export const GET_IP_LISTING_QUERY_KEY = (id: string) => [rootIpListingsKey, id];

const rootLicenses = 'am_licenses';
export const LICENSES_QUERY_KEY = [rootLicenses];
export const GET_LICENSES_QUERY_KEY = (ipListingId: string) => [rootLicenses, ipListingId];
export const GET_LICENSE_QUERY_KEY = (licenseId: string) => [rootLicenses, 'license', licenseId];
export const GET_LICENSE_BY_IP_FAMILY_ID_QUERY_KEY = (ipFamilyId: string) => [
  rootLicenses,
  'ipFamilyId',
  ipFamilyId,
];

const rootMatchesKey = 'am_matches';
export const MATCHES_QUERY_KEY = [rootMatchesKey];
export const GET_PLACEFILE_IMAGES_QUERY_KEY = (
  accountId?: string,
  agreementCandidateId?: string,
) => [rootMatchesKey, 'placefileImages', accountId, agreementCandidateId];
export const GET_PLACEFILE_IMAGE_URLS_QUERY_KEY = (assetIds?: number[]) => [
  rootMatchesKey,
  'placefileImageUrls',
  assetIds,
];
export const GET_AGREEMENT_CANDIDATE_BY_ID_QUERY_KEY = (
  accountId?: string,
  agreementCandidateId?: string,
) => [rootMatchesKey, 'agreementCandidateById', accountId, agreementCandidateId];

const rootAgreementsKey = 'am_agreements';
export const AGREEMENTS_QUERY_KEY = [rootAgreementsKey] as const;
export const GET_IPH_AGREEMENTS_BY_STATUS_QUERY_KEY = (accountId?: string, status?: string[]) => [
  rootAgreementsKey,
  'iphAgreementsByStatus',
  accountId,
  status,
];
export const GET_CREATOR_AGREEMENTS_BY_STATUS_QUERY_KEY = (
  accountId?: string,
  status?: string[],
) => [rootAgreementsKey, 'creatorAgreementsByStatus', accountId, status];
export const GET_IPH_AGREEMENT_WITH_DETAILS_QUERY_KEY = (
  accountId?: string,
  agreementId?: string,
) => [rootAgreementsKey, 'agreementWithDetails', accountId, agreementId];
export const GET_AGREEMENT_STATUSES_BY_IDS_QUERY_KEY = (
  accountId?: string,
  agreementIds?: string,
) => [rootAgreementsKey, 'agreementStatusesByIds', accountId, agreementIds] as const;
export const GET_CREATOR_AGREEMENT_WITH_DETAILS_QUERY_KEY = (
  accountId?: string,
  agreementId?: string,
) => [rootAgreementsKey, 'creatorAgreementWithDetails', accountId, agreementId];
export const GET_AGREEMENTS_BY_LICENSE_QUERY_KEY = (accountId?: string, licenseId?: string) => [
  rootAgreementsKey,
  'agreementsByLicense',
  accountId,
  licenseId,
];

const rootExperienceGuidelinesKey = 'am_experienceGuidelines';
export const GET_EXPERIENCE_GUIDELINES_QUERY_KEY = (universeId: number) => [
  rootExperienceGuidelinesKey,
  universeId,
];
