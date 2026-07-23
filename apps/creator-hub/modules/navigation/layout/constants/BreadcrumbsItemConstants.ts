import {
  analyticsAudienceNavigationItem,
  analyticsCrashesNavigationItem,
  analyticsCustomDashboardsManageNavigationItem,
  analyticsCustomEventsNavigationItem,
  analyticsDataStoresNavigationItem,
  analyticsErrorReportNavigationItem,
  analyticsExploreNavigationItem,
  analyticsHttpServiceNavigationItem,
  analyticsMemoryStoresNavigationItem,
  analyticsMessagingServiceNavigationItem,
  analyticsPerformanceNavigationItem,
  analyticsRecommendedEventsEconomyNavigationItem,
  analyticsRecommendedEventsFunnelsNavigationItem,
  analyticsRecommendationServiceNavigationItem,
  analyticsSpeechToTextNavigationItem,
  analyticsTextToSpeechNavigationItem,
  analyticsVideoServiceNavigationItem,
  analyticsGenerativeAINavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import { Item, itemFullNameKeys, itemTypeToSingularNameKeys } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import BreadcrumbItemType from '../enums/BreadcrumbsItemType';

export type BreadcrumbItemDetails = {
  displayName: (params: getDisplayNameParams) => string;
  breadcrumbType: BreadcrumbItemType;
  parentItemTypeName?: string;
  withId?: boolean;
  getLinkPath?: (ids: getLinkPathParams) => string;
};

export type getDisplayNameParams = {
  translate: (key: string, args?: { [key: string]: string }) => string;
  itemType?: Item;
  enableQuestionnaireV2?: boolean;
  itemName?: string;
};

export type displayNameObject = {
  key: string;
  args?: { param: string; value: string };
};

export type getLinkPathParams = {
  baseId?: string;
  badgeId?: string;
  passId?: string;
  groupId?: string;
  assetId?: string;
  bundleId?: string;
  contentId?: string;
  developerItemId?: string;
  associatedItemType?: Item;
  subscriptionId?: string;
  environmentId?: string;
  experimentId?: string;
  experienceSubscriptionId?: string;
  lookId?: string;
  alertId?: string;
};

const createNameWithTranslate = (
  displayName: displayNameObject,
  translate: (key: string, args?: { [key: string]: string }) => string,
) => {
  if (displayName.args && displayName.args.value) {
    return translate(displayName.key, {
      [displayName.args.param]: translate(displayName.args.value),
    });
  }
  return translate(displayName.key);
};

const getCreatorStoreItemConfigurePathFromLinkPath = (
  getLinkPathParams: getLinkPathParams,
): string => {
  const id = parseInt(getLinkPathParams.developerItemId ?? '', 10);
  return Number.isNaN(id)
    ? dashboard.configureCreatorStoreItemBasePath
    : dashboard.getConfigureCreatorStoreItemUrl(id);
};

// If a new page is created, please add the router parse item and corresponding BreadcrumbItemDetails.
export const RouterParseItemToBreadcrumbItemDetails: { [key: string]: BreadcrumbItemDetails } = {
  analytics: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Analytics' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Catalog,
  },
  creations: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Creations' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Creations,
    getLinkPath: (getLinkPathParams) => {
      return getLinkPathParams?.groupId
        ? `/dashboard/creations?groupId=${getLinkPathParams?.groupId}`
        : '/dashboard/creations';
    },
  },
  experiences: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Games' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Games,
    withId: true,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/overview`;
    },
  },
  collaborators: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Tab.Collaborators' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Collaborators,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/collaborators`;
    },
  },
  badges: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Badges' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Badge,
    parentItemTypeName: 'associated-items',
    withId: true,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/badges/${getLinkPathParams.badgeId}/overview`;
    },
  },
  'referral-reward-details': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ReferralRewards' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ReferralRewards,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/referral-reward-details`;
    },
    parentItemTypeName: 'referral-reward-details',
    withId: true,
  },
  bundle: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Creations' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Bundle,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/bundle/${getLinkPathParams.bundleId}/configure`;
    },
    withId: true,
  },
  'experience-subscriptions': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Subscriptions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ExperienceSubscription,
    parentItemTypeName: 'associated-items',
    withId: true,
  },
  'associated-items': {
    displayName: ({ translate, itemType }) => {
      if (itemType) {
        return createNameWithTranslate({ key: itemFullNameKeys[itemType] }, translate);
      }
      return createNameWithTranslate({ key: 'Heading.AssociatedItems' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AssociatedItems,
    getLinkPath: (getLinkPathParams) => {
      if (getLinkPathParams?.associatedItemType === Item.DeveloperProduct) {
        return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/developer-products`;
      }

      if (getLinkPathParams?.associatedItemType === Item.ExperienceSubscription) {
        return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/subscriptions`;
      }

      if (getLinkPathParams?.associatedItemType === Item.GamePass) {
        return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/passes`;
      }

      return getLinkPathParams?.associatedItemType
        ? `/dashboard/creations/experiences/${getLinkPathParams.baseId}/associated-items?activeTab=${getLinkPathParams.associatedItemType}`
        : `/dashboard/creations/experiences/${getLinkPathParams.baseId}/associated-items`;
    },
  },
  catalog: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Creations' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Catalog,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/catalog/${getLinkPathParams.assetId}/configure`;
    },
    withId: true,
  },
  store: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Creations' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CreatorStore,
    getLinkPath: getCreatorStoreItemConfigurePathFromLinkPath,
    withId: true,
  },
  'version-history': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.VersionHistory' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CreatorStore,
    getLinkPath: getCreatorStoreItemConfigurePathFromLinkPath,
    withId: false,
  },
  localization: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Localization' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Localization,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/localization`;
    },
  },
  'activity-history': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ActivityFeed' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ActivityHistory,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/activity-history`;
    },
  },
  activityFeed: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ActivityFeed' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ActivityHistory,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/activity-history`;
    },
  },
  notifications: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Notifications' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Notifications,
    getLinkPath: (getLinkPathParams) => {
      if (getLinkPathParams.baseId) {
        return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/notifications`;
      }
      // Differentiate notifications for creations and creators
      return '/settings/notifications';
    },
  },
  update: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Notifications.UpdateContent' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Notifications,
  },
  'social-links': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.SocialLinks' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.SocialLinks,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/social-links`;
    },
  },
  updates: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Updates' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Updates,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/updates`;
    },
  },
  translation: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Translation' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Translation,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/associated-items`;
    },
  },
  overview: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Overview' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Overview,
  },
  passes: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.GamePass' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.GamePass,
    parentItemTypeName: 'associated-items',
    withId: true,
  },
  'developer-products': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.DeveloperProduct' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.DeveloperProduct,
    withId: true,
    parentItemTypeName: 'associated-items',
  },
  'external-purchase-settings': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ExternalPurchaseSettings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ExternalPurchaseSettings,
  },
  'avatar-items': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Label.ThirdPartyAvatarItemCommissions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
  },
  'free-avatars': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Label.FreeAvatars' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.FreeAvatars,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getFreeAvatarsUrl(Number(getLinkPathParams.baseId));
    },
  },
  'avatar-creation-tokens': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AvatarCreationTokens' }, translate);
    },
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getMonetizationAvatarCreationTokensUrl(
        Number(getLinkPathParams.baseId),
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
  },
  subscriptions: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Label.Subscriptions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
  },
  commerce: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Commerce' }, translate);
    },
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getMonetizationCommerceUrl(Number(getLinkPathParams.baseId));
    },
    breadcrumbType: BreadcrumbItemType.Commerce,
  },
  'create-products': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CreateProduct' }, translate);
    },
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getMonetizationCommerceCreateProductUrl(
        Number(getLinkPathParams.baseId),
      );
    },
    breadcrumbType: BreadcrumbItemType.CreateProducts,
  },
  eligibility: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Eligibility' }, translate);
    },
    getLinkPath: () => {
      return `/settings/eligibility`;
    },
    breadcrumbType: BreadcrumbItemType.Eligibility,
  },
  'priced-assets': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PricedAssets' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PricedAssets,
  },
  'audio-distribution': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AudioDistribution' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AudioDistribution,
  },
  'paid-access': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PaidAccess' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PaidAccess,
  },
  'extended-services': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ExtendedServices' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ExtendedServices,
  },
  'public-publish': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PublicPublish' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PublicPublish,
  },
  'publishing-permissions': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PublishingPermissions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PublishingPermissions,
  },
  'us-o18-devex-rate': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.DevExO18UsSettingsNav' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.UsO18DevexRate,
  },
  'contribution-report': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ContributionReports' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ContributionReport,
  },
  acquisition: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Acquisition' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsAcquisition,
  },
  engagement: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Engagement' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsEngagement,
  },
  retention: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Retention' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsRetention,
  },
  monetization: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Monetization' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getMonetizationOverviewUrl(Number(getLinkPathParams.baseId));
    },
  },
  performance: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsPerformanceNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsPerformance,
  },
  crashes: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: analyticsCrashesNavigationItem.title.key }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsCrashes,
  },
  audience: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        {
          key: analyticsAudienceNavigationItem.title.key,
        },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsAudience,
  },
  economy: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        {
          key: analyticsRecommendedEventsEconomyNavigationItem.title.key,
        },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsEconomy,
  },
  funnels: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        {
          key: analyticsRecommendedEventsFunnelsNavigationItem.title.key,
        },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsFunnels,
  },
  errors: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsErrorReportNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsErrorReport,
  },
  'memory-stores': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsMemoryStoresNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMemoryStores,
  },
  'data-stores': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsDataStoresNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsDataStores,
  },
  leaderboard: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Leaderboard' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Leaderboard,
  },
  'http-service': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsHttpServiceNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsHttpServicce,
  },
  'messaging-service': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsMessagingServiceNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMessagingService,
  },
  'speech-to-text': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsSpeechToTextNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsSpeechToText,
  },
  'text-to-speech': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsTextToSpeechNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsTextToSpeech,
  },
  'video-service': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsVideoServiceNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsVideoService,
  },
  'generative-ai': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsGenerativeAINavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsGenerativeAI,
  },
  custom: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsCustomEventsNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticCustomEvents,
  },
  explore: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: analyticsExploreNavigationItem.title.key }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsExploreMode,
  },
  dashboards: {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsCustomDashboardsManageNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsCustomDashboards,
  },
  'managed-pricing': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ManagedPricing' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ManagedPricing,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/managed-pricing`;
    },
  },
  shop: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PersonalizedShop' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PersonalizedShop,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/shop`;
    },
  },
  'hard-coded-prices': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.HardCodedPrices' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.HardCodedPrices,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/hard-coded-prices`;
    },
  },
  'price-optimization': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PriceOptimization' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PriceOptimization,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/price-optimization`;
    },
  },
  'price-check': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.DynamicPriceCheck' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PriceCheck,
  },
  'immersive-ads': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Ads' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ImmersiveAds,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getMonetizationImmersiveAdsUrl(Number(getLinkPathParams.baseId));
    },
  },
  'create-placement': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AdsCreatePlacement' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ImmersiveAdsCreatePlacement,
  },
  'creator-rewards': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CreatorRewards' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/creator-rewards`;
    },
  },
  'roblox-plus': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.RobloxPlusDeveloperProgram' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AnalyticsMonetization,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/monetization/roblox-plus`;
    },
  },
  'experience-questionnaire': {
    displayName: ({ translate, enableQuestionnaireV2 }) => {
      let key = 'Heading.ExperienceQuestionnaire';
      if (enableQuestionnaireV2) {
        key = 'Heading.ContentRatings';
      }
      return createNameWithTranslate({ key }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Questionnaire,
  },
  guidelines: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Guidelines' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Questionnaire,
  },
  configure: {
    displayName: ({ translate, itemType }) => {
      if (
        itemType === Item.CatalogAsset ||
        itemType === Item.LibraryAsset ||
        itemType === Item.Bundle ||
        itemType === Item.Event ||
        itemType === Item.AvatarCreationToken ||
        itemType === Item.Environment ||
        itemType === Item.Look
      ) {
        return createNameWithTranslate({ key: 'Heading.Configure' }, translate);
      }
      if (itemType === Item.Game) {
        return createNameWithTranslate({ key: 'Heading.ContentSettings' }, translate);
      }
      if (itemType === Item.ExperienceSubscription) {
        return createNameWithTranslate({ key: 'Heading.UpdateSubscription' }, translate);
      }
      if (itemType === Item.Alert) {
        return createNameWithTranslate({ key: 'Heading.ConfigureAlert' }, translate);
      }
      return createNameWithTranslate({ key: 'Heading.BasicSettings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Configure,
  },
  'communication-settings': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CommunicationSettings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CommunicationSettings,
    getLinkPath: (getLinkPathParams) => {
      return `/creations/experiences/${getLinkPathParams.baseId}/communication-settings`;
    },
  },
  sales: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Sales' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Sales,
  },
  promotions: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Promotions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Promotions,
  },
  create: {
    displayName: ({ translate, itemType }) => {
      if (itemType) {
        return createNameWithTranslate(
          {
            key: 'Heading.Create',
            args: {
              param: 'itemType',
              value: itemTypeToSingularNameKeys[itemType],
            },
          },
          translate,
        );
      }
      return createNameWithTranslate({ key: 'Heading.Create' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Create,
  },
  places: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Places' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Places,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/places`;
    },
    parentItemTypeName: 'places',
    withId: true,
  },
  environments: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Environments' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Environments,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/environments`;
    },
    parentItemTypeName: 'environments',
    withId: true,
  },
  new_environment: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Action.CreateEnvironment' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Environments,

    parentItemTypeName: 'environments',
  },
  manage: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Manage' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Manage,
  },
  icon: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Icon' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Icon,
  },
  events: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Events' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Event,
    withId: true,
    parentItemTypeName: 'events',
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/events`;
    },
  },
  'select-eligibility': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Title.SelectEligibility' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.SelectEligibility,
  },
  thumbnails: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PlaceThumbnails' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Thumbnails,
  },
  videos: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PlaceVideos' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Videos,
  },
  access: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AccessSettings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Access,
  },
  secrets: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Secrets' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Secrets,
  },
  matchmaking: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CustomMatchmaking' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CustomMatchmaking,
    getLinkPath: (getLinkPathParams) => {
      return dashboard.getCustomMatchmakingDashboardUrl(Number(getLinkPathParams.baseId));
    },
  },
  'server-management': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ServerManagement' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ServerManagement,
    getLinkPath: (getLinkPathParams) => {
      return dashboard.getServerManagementUrl(Number(getLinkPathParams.baseId));
    },
  },
  'create-configuration': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CreateConfiguration' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CreateMatchmakingConfiguration,
  },
  'edit-configuration': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.EditConfiguration' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.EditMatchmakingConfiguration,
  },
  'create-attribute': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.CreateAttribute' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.CreateMatchmakingAttribute,
    getLinkPath: (getLinkPathParams) => {
      return dashboard.getCustomMatchmakingAttributeCreationUrl(Number(getLinkPathParams.baseId));
    },
  },
  'edit-player-attribute': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.EditPlayerAttribute' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.EditMatchmakingPlayerAttribute,
  },
  'edit-server-attribute': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.EditServerAttribute' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.EditMatchmakingServerAttribute,
  },
  settings: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Settings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Settings,
  },
  permissions: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Permissions' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Permissions,
  },
  webhooks: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Webhooks' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Webhooks,
  },
  'data-collection': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.DataSharing' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.DataSharing,
  },
  '[notificationCategory]': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Notifications' }, translate);
    },
    withId: true,
    breadcrumbType: BreadcrumbItemType.Category,
  },
  preferences: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Preferences' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Preferences,
  },
  advanced: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Header.Title' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Advanced,
  },
  // TODO (yinanzhao): Modify once we add the translation strings
  bans: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Bans' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Bans,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getUserBansUrl(Number(getLinkPathParams.baseId));
    },
  },
  add: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AddUsersToBan' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Add,
  },
  reorder: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Reorder' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Reorder,
  },
  feedback: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Feedback' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Feedback,
  },
  'api-settings': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.APISettings' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ApiSettings,
  },
  configs: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Configs' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Configs,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getAnalyticsConfigsUrl(Number(getLinkPathParams.baseId));
    },
  },
  experiments: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Experiments' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Experiments,
    getLinkPath: (getLinkPathParams) => {
      return creatorHub.dashboard.getExperimentsUrl(Number(getLinkPathParams.baseId));
    },
  },
  'experiment-create': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ExperimentCreate' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ExperimentCreate,
  },
  'experiment-details': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ExperimentDetails' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ExperimentDetails,
    withId: true,
  },
  alerts: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Alerts' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Alerts,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/alerts`;
    },
    parentItemTypeName: 'alerts',
    withId: true,
  },
  history: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ConfigsHistory' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ConfigsHistory,
  },
  'config-create': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.ConfigCreate' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.ConfigCreate,
  },
  variants: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Variants' }, translate);
    },
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/catalog/${getLinkPathParams.assetId}/variants`;
    },
    breadcrumbType: BreadcrumbItemType.Catalog,
  },
  look: {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.Creations' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.Look,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/look/${getLinkPathParams.lookId}/configure`;
    },
    withId: true,
  },
  'audience-reach': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.AudienceReach' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.AudienceReach,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/audience-reach`;
    },
  },
  'player-support': {
    displayName: ({ translate }) => {
      return createNameWithTranslate({ key: 'Heading.PlayerSupport' }, translate);
    },
    breadcrumbType: BreadcrumbItemType.PlayerSupport,
    getLinkPath: (getLinkPathParams) => {
      return `/dashboard/creations/experiences/${getLinkPathParams.baseId}/player-support`;
    },
  },
  '[ticketId]': {
    // Intentionally renders no leaf crumb: this entry exists only so the parent
    // "Player Support" segment is no longer the trailing crumb and is rendered as
    // a link back to the support requests list. Empty-named trailing crumbs are
    // skipped by AppBreadcrumbs.
    displayName: () => '',
    breadcrumbType: BreadcrumbItemType.PlayerSupportTicket,
  },
  'recommendation-service': {
    displayName: ({ translate }) => {
      return createNameWithTranslate(
        { key: analyticsRecommendationServiceNavigationItem.title.key },
        translate,
      );
    },
    breadcrumbType: BreadcrumbItemType.RecommendationService,
  },
};
