import type { WidgetProps } from '@rbx/flags/widget';
import * as avatarMarketplaceFlags from './avatarMarketplace';
import * as communitiesFlags from './communities';
import * as contentAccessAndInventoryFlags from './contentAccessAndInventory';
import * as contentLicensingFlags from './contentLicensing';
import * as contentSuitabilityFlags from './contentSuitability';
import * as creatorAnalyticsFlags from './creatorAnalytics';
import * as creatorBusinessFlags from './creatorBusiness';
import * as creatorCreationsFlags from './creatorCreations';
import * as creatorGameopsFlags from './creatorGameops';
import * as creatorRoadmapFlags from './creatorRoadmap';
import * as creatorServicesInsightsFlags from './creatorServicesInsights';
import * as devexFlags from './devex';
import * as gameDiscoveryServingFlags from './gameDiscoveryServing';
import * as groupsFlags from './groups';
import * as immersiveAdsFlags from './immersiveAds';
import * as leaderboardsFlags from './leaderboards';
import * as monetizationFlags from './monetization';
import * as payoutsFlags from './payouts';

export const generatedFlags = [
    {
      flag: avatarMarketplaceFlags.freeAvatarModuleStorePageLink,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'freeAvatarModuleStorePageLink',
        defaultValue: "#",
        valueType: 'string',
        contextType: 'static',
      },
    },
    {
      flag: avatarMarketplaceFlags.freeAvatarModuleDocsPageLink,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'freeAvatarModuleDocsPageLink',
        defaultValue: "#",
        valueType: 'string',
        contextType: 'static',
      },
    },
    {
      flag: avatarMarketplaceFlags.enableAvatarLooks,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'enableAvatarLooks',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: avatarMarketplaceFlags.enableUgcFolders,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'enableUGCFolders',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: avatarMarketplaceFlags.isAutoPublishPreferencesEnabled,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'isAutoPublishPreferencesEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: communitiesFlags.creatorAnalytics,
      metadata: {
        namespace: 'communities',
        name: 'CreatorAnalytics',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'group',
      },
    },
    {
      flag: contentAccessAndInventoryFlags.isAssetPrivacyOptOutSurveyEnabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isAssetPrivacyOptOutSurveyEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentAccessAndInventoryFlags.isAssetAccessRequestsEnabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isAssetAccessRequestsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentAccessAndInventoryFlags.isModelCustomThumbnailUploadEnabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isModelCustomThumbnailUploadEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentLicensingFlags.isExperiencePreviewEnabled,
      metadata: {
        namespace: 'content-licensing',
        name: 'isExperiencePreviewEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: contentLicensingFlags.enableIpPlatformLicenseRecommendations,
      metadata: {
        namespace: 'content-licensing',
        name: 'enableIpPlatformLicenseRecommendations',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentLicensingFlags.isIpLicensingEarningsEnabled,
      metadata: {
        namespace: 'content-licensing',
        name: 'isIpLicensingEarningsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentSuitabilityFlags.questionnaireV2Allowlist,
      metadata: {
        namespace: 'content-suitability',
        name: 'questionnaireV2Allowlist',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentSuitabilityFlags.questionnaireV2Q1Release,
      metadata: {
        namespace: 'content-suitability',
        name: 'questionnaireV2Q1Release',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.visibleAssetIdInPersonalizationEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'visibleAssetIdInPersonalizationEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCpuCoreUtilizationEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCpuCoreUtilizationEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperienceAlertsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperienceAlertsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isOwnershipWatermarkEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isOwnershipWatermarkEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentTargetingEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentTargetingEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isErrorReportV2Enabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isErrorReportV2Enabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isErrorReportNewPlaceVersionLiveBannerEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isErrorReportNewPlaceVersionLiveBannerEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isErrorReportSuggestedRulesEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isErrorReportSuggestedRulesEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isFirstSeenColumnEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isFirstSeenColumnEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isAceMetricVariantFanoutEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isAceMetricVariantFanoutEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.sentryChartTracingEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'sentryChartTracingEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.acquisitionMigrationMetricsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'acquisitionMigrationMetricsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isTargetingConfigsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isTargetingConfigsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentNullControlValueEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentNullControlValueEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentRolloutEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentRolloutEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isGeneralBreakGlassBannerEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'IsGeneralBreakGlassBannerEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isMonetizationBreakGlassBannerEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'IsMonetizationBreakGlassBannerEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isPlayerFeedbackExampleCommentsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isPlayerFeedbackExampleCommentsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isAnalyticsAssistantChatEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isAnalyticsAssistantChatEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isAnalyticsAssistantIssueBannerEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isAnalyticsAssistantIssueBannerEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.showCreatorRewardsReportingDisclaimer,
      metadata: {
        namespace: 'creator-analytics',
        name: 'showCreatorRewardsReportingDisclaimer',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isClientScriptCpuTimeEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isClientScriptCPUTimeEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isRotraceMetricEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isRotraceMetricEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.showVideoServiceDashboard,
      metadata: {
        namespace: 'creator-analytics',
        name: 'showVideoServiceDashboard',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isTreemapColorBySiblingProportionEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isTreemapColorBySiblingProportionEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isChartOverflowMenuEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isChartOverflowMenuEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isAssistantChartOverflowMenuEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isAssistantChartOverflowMenuEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCreatorConfigStudioPublishWorkflowEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCreatorConfigStudioPublishWorkflowEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCreatorConfigStudioPublishTimerEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCreatorConfigStudioPublishTimerEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCreatorConfigPublishAsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCreatorConfigPublishAsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isAnalyticsMetricAwareYAxisFormatterEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isAnalyticsMetricAwareYAxisFormatterEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCustomDashboardsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCustomDashboardsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCustomDashboardsLocalStorageEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCustomDashboardsLocalStorageEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isCustomDashboardsApiBackendEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isCustomDashboardsApiBackendEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isFunnelCohortCompletionRateEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isFunnelCohortCompletionRateEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isJourneyEventsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isJourneyEventsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isComparisonRangePolicyEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isComparisonRangePolicyEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isClientSessionsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isClientSessionsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorBusinessFlags.showDevExO18LandingPage,
      metadata: {
        namespace: 'creator-business',
        name: 'showDevExO18LandingPage',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorBusinessFlags.showDevExO18LandingPageAnalyticsSection,
      metadata: {
        namespace: 'creator-business',
        name: 'showDevExO18LandingPageAnalyticsSection',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorBusinessFlags.isDailyRevenueByBalanceTypeChartEnabled,
      metadata: {
        namespace: 'creator-business',
        name: 'isDailyRevenueByBalanceTypeChartEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorBusinessFlags.isRevenueShareAgreementsEnabled,
      metadata: {
        namespace: 'creator-business',
        name: 'isRevenueShareAgreementsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorBusinessFlags.enableVirtualTransactionsTab,
      metadata: {
        namespace: 'creator-business',
        name: 'enableVirtualTransactionsTab',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorCreationsFlags.isMomentsUploadEnabled,
      metadata: {
        namespace: 'creator-creations',
        name: 'isMomentsUploadEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorCreationsFlags.isMomentsSitetestUrlParsingEnabled,
      metadata: {
        namespace: 'creator-creations',
        name: 'isMomentsSitetestUrlParsingEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorGameopsFlags.enablePlayerSupport,
      metadata: {
        namespace: 'creator-gameops',
        name: 'enablePlayerSupport',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorGameopsFlags.enablePlayerSupportSearchAndFilters,
      metadata: {
        namespace: 'creator-gameops',
        name: 'enablePlayerSupportSearchAndFilters',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorGameopsFlags.enableExpeditedReview,
      metadata: {
        namespace: 'creator-gameops',
        name: 'enableExpeditedReview',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorRoadmapFlags.creatorRoadmapEnabled,
      metadata: {
        namespace: 'creator-roadmap',
        name: 'creatorRoadmapEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorServicesInsightsFlags.isCsmExtendedMetricsEnabled,
      metadata: {
        namespace: 'creator-services-insights',
        name: 'isCsmExtendedMetricsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: devexFlags.shouldUseWatermarkFiatCalculation,
      metadata: {
        namespace: 'devex',
        name: 'shouldUseWatermarkFiatCalculation',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: devexFlags.isTaxDocumentationEnabled,
      metadata: {
        namespace: 'devex',
        name: 'isTaxDocumentationEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: gameDiscoveryServingFlags.isHomeAcquisitionSignalsEnabled,
      metadata: {
        namespace: 'game-discovery-serving',
        name: 'isHomeAcquisitionSignalsEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: groupsFlags.isUnifiedUiEnabled,
      metadata: {
        namespace: 'groups',
        name: 'isUnifiedUiEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: immersiveAdsFlags.isRewardedVideoRedesignEnabled,
      metadata: {
        namespace: 'immersive-ads',
        name: 'isRewardedVideoRedesignEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: leaderboardsFlags.isLeaderboardConfigsEnabled,
      metadata: {
        namespace: 'leaderboards',
        name: 'isLeaderboardConfigsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: monetizationFlags.mockManagedPricingSummary,
      metadata: {
        namespace: 'monetization',
        name: 'mockManagedPricingSummary',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: monetizationFlags.mockManagedPricingEvents,
      metadata: {
        namespace: 'monetization',
        name: 'mockManagedPricingEvents',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: monetizationFlags.mockHardCodedPrices,
      metadata: {
        namespace: 'monetization',
        name: 'mockHardCodedPrices',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: monetizationFlags.mockManagedPricingProductWrites,
      metadata: {
        namespace: 'monetization',
        name: 'mockManagedPricingProductWrites',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: monetizationFlags.isProductArchiveEnabled,
      metadata: {
        namespace: 'monetization',
        name: 'isProductArchiveEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: payoutsFlags.enablePayoutWatermarkContributions,
      metadata: {
        namespace: 'payouts',
        name: 'enablePayoutWatermarkContributions',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'group',
      },
    },
  ] as const satisfies WidgetProps['flags'];
