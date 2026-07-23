import { CategoryType } from '@rbx/client-toolbox-service/v1';
import type { ManagedPricingTab } from '@modules/managed-pricing/types';
import type { PersonalizedShopsTab } from '@modules/shops/types';
import Asset from '../common/enums/Asset';
import Item from '../common/enums/Item';

const creatorStoreBaseUrl = `${process.env.baseUrl}/store`;
const docSiteUrl = `${process.env.baseUrl}/docs`;
const developerForumUrl = 'https://devforum.roblox.com';
const developerForumCdnUrl = 'https://doy2mn9upadnk.cloudfront.net';
const developerForumMediaCdnUrl = '//d3vcfwomg2mj2z.cloudfront.net';

const categoryTypeToCreatorStorePath: Record<CategoryType, string> = {
  [CategoryType.Model]: 'models',
  [CategoryType.Plugin]: 'plugins',
  [CategoryType.Audio]: 'audio',
  [CategoryType.FontFamily]: 'fonts',
  [CategoryType.Decal]: 'decals',
  [CategoryType.MeshPart]: 'meshParts',
  [CategoryType.Video]: 'videos',
  [CategoryType.Animation]: '',
  [CategoryType.Music]: '',
  [CategoryType.SoundEffect]: '',
  [CategoryType.UnknownAudio]: '',
  [CategoryType.Package]: '',
  [CategoryType.SharedPackage]: '',
};

export const creatorStore = {
  getUrl: () => creatorStoreBaseUrl,
  getAssetUrl: (assetId: number) => `${creatorStoreBaseUrl}/asset/${assetId}`,
  getSearchUrl: (category: CategoryType, searchTerm: string) => {
    if (categoryTypeToCreatorStorePath[category] !== '') {
      return `${creatorStoreBaseUrl}/${categoryTypeToCreatorStorePath[category]}?keyword=${encodeURIComponent(searchTerm)}`;
    }
    throw new Error(`Unsupported search asset type ${category}`);
  },
};

export const developerForum = {
  getBaseUrl: () => developerForumUrl,
  getCdnBaseUrl: () => developerForumCdnUrl,
  getMediaCdnBaseUrl: () => developerForumMediaCdnUrl,
  getAnnouncementsPath: () => '/c/updates/announcements/36',
  getPublicSfxAnnouncementPath: () =>
    '/t/public-sound-effects-upload-are-now-available-for-creators/2980704',
};

export type TConfigurableItem = Item.Game | Item.Bundle | Item.CatalogAsset;

