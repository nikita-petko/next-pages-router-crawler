import {
  analyticsPerformanceNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
  logAnalyticsError,
  DateRangeType,
} from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RecommendationType } from '@modules/clients/analytics';
import { RAQIV2MemoryGroup, RAQIV2OperatingSystem } from '@rbx/creator-hub-analytics-config';
import { FeatureAttributes } from '@rbx/client-universe-analytics-insights/v1';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';

const trackOnboardFunnel = translationKey(
  'Description.Recommendation.TrackOnboardFunnel',
  TranslationNamespace.Insights,
);
const learnNewUserExperience = translationKey(
  'Description.Recommendation.LearnNewUserExperience',
  TranslationNamespace.Insights,
);
const learnEngagement = translationKey(
  'Description.Recommendation.LearnEngagement',
  TranslationNamespace.Insights,
);
const trackProgressionFunnel = translationKey(
  'Description.Recommendation.TrackProgressionFunnel',
  TranslationNamespace.Insights,
);
const learnClearGoals = translationKey(
  'Description.Recommendation.LearnClearGoals',
  TranslationNamespace.Insights,
);
const monitorDevProductsAndEconomy = translationKey(
  'Description.Recommendation.MonitorDevProductsAndEconomy',
  TranslationNamespace.Insights,
);
const learnFirstTimePurchases = translationKey(
  'Description.Recommendation.LearnFirstTimePurchases',
  TranslationNamespace.Insights,
);
const updateThumbnails = translationKey(
  'Description.Recommendation.UpdateThumbnails',
  TranslationNamespace.Insights,
);
const learnDiscovery = translationKey(
  'Description.Recommendation.LearnDiscovery',
  TranslationNamespace.Insights,
);
const learnRepeatPurchases = translationKey(
  'Description.Recommendation.LearnRepeatPurchases',
  TranslationNamespace.Insights,
);
const learnLongTermCreatorContent = translationKey(
  'Description.Recommendation.LearnLongTermCreatorContent',
  TranslationNamespace.Insights,
);
const monitorOnboardFunnel = translationKey(
  'Description.Recommendation.MonitorOnboardFunnel',
  TranslationNamespace.Insights,
);
const monitorProgressionFunnel = translationKey(
  'Description.Recommendation.MonitorProgressionFunnel',
  TranslationNamespace.Insights,
);

