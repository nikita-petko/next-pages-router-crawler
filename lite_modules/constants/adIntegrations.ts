import { AdPolicyReviewLabelType } from '@rbx/ads-moderation-ui';

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

interface EnumAdsCategoryOption {
  enumValue: AdPolicyReviewLabelType;
  value: string;
}

interface CustomAdsCategoryOption {
  label: string;
  value: string;
}

export type AdsCategoryOption = EnumAdsCategoryOption | CustomAdsCategoryOption;

const EnumAdsCategoryOptions: EnumAdsCategoryOption[] = (
  [
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_FILM_TV_YOUNG_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_FILM_TV_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_FILM_TV_ADULT,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_GAMING_YOUNG_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_GAMING_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ENTERTAINMENT_MUSIC_AND_GAMING_GAMING_ADULT,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_ILLEGAL_AND_REGULATED_GOODS_OTC_PHARMACEUTICALS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FOOD_AND_BEVERAGE_HFSS_FOODS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FOOD_AND_BEVERAGE_FOOD_AND_BEVERAGES,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_TOYS_HOBBY_AND_LEARNING_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_TOYS_HOBBY_AND_LEARNING_ADULTS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FINANCIAL_SERVICES_TEENS,
    AdPolicyReviewLabelType.AD_POLICY_REVIEW_LABEL_FINANCIAL_SERVICES_ADULTS,
  ] as const
).map(
  (enumValue): EnumAdsCategoryOption => ({
    enumValue,
    value: AdPolicyReviewLabelType[enumValue].slice(AD_POLICY_REVIEW_LABEL_PREFIX.length),
  }),
);

export const AdsCategoryOptions: AdsCategoryOption[] = [
  ...EnumAdsCategoryOptions,
  {
    label: 'None of the Above',
    value: AdsCategoryOtherValue,
  },
];

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
