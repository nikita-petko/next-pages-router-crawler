import { appDataDefaults } from '@constants/appStore';
import { videoMinBidMappingsMicroUsdDefaults } from '@constants/asset';
import { DEFAULT_LIFETIME_BUDGET_DECREASE_BUFFER_RATIO } from '@constants/campaign';
import { MAX_ALLOWED_CREATIVES } from '@constants/campaignBuilder';
import { ServerRegionCode } from '@constants/locationAutocomplete';
import { GetAdsMetadataResponseType } from '@type/metadata';
import { UsdToMicroUsd } from '@utils/currency';

export const defaultCancelCampaignTimeBufferMs = 21600000;

const euRegionCodeList = [
  ServerRegionCode.VALUE_ALL,
  ServerRegionCode.VALUE_DE,
  ServerRegionCode.VALUE_FR,
  ServerRegionCode.VALUE_WESTERN_EUROPE,
  ServerRegionCode.VALUE_EASTERN_EUROPE,
];

export const appMetadataDefaults: GetAdsMetadataResponseType = {
  ...appDataDefaults,
  ...videoMinBidMappingsMicroUsdDefaults,
  adIntegrationCampaignMinimumStartTimestampMsUtc: 0,
  advertisingStandardsUrl:
    'https://en.help.roblox.com/hc/articles/13722260778260-Advertising-Standards',
  appealModerationDecisionUrl:
    'https://en.help.roblox.com/hc/articles/360000245263-Appeal-Your-Content-or-Account-Moderation',
  campaignMaximumDailyBudgetMicroUsd: UsdToMicroUsd(appDataDefaults.campaignMaximumDailyBudgetUsd),
  campaignMaximumDailyExpectedPlays: appDataDefaults.campaignMaximumDailyExpectedPlays,
  campaignMinimumDailyBudgetMicroUsd: UsdToMicroUsd(appDataDefaults.campaignMinimumDailyBudgetUsd),
  campaignMinimumDailyExpectedPlays: appDataDefaults.campaignMinimumDailyExpectedPlays,
  cancelCampaignTimeBufferMs: defaultCancelCampaignTimeBufferMs,
  canUserImpersonate: false,
  coreRegionFloorPriceMicroUsd: UsdToMicroUsd(appDataDefaults.coreRegionFloorPriceUsd),
  cpcMaximumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cpcCeilingPriceUsd),
  cpcMinimumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cpcFloorPriceUsd),
  cpmMaximumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cpmMaximumBidUsd),
  cpmMinimumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cpmMinimumBidUsd),
  cptMaximumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cptMaximumBidUsd),
  cptMinimumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.cptMinimumBidUsd),
  defaultBudgetRecommendationMicroUsd: 8000000,
  defaultDurationRecommendationDays: 7,
  EURegionCodeList: euRegionCodeList,
  isAdAccountAutoCreateEnabled: false,
  isAdIntegrationRevenueShareEstimateEnabled: false,
  isAdIntegrationsEnabled: false,
  isAge5To12TargetingEnabled: false,
  isAudienceEstimateEnabled: false,
  isAuthMigrationEnabled: false,
  isAutoReloadAdCreditCueingEnabled: false,
  isCampaignRoasEnabled: false,
  isClassicFlowEnabled: false,
  isCreativeLibraryEnabled: false,
  isCustomDateRangeEnabled: false,
  isDecreaseBudgetEnabled: false,
  isDeleteEnabled: false,
  isEligibilityEndpointEnabled: false,
  isForecastEstimatorEnabled: false,
  isFullDaysEnabled: false,
  isGaasEnabled: false,
  isGenAiCreativesEnabled: false,
  isGenAiCreativesUserReferenceEnabled: false,
  isMaxReachEnabled: false,
  isOneByTwoTileCreationEnabled: false,
  isPaymentsPagesForLOCEnabled: false,
  isSpendObjectiveEnabled: false,
  isUniverseOwnershipBypassEnabled: false,
  isWatermarkedRobuxConversionEnabled: false,
  lifetimeBudgetDecreaseBufferRatio: DEFAULT_LIFETIME_BUDGET_DECREASE_BUFFER_RATIO,
  livePreviewCpmPlaceUrl:
    'https://www.roblox.com/games/start?placeId=16970181235&launchData=%7B%22room%22%3A%22VideoAds%22%7D',
  livePreviewCpv15PlaceUrl:
    'https://www.roblox.com/games/start?placeId=16970181235&launchData=%7B%22room%22%3A%22RewardVideoAds%22%7D',
  livePreviewImagePlaceUrl:
    'https://www.roblox.com/games/start?placeId=16970181235&launchData=%7B%22room%22%3A%22PortalAds%22%7D',
  livePreviewPortalPlaceUrl:
    'https://www.roblox.com/games/start?placeId=16970181235&launchData=%7B%22room%22%3A%22BillboardAds%22%7D',
  maxFrequencyCapDurationInDays: 30,
  maxFrequencyCapValue: 100,
  maxGenAiCreativesUserPromptLength: 100,
  maxHeadlineLengthInChars: 22,
  maximumAdsPerTrafficDrivingCampaignCount: MAX_ALLOWED_CREATIVES,
  maxSubtitleLengthInChars: 32,
  mixedRegionFloorPriceMicroUsd: UsdToMicroUsd(appDataDefaults.mixedRegionFloorPriceUsd),
  offPlatformRequestMaximumRawVideos: 5,
  offPlatformRequestMinimumDailyBudgetMicroUsd: 358000000, // $358 × 28 days = $10,024 (above $10,000 lifetime minimum)
  offPlatformRequestMinimumDaysFromStartDate: 14,
  offPlatformRequestMinimumDurationDays: 28,
  offPlatformRequestMinimumLifetimeBudgetMicroUsd: 10000000000,
  opportunisticRegionFloorPriceMicroUsd: UsdToMicroUsd(
    appDataDefaults.opportunisticRegionFloorPriceUsd,
  ),
  portalAdsMaximumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.portalAdsMaximumBidValueUsd),
  reactivationObjectiveMinimumAudienceSize: 0,
  reactivationObjectiveWarningAudienceSize: 10000,
  retargetingObjectiveMinimumAudienceSize: 0,
  retargetingObjectiveWarningAudienceSize: 10000,
  retentionObjectiveMinimumAudienceSize: 0,
  retentionObjectiveWarningAudienceSize: 10000,
  statusBannerMessage: '',
  statusBannerMessageLevel: '',
  strategicRegionFloorPriceMicroUsd: UsdToMicroUsd(appDataDefaults.strategicRegionFloorPriceUsd),
  tileAdsMaximumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.tileAdsMaximumBidValueUsd),
  tileAdsMinimumBidValueMicroUsd: UsdToMicroUsd(appDataDefaults.tileAdsMinimumBidValueUsd),
};
