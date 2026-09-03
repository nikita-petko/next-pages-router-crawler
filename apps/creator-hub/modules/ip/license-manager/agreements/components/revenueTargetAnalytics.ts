import { useEffect } from 'react';
import { LicenseType, type AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';

export type AgreementRevenueTargetsAudience = 'creator' | 'iph';
export type AgreementRevenueTargetsFeature = 'avatarItemLicensing' | 'inGameSalesLicensing';
export type AgreementRevenueTargetType = 'avatarItem' | 'developerProduct' | 'gamePass';
export const REVENUE_TARGET_GRID_IMPRESSION_VISIBILITY_THRESHOLD = 0;

export interface AgreementRevenueTargetAnalyticsContext {
  audience: AgreementRevenueTargetsAudience;
  agreementStatus?: AgreementStatus;
}

export const getAgreementStatusAnalyticsValue = (
  agreementStatus?: AgreementStatus,
): AgreementStatus | 'missing' => agreementStatus ?? 'missing';

interface UseAgreementRevenueTargetsEligibilityImpressionParams {
  agreementId?: string;
  agreementStatus?: AgreementStatus;
  audience: AgreementRevenueTargetsAudience;
  avatarItemLicensingEnabled: boolean;
  avatarItemLicensingFlagReady: boolean;
  effectiveLicenseType: LicenseType;
  inGameSalesLicensingEnabled: boolean;
  inGameSalesLicensingFlagReady: boolean;
  isPageReady: boolean;
  licenseType?: LicenseType;
}

export const useAgreementRevenueTargetsEligibilityImpression = ({
  agreementId,
  agreementStatus,
  audience,
  avatarItemLicensingEnabled,
  avatarItemLicensingFlagReady,
  effectiveLicenseType,
  inGameSalesLicensingEnabled,
  inGameSalesLicensingFlagReady,
  isPageReady,
  licenseType,
}: UseAgreementRevenueTargetsEligibilityImpressionParams) => {
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const feature =
    licenseType === LicenseType.MarketplaceSale
      ? 'avatarItemLicensing'
      : licenseType === LicenseType.CollaborationInExperienceSale
        ? 'inGameSalesLicensing'
        : undefined;
  const isFeatureFlagReady =
    feature === 'avatarItemLicensing'
      ? avatarItemLicensingFlagReady
      : inGameSalesLicensingFlagReady;
  const isFeatureEnabled =
    feature === 'avatarItemLicensing' ? avatarItemLicensingEnabled : inGameSalesLicensingEnabled;

  useEffect(() => {
    if (!isPageReady || feature == null || !isFeatureFlagReady) {
      return;
    }

    logOnce(
      LicenseManagerImpressionEvent.AgreementDetailsRevenueTargetsEligibilityImpressionEvent,
      {
        agreementStatus: getAgreementStatusAnalyticsValue(agreementStatus),
        audience,
        avatarItemLicensingEnabled,
        effectiveLicenseType,
        feature,
        featureFlagEnabled: isFeatureEnabled,
        inGameSalesLicensingEnabled,
        licenseType: licenseType ?? 'missing',
      },
      `${agreementId ?? 'missing'}:${audience}:${feature}`,
    );
  }, [
    agreementId,
    agreementStatus,
    audience,
    avatarItemLicensingEnabled,
    effectiveLicenseType,
    feature,
    inGameSalesLicensingEnabled,
    isFeatureEnabled,
    isFeatureFlagReady,
    isPageReady,
    licenseType,
    logOnce,
  ]);
};
