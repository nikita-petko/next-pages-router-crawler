export enum AdIntegrationFormField {
  AdsCategory = 'adsCategory',
  AdvertiserName = 'advertiserName',
  CampaignName = 'campaignName',
  EndDate = 'endDate',
  EndTime = 'endTime',
  Experience = 'experience',
  HasRewardedPlacements = 'hasRewardedPlacements',
  StartDate = 'startDate',
  StartTime = 'startTime',
  TermsAndAdsStandardsAcknowledgement = 'termsAndAdsStandardsAcknowledgement',
}

export const AD_POLICY_REVIEW_LABEL_PREFIX = 'AD_POLICY_REVIEW_LABEL_';
export const AdsCategoryOtherValue = 'OTHER';

export const MaxAdvertiserNameLength = 50;
export const MaxCampaignNameLength = 50;

// Revenue share costs take effect at the start of Q1 2027. The revenue share
// estimate numbers are only surfaced for campaigns starting on/after this date;
// campaigns starting earlier show the placeholder scaffold only.
export const RevenueShareEffectiveDateMs = new Date('2027-01-01T00:00:00Z').getTime();

const SUPPORTED_AD_INTEGRATION_ASSET_TYPES = ['Image', 'Video', 'Model'] as const;

export const isSupportedAdIntegrationAssetType = (type?: string): boolean =>
  type != null &&
  SUPPORTED_AD_INTEGRATION_ASSET_TYPES.some(
    (supportedType) => supportedType.toLowerCase() === type.trim().toLowerCase(),
  );
