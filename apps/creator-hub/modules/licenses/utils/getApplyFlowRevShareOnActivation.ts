import type { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { shouldRevShareOnActivation } from '@modules/ip/license-manager/ipListings/utils/shouldRevShareOnActivation';

interface GetApplyFlowRevShareOnActivationParams {
  durationType?: LicenseDurationType;
  licenseType?: LicenseType;
  enableCollaborationLicensing: boolean;
  enableMarketplaceSalesLicensing: boolean;
}

/** Apply-flow rev-share-on-activation check, aligned with license form `shouldRevShareOnActivation`. */
export function getApplyFlowRevShareOnActivation({
  durationType,
  licenseType,
  enableCollaborationLicensing,
  enableMarketplaceSalesLicensing,
}: GetApplyFlowRevShareOnActivationParams): boolean {
  return shouldRevShareOnActivation({
    durationType,
    licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  });
}