// new
const lookForMetricDrop = translationKey(
  'Description.Recommendation.LookForMetricDrop',
  TranslationNamespace.Insights,
);
const LookForRFYMetricDrop = translationKey(
  'Description.Recommendation.LookForRFYMetricDrop',
  TranslationNamespace.Insights,
);
const optimizeDevProductPassAndEconomy = translationKey(
  'Description.Recommendation.OptimizeDevProductPassAndEconomy',
  TranslationNamespace.Insights,
);
const learnImproveD1Retention = translationKey(
  'Description.Recommendation.LearnImproveD1Retention',
  TranslationNamespace.Insights,
);
const learnImproveSessionTime = translationKey(
  'Description.Recommendation.LearnImproveSessionTime',
  TranslationNamespace.Insights,
);
const learnImproveAvgPlayTime = translationKey(
  'Description.Recommendation.LearnImproveAvgPlayTime',
  TranslationNamespace.Insights,
);
const learnImproveD7Retention = translationKey(
  'Description.Recommendation.LearnImproveD7Retention',
  TranslationNamespace.Insights,
);
const lookForItemSalesDrop = translationKey(
  'Description.Recommendation.LookForItemSalesDrop',
  TranslationNamespace.Insights,
);
const idenfityChangesEconomy = translationKey(
  'Description.Recommendation.IdentifyChangesEconomy',
  TranslationNamespace.Insights,
);
const viewAcquistionAndLearnDiscovery = translationKey(
  'Description.Recommendation.ViewAcquistionAndLearnDiscovery',
  TranslationNamespace.Insights,
);
const viewRFYSignalsAndLearnDiscovery = translationKey(
  'Description.Recommendation.viewAcquisitionAndInvestigateRFYSignal',
  TranslationNamespace.Insights,
);
const lookForMetricGain = translationKey(
  'Description.Recommendation.LookForMetricGain',
  TranslationNamespace.Insights,
);
const lookForMetricRFYGain = translationKey(
  'Description.Recommendation.lookForMetricRFYGain',
  TranslationNamespace.Insights,
);
const checkRecentThumbnailUpdates = translationKey(
  'Description.Recommendation.CheckRecentThumbnailUpdates',
  TranslationNamespace.Insights,
);
const recommendationDropLeadQPTRDrop = translationKey(
  'Description.Recommendation.RecommendationDropLeadQPTRDrop',
  TranslationNamespace.Insights,
);
const viewAcquistion = translationKey(
  'Description.Recommendation.ViewAcquistion',
  TranslationNamespace.Insights,
);
const adsPerformanceSuggestion1 = translationKey(
  'Description.Recommendation.AdsPerformanceSuggestion1',
  TranslationNamespace.Insights,
);
const adsPerformanceSuggestion2 = translationKey(
  'Description.Recommendation.AdsPerformanceSuggestion2',
  TranslationNamespace.Insights,
);
const greatWork = translationKey(
  'Description.Recommendation.GreatWork',
  TranslationNamespace.Insights,
);
const greatJob = translationKey(
  'Description.Recommendation.GreatJob',
  TranslationNamespace.Insights,
);
const keepGoing = translationKey(
  'Description.Recommendation.KeepGoing',
  TranslationNamespace.Insights,
);
const lookForItemSalesGain = translationKey(
  'Description.Recommendation.LookForItemSalesGain',
  TranslationNamespace.Insights,
);
const checkEconomyImproved = translationKey(
  'Description.Recommendation.CheckEconomyImproved',
  TranslationNamespace.Insights,
);
const checkThumbnailHelped = translationKey(
  'Description.Recommendation.CheckThumbnailHelped',
  TranslationNamespace.Insights,
);
const testNewThumbnail = translationKey(
  'Description.Recommendation.TestNewThumbnail',
  TranslationNamespace.Insights,
);
const greatJobD30 = translationKey(
  'Description.Recommendation.GreatJobD30',
  TranslationNamespace.Insights,
);
const exploreLowEndAndroid = translationKey(
  'Description.Recommendation.ExploreLowEndAndroid',
  TranslationNamespace.Insights,
);
const lowEndAndroidCcuRatio = translationKey(
  'Description.Recommendation.LowEndAndroidCcuRatio',
  TranslationNamespace.Insights,
);
const enableStreaming = translationKey(
  'Description.Recommendation.EnableStreaming',
  TranslationNamespace.Insights,
);

// product recommendations
const thumbnailPersonalizationProductRecommendation = translationKey(
  'Description.Recommendation.ThumbnailPersonalization',
  TranslationNamespace.AnalyticsAssistant,
);
const economyEventsProductRecommendation = translationKey(
  'Description.Recommendation.EconomyEvents',
  TranslationNamespace.AnalyticsAssistant,
);
const funnelEventsProductRecommendation = translationKey(
  'Description.Recommendation.FunnelEvents',
  TranslationNamespace.AnalyticsAssistant,
);
const autoTranslationRecommendation = translationKey(
  'Description.Recommendation.AutoTranslation',
  TranslationNamespace.AnalyticsAssistant,
);
const autoTextCaptureRecommendation = translationKey(
  'Description.Recommendation.AutoTextCapture',
  TranslationNamespace.AnalyticsAssistant,
);
const packagesMissionsRecommendation = translationKey(
  'Description.Recommendation.PackagesMissions',
  TranslationNamespace.AnalyticsAssistant,
);
const packagesStarterPackRecommendation = translationKey(
  'Description.Recommendation.PackagesStarterPack',
  TranslationNamespace.AnalyticsAssistant,
);
const packagesGenericRecommendation = translationKey(
  'Description.Recommendation.PackagesGeneric',
  TranslationNamespace.AnalyticsAssistant,
);
const packagesSeasonPassRecommendation = translationKey(
  'Description.Recommendation.PackagesSeasonPass',
  TranslationNamespace.AnalyticsAssistant,
);
const packagesEngagementRewardsRecommendation = translationKey(
  'Description.Recommendation.PackagesEngagementRewards',
  TranslationNamespace.AnalyticsAssistant,
);
const regionalPricingRecommendation = translationKey(
  'Description.Recommendation.RegionalPricing',
  TranslationNamespace.AnalyticsAssistant,
);
const priceOptimizationRecommendation = translationKey(
  'Description.Recommendation.PriceOptimization',
  TranslationNamespace.AnalyticsAssistant,
);
const productIntelligenceApisRecommendation = translationKey(
  'Description.Recommendation.ProductIntelligenceApis',
  TranslationNamespace.AnalyticsAssistant,
);

