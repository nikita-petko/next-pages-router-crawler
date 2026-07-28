import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import {
  DauBucket,
  LicenseType,
  UniverseContentMaturity,
} from '@rbx/client-content-licensing-api/v1';
import { convertNumDaysToDurationBucket } from '../../utils/timeLimitedLicense';
import type { LicenseFormData } from '../components/LicenseForm';
import type { MinimumDAUValue } from '../components/licenseFormTypes';
import { MinimumDAU, MonitorType } from '../components/licenseFormTypes';
import { shouldRevShareOnActivation } from './shouldRevShareOnActivation';

function resolveLicenseTypeForForm(
  licenseType: LicenseType | undefined,
  enableCollaborationLicensing: boolean,
  enableMarketplaceSalesLicensing: boolean,
): LicenseType | undefined {
  if (licenseType === LicenseType.CollaborationInExperienceSale) {
    return enableCollaborationLicensing ? licenseType : LicenseType.FullExperience;
  }
  if (licenseType === LicenseType.MarketplaceSale) {
    return enableMarketplaceSalesLicensing ? licenseType : LicenseType.FullExperience;
  }
  if (!enableCollaborationLicensing) {
    return LicenseType.FullExperience;
  }
  return licenseType ?? LicenseType.FullExperience;
}

function mapDau7DayThresholdToMinimumDAU(dau7DayThreshold: DauBucket | undefined): MinimumDAUValue {
  if (dau7DayThreshold === DauBucket.Small) {
    return MinimumDAU.Small;
  }
  if (dau7DayThreshold === DauBucket.Large) {
    return MinimumDAU.Large;
  }
  return MinimumDAU.NoRequirement;
}

/**
 * Maps a license API response to LicenseForm default values for create (copy-from) or edit.
 * Uses top-level fields only — never pendingEdits (draft under moderation).
 */
function mapLicenseResponseToFormDefaults(
  license: LicenseResponse,
  enableCollaborationLicensing: boolean,
  enableMarketplaceSalesLicensing: boolean,
): LicenseFormData {
  const durationType = license.licenseDuration?.durationType;
  const licenseType = resolveLicenseTypeForForm(
    license.licenseType,
    enableCollaborationLicensing,
    enableMarketplaceSalesLicensing,
  );

  return {
    name: license.name ?? '',
    description: license.description ?? '',
    revenueShare: license.royaltyRate ?? 0,
    maxMaturityRating:
      license.maxAgeRating === UniverseContentMaturity.None
        ? UniverseContentMaturity.Restricted
        : (license.maxAgeRating ?? UniverseContentMaturity.Restricted),
    minimumDAU: mapDau7DayThresholdToMinimumDAU(license.dau7DayThreshold),
    contentStandardsFile: undefined,
    contentStandardsDocumentId: license.contentStandardsDocumentId ?? undefined,
    visibility: license.visibility,
    monitorType: shouldRevShareOnActivation({
      durationType,
      licenseType,
      enableCollaborationLicensing,
      enableMarketplaceSalesLicensing,
    })
      ? MonitorType.MonitorAndRevshare
      : license.enableMonetization
        ? MonitorType.MonitorAndRevshare
        : MonitorType.MonitorOnly,
    contentStandardScope: license.contentStandardsScope ?? '',
    contentStandardAnswers: license.contentStandardAnswers ?? [],
    durationType,
    minDuration: convertNumDaysToDurationBucket(
      license.licenseDuration?.timeBounds?.minMax?.minDays,
    ),
    maxDuration: convertNumDaysToDurationBucket(
      license.licenseDuration?.timeBounds?.minMax?.maxDays,
    ),
    licenseType,
  };
}

export default mapLicenseResponseToFormDefaults;