export const dashboard = {
  getUrl: (groupId?: string, assetType?: Exclude<Asset, 'Place' | 'Event'>, activeTab?: string) => {
    const params: Record<string, string> = {
      ...(groupId ? { groupId } : {}),
      ...(assetType ? { assetType } : {}),
      ...(activeTab ? { activeTab } : {}),
    };
    const parsedParams = new URLSearchParams(params).toString();
    return `/dashboard/creations${parsedParams.length > 0 ? '?' : ''}${parsedParams}`;
  },
  getConfigureItemUrl: (id: number, itemType: TConfigurableItem) => {
    switch (itemType) {
      case Item.Game:
        return dashboard.getConfigureExperienceUrl(id);
      case Item.Bundle:
        return dashboard.getConfigureBundlePath(id);
      case Item.CatalogAsset:
        return dashboard.getConfigureAvatarItemsUrl(id);
      default: {
        const exhaustiveCheck: never = itemType;
        throw new Error(`Unsupported item type ${String(exhaustiveCheck)}`);
      }
    }
  },
  getExperienceOverviewUrl: (experienceId: number) =>
    `/dashboard/creations/experiences/${experienceId}/overview`,
  getConfigureBundlePath: (bundleId: number) => `/dashboard/creations/bundle/${bundleId}/configure`,
  getConfigureExperienceUrl: (experienceId: number) =>
    `/dashboard/creations/experiences/${experienceId}/configure`,
  configureCreatorStoreItemBasePath: '/dashboard/creations/store/',
  getConfigureCreatorStoreItemUrl: (assetId: number) =>
    `${dashboard.configureCreatorStoreItemBasePath}${assetId}/configure`,
  getConfigureAvatarItemsUrl: (assetId: number) =>
    `/dashboard/creations/catalog/${assetId}/configure`,
  getConfigureDeveloperProductUrl: (universeId: number, productId: number) =>
    `/dashboard/creations/experiences/${universeId}/developer-products/${productId}/configure` as const,
  getCreateDeveloperProductUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/developer-products/create` as const,
  getConfigurePassUrl: (universeId: number, passId: number) =>
    `/dashboard/creations/experiences/${universeId}/passes/${passId}/configure` as const,
  getConfigurePassSalesUrl: (universeId: number, passId: number) =>
    `/dashboard/creations/experiences/${universeId}/passes/${passId}/sales` as const,
  getCreatePassUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/passes/create` as const,
  getConfigureExperienceSubscriptionUrl: (universeId: number, subscriptionId: string) =>
    `/dashboard/creations/experiences/${universeId}/experience-subscriptions/${subscriptionId}/configure` as const,
  getCreateExperienceSubscriptionUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/experience-subscriptions/create` as const,
  getUserBansUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/safety/bans`,
  getAddUsersToBanUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/safety/bans/add`,
  getAnalyticsOverviewUrl: () => `/dashboard/analytics`,
  getAnalyticsUrl: (experienceId: number) =>
    `/dashboard/creations/experiences/${experienceId}/analytics`,
  getAnalyticsPerformanceUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/performance`,
  getAnalyticsPerformanceClientUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/performance?tab=client`,
  getAnalyticsEngagementUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/engagement`,
  getAnalyticsFunnelsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/funnels`,
  getAnalyticsEconomyUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/economy`,
  getAnalyticAcquisitionUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/acquisition`,
  getAnalyticAcquisitionHomeRecommendationsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/acquisition?tab=homeRecommendations`,
  getAnalyticsConfigsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/configs`,
  getAnalyticsConfigsCreateUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/configs/config-create`,
  getAnalyticsErrorsUrls: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/errors`,
  getAnalyticsExploreUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/explore`,
  getAnalyticsAgentUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/agent`,
  getBundleAnalyticsUrl: (bundleId: number, rangeType = 'Last7Days') =>
    `/dashboard/creations/bundle/${bundleId}/analytics?rangeType=${rangeType}`,
  getCatalogAnalyticsUrl: (assetId: number, rangeType = 'Last7Days') =>
    `/dashboard/creations/catalog/${assetId}/analytics?rangeType=${rangeType}`,
  getPlaceThumbnailsUrl: (universeId: number, placeId: number) =>
    `/dashboard/creations/experiences/${universeId}/places/${placeId}/thumbnails`,
  getPlaceVideosUrl: (universeId: number, placeId: number) =>
    `/dashboard/creations/experiences/${universeId}/places/${placeId}/videos`,
  getPlaceIconUrl: (universeId: number, placeId: number) =>
    `/dashboard/creations/experiences/${universeId}/places/${placeId}/icon`,
  getExperienceAlertCreateUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/alerts/create`,
  getExperienceAlertConfigureUrl: (universeId: number, alertId: string) =>
    `/dashboard/creations/experiences/${universeId}/alerts/${alertId}/configure`,
  getExperienceAlertsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/alerts`,
  getExperienceWebhooksUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/webhooks`,
  getExperimentsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/experiments`,

  getUploadUrl: (
    asset: Extract<
      Asset,
      'TShirt' | 'Shirt' | 'Pants' | 'Decal' | 'Audio' | 'Video'
    > = Asset.TShirt,
  ) => `/dashboard/creations/upload?assetType=${asset}`,
  getDevexUrl: () => '/dashboard/devex',
  getBillingStatementUrl: (date: string) => `/dashboard/summary/${date}`,
  getServiceActivityUrl: () => `/dashboard/billing`,
  getMonetizationOverviewUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/overview` as const,
  getMonetizationDeveloperProductsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/developer-products` as const,
  getMonetizationDeveloperProductsAnalyticsTabUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/developer-products?tab=Analytics` as const,
  getMonetizationDeveloperProductsExternalPurchaseSettingsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/developer-products/external-purchase-settings` as const,
  getMonetizationPassesUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/passes` as const,
  getMonetizationPassesAnalyticsTabUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/passes?tab=Analytics` as const,
  getMonetizationAvatarItemsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/avatar-items`,
  getFreeAvatarsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/free-avatars`,
  getMonetizationAvatarItemsAnalyticsTabUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/avatar-items?tab=Analytics`,
  getMonetizationSubscriptionsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/subscriptions` as const,
  getMonetizationSubscriptionsAnalyticsTabUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/subscriptions?tab=Analytics` as const,
  getMonetizationSubscriptionsHistoryTabUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/subscriptions?tab=History` as const,
  getMonetizationCommerceUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/commerce`,
  getMonetizationCommerceCreateProductUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/commerce/create-products`,
  getMonetizationImmersiveAdsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/immersive-ads`,
  getMonetizationImmersiveAdsCreatePlacementUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/immersive-ads/create-placement`,
  getMonetizationCreatorRewardsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/creator-rewards`,
  getMonetizationBountyPayoutsUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/roblox-plus`,
  getMonetizationAvatarCreationTokensUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/avatar-creation-tokens`,
  getMonetizationPriceOptimizationUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/price-optimization` as const,
  getMonetizationDynamicPriceCheckUrl: (
    universeId: number | string,
    params: { from?: string } = {},
  ) => {
    const queryParams = new URLSearchParams(params).toString();
    return `/dashboard/creations/experiences/${universeId}/monetization/price-check${queryParams.length > 0 ? `?${queryParams}` : ''}` as const;
  },
  getManagedPricingUrl: (universeId: number, tab?: ManagedPricingTab) =>
    `/dashboard/creations/experiences/${universeId}/monetization/managed-pricing${tab ? `?tab=${tab}` : ''}` as const,
  getManagedPricingEventDetailsUrl: (universeId: number, eventId: string) =>
    `/dashboard/creations/experiences/${universeId}/monetization/managed-pricing/events/${eventId}/details` as const,
  getMonetizationHardCodedPricesUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/monetization/hard-coded-prices` as const,
  getPersonalizedShopsUrl: (universeId: number, tab?: PersonalizedShopsTab) =>
    `/dashboard/creations/experiences/${universeId}/monetization/shop${tab ? `?tab=${tab}` : ''}` as const,
  getSellerOnboardingUrl: () => `/settings/eligibility/priced-assets`,
  getTranslatorPortalUrl: () => `/dashboard/translator-portal`,
  getAudioDistributionOnboardingUrl: () => `/settings/eligibility/audio-distribution`,
  getCreateGroupUrl: () => `/dashboard/group/create`,
  getGroupProfileUrl: (groupId: string) => {
    const params: Record<string, string> = { groupId };
    const parsedParams = new URLSearchParams(params).toString();
    return `/dashboard/group/profile${parsedParams.length > 0 ? '?' : ''}${parsedParams}`;
  },
  getRightsManagerAssetUrl: (contentId: string) =>
    `/dashboard/rights-manager/accounts/contents/asset/${contentId}`,
  getCustomMatchmakingDashboardUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking`,
  getCustomMatchmakingConfigurationDashboardUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking?activeTab=Configuration`,
  getCustomMatchmakingAttributesDashboardUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking?activeTab=Attributes`,
  getCustomMatchmakingAnalyticsDashboardUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking?activeTab=Analytics`,
  getCustomMatchmakingConfigurationCreationUrl: (universeId: number, configurationId: string) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking/create-configuration/${configurationId}`,
  getCustomMatchmakingEditConfigurationUrl: (universeId: number, configurationId: string) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking/edit-configuration/${configurationId}`,
  getCustomMatchmakingAttributeCreationUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking/create-attribute`,
  getCustomMatchmakingEditServerAttributeUrl: (universeId: number, attributeId: string) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking/edit-server-attribute/${attributeId}`,
  getCustomMatchmakingEditPlayerAttributeUrl: (universeId: number, attributeId: string) =>
    `/dashboard/creations/experiences/${universeId}/matchmaking/edit-player-attribute/${attributeId}`,

  getLocalizationUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/localization`,

  getDataStoresManagerUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/analytics/data-stores`,
  getExtendedServicesUnlock: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/extended-services`,
  getPaymentsUrl: () => `/dashboard/payments`,
  getServerManagementUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/server-management`,
  getPlayerSupportUrl: (universeId: number) =>
    `/dashboard/creations/experiences/${universeId}/player-support`,
};

