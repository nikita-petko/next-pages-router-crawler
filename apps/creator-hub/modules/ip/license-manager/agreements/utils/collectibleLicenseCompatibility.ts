import { ResellingPermission, type LicenseResponse } from '@rbx/client-content-licensing-api/v1';

export const isLicenseCompatibleWithCollectible = (
  license: LicenseResponse,
  isLimited: boolean,
  isResellAllowed: boolean,
): boolean => {
  switch (license.licenseTerms?.reselling) {
    case ResellingPermission.Allowed:
      return true;
    case ResellingPermission.Disallowed:
      return !(isLimited && isResellAllowed);
    case ResellingPermission.NotApplicable:
    case ResellingPermission.Invalid:
    case undefined:
      return false;
  }

  return false;
};
