import ErrorCodes from '@constants/errorCodes';
import { AdvertiserType } from '@type/advertiser';
import { EmptyRequestStateWithErrorType } from '@utils/zustandUtils';

const isPermissionsDenial = (
  advertiserState: EmptyRequestStateWithErrorType<AdvertiserType>,
): boolean =>
  advertiserState.errorCode === ErrorCodes.FORBIDDEN_ACTION || advertiserState.errorStatus === 403;

/**
 * True when a group workspace is selected but the group has no ad account yet.
 * Permissions denials are excluded — those are real errors, not setup-needed states.
 */
export const isGroupAdAccountMissing = (
  advertiserState: EmptyRequestStateWithErrorType<AdvertiserType> | undefined,
): boolean => {
  if (!advertiserState || advertiserState.isLoading) {
    return false;
  }

  if (isPermissionsDenial(advertiserState)) {
    return false;
  }

  if (advertiserState.data?.ad_account?.id) {
    return false;
  }

  const errorCode = advertiserState.errorCode ?? advertiserState.data?.error?.code;
  if (
    errorCode === ErrorCodes.AD_ACCOUNT_NOT_FOUND ||
    errorCode === ErrorCodes.ORGANIZATION_NOT_FOUND
  ) {
    return true;
  }

  if (advertiserState.isError) {
    return false;
  }

  return !advertiserState.data?.ad_account?.id;
};

export const isMissingGroupAdAccountHistoryError = (error: unknown): boolean => {
  const code = (error as { response?: { data?: { error?: { code?: string } } } })?.response?.data
    ?.error?.code;
  return code === ErrorCodes.AD_ACCOUNT_NOT_FOUND || code === ErrorCodes.ORGANIZATION_NOT_FOUND;
};