enum LinkSetType {
  Funnel = 'funnel',
  RetentionD1 = 'retentionD1',
  RetentionD7 = 'retentionD7',
  RetentionD30 = 'retentionD30',
  DevProductsPassAndEconomy = 'devProductsPassAndEconomy',
  RevenuePerUser = 'revenuePerUser',
  Engagement = 'engagement',
  PayerConversion = 'payerConversion',
  Economy = 'economy',
  Thumbnails = 'thumbnails',
  Discovery = 'discovery',
  Acquisition = 'acquisition',
  AcquisitionRFY = 'acquisitionRFY',
  AcquisitionAndDiscovery = 'acquisitionAndDiscovery',
  AcquisitionRFYAndDiscovery = 'acquisitionRFYAndDiscoveryRFY',
  ItemSales = 'itemSales',
  LowEndAndroidPerformancePage = 'performance',
  Streaming = 'streaming',
  Localization = 'localization',
  GameDesignMissions = 'gameDesignMissions',
  GameDesignStarterPack = 'gameDesignStarterPack',
  GameDesignBundles = 'gameDesignBundles',
  GameDesignSeasonPass = 'gameDesignSeasonPass',
  GameDesignEngagementRewards = 'gameDesignEngagementRewards',
  Passes = 'passes',
  DeveloperProducts = 'developerProducts',
  PriceOptimization = 'priceOptimization',
  AdsManager = 'adsManager',
  AcquisitionNewUserFunnel = 'acquisitionNewUserFunnel',
  ProductIntelligenceApis = 'productIntelligenceApis',
  None = 'none',
}

type LinkUrlType = 'dashboard' | 'docs';

type InsightsLinkSpec = {
  linkSetType: LinkSetType;
  translationKey: TranslationKey;
};

export enum LowestBenchmarkRecommendationType {
  LowestBenchmarkRFYQualifiedPTR = 'LowestBenchmarkRFYQualifiedPTR',
  LowestBenchmarkD1Retention = 'LowestBenchmarkD1Retention',
  LowestBenchmarkSessionTime = 'LowestBenchmarkSessionTime',
  LowestBenchmarkD7Retention = 'LowestBenchmarkD7Retention',
  LowestBenchmarkPayerConversion = 'LowestBenchmarkPayerConversion',
  LowestBenchmarkArppu = 'LowestBenchmarkArppu',
  LowestBenchmarkPtr = 'LowestBenchmarkPtr',
}

export const RecommendationsWithNonStaticLinks = [RecommendationType.ProductStudioPublish] as const;
export type TRecommendationTypeWithNonStaticLinks =
  (typeof RecommendationsWithNonStaticLinks)[number];

type RecommendationTypes = RecommendationType | LowestBenchmarkRecommendationType;

