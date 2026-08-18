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
import * as engineNetworkingFlags from './engineNetworking';
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
      flag: avatarMarketplaceFlags.enableTaxonomyBasedCreatorDashboard,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'enableTaxonomyBasedCreatorDashboard',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: avatarMarketplaceFlags.enableCreatorShowcases,
      metadata: {
        namespace: 'avatar-marketplace',
        name: 'enableCreatorShowcases',
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
      flag: contentAccessAndInventoryFlags.isAssetDependenciesViewerEnabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isAssetDependenciesViewerEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentAccessAndInventoryFlags.isCreatorStoreVideoMultipartUploadEnabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isCreatorStoreVideoMultipartUploadEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentAccessAndInventoryFlags.isPricingEligibilityV2Enabled,
      metadata: {
        namespace: 'content-access-and-inventory',
        name: 'isPricingEligibilityV2Enabled',
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
        defaultValue: true,
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
      flag: contentLicensingFlags.isImageAttachmentEnabledInLicenseApplication,
      metadata: {
        namespace: 'content-licensing',
        name: 'isImageAttachmentEnabledInLicenseApplication',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentLicensingFlags.isShowcaseExperiencesEnabled,
      metadata: {
        namespace: 'content-licensing',
        name: 'isShowcaseExperiencesEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentLicensingFlags.isIgnoreMatchEnabled,
      metadata: {
        namespace: 'content-licensing',
        name: 'isIgnoreMatchEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: contentLicensingFlags.isAvatarItemLicensingEnabled,
      metadata: {
        namespace: 'content-licensing',
        name: 'isAvatarItemLicensingEnabled',
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
      flag: creatorAnalyticsFlags.analyticsChartLoadEventstreamEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'analyticsChartLoadEventstreamEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isLimitedAnalyticsAdminMonitoringNavigationEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isLimitedAnalyticsAdminMonitoringNavigationEnabled',
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
      flag: creatorAnalyticsFlags.isExperienceAlertsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperienceAlertsEnabled',
        defaultValue: true,
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
      flag: creatorAnalyticsFlags.isExperimentationTemplatesEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentationTemplatesEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentTargetingEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentTargetingEnabled',
        defaultValue: true,
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
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentNullControlValueEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentNullControlValueEnabled',
        defaultValue: true,
        valueType: 'boolean',
        contextType: 'universe',
      },
    },
    {
      flag: creatorAnalyticsFlags.isExperimentRolloutEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isExperimentRolloutEnabled',
        defaultValue: true,
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
      flag: creatorAnalyticsFlags.isTelemetryMigrationEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isTelemetryMigrationEnabled',
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
        contextType: 'universe',
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
        contextType: 'universe',
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
      flag: creatorAnalyticsFlags.isEhdResultsEnabled,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isEhdResultsEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorAnalyticsFlags.isEhdResultsAlwaysFetched,
      metadata: {
        namespace: 'creator-analytics',
        name: 'isEhdResultsAlwaysFetched',
        defaultValue: false,
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
      flag: creatorCreationsFlags.isBadgeDefaultIconEnabled,
      metadata: {
        namespace: 'creator-creations',
        name: 'isBadgeDefaultIconEnabled',
        defaultValue: false,
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
      flag: creatorCreationsFlags.isMomentsUploadLanguageSelectEnabled,
      metadata: {
        namespace: 'creator-creations',
        name: 'isMomentsUploadLanguageSelectEnabled',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorCreationsFlags.isMomentsFeedIdEnabled,
      metadata: {
        namespace: 'creator-creations',
        name: 'isMomentsFeedIdEnabled',
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
      flag: creatorGameopsFlags.enablePlayerHostedEvents,
      metadata: {
        namespace: 'creator-gameops',
        name: 'enablePlayerHostedEvents',
        defaultValue: false,
        valueType: 'boolean',
        contextType: 'static',
      },
    },
    {
      flag: creatorGameopsFlags.enablePlayerSupportCreatorTicketReroute,
      metadata: {
        namespace: 'creator-gameops',
        name: 'enablePlayerSupportCreatorTicketReroute',
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
      flag: engineNetworkingFlags.isBandwidthNetworkTabEnabled,
      metadata: {
        namespace: 'engine-networking',
        name: 'isBandwidthNetworkTabEnabled',
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
      flag: immersiveAdsFlags.isAdsPageRedesignEnabled,
      metadata: {
        namespace: 'immersive-ads',
        name: 'isAdsPageRedesignEnabled',
        defaultValue: false,
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
