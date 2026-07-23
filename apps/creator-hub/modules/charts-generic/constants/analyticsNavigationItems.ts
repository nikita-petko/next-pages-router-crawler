import type { TranslationKey } from '@modules/analytics-translations/types';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * These objects represent navigable analytics pages, and should manage linking to
 * analytics-related pages and keeping track of page titles in navigation and headers.
 *
 * Each piece of information here previously was keyed by AnalyticsPageKey.
 * At some point these should converge into the creator hub overall navigation.
 */
export type AnalyticsNavigationItem = {
  readonly path: `/${string}`;
  readonly pathPattern: RegExp;
  readonly title: TranslationKey;
  readonly titleOverrideForIAM2?: TranslationKey;
  /** Parent navigation item representing the group this page belongs to (e.g. Monetization, Analytics Home). */
  readonly group?: AnalyticsNavigationItem;
};

// --- Group-level navigation items (defined first so children can reference them) ---

export const analyticsMonetizationNavigationItem = {
  path: '/monetization/overview',
  pathPattern: /\/monetization\/overview/,
  title: translationKey('Heading.Monetization', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAnalyticsHomeNavigationItem = {
  path: '/dashboard/analytics',
  pathPattern: /\/dashboard\/analytics/,
  title: translationKey('Heading.Analytics', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsExperimentsNavigationItem = {
  path: '/experiments',
  pathPattern: /\/experiments(?!\/)/,
  title: translationKey('Heading.Experiments', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

// --- Child navigation items ---

export const analyticsItemMonetizationDeveloperProductsNavigationItem = {
  path: '/monetization/developer-products',
  pathPattern: /\/monetization\/developer-products/,
  title: translationKey('Label.DeveloperProducts', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsItemMonetizationPassesNavigationItem = {
  path: '/monetization/passes',
  pathPattern: /\/monetization\/passes/,
  title: translationKey('Label.GamePasses', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsItemMonetizationAvatarItemsNavigationItem = {
  path: '/monetization/avatar-items',
  pathPattern: /\/monetization\/avatar-items/,
  title: translationKey('Label.ThirdPartyAvatarItemCommissions', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsItemFreeAvatarsNavigationItem = {
  path: '/free-avatars',
  pathPattern: /\/free-avatars$/,
  title: translationKey('Label.FreeAvatars', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsItemAnalyticsNavigationItem = {
  path: '/creations/catalog',
  pathPattern: /\/creations\/catalog/,
  title: translationKey('Heading.ItemAnalytics', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsImmersiveAdsNavigationItem = {
  path: '/monetization/immersive-ads',
  pathPattern: /\/monetization\/immersive-ads/,
  title: translationKey('Heading.Ads', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsSubscriptionsNavigationItem = {
  path: '/monetization/subscriptions',
  pathPattern: /\/monetization\/subscriptions/,
  title: translationKey('Heading.Subscriptions', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsMemoryStoresNavigationItem = {
  path: '/analytics/memory-stores',
  pathPattern: /\/analytics\/memory-stores/,
  title: translationKey('Heading.MemoryStores', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsDataStoresNavigationItem = {
  path: '/analytics/data-stores',
  pathPattern: /\/analytics\/data-stores/,
  title: translationKey('Heading.DataStores', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsHttpServiceNavigationItem = {
  path: '/analytics/http-service',
  pathPattern: /\/analytics\/http-service/,
  title: translationKey('Heading.HttpService', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsMessagingServiceNavigationItem = {
  path: '/analytics/messaging-service',
  pathPattern: /\/analytics\/messaging-service/,
  title: translationKey('Heading.MessagingService', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsSpeechToTextNavigationItem = {
  path: '/analytics/speech-to-text',
  pathPattern: /\/analytics\/speech-to-text/,
  title: translationKey('Heading.SpeechToText', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsTextToSpeechNavigationItem = {
  path: '/analytics/text-to-speech',
  pathPattern: /\/analytics\/text-to-speech/,
  title: translationKey('Heading.TextToSpeech', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsVideoServiceNavigationItem = {
  path: '/analytics/video-service',
  pathPattern: /\/analytics\/video-service/,
  title: translationKey('Heading.VideoService', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsExperienceCreatorRewardsNavigationItem = {
  path: '/monetization/creator-rewards',
  pathPattern: /\/monetization\/creator-rewards/,
  title: translationKey('Heading.CreatorRewards', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsBountyPayoutsNavigationItem = {
  path: '/monetization/roblox-plus',
  pathPattern: /\/monetization\/roblox-plus/,
  title: translationKey('Heading.RobloxPlusDeveloperProgram', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsPerformanceNavigationItem = {
  path: '/analytics/performance',
  pathPattern: /\/analytics\/performance/,
  title: translationKey('Heading.Performance', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsCrashesNavigationItem = {
  path: '/analytics/crashes',
  pathPattern: /\/analytics\/crashes/,
  title: translationKey('Heading.Crashes', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsErrorReportNavigationItem = {
  path: '/analytics/errors',
  pathPattern: /\/analytics\/errors/,
  title: translationKey('Heading.ErrorReport', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAudienceNavigationItem = {
  path: '/analytics/audience',
  pathPattern: /\/analytics\/audience/,
  title: translationKey('Heading.Demographics', TranslationNamespace.Navigation),
  // titleOverrideForIAM2: translationKey('Heading.Audience', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsRecommendedEventsEconomyNavigationItem = {
  path: '/analytics/economy',
  pathPattern: /\/analytics\/economy/,
  title: translationKey('Heading.Economy', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsRecommendedEventsFunnelsNavigationItem = {
  path: '/analytics/funnels',
  pathPattern: /\/analytics\/funnels/,
  title: translationKey('Heading.Funnels', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsExploreNavigationItem = {
  path: '/analytics/explore',
  pathPattern: /\/analytics\/explore/,
  title: translationKey('Heading.Explore', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsCustomDashboardsManageNavigationItem = {
  path: '/analytics/dashboards',
  pathPattern: /\/analytics\/dashboards/,
  title: translationKey('Heading.CustomDashboards', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsRetentionNavigationItem = {
  path: '/analytics/retention',
  pathPattern: /\/analytics\/retention/,
  title: translationKey('Heading.Retention', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsEngagementNavigationItem = {
  path: '/analytics/engagement',
  pathPattern: /\/analytics\/engagement/,
  title: translationKey('Heading.Engagement', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsUserAcquisitionNavigationItem = {
  path: '/analytics/acquisition',
  pathPattern: /\/analytics\/acquisition/,
  title: translationKey('Heading.Acquisition', TranslationNamespace.Navigation),
  group: analyticsAnalyticsHomeNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsUserAcquisitionRFYNavigationItem = {
  path: '/analytics/acquisition?tab=homeRecommendations',
  pathPattern: /\/analytics\/acquisition\?tab=homeRecommendations/,
  title: translationKey('Heading.Acquisition', TranslationNamespace.Navigation),
  group: analyticsAnalyticsHomeNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsCustomEventsNavigationItem = {
  path: '/analytics/custom',
  pathPattern: /\/analytics\/custom/,
  title: translationKey('Heading.CustomEvents', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsFeedbackNavigationItem = {
  path: '/feedback',
  pathPattern: /\/feedback/,
  title: translationKey('Heading.Feedback', TranslationNamespace.PlayerFeedback),
} as const satisfies AnalyticsNavigationItem;

export const analyticsConfigsHistoryNavigationItem = {
  path: '/configs/history',
  pathPattern: /\/configs\/history/,
  title: translationKey('Heading.ConfigsHistory', TranslationNamespace.Navigation),
  titleOverrideForIAM2: translationKey('Heading.ConfigHistory', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsConfigsNavigationItem = {
  path: '/configs',
  pathPattern: /\/configs(?!\/)/,
  title: translationKey('Heading.Configs', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsConfigCreateNavigationItem = {
  path: '/configs/config-create',
  pathPattern: /\/configs\/config-create/,
  title: translationKey('Heading.ConfigCreate', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAlertsNavigationItem = {
  path: '/alerts',
  pathPattern: /\/alerts(?!\/)/,
  title: translationKey('Heading.Alerts', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAlertCreationNavigationItem = {
  path: '/alerts/create',
  pathPattern: /\/alerts\/create/,
  title: translationKey('Heading.CreateAlert', TranslationNamespace.ExperienceAlerts),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAlertConfifurationNavigationItem = {
  path: '/alerts',
  pathPattern: /\/alerts\/\d+\/configure$/,
  title: translationKey('Heading.ConfigureAlert', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsMatchmakingNavigationItem = {
  path: '/matchmaking',
  pathPattern: /\/matchmaking/,
  title: translationKey('Heading.CustomMatchmaking', TranslationNamespace.Matchmaking),
} as const satisfies AnalyticsNavigationItem;

export const analyticsCommerceNavigationItem = {
  path: '/monetization/commerce',
  pathPattern: /\/monetization\/commerce/,
  title: translationKey('Heading.Commerce', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsAssistantNavigationItem = {
  path: '/analytics/assistant',
  pathPattern: /\/analytics\/assistant/,
  title: translationKey('Heading.Assistant', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAgentNavigationItem = {
  path: '/analytics/agent',
  pathPattern: /\/analytics\/agent/,
  title: translationKey('Heading.Assistant', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAiChatNavigationItem = {
  path: '/analytics/ai-chat',
  pathPattern: /\/analytics\/ai-chat/,
  title: translationKey('Heading.Assistant', TranslationNamespace.Analytics),
} as const satisfies AnalyticsNavigationItem;

export const analyticsExperimentsCreateNavigationItem = {
  path: '/experiments/experiment-create',
  pathPattern: /\/experiments\/experiment-create/,
  title: translationKey('Heading.ExperimentsCreate', TranslationNamespace.Navigation),
  titleOverrideForIAM2: translationKeyWithoutNamespace('Heading.Experimentation'),
  group: analyticsExperimentsNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsRecommendationServiceNavigationItem = {
  path: '/recommendation-service',
  pathPattern: /\/recommendation-service/,
  title: translationKey('Heading.RecommendationService', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsSafetyNavigationItem = {
  path: '/safety/overview',
  pathPattern: /\/safety\/overview/,
  title: translationKey('Heading.SafetyOverview', TranslationNamespace.Analytics),
  titleOverrideForIAM2: translationKey('Heading.Safety', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsCreationOverviewNavigationItem = {
  path: '/overview',
  pathPattern: /\/overview(?![/\w])/,
  title: translationKey('Heading.Overview', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsThumbnailsNavigationItem = {
  // buildExperienceAnalyticsUrlWithParams demands a string but doesn't have place ID
  // so it cannot populate /places/:placeId/thumbnails properly.
  path: '/thumbnails',
  pathPattern: /\/places\/\d+\/thumbnails$/,
  title: translationKey('Heading.Thumbnails', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsNotificationsNavigationItem = {
  path: '/notifications',
  pathPattern: /\/notifications/,
  title: translationKey('Heading.Notifications', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsExperienceSubscriptionsNavigationItem = {
  path: '/experience-subscriptions',
  pathPattern: /\/experience-subscriptions/,
  title: translationKey('Heading.Subscriptions', TranslationNamespace.Navigation),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;

export const analyticsGenerativeAINavigationItem = {
  path: '/analytics/generative-ai',
  pathPattern: /\/analytics\/generative-ai/,
  title: translationKey('Heading.GenerativeAI', TranslationNamespace.Navigation),
} as const satisfies AnalyticsNavigationItem;

export const analyticsAvatarCreationTokensNavigationItem = {
  path: '/monetization/avatar-creation-tokens',
  pathPattern: /\/monetization\/avatar-creation-tokens/,
  title: translationKey('Heading.AvatarCreationTokens', TranslationNamespace.AvatarAnalytics),
  titleOverrideForIAM2: translationKey(
    'Heading.AvatarCreationTokens',
    TranslationNamespace.Navigation,
  ),
  group: analyticsMonetizationNavigationItem,
} as const satisfies AnalyticsNavigationItem;
/**
 * All navigation items in priority order for path matching.
 * More specific paths come before their prefixes to avoid false matches.
 */
const allNavigationItems: AnalyticsNavigationItem[] = [
  analyticsUserAcquisitionRFYNavigationItem,
  analyticsUserAcquisitionNavigationItem,
  analyticsEngagementNavigationItem,
  analyticsRetentionNavigationItem,
  analyticsMonetizationNavigationItem,
  analyticsItemMonetizationDeveloperProductsNavigationItem,
  analyticsItemMonetizationPassesNavigationItem,
  analyticsItemMonetizationAvatarItemsNavigationItem,
  analyticsItemFreeAvatarsNavigationItem,
  analyticsItemAnalyticsNavigationItem,
  analyticsImmersiveAdsNavigationItem,
  analyticsSubscriptionsNavigationItem,
  analyticsMemoryStoresNavigationItem,
  analyticsDataStoresNavigationItem,
  analyticsHttpServiceNavigationItem,
  analyticsMessagingServiceNavigationItem,
  analyticsSpeechToTextNavigationItem,
  analyticsTextToSpeechNavigationItem,
  analyticsVideoServiceNavigationItem,
  analyticsGenerativeAINavigationItem,
  analyticsExperienceCreatorRewardsNavigationItem,
  analyticsBountyPayoutsNavigationItem,
  analyticsPerformanceNavigationItem,
  analyticsCrashesNavigationItem,
  analyticsErrorReportNavigationItem,
  analyticsAudienceNavigationItem,
  analyticsRecommendedEventsEconomyNavigationItem,
  analyticsRecommendedEventsFunnelsNavigationItem,
  analyticsExploreNavigationItem,
  analyticsCustomDashboardsManageNavigationItem,
  analyticsCustomEventsNavigationItem,
  analyticsAssistantNavigationItem,
  analyticsAgentNavigationItem,
  analyticsAiChatNavigationItem,
  analyticsFeedbackNavigationItem,
  analyticsConfigsHistoryNavigationItem,
  analyticsConfigsNavigationItem,
  analyticsConfigCreateNavigationItem,
  analyticsMatchmakingNavigationItem,
  analyticsCommerceNavigationItem,
  analyticsSafetyNavigationItem,
  analyticsCreationOverviewNavigationItem,
  analyticsAnalyticsHomeNavigationItem,
  analyticsExperimentsNavigationItem,
  analyticsExperimentsCreateNavigationItem,
  analyticsRecommendationServiceNavigationItem,
  analyticsThumbnailsNavigationItem,
  analyticsNotificationsNavigationItem,
  analyticsExperienceSubscriptionsNavigationItem,
  analyticsAlertCreationNavigationItem,
  analyticsAlertConfifurationNavigationItem,
  analyticsAlertsNavigationItem,
  analyticsAvatarCreationTokensNavigationItem,
];

export function getAnalyticsNavigationItemFromPath(
  path: string,
): AnalyticsNavigationItem | undefined {
  return allNavigationItems.find((item) => item.pathPattern.test(path));
}
