/* oxlint-disable typescript/prefer-nullish-coalescing -- this file inherits master's `||` defaults for `boolean | undefined` setting chains; flipping every site to `??` would change semantics. Justified per file-level rather than annotating each site. */
import type { ResolvedUniversePermissionsResponse } from '@rbx/client-organizations-service-api/v1';
import type { Locale } from '@rbx/intl';
import { OpenInNewIcon } from '@rbx/ui';
import {
  analyticsAgentNavigationItem,
  analyticsAudienceNavigationItem,
  analyticsConfigsNavigationItem,
  analyticsCrashesNavigationItem,
  analyticsCustomDashboardsManageNavigationItem,
  analyticsDataStoresNavigationItem,
  analyticsExploreNavigationItem,
  analyticsEngagementNavigationItem,
  analyticsErrorReportNavigationItem,
  analyticsExperienceCreatorRewardsNavigationItem,
  analyticsGenerativeAINavigationItem,
  analyticsExperimentsNavigationItem,
  analyticsHttpServiceNavigationItem,
  analyticsImmersiveAdsNavigationItem,
  analyticsItemMonetizationAvatarItemsNavigationItem,
  analyticsItemFreeAvatarsNavigationItem,
  analyticsItemMonetizationDeveloperProductsNavigationItem,
  analyticsItemMonetizationPassesNavigationItem,
  analyticsMatchmakingNavigationItem,
  analyticsMemoryStoresNavigationItem,
  analyticsMessagingServiceNavigationItem,
  analyticsBountyPayoutsNavigationItem,
  analyticsPerformanceNavigationItem,
  analyticsAvatarCreationTokensNavigationItem,
  analyticsRecommendationServiceNavigationItem,
  analyticsRecommendedEventsEconomyNavigationItem,
  analyticsRecommendedEventsFunnelsNavigationItem,
  analyticsRecommendedEventsJourneyNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsSpeechToTextNavigationItem,
  analyticsSubscriptionsNavigationItem,
  analyticsTextToSpeechNavigationItem,
  analyticsVideoServiceNavigationItem,
  analyticsUserAcquisitionNavigationItem,
  analyticsAlertsNavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsNavigationNewBadge from '@modules/experience-analytics-shared/components/AnalyticsNavigationNewBadge';
import ExploreModeNewChip from '@modules/experience-analytics-shared/components/ExploreModeNewChip';
import type { AnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import SubscriptionsNewChip from '@modules/experience-navigation/components/SubscriptionsNewChip';
import ManagedPricingNewChip from '@modules/managed-pricing/common/ManagedPricingNewChip';
import { Item } from '@modules/miscellaneous/common';
import { www } from '@modules/miscellaneous/urls';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import PlayerSupportNewChip from '@modules/player-support/components/PlayerSupportNewChip';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import PersonalizedShopsNewChip from '@modules/shops/components/PersonalizedShopsNewChip';
import AnalyticsPageNewChip from './components/AnalyticsPageNewChip';
import type CreationsCustomSettings from './interfaces/CreationsCustomSettings';

const { getSponsorExperienceUrl } = www;
export type CreationsFeatureSettings = TSettings &
  CreationsCustomSettings & {
    canConfigure: boolean;
    canConfigureExperienceEvents: boolean;
    isStudioCompatible: boolean;
    permissions: ResolvedUniversePermissionsResponse | null;
    canManageWebhooks: boolean;
    locale: Locale | null;
    shouldUseQuestionnaireV2?: boolean;
    shouldHideSocialLinksSection: boolean;
    canGetSelectEligibilityData: boolean;
    isExperienceAlertsEnabled: boolean;
    enablePlayerSupport: boolean;
    isAnalyticsAssistantChatEnabled: boolean;
    isCustomDashboardsEnabled: boolean;
    isLeaderboardConfigsEnabled: boolean;
    showVideoServiceDashboard: boolean;
    isJourneysEnabled: boolean;
  } & Pick<
    AnalyticsExperiencePermissions,
    'userCanViewAnalyticsForUniverse' | 'userCanManageAnalyticsAlertForUniverse'
  >;

const NO_HEADER_SECTION_TITLE_KEY = undefined;
export const GameLeftNavigationSectionTitleKeys = [
  NO_HEADER_SECTION_TITLE_KEY,
  'Heading.Content',
  'Heading.Access',
  'Heading.Community',
  'Heading.RealtimeMonitoring',
  'Heading.Analytics',
  'Heading.Monetization',
  'Heading.Advertisements',
  'Heading.Other',
];

function isSomeSubFeaturesEnabled(
  subFeatures: Feature<CreationsFeatureSettings>[],
  settings?: CreationsFeatureSettings,
) {
  return subFeatures.some(({ isEnabledOnSettings }) =>
    isEnabledOnSettings ? isEnabledOnSettings(settings) : true,
  );
}

export const creationsFeatureManager = new NavigationFeatureManager<CreationsFeatureSettings>(
  '/dashboard/creations/experiences/[id]',
);

const overviewFeature: Feature = {
  key: 'overview',
  nameKey: 'Heading.Overview',
  path: '/overview',
};

const analyticsAgentFeature: Feature<CreationsFeatureSettings> = {
  key: 'analyticsAgent',
  nameKey: analyticsAgentNavigationItem.title.key,
  path: '/analytics/agent',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.isAnalyticsAssistantChatEnabled && settings?.userCanViewAnalyticsForUniverse) ??
    false,
};

// Content

const contentSettingsFeature: Feature<CreationsFeatureSettings> = {
  key: 'contentSettings',
  nameKey: 'Heading.ContentSettings',
  path: '/configure',
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const placesFeature: Feature<CreationsFeatureSettings> = {
  key: 'places',
  nameKey: 'Heading.Places',
  path: '/places',
  subPath: '/places/manage',
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const environmentsFeature: Feature<CreationsFeatureSettings> = {
  key: 'environments',
  nameKey: 'Heading.Environments',
  path: '/environments',
  subPath: '/environments/new_environment',
  altMatchPaths: ['/environments/new_environment', /\/environments\/[^/]+\/configure$/],
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.canConfigure && settings?.enableEnvironments) ?? false,
};

const assetPermissionsFeature: Feature<CreationsFeatureSettings> = {
  key: 'permissions',
  nameKey: 'Heading.Permissions', // in TranslationNamespace.Navigation
  path: '/permissions',
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const localizationFeature: Feature<CreationsFeatureSettings> = {
  key: 'localization',
  nameKey: 'Heading.Localization',
  path: '/localization',
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const activityFeedFeature: Feature<CreationsFeatureSettings> = {
  key: 'activityFeed',
  nameKey: 'Heading.ActivityFeed',
  path: '/activity-history',
};

const playerSupportFeature: Feature<CreationsFeatureSettings> = {
  key: 'playerSupport',
  nameKey: 'Heading.PlayerSupport',
  path: '/player-support',
  adornment: <PlayerSupportNewChip />,
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.enablePlayerSupport ?? false,
};

// Access

const accessFeature: Feature<CreationsFeatureSettings> = {
  key: 'access',
  nameKey: 'Heading.AccessSettings',
  path: '/access',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const communicationSettingsFeature: Feature<CreationsFeatureSettings> = {
  key: 'communication-settings',
  nameKey: 'Heading.CommunicationSettings',
  path: '/communication-settings',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const matchmakingFeature: Feature<CreationsFeatureSettings> = {
  key: 'matchmaking',
  nameKey: 'Heading.CustomMatchmaking',
  path: '/matchmaking',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
  adornment: <AnalyticsPageNewChip pagePath={analyticsMatchmakingNavigationItem.path} />,
};

const serverManagementFeature: Feature<CreationsFeatureSettings> = {
  key: 'serverManagement',
  nameKey: 'Heading.ServerManagement',
  path: '/server-management',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

// Secrets

const secretsFeature: Feature<CreationsFeatureSettings> = {
  key: 'secrets',
  nameKey: 'Heading.Secrets',
  path: '/secrets',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const webhooksFeature: Feature<CreationsFeatureSettings> = {
  key: 'webhooks',
  nameKey: 'Heading.Webhooks',
  path: '/webhooks',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' &&
    (settings?.canManageWebhooks ?? false) &&
    (settings?.isExperienceWebhooksEnabled ?? false),
};

const dataStoresManagerFeature: Feature<CreationsFeatureSettings> = {
  key: 'dataStoresManager',
  nameKey: 'Heading.DataStoresManager',
  path: '/analytics/data-stores',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const leaderboardFeature: Feature<CreationsFeatureSettings> = {
  key: 'leaderboard',
  nameKey: 'Heading.Leaderboard',
  path: '/leaderboard',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' &&
    (settings?.permissions?.publish ?? false) &&
    (settings?.isLeaderboardConfigsEnabled ?? false),
};

const extendedServicesUnlockFeature: Feature<CreationsFeatureSettings> = {
  key: 'extendedServicesUnlock',
  nameKey: 'Heading.ExtendedServices',
  path: '/extended-services',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const experienceQuestionnaireFeature: Feature<CreationsFeatureSettings> = {
  key: 'experienceQuestionnaire',
  nameKey: 'Heading.ExperienceQuestionnaire',
  path: '/experience-questionnaire',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' &&
    (settings?.canConfigure ?? false) &&
    !settings?.shouldUseQuestionnaireV2,
};

const maturityAndComplianceFeature: Feature<CreationsFeatureSettings> = {
  key: 'maturityAndCompliance',
  nameKey: 'Heading.MaturityAndComplianceQuestionnaireV2',
  path: '/experience-questionnaire',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    process.env.buildTarget !== 'luobu' &&
    (settings?.canConfigure ?? false) &&
    (settings?.shouldUseQuestionnaireV2 ?? false),
};

const feedbackFeature: Feature<CreationsFeatureSettings> = {
  key: 'feedback',
  nameKey: 'Heading.Feedback',
  path: '/feedback',
  sectionTitleKey: 'Heading.Access',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.enablePlayerFeedback && settings?.userCanViewAnalyticsForUniverse) ?? false,
};

//  Engagement

const eventsAndUpdatesFeature: Feature<CreationsFeatureSettings> = {
  key: 'eventsAndUpdates',
  nameKey: 'Heading.EEEventsAndUpdates',
  path: '/events',
  sectionTitleKey: 'Heading.Community',
  isEnabledOnSettings: (settings) =>
    ((settings?.canConfigureExperienceEvents ?? false) &&
      (settings?.isExperienceCreatedByCurrentUserOrGroup ?? false)) ||
    (settings?.userCanViewAnalyticsForUniverse ?? false),
};

const socialLinkFeature: Feature<CreationsFeatureSettings> = {
  key: 'socialLinks',
  nameKey: 'Heading.SocialLinks',
  path: '/social-links',
  sectionTitleKey: 'Heading.Community',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget !== 'luobu' &&
    (settings?.canConfigure ?? false) &&
    !settings?.shouldHideSocialLinksSection,
};

const notificationsFeature: Feature<CreationsFeatureSettings> = {
  key: 'notifications',
  nameKey: 'Heading.Notifications',
  path: '/notifications',
  sectionTitleKey: 'Heading.Community',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const recommendationServiceFeature: Feature<CreationsFeatureSettings> = {
  key: 'recommendationService',
  nameKey: 'Heading.RecommendationService',
  path: '/recommendation-service',
  sectionTitleKey: 'Heading.Community',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
  adornment: <AnalyticsPageNewChip pagePath={analyticsRecommendationServiceNavigationItem.path} />,
};

// Analytics

const retentionFeature: Feature<CreationsFeatureSettings> = {
  key: 'retention',
  nameKey: analyticsRetentionNavigationItem.title.key,
  path: '/analytics/retention',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const engagementFeature: Feature<CreationsFeatureSettings> = {
  key: 'engagement',
  nameKey: analyticsEngagementNavigationItem.title.key,
  path: '/analytics/engagement',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const userAcquisitionFeature: Feature<CreationsFeatureSettings> = {
  key: 'userAcquisition',
  nameKey: analyticsUserAcquisitionNavigationItem.title.key,
  path: '/analytics/acquisition',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const audienceFeature: Feature<CreationsFeatureSettings> = {
  key: 'audience',
  nameKey: analyticsAudienceNavigationItem.title.key,
  path: '/analytics/audience',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const recommendedEventsEconomyFeature: Feature<CreationsFeatureSettings> = {
  key: 'economy',
  nameKey: analyticsRecommendedEventsEconomyNavigationItem.title.key,
  path: '/analytics/economy',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const recommendedEventsFunnelsFeature: Feature<CreationsFeatureSettings> = {
  key: 'funnels',
  nameKey: analyticsRecommendedEventsFunnelsNavigationItem.title.key,
  path: '/analytics/funnels',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const journeysFeature: Feature<CreationsFeatureSettings> = {
  key: 'journeys',
  nameKey: analyticsRecommendedEventsJourneyNavigationItem.title.key,
  path: '/analytics/journeys',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.isJourneysEnabled && settings?.userCanViewAnalyticsForUniverse) ?? false,
};

const exploreModeFeature: Feature<CreationsFeatureSettings> = {
  key: 'explore',
  nameKey: analyticsExploreNavigationItem.title.key,
  path: '/analytics/explore',
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
  adornment: <ExploreModeNewChip />,
};

const selectEligibility: Feature<CreationsFeatureSettings> = {
  key: 'selectEligibility',
  nameKey: 'Title.SelectEligibility',
  path: '/analytics/select-eligibility',
  sectionTitleKey: 'Title.SelectEligibility',
  isEnabledOnSettings: () => false,
};

const remoteConfigsFeature: Feature<CreationsFeatureSettings> = {
  key: 'remoteConfigs',
  nameKey: analyticsConfigsNavigationItem.title.key,
  path: '/configs',
  subPath: '/configs/history',
  altMatchPaths: ['/configs/config-create'],
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  adornment: <AnalyticsPageNewChip pagePath={analyticsConfigsNavigationItem.path} />,
};

const experimentsFeature: Feature<CreationsFeatureSettings> = {
  key: 'experiments',
  nameKey: analyticsExperimentsNavigationItem.title.key,
  path: '/experiments',
  altMatchPaths: ['/experiments/experiment-create', /\/experiments\/[^/]+\/experiment-details$/],
  sectionTitleKey: 'Heading.Analytics',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
  adornment: <AnalyticsPageNewChip pagePath={analyticsExperimentsNavigationItem.path} />,
};

const alertsFeature: Feature<CreationsFeatureSettings> = {
  key: 'alerts',
  nameKey: analyticsAlertsNavigationItem.title.key,
  path: analyticsAlertsNavigationItem.path,
  altMatchPaths: ['/alerts/create', /\/alerts\/[^/]+\/configure$/],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.isExperienceAlertsEnabled ?? false) &&
    (settings?.userCanManageAnalyticsAlertForUniverse ?? false),
  adornment: <AnalyticsPageNewChip pagePath={analyticsAlertsNavigationItem.path} />,
};

// Monetization
const monetizationOverviewFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationOverview',
  nameKey: 'Heading.Overview',
  path: '/monetization/overview',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const monetizationPriceOptimizationFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationPriceOptimization',
  nameKey: 'Heading.PriceOptimization',
  path: '/monetization/price-optimization',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience &&
      !settings?.isManagedPricingEnabled && // Only display if managed pricing is not enabled as we are migrating
      settings?.isPriceOptimizationEnabled) ??
    false,
};

const monetizationManagedPricingFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationManagedPricing',
  nameKey: 'Heading.ManagedPricing',
  path: '/monetization/managed-pricing',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (((settings?.permissions?.monetizeExperience ?? false) ||
      (settings?.permissions?.viewAnalytics ?? false)) &&
      settings?.isManagedPricingEnabled) ??
    false,
  adornment: <ManagedPricingNewChip />,
};

const monetizationPersonalizedShopFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationPersonalizedShop',
  nameKey: 'Heading.PersonalizedShop',
  path: '/monetization/shop',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience || settings?.permissions?.viewAnalytics) ?? false,
  adornment: <PersonalizedShopsNewChip />,
};

const monetizationDeveloperProductsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationDevProduct',
  nameKey: analyticsItemMonetizationDeveloperProductsNavigationItem.title.key,
  path: '/monetization/developer-products',
  subPath: '/monetization/developer-products/external-purchase-settings',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience ?? false) ||
    (settings?.userCanViewAnalyticsForUniverse ?? false),
};

const monetizationGamePassesFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationGamePasses',
  nameKey: analyticsItemMonetizationPassesNavigationItem.title.key,
  path: '/monetization/passes',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience ?? false) ||
    (settings?.userCanViewAnalyticsForUniverse ?? false),
};

const monetizationAvatarItemsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationAvatarItems',
  nameKey: analyticsItemMonetizationAvatarItemsNavigationItem.title.key,
  path: '/monetization/avatar-items',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience ?? false) ||
    (settings?.userCanViewAnalyticsForUniverse ?? false),
};

const freeAvatarsFeature: Feature<CreationsFeatureSettings> = {
  key: 'freeAvatars',
  nameKey: analyticsItemFreeAvatarsNavigationItem.title.key,
  path: '/free-avatars',
  sectionTitleKey: 'Heading.Engagement',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.canConfigure ?? false) &&
    (settings?.userCanViewAnalyticsForUniverse ?? false) &&
    (settings?.isFreeAvatarSystemEnabled ?? false),
};

const monetizationImmersiveAdsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationImmersiveAds',
  nameKey: analyticsImmersiveAdsNavigationItem.title.key,
  path: '/monetization/immersive-ads',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const monetizationSubscriptionsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationExperienceSubscriptions',
  nameKey: analyticsSubscriptionsNavigationItem.title.key,
  path: '/monetization/subscriptions',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.permissions?.monetizeExperience ?? false) ||
    (settings?.userCanViewAnalyticsForUniverse ?? false),
  adornment: <SubscriptionsNewChip />,
};

const monetizationCommerceFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationCommerce',
  nameKey: 'Heading.Commerce',
  path: '/monetization/commerce',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) => settings?.canConfigure ?? false,
};

const monetizationCreatorRewardsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationCreatorRewards',
  nameKey: analyticsExperienceCreatorRewardsNavigationItem.title.key,
  path: '/monetization/creator-rewards',
  sectionTitleKey: 'Heading.CreatorRewards',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};
const monetizationBountyPayoutsFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationBountyPayouts',
  nameKey: analyticsBountyPayoutsNavigationItem.title.key,
  path: '/monetization/roblox-plus',
  sectionTitleKey: 'Heading.Monetization',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const monetizationAvatarCreationTokensFeature: Feature<CreationsFeatureSettings> = {
  key: 'monetizationAvatarCreationTokens',
  nameKey: analyticsAvatarCreationTokensNavigationItem.title.key,
  path: '/monetization/avatar-creation-tokens',
  sectionTitleKey: 'Heading.Monetization',
};

// Advertisements
const sponsorLink: Feature<CreationsFeatureSettings> = {
  adornment: <OpenInNewIcon fontSize='small' />,
  getExternalPath: getSponsorExperienceUrl,
  key: 'sponsor',
  nameKey: 'Heading.Sponsor',
  path: '',
  sectionTitleKey: 'Heading.Advertisements',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

// Realtime Monitoring

const performanceFeature: Feature<CreationsFeatureSettings> = {
  key: 'performance',
  nameKey: analyticsPerformanceNavigationItem.title.key,
  path: '/analytics/performance',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const crashesFeature: Feature<CreationsFeatureSettings> = {
  key: 'crashes',
  nameKey: analyticsCrashesNavigationItem.title.key,
  path: analyticsCrashesNavigationItem.path,
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const errorReportFeature: Feature<CreationsFeatureSettings> = {
  key: 'errorReport',
  nameKey: analyticsErrorReportNavigationItem.title.key,
  path: '/analytics/errors',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
  adornment: <AnalyticsPageNewChip pagePath={analyticsErrorReportNavigationItem.path} />,
};

const memoryStoresFeature: Feature<CreationsFeatureSettings> = {
  key: 'memoryStores',
  nameKey: analyticsMemoryStoresNavigationItem.title.key,
  path: '/analytics/memory-stores',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const speechToTextFeature: Feature<CreationsFeatureSettings> = {
  key: 'speechToText',
  nameKey: analyticsSpeechToTextNavigationItem.title.key,
  path: '/analytics/speech-to-text',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const textToSpeechFeature: Feature<CreationsFeatureSettings> = {
  key: 'textToSpeech',
  nameKey: analyticsTextToSpeechNavigationItem.title.key,
  path: '/analytics/text-to-speech',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const dataStoresFeature: Feature<CreationsFeatureSettings> = {
  key: 'dataStores',
  nameKey: analyticsDataStoresNavigationItem.title.key,
  path: '/analytics/data-stores',
  query: { activeTab: 'Dashboard' },
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const httpServiceFeature: Feature<CreationsFeatureSettings> = {
  key: 'httpServicce',
  nameKey: analyticsHttpServiceNavigationItem.title.key,
  path: '/analytics/http-service',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const messagingServiceFeature: Feature<CreationsFeatureSettings> = {
  key: 'messagingService',
  nameKey: analyticsMessagingServiceNavigationItem.title.key,
  path: '/analytics/messaging-service',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const videoServiceFeature: Feature<CreationsFeatureSettings> = {
  key: 'videoService',
  nameKey: analyticsVideoServiceNavigationItem.title.key,
  path: '/analytics/video-service',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
  adornment: <AnalyticsPageNewChip pagePath={analyticsVideoServiceNavigationItem.path} />,
};

const generativeAIFeature: Feature<CreationsFeatureSettings> = {
  key: 'generativeAI',
  nameKey: analyticsGenerativeAINavigationItem.title.key,
  path: '/analytics/generative-ai',
  sectionTitleKey: 'Heading.RealtimeMonitoring',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

// Safety
const safetyOverviewFeature: Feature<CreationsFeatureSettings> = {
  key: 'safety',
  nameKey: 'Heading.Overview',
  path: '/safety/overview',
  sectionTitleKey: 'Heading.Safety',
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    settings?.userCanViewAnalyticsForUniverse ?? false,
};

const bansFeature: Feature<CreationsFeatureSettings> = {
  key: 'bans',
  nameKey: 'Heading.Bans',
  path: '/safety/bans',
  subPath: '/safety/bans/add',
  sectionTitleKey: 'Heading.Safety',
};

const safetyCollaboratorsFeature: Feature<CreationsFeatureSettings> = {
  key: 'safetyCollaborators',
  nameKey: 'Tab.Collaborators',
  path: '/safety/collaborators',
  sectionTitleKey: 'Heading.Safety',
};

// ============= V2 Nav Layout ========================================
// Overview
creationsFeatureManager.addFeature(overviewFeature);
creationsFeatureManager.addFeature(analyticsAgentFeature);
// Configure
const contentSettingsFeatureV2 = { ...contentSettingsFeature, nameKey: 'Heading.Settings' };
const configureCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'configureCategory',
  nameKey: 'Heading.Configure',
  subFeatures: [
    contentSettingsFeatureV2,
    placesFeature,
    environmentsFeature,
    matchmakingFeature,
    serverManagementFeature,
    assetPermissionsFeature,
    remoteConfigsFeature,
    experimentsFeature,
    alertsFeature,
    secretsFeature,
    webhooksFeature,
    dataStoresManagerFeature,
    leaderboardFeature,
    extendedServicesUnlockFeature,
    experienceQuestionnaireFeature,
    maturityAndComplianceFeature,
  ],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    configureCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(configureCategoryFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(configureCategoryFeature);

// Analytics
const analyticsFeature: Feature<CreationsFeatureSettings> = {
  key: 'analyticsCategory',
  nameKey: 'Heading.Analytics',
  subFeatures: [
    retentionFeature,
    engagementFeature,
    userAcquisitionFeature,
    audienceFeature,
    recommendedEventsEconomyFeature,
    recommendedEventsFunnelsFeature,
    journeysFeature,
    exploreModeFeature,
    selectEligibility,
  ],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    analyticsFeature.subFeatures
      ? isSomeSubFeaturesEnabled(analyticsFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(analyticsFeature);

// Custom Dashboards

export const customDashboardsManageFeature: Feature<CreationsFeatureSettings> = {
  key: 'customDashboardsManage',
  nameKey: 'Label.ManageAll',
  path: analyticsCustomDashboardsManageNavigationItem.path,
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    (settings?.userCanViewAnalyticsForUniverse && settings?.isCustomDashboardsEnabled) ?? false,
  adornment: (
    <AnalyticsNavigationNewBadge pagePath={analyticsCustomDashboardsManageNavigationItem.path} />
  ),
};

const customDashboardsCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'customDashboardsCategory',
  nameKey: 'Heading.CustomDashboards',
  displayName: 'Custom Dashboards',
  subFeatures: [customDashboardsManageFeature],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    customDashboardsCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(customDashboardsCategoryFeature.subFeatures, settings)
      : false,
};

creationsFeatureManager.addFeature(customDashboardsCategoryFeature);

// Monetization
const monetizationFeatureCategory: Feature<CreationsFeatureSettings> = {
  key: 'monetizationCategory',
  nameKey: 'Heading.Monetization',
  subFeatures: [
    monetizationOverviewFeature,
    monetizationPersonalizedShopFeature,
    monetizationPriceOptimizationFeature,
    monetizationManagedPricingFeature,
    monetizationDeveloperProductsFeature,
    monetizationGamePassesFeature,
    monetizationAvatarItemsFeature,
    monetizationCommerceFeature,
    monetizationImmersiveAdsFeature,
    monetizationSubscriptionsFeature,
    monetizationBountyPayoutsFeature,
    monetizationCreatorRewardsFeature,
    monetizationAvatarCreationTokensFeature,
  ],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    monetizationFeatureCategory.subFeatures
      ? isSomeSubFeaturesEnabled(monetizationFeatureCategory.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(monetizationFeatureCategory);

// Monitoring
const monitorCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'monitorCategory',
  nameKey: 'Heading.Monitoring',
  subFeatures: [
    performanceFeature,
    errorReportFeature,
    crashesFeature,
    memoryStoresFeature,
    speechToTextFeature,
    textToSpeechFeature,
    dataStoresFeature,
    httpServiceFeature,
    messagingServiceFeature,
    videoServiceFeature,
    generativeAIFeature,
  ],
  isEnabledOnSettings: (settings) =>
    monitorCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(monitorCategoryFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(monitorCategoryFeature);

// Activity History
creationsFeatureManager.addFeature(activityFeedFeature);

// Audience
const reachFeature: Feature<CreationsFeatureSettings> = {
  key: 'reach',
  nameKey: 'Heading.Reach',
  path: '/audience-reach',
  isEnabledOnSettings: (settings) =>
    (settings?.canConfigure ?? false) || (settings?.userCanViewAnalyticsForUniverse ?? false),
};

const audienceCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'audienceCategory',
  nameKey: 'Heading.Audience',
  subFeatures: [
    reachFeature,
    feedbackFeature,
    playerSupportFeature,
    accessFeature,
    communicationSettingsFeature,
    localizationFeature,
  ],
  isEnabledOnSettings: (settings) =>
    audienceCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(audienceCategoryFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(audienceCategoryFeature);

// Referral Rewards
const referralRewardsFeature: Feature<CreationsFeatureSettings> = {
  key: 'referralRewardDetails',
  nameKey: 'Heading.ReferralRewards',
  path: '/referral-reward-details',
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

// Engagement
const badgesFeature: Feature<CreationsFeatureSettings> = {
  key: 'badges',
  nameKey: 'Label.Badges',
  path: '/associated-items',
  query: { activeTab: Item.Badge },
  sectionTitleKey: 'Heading.Content',
  isEnabledOnSettings: (settings) =>
    process.env.buildTarget !== 'luobu' && (settings?.canConfigure ?? false),
};

const engagementCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'engagementCategory',
  nameKey: 'Heading.Engagement',
  subFeatures: [
    eventsAndUpdatesFeature,
    freeAvatarsFeature,
    socialLinkFeature,
    notificationsFeature,
    badgesFeature,
    referralRewardsFeature,
    recommendationServiceFeature,
  ],
  isEnabledOnSettings: (settings) =>
    engagementCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(engagementCategoryFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(engagementCategoryFeature);

// Safety
const safetyFeature: Feature<CreationsFeatureSettings> = {
  key: 'safetyCategory',
  nameKey: 'Heading.Safety',
  subFeatures: [safetyOverviewFeature, bansFeature, safetyCollaboratorsFeature],
  isEnabledOnSettings: (settings?: CreationsFeatureSettings) =>
    safetyFeature.subFeatures
      ? isSomeSubFeaturesEnabled(safetyFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(safetyFeature);

// Promotion
const promotionCategoryFeature: Feature<CreationsFeatureSettings> = {
  key: 'promotionCategory',
  nameKey: 'Heading.Promotion',
  subFeatures: [sponsorLink],
  isEnabledOnSettings: (settings) =>
    promotionCategoryFeature.subFeatures
      ? isSomeSubFeaturesEnabled(promotionCategoryFeature.subFeatures, settings)
      : false,
};
creationsFeatureManager.addFeature(promotionCategoryFeature);

export default creationsFeatureManager;
