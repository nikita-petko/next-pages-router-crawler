import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { MonitorType } from '../components/licenseFormTypes';
import type { MonitorType as MonitorTypeValue } from '../components/licenseFormTypes';

export interface RevShareOnActivationParams {
  durationType?: LicenseDurationType;
  licenseType?: LicenseType;
  enableCollaborationLicensing: boolean;
  enableMarketplaceSalesLicensing: boolean;
}

/** Collaboration, marketplace sale, and time-limited licenses require rev share on activation. */
export function shouldRevShareOnActivation({
  durationType,
  licenseType,
  enableCollaborationLicensing,
  enableMarketplaceSalesLicensing,
}: RevShareOnActivationParams): boolean {
  if (durationType === LicenseDurationType.TimeLimited) {
    return true;
  }
  if (enableCollaborationLicensing && licenseType === LicenseType.CollaborationInExperienceSale) {
    return true;
  }
  if (enableMarketplaceSalesLicensing && licenseType === LicenseType.MarketplaceSale) {
    return true;
  }
  return false;
}

export function resolveEnableMonetization(
  params: RevShareOnActivationParams & { monitorType: MonitorTypeValue | null },
): boolean {
  if (shouldRevShareOnActivation(params)) {
    return true;
  }
  return params.monitorType === MonitorType.MonitorAndRevshare;
}