export const docs = {
  getUrl: () => docSiteUrl,
  getAiDataSharingUrl: () => `${docSiteUrl}/ai-data-sharing`,
  getBadgesPublishingUrl: () => `${docSiteUrl}/production/publishing/badges`,
  getExperiencesPublishingUrl: () =>
    `${docSiteUrl}/production/publishing/publishing-experiences-and-places`,
  getSellingOnCreatorStoreUrl: () =>
    `${docSiteUrl}/production/publishing/selling-on-the-creator-store`,
  getPassesMonetizationUrl: () => `${docSiteUrl}/production/monetization/game-passes` as const,
  getDeveloperProductsMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/developer-products` as const,
  getDeveloperProductsExternalPurchaseSettingsMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/developer-products#outside-your-experience` as const,
  getSubscriptionsMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/subscriptions` as const,
  getSubscriptionsMonetizationAnalyticsUrl: () =>
    `${docSiteUrl}/production/monetization/subscriptions#subscription-analytics` as const,
  getPriceOptimizationMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/price-optimization` as const,
  getDynamicPriceCheckMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/price-optimization#using-the-dynamic-price-check-tool` as const,
  getRegionalPricingMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/regional-pricing` as const,
  getPriceLevelsApiMonetizationUrl: () =>
    // Temporary, will be updated to the new URL when available
    `${docSiteUrl}/production/monetization/regional-pricing#protect-your-trades-and-gifts` as const,
  getManagedPricingMonetizationUrl: () =>
    `${docSiteUrl}/production/monetization/managed-pricing` as const, // TBD
  getPersonalizedShopsMonetizationUrl: () => `${docSiteUrl}/production/monetization/shop` as const,
  getImmersiveAdsMonetizationUrl: () => `${docSiteUrl}/production/monetization/immersive-ads`,
  getRewardedVideoUrl: () => `${docSiteUrl}/production/promotion/rewarded-video-ads`,
  // TODO: ADS-8577 - update the URL when available
  getExperienceDetailsPageRewardedAdsUrl: () =>
    `${docSiteUrl}/production/monetization/immersive-ads`,
  // NOTE(yhe-cn, 04/03/2023): we want luobu to use global link since create.robloxdev.cn/docs is not available
  getCreatorStorePublishingUrl: () =>
    `${docSiteUrl}/production/creator-store#distribute-and-sell-assets`,
  getDecalReferenceUrl: () => `${docSiteUrl}/reference/engine/classes/Decal`,
  getOpenCloudReferenceUrl: () => `${docSiteUrl}/reference/cloud`,
  getAudioAssetsUrl: () => `${docSiteUrl}/building-and-visuals/audio/audio-assets`,
  getAssetsUrl: () => `${docSiteUrl}/projects/assets`,
  getClassicClothingUrl: () => `${docSiteUrl}/avatar/accessories/classic-clothing`,
  getEarningOnRobloxUrl: () => `${docSiteUrl}/production/earning-on-roblox`,
  getSettingUpStudioUrl: () => `${docSiteUrl}/studio/setup`,
  getStudioUrl: () => `${docSiteUrl}/studio`,
  getPlatformUrl: () => `${docSiteUrl}/platform`,
  getAnalyticsUrl: () => `${docSiteUrl}/production/analytics`,
  getAnalyticsErrorReportUrl: () => `${docSiteUrl}/production/analytics/error-report`,
  getUnityGuideUrl: () => `${docSiteUrl}/unity`,
  getUnrealGuideUrl: () => `${docSiteUrl}/unreal`,
  getEventsPlatformUrl: () => `${docSiteUrl}/production/promotion/events-platform`,
  getAvatarItemsUrl: () => `${docSiteUrl}/avatar`,
  getClassicAccessoriesUrl: () => `${docSiteUrl}/art/accessories/classic-clothing`,
  getModelsUrl: () => `${docSiteUrl}/parts/models`,
  getMakeupLooksUrl: () => `${docSiteUrl}/avatar/makeup-looks`,
  getPluginsReferenceUrl: () => `${docSiteUrl}/reference/engine/classes/Plugin`,
  getVideoFrameReferenceUrl: () => `${docSiteUrl}/reference/engine/classes/VideoFrame#Video`,
  getMeshPartReferenceUrl: () => `${docSiteUrl}/reference/engine/classes/MeshPart`,
  getAnimationReferenceUrl: () => `${docSiteUrl}/reference/engine/classes/Animation`,
  getLocalizationGuideUrl: () => `${docSiteUrl}/production/localization`,
  getAssistantUrl: () => `${docSiteUrl}/assistant`,
  getAnalyticsRetentionGuideUrl: () =>
    `${docSiteUrl}/production/analytics/retention#improving-day-1-retention`,
  getMonetizationNewUserExperienceGuideUrl: () =>
    `${docSiteUrl}/production/monetization/improve-new-user-experience`,
  getAnalyticsEngagementGuideUrl: () =>
    `${docSiteUrl}/production/analytics/engagement#improving-average-session-time`,
  getAnalyticsRetentionD7GuideUrl: () =>
    `${docSiteUrl}/production/analytics/retention#improving-day-7-retention`,
  getAnalyticsRetentionD30GuideUrl: () =>
    `${docSiteUrl}/production/analytics/retention#improving-day-30-retention`,
  getAnalyticsMonetizationPayerConversionRateGuideUrl: () =>
    `${docSiteUrl}/production/analytics/monetization#improving-payer-conversion-rate`,
  getAnalyticsMonetizationARPPUGuideUrl: () =>
    `${docSiteUrl}/production/analytics/monetization#improving-average-revenue-per-paying-user-arppu`,
  getAnalyticsFilterByMetricsGuideUrl: () =>
    `${docSiteUrl}/production/analytics/analytics-dashboard#filter-by-metrics`,
  getDiscoveryUrl: () => `${docSiteUrl}/discovery`,
  getDiscoveryBestPracticesUrl: () => `${docSiteUrl}/discovery#best-practices-for-discovery`,
  getDiscoveryRecommendationUrl: () => `${docSiteUrl}/discovery#how-recommendation-works`,
  getDiscoveryKeySignalsUrl: () => `${docSiteUrl}/discovery#key-signals`,
  getDiscoveryGetDiscoveredUrl: () =>
    `${docSiteUrl}/discovery#how-you-can-get-discovered-via-recommendations`,
  getCreatorStoreAssetModerationUrl: () => `${docSiteUrl}/production/creator-store#requirements`,
  getPerformanceOptimizationUrl: () => `${docSiteUrl}/performance-optimization`,
  getPromotionalThumbnailsUrl: () => `${docSiteUrl}/production/promotion/promotional-thumbnails`,
  getExperienceGenresUrl: () => `${docSiteUrl}/production/publishing/experience-genres`,
  getGenreDefinitionsUrl: () =>
    `${docSiteUrl}/production/publishing/experience-genres#genre-and-subgenre-descriptions`,
  getExperienceGenresAppealUrl: () =>
    `${docSiteUrl}/production/publishing/experience-genres#genre-accuracy`,
  getMakeExperiencePublicUrl: () =>
    `${docSiteUrl}/production/publishing/publish-experiences-and-places#make-experience-public`,
  getOwnershipTransferUrl: () => `${docSiteUrl}/projects/experience-ownership-transfer`,
  getStreamingUrl: () => `${docSiteUrl}/workspace/streaming`,
  getAnimationTransferUrl: () => `${docSiteUrl}/projects/transferring-animations`,

  getGameDesignMissionsUrl: () =>
    `${docSiteUrl}/production/game-design/introduction-to-quest-design`,
  getGameDesignStarterPackUrl: () => `${docSiteUrl}/production/game-design/starter-pack-design`,
  getGameDesignBundlesUrl: () =>
    `${docSiteUrl}/production/game-design/monetization-foundations#bundles`,
  getGameDesignSeasonPassUrl: () => `${docSiteUrl}/production/game-design/season-pass-design`,
  getGameDesignEngagementRewardsUrl: () =>
    `${docSiteUrl}/production/game-design/analytics-essentials#engagement-metrics
`,
  getCloudServicesMemoryStoresAPIRequestsUrl: () =>
    `${docSiteUrl}/cloud-services/memory-stores/observability#api-request-alerts`,
  getCloudServicesMemoryStoresMemoryUsageUrl: () =>
    `${docSiteUrl}/cloud-services/memory-stores/observability#memory-usage-alerts`,
  getExperimentationUrl: () => `${docSiteUrl}/production/experiments`,
  getExperimentationBestPracticesUrl: () =>
    `${docSiteUrl}/production/experiments#best-practices-for-experiments`,
  getReleaseNotesUrl: (majorVersion: number) =>
    `${docSiteUrl}/release-notes/release-notes-${majorVersion}`,
  getProductIntelligenceApisUrl: () =>
    `${docSiteUrl}/production/monetization/developer-products#personalize-your-in-experience-store`,
};

export const getUrl = () => `/`;
export const getDataCollectionUrl = () => `/data-collection`;
export const getRoadmapUrl = () => `/roadmap`;
export const getShareLinksUrl = () => `/affiliate`;

export const getGroupRoleUrl = (roleId: string) => `/dashboard/group/roles/${roleId}`;

export const getDataCollectionSettingsUrl = (
  isRobloxEnabled: boolean,
  isPublicEnabled: boolean,
  tab = '',
) => {
  const params: Record<string, string> = {
    ...(isRobloxEnabled ? { roblox: 'true' } : {}),
    ...(isPublicEnabled ? { public: 'true' } : {}),
    ...(tab ? { tab } : {}),
  };
  const parsedParams = new URLSearchParams(params).toString();
  return `/settings/data-collection${parsedParams.length > 0 ? '?' : ''}${parsedParams}`;
};
