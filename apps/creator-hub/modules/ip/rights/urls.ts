export const RIGHTS_MANAGEMENT_HREF = '/dashboard/rights-manager';
export const CLAIMS_HREF = '/dashboard/rights-manager/claims';
export const CREATE_CLAIMS_HREF = '/dashboard/rights-manager/claims/create';
export const REMOVAL_REQUESTS_HREF = '/dashboard/rights-manager/removal-requests';
export const CREATE_REMOVAL_REQUEST_HREF = '/dashboard/rights-manager/removal-requests/create';
export const REGISTRATION_HREF = '/dashboard/rights-manager/apply';
export const ACCOUNT_HREF = '/dashboard/rights-manager/account';
export const ACCOUNTS_HREF = '/dashboard/rights-manager/accounts';
export const MATCHES_HREF = '/dashboard/rights-manager/matches';

export const VIEW_CLAIM_ITEM_HREF = (claimID: string, claimItemID: string) =>
  `/dashboard/rights-manager/claims/${claimID}/items/${claimItemID}`;

export const CLAIMS_AGAINST_CONTENT_HREF = (contentType: string, contentId: string) =>
  `/dashboard/rights-manager/contents/${contentType}/${contentId}`;

export const REPORT_CODE_REMOVAL_REQUESTS_HREF =
  '/dashboard/rights-manager/removal-requests/report-code';
export const REPORT_CODE_CLAIMS_HREF = '/dashboard/rights-manager/claims/report-code';