const recommendationTypeToInsightsLinkSpec = (
  type: Exclude<RecommendationTypes, TRecommendationTypeWithNonStaticLinks>,
  universeId: number,
  attributes?: FeatureAttributes,
): InsightsLinkSpec[] => {
  switch (type) {
    case LowestBenchmarkRecommendationType.LowestBenchmarkD1Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackOnboardFunnel },
        { linkSetType: LinkSetType.RetentionD1, translationKey: learnNewUserExperience },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkSessionTime:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackOnboardFunnel },
        { linkSetType: LinkSetType.Engagement, translationKey: learnEngagement },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkD7Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackProgressionFunnel },
        { linkSetType: LinkSetType.RetentionD7, translationKey: learnClearGoals },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkPayerConversion:
      return [
        {
          linkSetType: LinkSetType.DevProductsPassAndEconomy,
          translationKey: monitorDevProductsAndEconomy,
        },
        { linkSetType: LinkSetType.PayerConversion, translationKey: learnFirstTimePurchases },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkArppu:
      return [
        {
          linkSetType: LinkSetType.DevProductsPassAndEconomy,
          translationKey: monitorDevProductsAndEconomy,
        },
        { linkSetType: LinkSetType.RevenuePerUser, translationKey: learnRepeatPurchases },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkPtr:
      return [
        { linkSetType: LinkSetType.Thumbnails, translationKey: updateThumbnails },
        { linkSetType: LinkSetType.AcquisitionAndDiscovery, translationKey: learnDiscovery },
      ];
    case LowestBenchmarkRecommendationType.LowestBenchmarkRFYQualifiedPTR:
      return [
        { linkSetType: LinkSetType.Thumbnails, translationKey: updateThumbnails },
        {
          linkSetType: LinkSetType.AcquisitionRFYAndDiscovery,
          translationKey: viewRFYSignalsAndLearnDiscovery,
        },
      ];
    // weekly change decrease
    case RecommendationType.PercentChangeDecreaseRevenue:
      return [
        { linkSetType: LinkSetType.None, translationKey: lookForMetricDrop },
        {
          linkSetType: LinkSetType.DevProductsPassAndEconomy,
          translationKey: optimizeDevProductPassAndEconomy,
        },
      ];
    case RecommendationType.PercentChangeDecreaseDau: {
      return [
        { linkSetType: LinkSetType.AcquisitionRFY, translationKey: LookForRFYMetricDrop },
        {
          linkSetType: LinkSetType.AcquisitionAndDiscovery,
          translationKey: viewAcquistionAndLearnDiscovery,
        },
      ];
    }
    case RecommendationType.PercentChangeDecreaseNewUsers: {
      return [
        { linkSetType: LinkSetType.AcquisitionRFY, translationKey: LookForRFYMetricDrop },
        {
          linkSetType: LinkSetType.AcquisitionAndDiscovery,
          translationKey: viewAcquistionAndLearnDiscovery,
        },
      ];
    }
    case RecommendationType.PercentChangeDecreaseD1Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackOnboardFunnel },
        { linkSetType: LinkSetType.RetentionD1, translationKey: learnImproveD1Retention },
      ];
    case RecommendationType.PercentChangeDecreaseSessionTime:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackOnboardFunnel },
        { linkSetType: LinkSetType.Engagement, translationKey: learnImproveSessionTime },
      ];
    case RecommendationType.PercentChangeDecreaseAvgPlayTime:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackOnboardFunnel },
        { linkSetType: LinkSetType.Engagement, translationKey: learnImproveAvgPlayTime },
      ];
    case RecommendationType.PercentChangeDecreaseD7Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: trackProgressionFunnel },
        { linkSetType: LinkSetType.RetentionD7, translationKey: learnImproveD7Retention },
      ];
    case RecommendationType.PercentChangeDecreasePayerConversion:
    case RecommendationType.PercentChangeDecreaseArppu:
      return [
        { linkSetType: LinkSetType.ItemSales, translationKey: lookForItemSalesDrop },
        { linkSetType: LinkSetType.Economy, translationKey: idenfityChangesEconomy },
      ];
    case RecommendationType.PercentChangeDecreaseRfyQptr:
      return [
        { linkSetType: LinkSetType.Thumbnails, translationKey: checkRecentThumbnailUpdates },
        { linkSetType: LinkSetType.AcquisitionRFY, translationKey: recommendationDropLeadQPTRDrop },
      ];
    case RecommendationType.PercentChangeDecreasePtr:
      return [
        { linkSetType: LinkSetType.Thumbnails, translationKey: updateThumbnails },
        { linkSetType: LinkSetType.Discovery, translationKey: learnDiscovery },
      ];
    case RecommendationType.PercentChangeDecreaseD30Retention:
      return [
        { linkSetType: LinkSetType.RetentionD30, translationKey: learnLongTermCreatorContent },
      ];
    // weekly change increase
    case RecommendationType.PercentChangeIncreaseRevenue:
      return [
        { linkSetType: LinkSetType.None, translationKey: lookForMetricGain },
        {
          linkSetType: LinkSetType.DevProductsPassAndEconomy,
          translationKey: monitorDevProductsAndEconomy,
        },
      ];
    case RecommendationType.PercentChangeIncreaseDau:
    case RecommendationType.PercentChangeIncreaseNewUsers: {
      return [
        { linkSetType: LinkSetType.AcquisitionRFY, translationKey: lookForMetricRFYGain },
        { linkSetType: LinkSetType.Acquisition, translationKey: viewAcquistion },
      ];
    }
    case RecommendationType.PercentChangeIncreaseD1Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: monitorOnboardFunnel },
        { linkSetType: LinkSetType.None, translationKey: greatWork },
      ];
    case RecommendationType.PercentChangeIncreaseSessionTime:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: monitorOnboardFunnel },
        { linkSetType: LinkSetType.None, translationKey: greatJob },
      ];
    case RecommendationType.PercentChangeIncreaseAvgPlayTime:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: monitorOnboardFunnel },
        { linkSetType: LinkSetType.None, translationKey: greatJob },
      ];
    case RecommendationType.PercentChangeIncreaseD7Retention:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: monitorProgressionFunnel },
        { linkSetType: LinkSetType.None, translationKey: keepGoing },
      ];
    case RecommendationType.PercentChangeIncreasePayerConversion:
    case RecommendationType.PercentChangeIncreaseArppu:
      return [
        { linkSetType: LinkSetType.ItemSales, translationKey: lookForItemSalesGain },
        { linkSetType: LinkSetType.Economy, translationKey: checkEconomyImproved },
      ];
    case RecommendationType.PercentChangeIncreaseRfyQptr:
    case RecommendationType.PercentChangeIncreasePtr:
      return [
        { linkSetType: LinkSetType.None, translationKey: checkThumbnailHelped },
        { linkSetType: LinkSetType.Thumbnails, translationKey: testNewThumbnail },
      ];
    case RecommendationType.PercentChangeIncreaseD30Retention:
      return [{ linkSetType: LinkSetType.None, translationKey: greatJobD30 }];
    case RecommendationType.DefaultIcon:
    case RecommendationType.DefaultThumbnail:
    case RecommendationType.RootPlaceDefaultName:
    case RecommendationType.RootPlaceDefaultOrEmptyDescription:
    case RecommendationType.AgeGuidelines:
    case RecommendationType.RootPlaceSimilarToTemplate:
    case RecommendationType.ViewPlayerFeedback:
      return [];
    case RecommendationType.LowEndAndroidCrashRate:
      return [
        { linkSetType: LinkSetType.None, translationKey: lowEndAndroidCcuRatio },
        {
          linkSetType: LinkSetType.LowEndAndroidPerformancePage,
          translationKey: exploreLowEndAndroid,
        },
      ];
    case RecommendationType.PerformanceEnableStreaming:
      return [
        {
          linkSetType: LinkSetType.Streaming,
          translationKey: enableStreaming,
        },
      ];
    case RecommendationType.ProductThumbnailPersonalization:
      return [
        {
          linkSetType: LinkSetType.Thumbnails,
          translationKey: thumbnailPersonalizationProductRecommendation,
        },
      ];
    case RecommendationType.ProductEconomyEvents:
      return [
        { linkSetType: LinkSetType.Economy, translationKey: economyEventsProductRecommendation },
      ];
    case RecommendationType.ProductFunnelEvents:
      return [
        { linkSetType: LinkSetType.Funnel, translationKey: funnelEventsProductRecommendation },
      ];
    case RecommendationType.ProductAutoTranslation:
      return [
        { linkSetType: LinkSetType.Localization, translationKey: autoTranslationRecommendation },
      ];
    case RecommendationType.ProductAutoTextCapture:
      return [
        { linkSetType: LinkSetType.Localization, translationKey: autoTextCaptureRecommendation },
      ];
    case RecommendationType.ProductPackagesMissions:
      return [
        {
          linkSetType: LinkSetType.GameDesignMissions,
          translationKey: packagesMissionsRecommendation,
        },
      ];
    case RecommendationType.ProductPackagesStarterPack:
      return [
        {
          linkSetType: LinkSetType.GameDesignStarterPack,
          translationKey: packagesStarterPackRecommendation,
        },
      ];
    case RecommendationType.ProductPackagesGeneric:
      return [
        {
          linkSetType: LinkSetType.GameDesignBundles,
          translationKey: packagesGenericRecommendation,
        },
      ];
    case RecommendationType.ProductPackagesSeasonPass:
      return [
        {
          linkSetType: LinkSetType.GameDesignSeasonPass,
          translationKey: packagesSeasonPassRecommendation,
        },
      ];
    case RecommendationType.ProductPackagesEngagementRewards:
      return [
        {
          linkSetType: LinkSetType.GameDesignEngagementRewards,
          translationKey: packagesEngagementRewardsRecommendation,
        },
      ];
    case RecommendationType.ProductRegionalPricing: {
      const productType =
        attributes?.values?.find((attribute) => attribute.key === 'ProductType')?.value ??
        'GamePass';

      return [
        {
          linkSetType:
            productType === 'GamePass' ? LinkSetType.Passes : LinkSetType.DeveloperProducts,
          translationKey: regionalPricingRecommendation,
        },
      ];
    }
    case RecommendationType.ProductPriceOptimization:
      return [
        {
          linkSetType: LinkSetType.PriceOptimization,
          translationKey: priceOptimizationRecommendation,
        },
      ];
    case RecommendationType.ViewAdsAcquisitionMetrics:
      // Link to acquisition page new user funnel table
      return [
        {
          linkSetType: LinkSetType.AcquisitionNewUserFunnel,
          translationKey: adsPerformanceSuggestion1,
        },
        { linkSetType: LinkSetType.None, translationKey: adsPerformanceSuggestion2 },
      ];
    case RecommendationType.ProductProductIntelligenceApis:
      return [
        {
          linkSetType: LinkSetType.ProductIntelligenceApis,
          translationKey: productIntelligenceApisRecommendation,
        },
      ];
    case RecommendationType.TrackOnboardingFunnel:
    case RecommendationType.TrackOnboardingProgressionFunnel:
    case RecommendationType.TrackProgressionFunnel:
    case RecommendationType.LearnNewUserExperience:
    case RecommendationType.LearnEngagement:
    case RecommendationType.LearnClearGoals:
    case RecommendationType.LearnFirstTimePurchases:
    case RecommendationType.LearnRepeatPurchases:
    case RecommendationType.LearnDiscovery:
    case RecommendationType.LearnLongTermCreatorContent:
    case RecommendationType.MonitorOnboardingFunnel:
    case RecommendationType.MonitorOnboardingProgressionFunnel:
    case RecommendationType.MonitorProgressionFunnel:
    case RecommendationType.MonitorDevProductsAndEconomy:
    case RecommendationType.MonitorConversionRate:
    case RecommendationType.UpdateThumbnails:
    case RecommendationType.ExploreDiscoveryMetrics:
    case RecommendationType.LowestBenchmarkD1Retention:
    case RecommendationType.LowestBenchmarkSessionTime:
    case RecommendationType.LowestBenchmarkD7Retention:
    case RecommendationType.LowestBenchmarkPayerConversion:
    case RecommendationType.LowestBenchmarkArppu:
    case RecommendationType.LowestBenchmarkPtr:
    case RecommendationType.ProductCustomEvents:
      logAnalyticsError(`Recommendation type ${type} is deprecated for universe ${universeId}`);
      return [];
    case RecommendationType.Invalid:
      throw new Error(`Invalid Recommendation type`);
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled Recommendation type ${exhaustiveCheck}`);
    }
  }
};

const linkSetTypeToLinks = (
  linkSetType: LinkSetType,
  universeId: number,
  placeId: number,
): { url: string; type: LinkUrlType }[] => {
  switch (linkSetType) {
    case LinkSetType.Funnel:
      return [
        { url: urls.creatorHub.dashboard.getAnalyticsFunnelsUrl(universeId), type: 'dashboard' },
      ];
    case LinkSetType.RetentionD1:
      return [{ url: urls.creatorHub.docs.getAnalyticsRetentionGuideUrl(), type: 'docs' }];
    case LinkSetType.Engagement:
      return [{ url: urls.creatorHub.docs.getAnalyticsEngagementGuideUrl(), type: 'docs' }];
    case LinkSetType.RetentionD7:
      return [{ url: urls.creatorHub.docs.getAnalyticsRetentionD7GuideUrl(), type: 'docs' }];
    case LinkSetType.RetentionD30:
      return [{ url: urls.creatorHub.docs.getAnalyticsRetentionD30GuideUrl(), type: 'docs' }];
    case LinkSetType.DevProductsPassAndEconomy:
      return [
        {
          url: urls.creatorHub.dashboard.getMonetizationDeveloperProductsAnalyticsTabUrl(
            universeId,
          ),
          type: 'dashboard',
        },
        {
          url: urls.creatorHub.dashboard.getMonetizationPassesAnalyticsTabUrl(universeId),
          type: 'dashboard',
        },
        { url: urls.creatorHub.dashboard.getAnalyticsEconomyUrl(universeId), type: 'dashboard' },
      ];
    case LinkSetType.PayerConversion:
      return [
        {
          url: urls.creatorHub.docs.getAnalyticsMonetizationPayerConversionRateGuideUrl(),
          type: 'docs',
        },
      ];
    case LinkSetType.RevenuePerUser:
      return [{ url: urls.creatorHub.docs.getAnalyticsMonetizationARPPUGuideUrl(), type: 'docs' }];
    case LinkSetType.Thumbnails:
      return [
        {
          url: urls.creatorHub.dashboard.getPlaceThumbnailsUrl(universeId, placeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.Discovery:
      return [{ url: urls.creatorHub.docs.getDiscoveryUrl(), type: 'docs' }];
    case LinkSetType.Acquisition:
      return [
        { url: urls.creatorHub.dashboard.getAnalyticAcquisitionUrl(universeId), type: 'dashboard' },
      ];
    case LinkSetType.AcquisitionNewUserFunnel:
      return [
        {
          url: `${urls.creatorHub.dashboard.getAnalyticAcquisitionUrl(universeId)}#new-user-funnel`,
          type: 'dashboard',
        },
      ];
    case LinkSetType.AcquisitionRFY:
      return [
        {
          url: urls.creatorHub.dashboard.getAnalyticAcquisitionHomeRecommendationsUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.AcquisitionAndDiscovery:
      return [
        { url: urls.creatorHub.dashboard.getAnalyticAcquisitionUrl(universeId), type: 'dashboard' },
        { url: urls.creatorHub.docs.getDiscoveryUrl(), type: 'docs' },
      ];
    case LinkSetType.AcquisitionRFYAndDiscovery:
      return [
        {
          url: urls.creatorHub.dashboard.getAnalyticAcquisitionHomeRecommendationsUrl(universeId),
          type: 'dashboard',
        },
        { url: urls.creatorHub.docs.getDiscoveryUrl(), type: 'docs' },
      ];
    case LinkSetType.ItemSales:
      return [
        {
          url: urls.creatorHub.dashboard.getMonetizationDeveloperProductsAnalyticsTabUrl(
            universeId,
          ),
          type: 'dashboard',
        },
        {
          url: urls.creatorHub.dashboard.getMonetizationPassesAnalyticsTabUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.Economy:
      return [
        { url: urls.creatorHub.dashboard.getAnalyticsEconomyUrl(universeId), type: 'dashboard' },
      ];
    case LinkSetType.LowEndAndroidPerformancePage:
      return [
        {
          url: buildExperienceAnalyticsUrlWithParams(
            analyticsPerformanceNavigationItem,
            {
              [AnalyticsQueryParams.RangeType]: DateRangeType.Last7Days,
              [AnalyticsQueryParams.FilterPlace]: placeId.toString(),
              [AnalyticsQueryParams.OperatingSystem]: RAQIV2OperatingSystem.Android,
              [AnalyticsQueryParams.MemoryGroup]: RAQIV2MemoryGroup.UnderTwoGB,
            },
            universeId,
          ),
          type: 'dashboard',
        },
      ];
    case LinkSetType.Streaming:
      return [
        {
          url: urls.creatorHub.docs.getStreamingUrl(),
          type: 'docs',
        },
      ];
    case LinkSetType.Localization:
      return [{ url: urls.creatorHub.dashboard.getLocalizationUrl(universeId), type: 'dashboard' }];
    case LinkSetType.GameDesignMissions:
      return [{ url: urls.creatorHub.docs.getGameDesignMissionsUrl(), type: 'docs' }];
    case LinkSetType.GameDesignStarterPack:
      return [{ url: urls.creatorHub.docs.getGameDesignStarterPackUrl(), type: 'docs' }];
    case LinkSetType.GameDesignBundles:
      return [{ url: urls.creatorHub.docs.getGameDesignBundlesUrl(), type: 'docs' }];
    case LinkSetType.GameDesignSeasonPass:
      return [{ url: urls.creatorHub.docs.getGameDesignSeasonPassUrl(), type: 'docs' }];
    case LinkSetType.GameDesignEngagementRewards:
      return [{ url: urls.creatorHub.docs.getGameDesignEngagementRewardsUrl(), type: 'docs' }];
    case LinkSetType.Passes:
      return [
        {
          url: urls.creatorHub.dashboard.getMonetizationPassesUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.DeveloperProducts:
      return [
        {
          url: urls.creatorHub.dashboard.getMonetizationDeveloperProductsUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.PriceOptimization:
      return [
        {
          url: urls.creatorHub.dashboard.getMonetizationPriceOptimizationUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.AdsManager:
      return [
        {
          url: urls.www.getSponsorExperienceUrl(universeId),
          type: 'dashboard',
        },
      ];
    case LinkSetType.ProductIntelligenceApis:
      return [
        {
          url: urls.creatorHub.docs.getProductIntelligenceApisUrl(),
          type: 'docs',
        },
      ];
    case LinkSetType.None:
      return [];
    default: {
      const exhaustiveCheck: never = linkSetType;
      throw new Error('Unrecognized link set type: ', exhaustiveCheck);
    }
  }
};

const recommendationTypeToTranslationInfo = (
  type: RecommendationTypes,
  universeId: number,
  placeId: number,
  attributes?: FeatureAttributes,
) => {
  if (isValidArrayEnumValue(RecommendationsWithNonStaticLinks, type)) {
    return [];
  }

  const spec = recommendationTypeToInsightsLinkSpec(type, universeId, attributes);
  return spec.map(({ translationKey: givenTranslationKey, linkSetType }) => {
    const links = linkSetTypeToLinks(linkSetType, universeId, placeId);
    return { key: givenTranslationKey, links };
  });
};

export default recommendationTypeToTranslationInfo;
