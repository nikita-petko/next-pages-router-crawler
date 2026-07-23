import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';

export const getIsNonZeroRevShareFromLicense = (license?: LicenseResponse) => {
  if (!license) {
    return false;
  }
  return license.royaltyRate ? license.royaltyRate > 0 : false;
};

export const getIsNonZeroRevShareFromValue = (value?: number) => {
  return value ? value > 0 : false;
};
