import { appDataDefaults } from '@constants/appStore';
import { videoMinBidMappingsMicroUsdDefaults } from '@constants/asset';
import { appMetadataDefaults } from '@constants/metadata';
import { AppDataBase } from '@type/appStore';
import { GetAdsMetadataResponseType } from '@type/metadata';

const microUsdMultiplier = 1 * 1000 * 1000;

const getValueWithDefaultFallthrough = <TValue>(value: TValue, fallback: TValue): TValue =>
  value || fallback;

type AppDataDefaultKey = keyof typeof appDataDefaults & keyof AppDataBase;

const appMetadataAppDataDefaults = appMetadataDefaults as Partial<AppDataBase>;

const getAppDataDefault = <TKey extends AppDataDefaultKey>(key: TKey): AppDataBase[TKey] =>
  getValueWithDefaultFallthrough(
    appDataDefaults[key] as AppDataBase[TKey],
    appMetadataAppDataDefaults[key] as AppDataBase[TKey],
  );

export const applyMetadataToAppData = (
  currentAppData: AppDataBase,
  resolvedMetadata: GetAdsMetadataResponseType,
): AppDataBase => {
  const metadataFields: Pick<
    AppDataBase,
    | 'adCreditFromRobuxPurchaseRate'
    | 'adCreditMaximumPurchaseAmount'
    | 'adCreditMinimumPurchaseAmount'
    | 'campaignMaximumDailyExpectedPlays'
    | 'coreCountryOverrideCodeList'
    | 'coreRegionCodeList'
    | 'maximumAdsPerTrafficDrivingCampaignCount'
    | 'opportunisticRegionCodeList'
    | 'showAudienceEstimate'
    | 'showDelete'
    | 'statusBannerMessage'
    | 'strategicRegionCodeList'
  > = {
    adCreditFromRobuxPurchaseRate: getValueWithDefaultFallthrough(
      resolvedMetadata.adCreditFromRobuxPurchaseRate,
      getAppDataDefault('adCreditFromRobuxPurchaseRate'),
    ),
    adCreditMaximumPurchaseAmount: getValueWithDefaultFallthrough(
      resolvedMetadata.adCreditMaximumPurchaseAmount,
      getAppDataDefault('adCreditMaximumPurchaseAmount'),
    ),
    adCreditMinimumPurchaseAmount: getValueWithDefaultFallthrough(
      resolvedMetadata.adCreditMinimumPurchaseAmount,
      getAppDataDefault('adCreditMinimumPurchaseAmount'),
    ),
    campaignMaximumDailyExpectedPlays: getValueWithDefaultFallthrough(
      resolvedMetadata.campaignMaximumDailyExpectedPlays,
      getAppDataDefault('campaignMaximumDailyExpectedPlays'),
    ),
    coreCountryOverrideCodeList: getValueWithDefaultFallthrough(
      resolvedMetadata.coreCountryOverrideCodeList,
      getAppDataDefault('coreCountryOverrideCodeList'),
    ),
    coreRegionCodeList: getValueWithDefaultFallthrough(
      resolvedMetadata.coreRegionCodeList,
      getAppDataDefault('coreRegionCodeList'),
    ),
    maximumAdsPerTrafficDrivingCampaignCount: getValueWithDefaultFallthrough(
      resolvedMetadata.maximumAdsPerTrafficDrivingCampaignCount,
      getAppDataDefault('maximumAdsPerTrafficDrivingCampaignCount'),
    ),
    opportunisticRegionCodeList: getValueWithDefaultFallthrough(
      resolvedMetadata.opportunisticRegionCodeList,
      getAppDataDefault('opportunisticRegionCodeList'),
    ),
    showAudienceEstimate: resolvedMetadata.isAudienceEstimateEnabled,
    showDelete: resolvedMetadata.isDeleteEnabled,
    statusBannerMessage: resolvedMetadata.statusBannerMessage || '',
    strategicRegionCodeList: getValueWithDefaultFallthrough(
      resolvedMetadata.strategicRegionCodeList,
      getAppDataDefault('strategicRegionCodeList'),
    ),
  };

  const usdMetadataFields: Pick<
    AppDataBase,
    | 'campaignMaximumDailyBudgetUsd'
    | 'campaignMinimumDailyBudgetUsd'
    | 'coreRegionFloorPriceUsd'
    | 'cpcCeilingPriceUsd'
    | 'cpcFloorPriceUsd'
    | 'cpmMaximumBidUsd'
    | 'cpmMinimumBidUsd'
    | 'cptMaximumBidUsd'
    | 'cptMinimumBidUsd'
    | 'mixedRegionFloorPriceUsd'
    | 'opportunisticRegionFloorPriceUsd'
    | 'portalAdsMaximumBidValueUsd'
    | 'strategicRegionFloorPriceUsd'
    | 'tileAdsMaximumBidValueUsd'
    | 'tileAdsMinimumBidValueUsd'
  > = {
    campaignMaximumDailyBudgetUsd: getValueWithDefaultFallthrough(
      (resolvedMetadata.campaignMaximumDailyBudgetMicroUsd ??
        appMetadataDefaults.campaignMaximumDailyBudgetMicroUsd) / microUsdMultiplier,
      getAppDataDefault('campaignMaximumDailyBudgetUsd'),
    ),
    campaignMinimumDailyBudgetUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.campaignMinimumDailyBudgetMicroUsd / microUsdMultiplier,
      getAppDataDefault('campaignMinimumDailyBudgetUsd'),
    ),
    coreRegionFloorPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.coreRegionFloorPriceMicroUsd / microUsdMultiplier,
      getAppDataDefault('coreRegionFloorPriceUsd'),
    ),
    cpcCeilingPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cpcMaximumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cpcCeilingPriceUsd'),
    ),
    cpcFloorPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cpcMinimumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cpcFloorPriceUsd'),
    ),
    cpmMaximumBidUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cpmMaximumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cpmMaximumBidUsd'),
    ),
    cpmMinimumBidUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cpmMinimumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cpmMinimumBidUsd'),
    ),
    cptMaximumBidUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cptMaximumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cptMaximumBidUsd'),
    ),
    cptMinimumBidUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.cptMinimumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('cptMinimumBidUsd'),
    ),
    mixedRegionFloorPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.mixedRegionFloorPriceMicroUsd / microUsdMultiplier,
      getAppDataDefault('mixedRegionFloorPriceUsd'),
    ),
    opportunisticRegionFloorPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.opportunisticRegionFloorPriceMicroUsd / microUsdMultiplier,
      getAppDataDefault('opportunisticRegionFloorPriceUsd'),
    ),
    portalAdsMaximumBidValueUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.portalAdsMaximumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('portalAdsMaximumBidValueUsd'),
    ),
    strategicRegionFloorPriceUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.strategicRegionFloorPriceMicroUsd / microUsdMultiplier,
      getAppDataDefault('strategicRegionFloorPriceUsd'),
    ),
    tileAdsMaximumBidValueUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.tileAdsMaximumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('tileAdsMaximumBidValueUsd'),
    ),
    tileAdsMinimumBidValueUsd: getValueWithDefaultFallthrough(
      resolvedMetadata.tileAdsMinimumBidValueMicroUsd / microUsdMultiplier,
      getAppDataDefault('tileAdsMinimumBidValueUsd'),
    ),
  };

  return {
    ...currentAppData,
    ...metadataFields,
    ...usdMetadataFields,
    videoMinBidMappingsMicroUsd: {
      coreRegionVideoCpmFloorPriceMicroUsd:
        resolvedMetadata.coreRegionVideoCpmFloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.coreRegionVideoCpmFloorPriceMicroUsd,
      coreRegionVideoCpv15FloorPriceMicroUsd:
        resolvedMetadata.coreRegionVideoCpv15FloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.coreRegionVideoCpv15FloorPriceMicroUsd,
      mixedRegionVideoCpmFloorPriceMicroUsd:
        resolvedMetadata.mixedRegionVideoCpmFloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.mixedRegionVideoCpmFloorPriceMicroUsd,
      mixedRegionVideoCpv15FloorPriceMicroUsd:
        resolvedMetadata.mixedRegionVideoCpv15FloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.mixedRegionVideoCpv15FloorPriceMicroUsd,
      opportunisticRegionVideoCpmFloorPriceMicroUsd:
        resolvedMetadata.opportunisticRegionVideoCpmFloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.opportunisticRegionVideoCpmFloorPriceMicroUsd,
      opportunisticRegionVideoCpv15FloorPriceMicroUsd:
        resolvedMetadata.opportunisticRegionVideoCpv15FloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.opportunisticRegionVideoCpv15FloorPriceMicroUsd,
      strategicRegionVideoCpmFloorPriceMicroUsd:
        resolvedMetadata.strategicRegionVideoCpmFloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.strategicRegionVideoCpmFloorPriceMicroUsd,
      strategicRegionVideoCpv15FloorPriceMicroUsd:
        resolvedMetadata.strategicRegionVideoCpv15FloorPriceMicroUsd ||
        videoMinBidMappingsMicroUsdDefaults.strategicRegionVideoCpv15FloorPriceMicroUsd,
    },
  };
};
