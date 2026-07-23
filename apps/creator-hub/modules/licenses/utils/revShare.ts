import { LicenseResponse } from '@rbx/clients/contentLicensingApi/v1';

export const getIsNonZeroRevShareFromLicense = (license?: LicenseResponse) => {
  if (!license) return false;
  return license.royaltyRate ? license.royaltyRate > 0 : false;
};

export const getIsNonZeroRevShareFromValue = (value?: number) => {
  return value ? value > 0 : false;
};
